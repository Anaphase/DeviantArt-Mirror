var _                    = require('underscore')
  , request              = require('request')
    
  , credentials          = require('../data/credentials.js').bitly
    
  , console              = require('./console.js')
  
  , globalRequestOptions = {
        qs: {
            login: credentials.username
          , apikey: credentials.apikey
        }
      , headers: { "User-Agent": "DeviantArt -> Imgur Mirror Bot by http://reddit.com/u/Anaphase" }
    }

module.exports = {
    
    shorten: function(data){
        
        if (!data || typeof data !== "object") return false
        
        //  variable           source            default
        var url              = data.url       || ""
          , errorCallback    = data.error     || function(){}
          , successCallback  = data.success   || function(){}
          , completeCallback = data.complete  || function(){}
          , requestOptions   = {}
        
        requestOptions = {
            qs: { uri: url }
          , url: "http://api.bitly.com/v3/shorten"
        }
        _.defaults(requestOptions, globalRequestOptions)
        _.defaults(requestOptions.qs, globalRequestOptions.qs)
        
        request.get(requestOptions, function (error, response, body){
            
            if (!error) {
                
                var bitly = JSON.parse(body)
                
                if (bitly.status_code === 200)
                    successCallback(bitly.data)
                else
                    errorCallback(bitly.status_txt)
                
                completeCallback()
                
            } else {
                errorCallback(error)
                completeCallback()
            }
        })
        
  }
}
