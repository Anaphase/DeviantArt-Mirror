var request = require('request');

module.exports = {
	
	getImage: function(data){
		
		data = data || {};
		
		//  variable          source           default
		var url              = data.url       || "",
		    errorCallback    = data.error     || function(){},
		    successCallback  = data.success   || function(){},
		    completeCallback = data.complete  || function(){};
		
		var requestOptions = {
			url: "http://backend.deviantart.com/oembed?url=" + encodeURIComponent(url)
		};
		
		request(requestOptions, function(error, response, body){
			
			if (!error && response.statusCode === 200) {
				
				var deviantart = JSON.parse(body);
				
				/*
					EXAMPLE RESPONSE FROM DEVAINT ART
					
					{
						version: "1.0",
						type: "photo",
						title: "Title",
						category: "Category > Subcategory",
						url: "URL to full image",
						author_name: "CoolGuy",
						author_url: "http://CoolGuy.deviantart.com",
						provider_name: "deviantART",
						provider_url: "http://www.deviantart.com",
						thumbnail_url: "URL to thumbnail",
						thumbnail_url_150: "URL to small thumbnail",
						thumbnail_width: 100,
						thumbnail_height: 100,
						width: "100",
						height: "100"
					}
					
				*/
				
				if(deviantart.type != "photo") errorCallback("Not an image.");
				
				successCallback(deviantart);
				completeCallback();
				
				return true;
				
			} else {
				errorCallback(error);
				completeCallback();
				return false;
			}
			
		});
		
	}
	
};