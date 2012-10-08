var request = require('request')
  , console = require('./console.js')

module.exports = {
    
    getImage: function(data){
        
        if (!data || typeof data !== "object") return false
        
        //  variable           source            default
        var url              = data.url       || ""
          , errorCallback    = data.error     || function(){}
          , successCallback  = data.success   || function(){}
          , completeCallback = data.complete  || function(){}
          
          , requestOptions   = {}
        
        requestOptions = {
            url: "http://backend.deviantart.com/oembed?url=" + encodeURIComponent(url)
        }
        
        request(requestOptions, function(error, response, body){
            
            if (!error) {
                
                if (response.statusCode !== 200) {
                    errorCallback(body)
                    completeCallback()
                    return
                }
                
                var deviantart = JSON.parse(body)
                
                if (deviantart.type == "photo")
                    successCallback(deviantart)
                else
                    errorCallback("Not an image.")
                
            } else {
                errorCallback(error)
            }
            
            completeCallback()
        })
    }
}
