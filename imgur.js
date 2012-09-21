var request = require('request');

module.exports = {
	
	mirror: function(imageUrl, callback){
	    
	    request('http://api.imgur.com/2/upload?url='+imageUrl, function(error, response, body) {
		    
			if (!error && response.statusCode === 200) {
				callback("http://i.imgur.com"+response.request.uri.path);
			}
			
		});
	    
	}
	
};