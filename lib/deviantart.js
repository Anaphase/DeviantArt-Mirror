var fs      = require('fs'),
    jsdom   = require('jsdom'),
    jquery  = fs.readFileSync('./lib/vendor/jquery-1.8.1.js').toString();

module.exports = {
	
	getImage: function(url, callback){
	    
	    jsdom.env({
	    	html: url,
	    	src: [jquery],
	    	done: function(errors, window) {
	    		
	    		var $ = window.$;
	    		var imageUrl = $('#download-button').attr("href");
	    		
	    		callback(imageUrl);
	    		
	    	}
	    });
	    
	}
	
};