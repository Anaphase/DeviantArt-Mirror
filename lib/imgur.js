var _           = require('underscore')
  , request     = require('request')
    
  , fs          = require('fs')
    
  , credentials = require('../data/credentials.js').imgur
    
  , console     = require('./console.js')
  
  , globalRequestOptions = {
        oauth: {
            consumer_key: credentials.key
          , consumer_secret: credentials.secret
          , token: credentials.access_token
          , token_secret: credentials.access_token_secret
        }
      , headers: { 'User-Agent': 'DeviantArt -> Imgur Mirror Bot by http://reddit.com/u/Anaphase' }
    }

module.exports = {
    
    upload: function(data){
        
        // takes base64 encoded file data and uploads it to Imgur
        
        if (!data || typeof data !== 'object') return false
        
        //  variable         source            default
        var image          = data.image     || ''
          , title          = data.title     || ''
          , caption        = data.caption   || ''
            
          , self           = this
          , requestOptions = {}
        
        requestOptions = {
            url: 'http://api.imgur.com/2/upload.json'
          , form: {
                'image': fs.readFileSync(image, 'base64')
              , 'type': 'base64'
              , 'name': title
              , 'title': title
              , 'caption': caption
            }
        }
        _.defaults(requestOptions, globalRequestOptions)
        
        request.post(requestOptions, function (error, response, body){
            self.handleResponse(data, error, response, body)
        })
    }
    
  , mirror: function(data){
        
        // takes a URL and "sideloads" it to Imgur
        
        if (!data || typeof data !== 'object') return false
        
        //  variable         source            default
        var url            = data.url       || ''
          , title          = data.title     || ''
          , caption        = data.caption   || ''
            
          , self           = this
          , requestOptions = {}
        
        requestOptions = {
            url: 'http://api.imgur.com/2/upload.json'
          , form: { 'image': url, 'name': title, 'title': title, 'caption': caption }
        }
        _.defaults(requestOptions, globalRequestOptions)
        
        request.post(requestOptions, function (error, response, body){
            self.handleResponse(data, error, response, body)
        })
    }
    
  , handleResponse: function(data, error, response, body){
        
        //  variable           source            default
        var errorCallback    = data.error     || function(){}
          , successCallback  = data.success   || function(){}
          , completeCallback = data.complete  || function(){}
        
        if (!error) {
            
            var imgur
            
            // handle some possible errors
            switch (response.statusCode) {
                
                case 200:
                    try {
                        imgur = JSON.parse(body)
                    } catch(e) {
                        errorCallback('Imgur returned a status code of 200, but did not return JSON. What\'s up with that?! Here\'s{ what Imgur returned: \n' + body)
                        completeCallback()
                        return
                    }
                    break
                
                case 400:
                    try { imgur = JSON.parse(body).error.message } catch(e) { imgur = body }
                    errorCallback('Error 400: This error indicates that a required parameter is missing or a parameter has a value that is out of bounds or otherwise incorrect. This status code is also returned when image uploads fail due to images that are corrupt or do not meet the format requirements. Here\'s what Imgur returned: \n' + imgur)
                    completeCallback()
                    return
                
                case 401:
                    try { imgur = JSON.parse(body).error.message } catch(e) { imgur = body }
                    errorCallback('Error 401: The request requires user authentication. Either you didn\'t send send OAuth credentials, or the ones you sent were invalid. Here\'s what Imgur returned: \n' + imgur)
                    completeCallback()
                    return
                
                case 403:
                    try { imgur = JSON.parse(body).error.message } catch(e) { imgur = body }
                    errorCallback('Error 403: Forbidden. You don\'t have access to this action. If you\'re getting this error, check that you haven\'t run out of API credits or make sure you\'re sending the OAuth headers correctly and have valid tokens/secrets. Here\'s what Imgur returned: \n' + imgur)
                    completeCallback()
                    return
                
                case 404:
                    try { imgur = JSON.parse(body).error.message } catch(e) { imgur = body }
                    errorCallback('Error 404: Action not supported. This indicates you have requested a resource that does not exist. For example, requesting page 100 from a list of 5 images will result in a 404. Here\'s what Imgur returned: \n' + imgur)
                    completeCallback()
                    return
                
                case 500:
                    try { imgur = JSON.parse(body).error.message } catch(e) { imgur = body }
                    errorCallback('Error 500: Unexpected internal error. What it says. We\'ll strive NOT to return these but your app should be prepared to see it. It basically means that something is broken with the Imgur service. Here\'s what Imgur returned: \n' + imgur)
                    completeCallback()
                    return
                
                case 503:
                    try { imgur = JSON.parse(body).error.message } catch(e) { imgur = body }
                    errorCallback('Error 503: Service unavailable. The server is currently overloaded or down for maintenance. Here\'s what Imgur returned: \n' + imgur)
                    completeCallback()
                    return
                
                default:
                    try { imgur = JSON.parse(body).error.message } catch(e) { imgur = body }
                    errorCallback('Error ' + response.statusCode + '. Here\'s what Imgur returned: \n' + imgur)
                    completeCallback()
                    return
            }
            
            if (!imgur.error)
                successCallback(imgur)
            else
                errorCallback(imgur.error)
            
        } else
            errorCallback(error)
        
        completeCallback()
    }
}
