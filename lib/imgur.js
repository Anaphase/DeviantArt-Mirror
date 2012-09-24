var request = require('request'),
    _       = require("./vendor/underscore-min.js");;

module.exports = {
	
	mirror: _.throttle(function(imageUrl, callback){
	    
	    request('http://api.imgur.com/2/upload?url='+imageUrl, function(error, response, body) {
		    
		    var imgurHash = response.request.uri.path;
		    
			if (!error && response.statusCode === 200) {
				callback("http://imgur.com"+imgurHash);
			}
			
		});
	    
	}, 1000 * 60) // throttle to 1 per minute
	
};