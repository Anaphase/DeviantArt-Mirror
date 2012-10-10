/*******************************************************************************
    
    Deviant Art Mirror Bot (for Reddit)
    
    Scans Reddit submissions for DeviantArt links and hosts them
    on Imgur, then comments on the Reddit submission with a link. 
    
    by Colin Wood (http://reddit.com/user/Anaphase)
    
    License: WTFPL (http://sam.zoy.org/wtfpl/)
    Attribution is cool but not required.
    
*******************************************************************************/

var imgur         = require('./lib/imgur.js')
  , bitly         = require('./lib/bitly.js')
  , reddit        = require('./lib/reddit.js')
  , deviantart    = require('./lib/deviantart.js')
  
  , fs            = require('fs')
  , request       = require('request')
  , imagemagick   = require('gm').subClass({ imageMagick: true })
    
  , console       = require('./lib/console.js') // requires 'colors' too
    
  , _             = require('underscore')
  , Backbone      = require('backbone')
    
  , StoryQueue    = new (require('./collections/StoryQueue.js'))
    
  , blacklist     = require('./data/blacklist.js')
  
  , watermarkData = {
        fontSize: 16
      , fontFill: 'rgba(255, 255, 255, 1)'
      , fontStroke: null
      , overlayMargin: 5
      , overlayFill: 'rgba(0, 0, 0, .40)'
      , overlayStroke: null
    }
  
    // used to only print "all stories mirrored/commented/etc" once, until there are more stories in the queue
  , emptyDeviantArtDefault = function(){ console.logTime(); console.info('All stories in queue have DeviantArt data!') }
  , emptyShortenDefault = function(){ console.logTime(); console.info('All stories in queue have bit.ly URLs!') }
  , emptyWatermarkDefault = function(){ console.logTime(); console.info('All stories in queue have been watermarked!') }
  , emptyMirrorDefault = function(){ console.logTime(); console.info('All stories in queue have been mirrored!') }
  , emptyCommentDefault = function(){ console.logTime(); console.info('All stories in queue have been commented on!') }
  , emptyDeviantArt = _.once(emptyDeviantArtDefault)
  , emptyShorten = _.once(emptyShortenDefault)
  , emptyWatermark = _.once(emptyWatermarkDefault)
  , emptyMirror = _.once(emptyMirrorDefault)
  , emptyComment = _.once(emptyCommentDefault)

