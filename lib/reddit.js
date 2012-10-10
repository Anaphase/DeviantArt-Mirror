var request              = require('request')
    
  , console              = require('./console.js') // requires 'colors' too
    
  , fs                   = require('fs')
  , savedUsers           = {}
  , credentials          = require('../data/credentials.js').reddit
    
  , cookie               = ''
  , modhash              = ''
  , cookieJar            = request.jar()
  , globalRequestOptions = { jar: cookieJar, headers: { 'User-Agent': 'DeviantArt -> Imgur Mirror Bot by /u/Anaphase' } }
    
  , _                    = require('underscore')

try {
    JSON.parse(fs.readFileSync('./data/savedUsers.json'))
} catch(e) {
    console.error('Could not parse savedUsers.json')
    console.error(e)
    return
}

module.exports = {
    
    login: function(data){
        
        if (!data || typeof data !== 'object') return false
        
        //  variable           source            default
        var username         = data.username  || credentials.username
          , password         = data.password  || credentials.password
          , errorCallback    = data.error     || function(){}
          , successCallback  = data.success   || function(){}
          , completeCallback = data.complete  || function(){}
          
          , self             = this
          , requestOptions   = {}
        
        // if we already have a cookie and modhash for this user, use that
        if (savedUsers[username]) {
            cookie  = savedUsers[username].cookie
            modhash = savedUsers[username].modhash
            cookieJar.add(request.cookie('reddit_session=' + cookie))
            successCallback()
            return true
        }
        
        requestOptions = {
            url: 'http://www.reddit.com/api/login/' + username
          , form: { 'api_type': 'json', 'user': username, 'passwd': password }
        }
        _.defaults(requestOptions, globalRequestOptions)
        
        request.post(requestOptions, function(error, response, body){
            
            var reddit
            
            if (!error) {
                
                if (response.statusCode !== 200) {
                    errorCallback('Reddit returned a non-OK status code of ' + response.statusCode + '. Here\'s what Reddit said: \n' + body)
                    completeCallback()
                    return
                }
                
                try {
                    reddit = JSON.parse(body).json
                } catch(e) {
                    errorCallback('Reddit returned a status code of 200, but did not return JSON. What\'s up with that?! Here\'s what Reddit returned: \n' + body)
                    completeCallback()
                    return
                }
                
                if (reddit.errors.length) {
                    errorCallback(reddit.errors)
                    completeCallback()
                    return
                }
                
                cookie  = reddit.data.cookie
                modhash = reddit.data.modhash
                
                cookieJar.add(request.cookie('reddit_session=' + cookie))
                
                savedUsers[username] = {'cookie': cookie, 'modhash': modhash}
                self.saveUsers()
                
                successCallback()
                
            } else
                errorCallback(error)
                
            completeCallback()
        })
    }
    
  , comment: function(data){
        
        if (!data || typeof data !== 'object') return false
        
        //  variable           source             default
        var text             = data.text       || ''
          , thing_id         = data.thingId    || ''
          , thing_type       = data.thingType  || 'link'
          , errorCallback    = data.error      || function(){}
          , successCallback  = data.success    || function(){}
          , completeCallback = data.complete   || function(){}
            
          , requestOptions   = {}
        
        switch (thing_type) {
            case 1: case 't1': case 'comment':
                thing_type = 't1'
                break
                
            case 2: case 't2': case 'account':
                thing_type = 't2'
                break
                
            case 3: case 't3': case 'link':
                thing_type = 't3'
                break
                
            case 4: case 't4': case 'message':
                thing_type = 't4'
                break
                
            case 5: case 't5': case 'subreddit':
                thing_type = 't5'
                break
                
            default:
                thing_type = 't3' // deafault to link
        }
        
        requestOptions = {
            url: 'http://www.reddit.com/api/comment'
          , form: { 'uh': modhash, 'thing_id': thing_type + '_' + thing_id, 'text': text }
        }
        _.defaults(requestOptions, globalRequestOptions)
        
        request.post(requestOptions, function(error, response, body){
            
            var reddit
              , commentError = false
            
            if (!error) {
                
                if (response.statusCode !== 200) {
                    errorCallback('Reddit returned a non-OK status code of ' + response.statusCode + '. Here\'s what Reddit said: \n' + body)
                    completeCallback()
                    return
                }
                
                try {
                    reddit = JSON.parse(body).jquery
                } catch(e) {
                    errorCallback('Reddit returned a status code of 200, but did not return JSON. What\'s up with that?! Here\'s what Reddit returned: \n' + body)
                    completeCallback()
                    return
                }
                
                // check for specific errors
                reddit.forEach(function(command){
                    try {
                        
                        if (command[3][0] == '.error.USER_REQUIRED')
                            commentError = reddit[6][3][0] // "please login to do that"
                        
                        if (command[3][0] == '.error.RATELIMIT.field-ratelimit')
                            commentError = reddit[14][3][0] // "You are doing that too much..."
                        
                        if (reddit[10][3][0] == '.error.DELETED_LINK.field-parent')
                            commentError = reddit[14][3][0] // "the link you are commenting on has been deleted"
                        
                    } catch(e){} // don't bother cathing errors because if the above tests fail, that means those errors don't exist
                })
                
                if (commentError) {
                    errorCallback(commentError)
                    completeCallback()
                    return
                }
                
                // make sure Reddit returned a good response
                try {
                    reddit[18][3][0][0].data.id
                } catch(e) {
                    errorCallback('Reddit did not return the expected result. Here\'s what Reddit said: ' + body)
                    completeCallback()
                    return
                }
                
                successCallback(reddit[18][3][0][0])
                
            } else
                errorCallback(error)
            
            completeCallback()
        })
    }
    
  , getStories: function(data){
        
        if (!data || typeof data !== 'object') return false
        
        //  variable           source            default
        var subreddit        = data.subreddit || ''
          , newOnly          = data.newOnly   || false
          , errorCallback    = data.error     || function(){}
          , successCallback  = data.success   || function(){}
          , completeCallback = data.complete  || function(){}
            
          , requestOptions   = {}
        
        requestOptions = {
            url: 'http://www.reddit.com' + subreddit + '/' + ((newOnly)?'new':'') + '.json?limit=1000'
        }
        _.defaults(requestOptions, globalRequestOptions)
        
        request(requestOptions, function(error, response, body){
            
            var reddit
              , stories
            
            if (!error) {
                
                if (response.statusCode !== 200) {
                    errorCallback('Reddit returned a non-OK status code of ' + response.statusCode + '. Here\'s what Reddit said: \n' + body)
                    completeCallback()
                    return
                }
                
                try {
                    reddit  = JSON.parse(body)
                    stories = reddit.data.children.map(function (s) { return s.data })
                } catch(e) {
                    errorCallback('Reddit returned a status code of 200, but did not return JSON. What\'s up with that?! Here\'s what Reddit returned: \n' + body)
                    completeCallback()
                    return
                }
                
                successCallback(stories)
                
            } else
                errorCallback(error)
                
            completeCallback()
        })
    }
    
  , getNewStories: function(data){
        if (!data || typeof data !== 'object') return false
        data.newOnly = true
        return this.getStories(data)
    }
    
  , saveUsers: function(data){
        
        if (data && typeof data !== 'object') data = {}
        
        data = data || {}
        
        //  variable          source           default
        var errorCallback    = data.error    || function(error){ console.beep(); console.error('Error saving savedUsers:'); console.error(error) }
          , successCallback  = data.success  || function(){}
          , completeCallback = data.complete || function(){}
        
        fs.writeFile('./data/savedUsers.json', JSON.stringify(savedUsers), function (error) {
            if (!error)
                successCallback()
            else
                errorCallback(error.message)
            completeCallback()
        })
    }
}
