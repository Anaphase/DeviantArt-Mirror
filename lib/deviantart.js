var request = require('request')
  , console = require('./console.js')

module.exports = {
    
    getImage: function(data){
        
        if (!data || typeof data !== 'object') return false
        
        //  variable           source            default
        var url              = data.url       || ''
          , errorCallback    = data.error     || function(){}
          , successCallback  = data.success   || function(){}
          , completeCallback = data.complete  || function(){}
            
          , requestOptions   = {}
        
        requestOptions = {
            url: 'http://backend.deviantart.com/oembed?url=' + encodeURIComponent(url)
        }
        
        request(requestOptions, function(error, response, body){
            
            var deviantart
            
            if (!error) {
                
                if (response.statusCode !== 200) {
                    errorCallback('DeviantArt returned a non-OK status code of ' + response.statusCode + '. Here\'s what DeviantArt said: \n' + body)
                    completeCallback()
                    return
                }
                
                try {
                    deviantart = JSON.parse(body)
                } catch(e) {
                    errorCallback('DeviantArt returned a status code of 200, but did not return JSON. What\'s up with that?! Here\'s what DeviantArt returned: \n' + body)
                    completeCallback()
                    return
                }
                
                if (deviantart.type == 'photo')
                    successCallback(deviantart)
                else
                    errorCallback('The requested Deviation is not an image.')
                
            } else
                errorCallback(error)
            
            completeCallback()
        })
    }
}
