var request              = require('request'),
    
    fs                   = require('fs'),
    savedUsers           = JSON.parse(fs.readFileSync('./data/savedUsers.json')),
    
    cookie               = "",
    modhash              = "",
    cookieJar            = request.jar(),
    globalRequestOptions = { jar: cookieJar, headers: { "User-Agent": "DeviantArt -> Imgur Mirror Bot by /u/Anaphase" } },
    
    _              = require('underscore');

module.exports = {
	
	login: function(data){
		
		//  variable          source           default
		var username        = data.username || "",
		    password        = data.password || "",
		    errorCallback   = data.error    || function(){},
		    successCallback = data.success  || function(){};
		
		// if we already have a cookie and modhash for this user, use that
		if(savedUsers[username]){
			cookie  = savedUsers[username].cookie,
			modhash = savedUsers[username].modhash;
			cookieJar.add(request.cookie("reddit_session="+cookie));
			successCallback();
			return true;
		}
		
		var requestOptions = {
			url: "http://www.reddit.com/api/login/" + username,
			form: { "api_type": "json", "user": username, "passwd": password }
		};
		_.defaults(requestOptions, globalRequestOptions);
		
		var that = this;
		request.post(requestOptions, function(error, response, body){
			
			var reddit = JSON.parse(body).json;
			
			if(reddit.errors.length) {
				errorCallback(reddit.errors);
				return false;
			}
			
			cookie  = reddit.data.cookie,
			modhash = reddit.data.modhash;
			
			cookieJar.add(request.cookie("reddit_session="+cookie));
			
			savedUsers[username] = {"cookie": cookie, "modhash": modhash};
			that.saveUsers();
			
			successCallback();
			return true;
			
		});
		
		return true;
		
	},
	
	comment: _.throttle(function(data){
		
		//  variable          source            default
		var text            = data.text      || "",
		    thing_id        = data.thingId   || "",
		    thing_type      = data.thingType || "link",
		    errorCallback   = data.error     || function(){},
		    successCallback = data.success   || function(){};
		
		switch(thing_type){
			case 1:
			case "t1":
			case "comment":
				thing_type = "t1";
				break;
				
			case 2:
			case "t2":
			case "account":
				thing_type = "t2";
				break;
				
			case 3:
			case "t3":
			case "link":
				thing_type = "t3";
				break;
				
			case 4:
			case "t4":
			case "message":
				thing_type = "t4";
				break;
				
			case 5:
			case "t5":
			case "subreddit":
				thing_type = "t5";
				break;
				
			default:
				thing_type = "t3"; // deafault to link
		}
		
		var requestOptions = {
			url: "http://www.reddit.com/api/comment",
			form: { "uh": modhash, "thing_id": thing_type+"_"+thing_id, "text": text }
		};
		_.defaults(requestOptions, globalRequestOptions);
		
		request.post(requestOptions, function(error, response, body){
			
			var reddit = JSON.parse(body),
			    commentError = false;
			
			reddit.jquery.forEach(function(command){
				if(typeof command[3] === "object") {
					switch(command[3][0]){
						case ".error.USER_REQUIRED":
							console.log(reddit.jquery);
							commentError = reddit.jquery[6][3][0]; // "please login to do that"
							break;
						
						case ".error.RATELIMIT.field-ratelimit":
							console.log(reddit.jquery);
							commentError = reddit.jquery[14][3][0]; // "You are doing that too much..."
							break;
					}
				}
			});
			
			if(commentError) {
				errorCallback(commentError);
				return false;
			}
			
			successCallback(reddit.jquery[18][3][0][0]);
			return true;
			
		});
		
		return true;
		
	}, 10000 * 60), // throttle to 10 mins, the limit for new users
	
	getStories: function(data){
		
		//  variable           source            default
		var subreddit        = data.subreddit || "",
		    newOnly          = data.newOnly   || false;
		    errorCallback    = data.error     || function(){},
		    successCallback  = data.success   || function(){};
		
		var requestOptions = {
			url: "http://www.reddit.com" + subreddit + "/" + ((newOnly)?"new":"") + ".json?limit=1000"
		};
		_.defaults(requestOptions, globalRequestOptions);
		
		request(requestOptions, function(error, response, body){
			
			if (!error && response.statusCode === 200) {
				
				var reddit = JSON.parse(body),
					stories = reddit.data.children.map(function (s) { return s.data; });
				
				successCallback(stories);
				
				//	stories.forEach(function(story){
				//		successCallback(story);
				//	});
				
				return true;
				
			} else {
				errorCallback(error, response, body);
				return false;
			}
			
		});
		
		return true;
		
	},
	
	getNewStories: function(data){
		data.newOnly = true;
		return this.getStories(data);
	},
	
	saveUsers: function(){
		
		var data = JSON.stringify(savedUsers);
		
		fs.writeFile("./data/savedUsers.json", data, function (error) {
			if(error) {
				console.log("There has been an error saving your configuration data.");
				console.log(error);
				return false;
			}
			return true;
		});
		
	}
	
};