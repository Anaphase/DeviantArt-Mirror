#!/usr/bin/env node

/*******************************************************************************
    
    DeviantArt Mirror (Reddit Bot)
    
    Scans Reddit submissions for DeviantArt links and hosts them,
    on Imgur then comments on the Reddit submission with a link. 
    
    by Colin Wood (http://reddit.com/user/Anaphase)
    
    License: WTFPL (http://sam.zoy.org/wtfpl/)
    Attribution is cool but not required.
    
*******************************************************************************/

var imgur       = require('./lib/imgur.js')
  , reddit      = require('./lib/reddit.js')
  , deviantart  = require('./lib/deviantart.js')
    
  , console     = require('./lib/console.js') // requires 'colors' too
    
  , _           = require('underscore')
  , Backbone    = require('backbone')
    
  , StoryQueue = new (require('./collections/StoryQueue.js'))
    
  , blacklist = require('./data/blacklist.js')
    
    // setInterval IDs
  , storyLoopID = null
  , mirrorLoopID = null
  , commentLoopID = null
  
    // used to only print "all stories mirrored/commented" once, until there are more stories in the queue
  , printAllMirroredDefault = function(){ console.warn("All stories in queue have been mirrored!") }
  , printAllCommentedDefault = function(){ console.warn("All mirrored stories in queue have been commented on!") }
  , printAllMirrored = _.once(printAllMirroredDefault)
  , printAllCommented = _.once(printAllCommentedDefault)

    // check new stories every 10 minutes
  , startStoryLoop = _.once(function(){
        storyLoop()
        storyLoopID = setInterval(storyLoop, 10000 * 60) 
    })

    // mirror a link every minute
  , startMirrorLoop = _.once(function(){
        mirrorLoop()
        mirrorLoopID = setInterval(mirrorLoop, 1000 * 60)
    })

    // comment on a link every 5 minutes
  , startCommentLoop = _.once(function(){
        commentLoop()
        commentLoopID = setInterval(commentLoop, 5000 * 60)
    })

console.log("DeviantArt Mirror Bot - By http://reddit.com/u/Anaphase".underline.inverse)

var request = require('request')
  , fs = require('fs')
  , gm = require('gm')
  , im = gm.subClass({ imageMagick: true })
watermarkImage()
return

reddit.login({
    error: function(error){
        console.error("Error logging in: ")
        console.error(error)
    }
  , success: function(){
        console.logGrey("Logged in.")
        startStoryLoop()
     // startMirrorLoop()
     // startCommentLoop()
    }
})

function storyLoop() {
    
    reddit.getStories({
        //subreddit: "/domain/deviantart.com"
        subreddit: "/r/totally_not_a_bot"
      , error: function(error, response, body){
            console.error("Error getting stories:")
            console.error(error)
        }
      , success: function(stories){
            
            var numAddedStories = ""
            
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
            
            console.logGrey("Added " + numAddedStories + " new " + ((numAddedStories==1) ? "story." : "stories."))
        },
        complete: function(){ startMirrorLoop() }
    })
}

function mirrorLoop() {
    
    // find the first story that hasn't been mirrored yet
    var story = StoryQueue.getNextStoryForMirror()
      , mirrorProgress
    
    if (!story) {
        printAllMirrored()
        startCommentLoop()
        return
    }
    
    // if we're here, that means there are more stories to mirror, so "reset" the printAllMirrored function
    printAllMirrored = _.once(printAllMirroredDefault)
    
    mirrorProgress = (StoryQueue.numMirrored() + 1) + "/" + StoryQueue.size()
    
    deviantart.getImage({
        url: story.get("url"),
        error: function(error){
            console.error(("Failed to mirror image " + mirrorProgress + " (attempt " + (story.get("failed_mirrors")+1) + " of " + story.get("ignore_threshold") + "):").bold)
            console.error('    [' + story.get("score") + '] "' + story.get("title").italic + '" (' + ('http://reddit.com' + story.get("permalink")).underline + ')')
            console.error('    -> ' + story.get("url").underline)
            console.error(error)
            story.failedToMirror()
            startCommentLoop()
        },
        success: function(deviantart_data){
            
            // check blacklist
            if (_.contains(blacklist.artists, deviantart_data.author_name)) {
                
                console.error(("Failed to mirror image (Blacklisted artist '" + deviantart_data.author_name + "'):").bold)
                console.error('    [' + story.get("score") + '] "' + story.get("title").italic + '" (' + ('http://reddit.com' + story.get("permalink")).underline + ')')
                console.error('    -> ' + story.get("url").underline)
                
                story.set({"failed_mirrors": story.get("ignore_threshold") , "ignore": true})
                mirrorLoop() // go ahead and mirror the next one since we didn't really send a request
                return
            }
            
            story.set({
                "deviantart": deviantart_data
              , "deviantart_image": deviantart_data.url // shortcut to image url
            })
            
            imgur.mirror({
                url: deviantart_data.url,
                title: '"' + deviantart_data.title + '" by ' + deviantart_data.author_name,
                caption: 'More art by ' + deviantart_data.author_name + ' @ ' +deviantart_data.author_url,
                error: function(error){
                    console.error(("Failed to mirror image " + mirrorProgress + " (attempt " + (story.get("failed_mirrors")+1) + " of " + story.get("ignore_threshold") + "):").bold)
                    console.error('    [' + story.get("score") + '] "' + story.get("title").italic + '" (' + ('http://reddit.com' + story.get("permalink")).underline + ')')
                    console.error('    -> ' + story.get("url").underline)
                    console.error(error)
                    story.failedToMirror()
                },
                success: function(imgur_data){
                    
                    story.set({
                        "imgur": imgur_data
                      , "imgur_image": "http://imgur.com/" + imgur_data.upload.image.hash // shortcut to image url
                    })
                    
                    console.logCyan(("Mirrored image " + mirrorProgress + ":").bold)
                    console.logCyan('    [' + story.get("score") + '] "' + story.get("title").italic + '" (' + ('http://reddit.com' + story.get("permalink")).underline + ')')
                    console.logCyan('    -> ' + story.get("imgur_image").underline)
                    
                    StoryQueue.save()
                },
                complete: function(){ startCommentLoop() }
            })
        }
    })
}

