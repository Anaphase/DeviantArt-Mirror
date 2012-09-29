var request = require('request'),
    _       = require('underscore');

module.exports = {
	
	mirror: _.throttle(function(data){
	    
		data = data || {};
		
		//  variable          source           default
		var url              = data.url       || "",
		    errorCallback    = data.error     || function(){},
		    successCallback  = data.success   || function(){},
		    completeCallback = data.complete  || function(){};
		
	    request("http://api.imgur.com/2/upload?url=" + url, function(error, response, body) {
		    
		    var imgurHash = response.request.uri.path;
		    
			if (!error && response.statusCode === 200) {
				successCallback("http://imgur.com" + imgurHash);
			} else {
				errorCallback(error);
				completeCallback();
			}
			
		});
	    
	}, 1000 * 60) // throttle to 1 per minute
	
};