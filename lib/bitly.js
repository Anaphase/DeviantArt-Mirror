var _                    = require('underscore')
  , request              = require('request')
    
  , credentials          = require('../data/credentials.js').bitly
    
  , console              = require('./console.js')
  
  , globalRequestOptions = {
        qs: {
            login: credentials.username
          , apikey: credentials.apikey
        }
      , headers: { 'User-Agent': 'DeviantArt -> Imgur Mirror Bot by http://reddit.com/u/Anaphase' }
    }

module.exports = {
    
    shorten: function(data){
        
        if (!data || typeof data !== 'object') return false
        
        //  variable           source            default
        var url              = data.url       || ''
          , errorCallback    = data.error     || function(){}
          , successCallback  = data.success   || function(){}
          , completeCallback = data.complete  || function(){}
            
          , requestOptions   = {}
        
        requestOptions = {
            qs: { uri: url }
          , url: 'http://api.bitly.com/v3/shorten'
        }
        _.defaults(requestOptions, globalRequestOptions)
        _.defaults(requestOptions.qs, globalRequestOptions.qs)
        
        request.get(requestOptions, function (error, response, body){
            
            var bitly
            
            if (!error) {
                
                // bit.ly returns 200 with all responses, with the "real"
                // status code set as a JSON variable
                if (response.statusCode !== 200) {
                    errorCallback('Bit.ly server returned a non-OK status code of ' + response.statusCode + '. Here\'s what bit.ly said: \n' + body)
                    completeCallback()
                    return
                }
                
                
                try {
                    bitly = JSON.parse(body)
                } catch(e) {
                    errorCallback('Bit.ly returned a status code of 200, but did not return JSON. What\'s up with that?! Here\'s what bit.ly returned: \n' + body)
                    completeCallback()
                    return
                }
                
                if (bitly.status_code === 200)
                    successCallback(bitly.data)
                else
                    errorCallback('Error ' + bitly.status_code + ': ' + bitly.status_txt)
                
            } else
                errorCallback(error)
                
            completeCallback()
        })
    }
}