module.exports = {
    
    login: function(callback){
        
        reddit.login({
            error: function(error){
                console.beep()
                console.error('Error logging in: ')
                console.error(error)
            }
          , success: function(){
                console.info('Logged in.')
                callback()
            }
        })
        
    }
    
  , getStories: function(callback){
        
        if (typeof callback !== 'function') callback = function(){}
        
        reddit.getStories({
            //subreddit: '/domain/deviantart.com'
            subreddit: '/r/totally_not_a_bot'
          , error: function(error, response, body){
                console.logTime()
                console.beep()
                console.error('Error getting stories:')
                console.error(error)
            }
          , success: function(stories){
                
                var numAddedStories = ''
                
                // only consider stories from DeviantArt
                stories = stories.filter(function(story){
                    return (
                        story.domain.match(/deviantart\.com$/)
                     && !_.contains(blacklist.subreddits, story.subreddit)
                     && !_.contains(blacklist.authors, story.author)
                    )
                })
                
                numAddedStories = StoryQueue.add(stories)
                
                if (numAddedStories > 0)
                    StoryQueue.save()
                
                console.logTime()
                console.info('Added ' + numAddedStories + ' new ' + ((numAddedStories==1) ? 'story.' : 'stories.'))
            }
          , complete: callback
        })
    }
    
  , processStory: _.throttle(function(callback){
        
        var self = this
        
        self.getDeviantArtData(function(){
            self.shortenUrl(function(){
                self.watermark(function(){
                    self.mirror(function(){
                        self.comment(callback)
                    })
                })
            })
        })
        
  }, 60000) // throttle to 1 min
    
  , getDeviantArtData: function(callback){
        
        var self      = this
          , story     = StoryQueue.find(function(story){ return !story.get('ignore') && _.isEmpty(story.get('deviantart')) })
          , totalLeft = StoryQueue.filter(function(story){ return !story.get('ignore') && _.isEmpty(story.get('deviantart')) }).length
          , progress  = (StoryQueue.size() - totalLeft + 1) + '/' + StoryQueue.size()
        
        if (typeof callback !== 'function') callback = function(){}
        
        if (!story) {
            if (totalLeft == 0) emptyDeviantArt()
            callback()
            return
        }
    
        // if we're here, that means there are more stories to process, so reset the "empty" function
        emptyDeviantArt = _.once(emptyDeviantArtDefault)
        
        deviantart.getImage({
            url: story.get('url')
          , error: function(error){
                console.logTime()
                console.beep()
                console.error(('Failed to get DeviantArt data for story ' + progress + ' (attempt ' + (story.get('failures').deviantart+1) + ' of ' + story.get('ignore_threshold') + '):').bold)
                console.error('    [' + story.get('score') + '] "' + story.get('title').italic + '" (' + ('http://reddit.com' + story.get('permalink')).underline + ')')
                console.error('    -> ' + story.get('url').underline)
                console.error(error)
                story.failed('deviantart')
                self.getDeviantArtData(callback)
            }
          , success: function(data){
                
                // check blacklist
                if (_.contains(blacklist.artists, data.author_name)) {
                    
                    console.beep()
                    console.error(('Failed to get DeviantArt data for story ' + progress + ' (Blacklisted artist "' + data.author_name + '"):').bold)
                    console.error('    [' + story.get('score') + '] "' + story.get('title').italic + '" (' + ('http://reddit.com' + story.get('permalink')).underline + ')')
                    console.error('    -> ' + story.get('url').underline)
                    
                    story.failed('deviantart', story.get('ignore_threshold'))
                    callback()
                    return
                }
                
                story.set({
                    'deviantart': data
                  , 'deviantart_image': data.url // shortcut to image url
                })
                
                console.logTime()
                console.logYellow(('Got DeviantArt data for story ' + progress + ':').bold)
                console.logYellow('    [' + story.get('score') + '] "' + story.get('title').italic + '" (' + ('http://reddit.com' + story.get('permalink')).underline + ')')
                console.logYellow('    -> ' + story.get('url').underline)
                
                StoryQueue.save()
                callback()
            }
          //, complete: callback
        })
    }
    
  , shortenUrl: function(callback){
        
        var self      = this
          , story     = StoryQueue.find(function(story){ return !story.get('ignore') && !_.isEmpty(story.get('deviantart')) && _.isEmpty(story.get('bitly')) })
          , totalLeft = StoryQueue.filter(function(story){ return !story.get('ignore') && _.isEmpty(story.get('bitly')) }).length
          , progress  = (StoryQueue.size() - totalLeft + 1) + '/' + StoryQueue.size()
        
        if (typeof callback !== 'function') callback = function(){}
        
        if (!story) {
            if (totalLeft == 0) emptyShorten()
            callback()
            return
        }
    
        // if we're here, that means there are more stories to process, so reset the "empty" function
        emptyShorten = _.once(emptyShortenDefault)
        
        bitly.shorten({
            url: story.get('url')
          , error: function(error){
                console.logTime()
                console.beep()
                console.error(('Failed to shorten URL ' + progress + ' (attempt ' + (story.get('failures').mirror+1) + ' of ' + story.get('ignore_threshold') + '):').bold)
                console.error('    [' + story.get('score') + '] "' + story.get('title').italic + '" (' + ('http://reddit.com' + story.get('permalink')).underline + ')')
                console.error('    -> ' + story.get('url').underline)
                console.error(error)
                story.failed('bitly')
                self.shortenUrl(callback)
            }
          , success: function(data){
                
                story.set({
                    'bitly': data
                  , 'bitly_url': data.url // shortcut to shortened url
                })
                
                console.logTime()
                console.logMagenta(('Shortened URL ' + progress + ':').bold)
                console.logMagenta('    [' + story.get('score') + '] "' + story.get('title').italic + '" (' + ('http://reddit.com' + story.get('permalink')).underline + ')')
                console.logMagenta('    -> ' + data.url)
                
                StoryQueue.save()
                callback()
            }
          //, complete: callback
        })
    }
    
  , watermark: function(callback){
        
        var self        = this
          , story       = StoryQueue.find(function(story){ return !story.get('ignore') && !_.isEmpty(story.get('deviantart')) && !_.isEmpty(story.get('bitly')) && !story.get('watermarked_image') })
          , totalLeft   = StoryQueue.filter(function(story){ return !story.get('ignore') && !story.get('watermarked_image') }).length
          , progress    = (StoryQueue.size() - totalLeft + 1) + '/' + StoryQueue.size()
          , fileName    = null
          , writeStream = null
          , watermark   = null
        
        if (typeof callback !== 'function') callback = function(){}
        
        if (!story) {
            if (totalLeft == 0) emptyWatermark()
            callback()
            return
        }
    
        // if we're here, that means there are more stories to process, so reset the "empty" function
        emptyWatermark = _.once(emptyWatermarkDefault)
        
        fileName    = './images/' + story.get('deviantart').url.split('/').pop()
        writeStream = request(story.get('deviantart').url).pipe(fs.createWriteStream(fileName))
        
        writeStream.on('close', function(){
        
            var readStream = fs.createReadStream(fileName)
            
            imagemagick(readStream, fileName).write(fileName, function (error){
                
                if (error) {
                    console.logTime()
                    console.beep()
                    console.error(('Failed to watermark image ' + progress + ' (attempt ' + (story.get('failures').mirror+1) + ' of ' + story.get('ignore_threshold') + '):').bold)
                    console.error('    [' + story.get('score') + '] "' + story.get('title').italic + '" (' + ('http://reddit.com' + story.get('permalink')).underline + ')')
                    console.error('    -> ' + story.get('url').underline)
                    console.error(error)
                    story.failed('watermark')
                    self.watermark(callback)
                    return
                }
                
                // we first need to get the image's size to determine how to draw things
                imagemagick(fileName).size(function(error, size){
                    if (error) {
                        console.logTime()
                        console.beep()
                        console.error(('Failed to watermark image ' + progress + ' (attempt ' + (story.get('failures').mirror+1) + ' of ' + story.get('ignore_threshold') + '):').bold)
                        console.error('    [' + story.get('score') + '] "' + story.get('title').italic + '" (' + ('http://reddit.com' + story.get('permalink')).underline + ')')
                        console.error('    -> ' + story.get('url').underline)
                        console.error(error)
                        story.failed('watermark')
                        self.watermark(callback)
                        return
                    }
                    
                    imagemagick(fileName)
                    .fill(watermarkData.overlayFill)
                    .stroke(watermarkData.overlayStroke)
                    .drawRectangle(0, size.height, size.width, size.height-(watermarkData.fontSize*2 + watermarkData.overlayMargin*2))
                    .font('Helvetica.ttf', watermarkData.fontSize)
                    .fill(watermarkData.fontFill)
                    .stroke(watermarkData.fontStroke)
                    .drawText(0, watermarkData.overlayMargin, story.get('deviantart').title + '\nby ' + story.get('deviantart').author_name + ' | ' + story.get('bitly_url'), 'south')
                    .write(fileName, function (error) {
                        
                        if (error) {
                            console.logTime()
                            console.beep()
                            console.error(('Failed to watermark image ' + progress + ' (attempt ' + (story.get('failures').mirror+1) + ' of ' + story.get('ignore_threshold') + '):').bold)
                            console.error('    [' + story.get('score') + '] "' + story.get('title').italic + '" (' + ('http://reddit.com' + story.get('permalink')).underline + ')')
                            console.error('    -> ' + story.get('url').underline)
                            console.error(error)
                            story.failed('watermark')
                            self.watermark(callback)
                            return
                        }
                        
                        story.set({
                            'watermarked_image': fileName
                        })
                        
                        console.logTime()
                        console.logBlue(('Watermarked image ' + progress + ':').bold)
                        console.logBlue('    [' + story.get('score') + '] "' + story.get('title').italic + '" (' + ('http://reddit.com' + story.get('permalink')).underline + ')')
                        console.logBlue('    -> ' + story.get('watermarked_image').underline)
                        
                        StoryQueue.save()
                        
                        callback()
                    })
                })
            })
        })
    }
    
  , mirror: function(callback){
        
        var self      = this
          , story     = StoryQueue.find(function(story){ return !story.get('ignore') && !_.isEmpty(story.get('deviantart')) && !_.isEmpty(story.get('bitly')) && story.get('watermarked_image') && _.isEmpty(story.get('imgur')) })
          , totalLeft = StoryQueue.filter(function(story){ return !story.get('ignore') && _.isEmpty(story.get('imgur')) }).length
          , progress  = (StoryQueue.size() - totalLeft + 1) + '/' + StoryQueue.size()
        
        if (typeof callback !== 'function') callback = function(){}
        
        if (!story) {
            if (totalLeft == 0) emptyMirror()
            callback()
            return
        }
    
        // if we're here, that means there are more stories to process, so reset the "empty" function
        emptyMirror = _.once(emptyMirrorDefault)
        
        imgur.upload({
            image: story.get('watermarked_image')
          , title: '"' + story.get('deviantart').title + '" by ' + story.get('deviantart').author_name
          , caption: 'You can find this image at ' + story.get('bitly_url') + '. More art by ' + story.get('deviantart').author_name + ' at ' + story.get('deviantart').author_url
          , error: function(error){
                console.logTime()
                console.beep()
                console.error(('Failed to mirror image ' + progress + ' (attempt ' + (story.get('failures').mirror+1) + ' of ' + story.get('ignore_threshold') + '):').bold)
                console.error('    [' + story.get('score') + '] "' + story.get('title').italic + '" (' + ('http://reddit.com' + story.get('permalink')).underline + ')')
                console.error('    -> ' + story.get('url').underline)
                console.error(error)
                story.failed('mirror')
                self.mirror(callback)
            }
          , success: function(data){
                
                story.set({
                    'imgur': data
                  , 'imgur_image': 'http://imgur.com/' + data.upload.image.hash // shortcut to image url
                })
                
                console.logTime()
                console.logCyan(('Mirrored image ' + progress + ':').bold)
                console.logCyan('    [' + story.get('score') + '] "' + story.get('title').italic + '" (' + ('http://reddit.com' + story.get('permalink')).underline + ')')
                console.logCyan('    -> ' + story.get('imgur_image').underline)
                
                StoryQueue.save()
                callback()
            }
          //, complete: callback
        })
    }
    
  , comment: function(callback){
        
        var self      = this
          , story       = StoryQueue.find(function(story){ return !story.get('ignore') && !_.isEmpty(story.get('deviantart')) && !_.isEmpty(story.get('bitly')) && story.get('watermarked_image') && !_.isEmpty(story.get('imgur')) && _.isEmpty(story.get('reddit')) })
          , totalLeft   = StoryQueue.filter(function(story){ return !story.get('ignore') && _.isEmpty(story.get('reddit')) }).length
          , progress    = (StoryQueue.size() - totalLeft + 1) + '/' + StoryQueue.size()
          , commentText = ''
          , pony        = ''
        
        if (typeof callback !== 'function') callback = function(){}
        
        if (!story) {
            if (totalLeft == 0) emptyComment()
            callback()
            return
        }
    
        // if we're here, that means there are more stories to process, so reset the "empty" function
        emptyComment = _.once(emptyCommentDefault)
        
        // put Scootaloo in the comment if we're on MLP :D
        pony = (story.get('subreddit').toLowerCase() == 'mylittlepony') ? '[](/scootacheer)' : ''
        
        commentText = pony + '[Here\'s an Imgur mirror!](' + story.get('imgur_image') + ')\n- - -\n^I\'m ^a ^bot. ^| [^FAQ](http://www.reddit.com/r/DeviantArtMirrorBot/comments/10cupp/faq/) ^| [^Report ^a ^Problem](http://www.reddit.com/r/DeviantArtMirrorBot/submit?title=Problem%20Report&text=http://reddit.com' + encodeURIComponent(story.get('permalink')) + '%0A%0ADescribe%20the%20problem%20here.) ^| [^Contact ^the ^Creator](http://www.reddit.com/message/compose/?to=Anaphase&subject=ATTN:%20DeviantArtMirrorBot) ^| [^Request ^Removal](http://www.reddit.com/message/compose/?to=Anaphase&subject=ATTN:%20DeviantArtMirrorBot%20Removal%20Request&message=Please%20remove%20the%20image%20DeviantArtMirrorBot%20linked%20to%20in:%0A%0Ahttp://reddit.com' + encodeURIComponent(story.get('permalink')) + '%0A%28' + story.get('imgur_image') + '%29)'
        
        // double check for duplicate comments (should already be taken care of...)
        if (StoryQueue.where({'id': story.get('id'), 'comment_id': null}).length == 0) {
            console.logTime()
            console.beep()
            console.error(('DUPLICATE COMMENT DETECTED ' + progress + ':').bold.inverse)
            console.error('    [' + story.get('score') + '] "' + story.get('title').italic + '" (' + ('http://reddit.com' + story.get('permalink')).underline + ')')
            console.error('    -> ' + story.get('url').underline)
            self.comment(callback)
            return
        }
        
        reddit.comment({
            thingId: story.get('id')
          , thingType: 'link'
          , text: commentText
          , error: function(error){
                console.logTime()
                console.beep()
                console.error('Failed to comment on story ' + progress + ' (attempt ' + (story.get('failed_comments')+1) + ' of ' + story.get('ignore_threshold') + '):')
                console.error('    [' + story.get('score') + '] "' + story.get('title').italic + '" (' + ('http://reddit.com' + story.get('permalink')).underline + ')')
                console.error(error)
                console.error(story.attributes)
                
                if (error == 'the link you are commenting on has been deleted')
                    story.failed('comment', story.get('ignore_threshold'))
                else
                    story.failed('comment')
                
                self.comment(callback)
            }
          , success: function(data){
                
                story.set({
                    'reddit': {
                        // the rest of the Reddit data is actually pretty
                        // useless in this context, so only store the ID
                        id: data.data.id
                    }
                  , 'comment_id': data.data.id // shortcut to comment id
                })
                
                console.logTime()
                console.logGreen(('Commented on story ' + progress + ':').bold)
                console.logGreen('    [' + story.get('score') + '] "' + story.get('title').italic + '" (' + ('http://reddit.com' + story.get('permalink')).underline + ')')
                console.logGreen('    -> ' + ('http://reddit.com' + story.get('permalink') + '#' + data.data.id.substr(3)).underline)
                
                StoryQueue.save()
                callback()
            }
          //, complete: callback
        })
    }
    
}