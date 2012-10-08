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
      , headers: { "User-Agent": "DeviantArt -> Imgur Mirror Bot by http://reddit.com/u/Anaphase" }
    }

module.exports = {
    
    upload: function(data){
        
        if (!data || typeof data !== "object") return false
        
        //  variable           source            default
        var image            = data.image     || ""
          , title            = data.title     || ""
          , caption          = data.caption   || ""
          , errorCallback    = data.error     || function(){}
          , successCallback  = data.success   || function(){}
          , completeCallback = data.complete  || function(){}
          , requestOptions   = {}
        
        requestOptions = {
            url: "http://api.imgur.com/2/upload.json"
          , form: {
                "image": fs.readFileSync(image, 'base64')
              , "type": "base64"
              , "name": title
              , "title": title
              , "caption": caption
            }
        }
        _.defaults(requestOptions, globalRequestOptions)
        
        request.post(requestOptions, function (error, response, body){
            
            if (!error) {
                
                var imgur = JSON.parse(body)
                
                if(response.statusCode !== 200) {
                    errorCallback(imgur.error)
                    completeCallback()
                    return
                }
                
                if (!imgur.error)
                    successCallback(imgur)
                else
                    errorCallback(imgur.error)
                
                completeCallback()
                
            } else {
                errorCallback(error)
                completeCallback()
            }
        })
    }
    
  , mirror: function(data){
        
        if (!data || typeof data !== "object") return false
        
        //  variable           source            default
        var url              = data.url       || ""
          , title            = data.title     || ""
          , caption          = data.caption   || ""
          , errorCallback    = data.error     || function(){}
          , successCallback  = data.success   || function(){}
          , completeCallback = data.complete  || function(){}
          , requestOptions   = {}
        
        requestOptions = {
            url: "http://api.imgur.com/2/upload.json"
          , form: { "image": url, "name": title, "title": title, "caption": caption }
        }
        _.defaults(requestOptions, globalRequestOptions)
        
        request.post(requestOptions, function (error, response, body){
            
            if (!error) {
                    
                var imgur = JSON.parse(body)
                
                if(response.statusCode !== 200) {
                    errorCallback(imgur.error)
                    completeCallback()
                    return
                }
                
                if (!imgur.error)
                    successCallback(imgur)
                else
                    errorCallback(imgur.error)
                
                completeCallback()
                
            } else {
                errorCallback(error)
                completeCallback()
            }
        })
    }
  
}