function commentLoop() {
    
    // find the first story that has been mirrored, but hasn't been commented on yet
    var story           = StoryQueue.getNextStoryForComment()
      , commentProgress = ""
      , commentText     = ""
      , pony            = ""
    
    if (!story) {
        printAllCommented()
        return
    }
    
    printAllCommented = _.once(printAllCommentedDefault)
    
    commentProgress = (StoryQueue.numCommented() + 1) + "/" + StoryQueue.size()
    
    // put Scootaloo in the comment if we're on MLP :D
    pony = (story.get("subreddit").toLowerCase() == "mylittlepony") ? "[](/scootacheer)" : "",
    
    commentText = pony + "[Here's an Imgur mirror!](" + story.get("imgur_image") + ")\n- - -\n^I ^am ^a ^bot. ^| [^FAQ](http://www.reddit.com/r/DeviantArtMirrorBot/comments/10cupp/faq/) ^| [^Report ^a ^Problem](http://www.reddit.com/r/DeviantArtMirrorBot/submit?title=Problem%20Report&text=http://reddit.com" + encodeURIComponent(story.get("permalink")) + "%20Describe%20the%20problem%20here.) ^| [^Contact ^the ^Creator](http://www.reddit.com/message/compose/?to=Anaphase&subject=ATTN:%20DeviantArtMirrorBot) ^| [^Request ^Removal](http://www.reddit.com/message/compose/?to=Anaphase&subject=ATTN:%20DeviantArtMirrorBot%20Removal%20Request&message=Please%20remove%20the%20image%20DeviantArtMirrorBot%20linked%20to%20in%20http://reddit.com" + encodeURIComponent(story.get("permalink")) + "%20-%20" + story.get("imgur_image") + ")"
    
    // double check for duplicate comments (should already be taken care of by StoryQueue.getNextStoryForComment())
    if (StoryQueue.where({"id": story.get("id"), "comment_id": null}).length == 0) {
        console.error(("DUPLICATE COMMENT DETECTED " + commentProgress + ":").bold.inverse)
        console.error('    [' + story.get("score") + '] "' + story.get("title").italic + '" (' + ('http://reddit.com' + story.get("permalink")).underline + ')')
        console.error('    -> ' + story.get("url").underline)
        return
    }
    
    reddit.comment({
        thingId: story.get("id")
      , thingType: "link"
      , text: commentText
      , error: function(error){
            console.error("Failed to comment on story " + commentProgress + " (attempt " + (story.get("failed_comments")+1) + " of " + story.get("ignore_threshold") + "):")
            console.error('    [' + story.get("score") + '] "' + story.get("title").italic + '" (' + ('http://reddit.com' + story.get("permalink")).underline + ')')
            console.error(error)
            
            console.log(story.attributes)
            
            if (error == "the link you are commenting on has been deleted")
                story.set({"failed_mirrors": story.get("ignore_threshold") , "ignore": true})
            else
                story.failedToComment()
        }
      , success: function(response){
            
            var commentID = response.data.id
            
            story.set({"comment_id": response.data.id})
            
            console.beep()
            console.logGreen(("Commented on story " + commentProgress + ":").bold)
            console.logGreen('    [' + story.get("score") + '] "' + story.get("title").italic + '" (' + ('http://reddit.com' + story.get("permalink")).underline + ')')
            
            StoryQueue.save()
        }
    })
}

function watermarkImage() {
    
    var writeStream = request('http://i.imgur.com/rWPqv.jpg').pipe(fs.createWriteStream('test.jpg'))
    
    writeStream.on('close', function(){
        
        var readStream = fs.createReadStream('test.jpg')
        
        im(readStream, 'test.jpg').write("test2.png", function (error) {
            if (error) console.log(error)
            else {
                im('test2.png')
                    .font("Helvetica Neue.ttf", 56)
                    .fill("rgba(0, 0, 0, .5)")
                    .drawText(0, 10, "Art by ^DemonMathiel Long Text", "south")
                    .write("test2.png", function (error) {
                        if (!error) console.log('done')
                        else console.log(error)
                    })
            }
        })
    })
}