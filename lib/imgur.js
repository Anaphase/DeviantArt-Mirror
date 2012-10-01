var _                    = require('underscore')
  , request              = require('request')
  , qs                   = require('querystring')
    
  , credentials          = require('./credentials.js')
    
  , console              = require('./console.js')
  
  , globalRequestOptions = {
        oauth: {
            consumer_key: credentials.imgur.key
          , consumer_secret: credentials.imgur.secret
          , token: credentials.imgur.access_token
          , token_secret: credentials.imgur.access_token_secret
        }
      , headers: { "User-Agent": "DeviantArt -> Imgur Mirror Bot by http://reddit.com/u/Anaphase" }
    }

module.exports = {
    
    mirror: _.throttle(function(data){
        
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
          , form: { "image": url, "title": title, "caption": caption }
        }
        _.defaults(requestOptions, globalRequestOptions)
        _.defaults(requestOptions.oauth, globalRequestOptions.oauth)
        
        request.post(requestOptions, function (error, response, body){
            
            if (!error && response.statusCode === 200) {
                
                var imgur = JSON.parse(body)
                
                if (!imgur.error)
                    successCallback(imgur)
                else
                    errorCallback(imgur.error)
                
                completeCallback()
                
            } else {
                errorCallback()
                completeCallback()
            }
        })
        
  }, 1000 * 60) // throttle to 1 per minute
    
  //    , mirror: _.throttle(function(data){
  //          
  //          if (!data || typeof data !== "object") return false
  //          
  //          //  variable           source            default
  //          var url              = data.url       || ""
  //            , errorCallback    = data.error     || function(){}
  //            , successCallback  = data.success   || function(){}
  //            , completeCallback = data.complete  || function(){}
  //          
  //          request("http://api.imgur.com/2/upload?url=" + url, function(error, response, body) {
  //              
  //              var imgurHash = response.request.uri.path
  //              
  //              if (!error && response.statusCode === 200)
  //                  successCallback("http://imgur.com" + imgurHash)
  //              else
  //                  errorCallback(error)
  //              
  //              completeCallback()
  //          })
  //      }, 1000 * 60) // throttle to 1 per minute
}
