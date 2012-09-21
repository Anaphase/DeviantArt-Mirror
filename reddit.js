var request = require('request');

module.exports = {
	
	getNewStories: function(){
		
		var subreddit = "",
		    callback  = function(){};
		
		switch(typeof arguments[0]) {
			case "string":
				subreddit = arguments[0],
				callback  = arguments[1];
				break;
			
			case "function":
				callback = arguments[0];
				break;
				
			default:
				return false;
		}
		
		var options = {
			url: 'http://www.reddit.com' + subreddit + '/new.json?limit=200',
			headers: {
				'User-Agent': 'DeviantArt -> Imgur Mirror Bot by /u/Anaphase'
			}
		};
		
		request(options, function(error, response, body) {
			
			if (!error && response.statusCode === 200) {
				
				var reddit = JSON.parse(body),
					stories = reddit.data.children.map(function (s) { return s.data; });
				
				//	stories = stories.filter(function(story){
				//		return story.domain.match(/deviantart\.com$/);
				//	});
				//	
				//	callback(stories[0]);
				
				stories.forEach(function(story){
					callback(story);
				});
				
			}
			
		});
		
	}
	
};