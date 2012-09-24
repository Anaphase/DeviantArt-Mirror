#!/usr/bin/env node

/*******************************************/
/* 
/* Reddit Bot - DeviantArt Mirror
/*
/* A simple Reddit bot
/*
/* by Colin Wood
/* 
/* License: WTFPL (http://sam.zoy.org/wtfpl/)
/* Attribution is cool but not required
/* 
/*******************************************/

// Imgur API Key: ef634f8fc76b2a3feff2f0bba6eddb7e

var imgur      = require('./lib/imgur.js'),
	reddit     = require('./lib/reddit.js'),
	deviantart = require('./lib/deviantart.js'),
	
	fs         = require('fs'),
	mirrorLog  = JSON.parse(fs.readFileSync('./data/mirrorLog.json')),
	commentLog = JSON.parse(fs.readFileSync('./data/commentLog.json')),
	
	stories	   = [],
	subreddits = [
		//	"adventuretime",
		//	"ainbowdash",
		//	"alternativeart",
		//	"Applejack",
		//	"derpyhooves",
		//	"fluttershy",
		//	"gravityfalls",
		//	"gumball",
		//	"Idliketobeatree",
		//	"mylittlealcoholic",
		//	"mylittlecmc",
		//	"MyLittleFoodManes",
		//	"MyLittleOutOfContext",
		"mylittlepony",
		//	"mylittleWTF",
		//	"pics",
		//	"pinkiepie",
		//	"Rarity",
		//	"regularshow",
		//	"twilightsparkle"
		];

console.beep = function(){
	console.log("\007");
}

reddit.login({
	username: "DeviantArtMirrorBot",
	password: "poopie",
	error: function(errors){
		errors.forEach(function(error){
			console.log("Error logging in: " + error[1]);
		});
	},
	success: function(){
		console.log("Logged in.");
		getStories();
		setInterval(getStories, 5000 * 60); // check new stories every 5 minutes
	}
});

function getStories() {
	
	console.log("Getting stories.");
	
	reddit.getStories({
		subreddit: "/r/" + subreddits.join("+"),
		error: function(error){
			console.log("Error getting stories: " + error);
		},
		success: function(story){
			
			// only consider links to DeviantArt
			if(!story.domain.match(/deviantart\.com$/)) return false;
			
			// skip this story if we've already mirrored it's image
			if(mirrorLog.indexOf(story.id) != -1) return false;
			
			deviantart.getImage(story.url, function(imageUrl){
				
				imgur.mirror(imageUrl, function(mirroredImageUrl){
					
					if(!imageUrl || mirroredImageUrl == "http://imgur.com/?error")
						return false;
					
					story.imageUrl         = imageUrl,
					story.mirroredImageUrl = mirroredImageUrl;
					
					console.log("    Mirrored " + story.id + " from /r/" + story.subreddit + ":\n        " + imageUrl + "\n        " + mirroredImageUrl + "\n");
					
					mirrorLog.push(story.id);
					saveMirrorLog();
					
					var pony = (story.subreddit.toLowerCase() == "mylittlepony")?"[](/scootacheer)":"";
					
					reddit.comment({
						thingId: story.id,
						thingType: "link",
						text: pony+"[Here's an Imgur mirror!](" + story.mirroredImageUrl + ")\n- - -\n^I ^am ^a ^bot. ^| [^FAQ](http://www.reddit.com/r/DeviantArtMirrorBot/comments/10cupp/faq/) ^| [^Report ^a ^Problem](http://www.reddit.com/r/DeviantArtMirrorBot/submit?title=Problem%20Report%26text=Describe%20the%20problem%20here.) ^| [^Contact ^the ^Creator](http://www.reddit.com/message/compose/?to=Anaphase%26subject=ATTN:%20DeviantArtMirrorBot)",
						error: function(error){
							console.log("    Error making comment on " + story.id + ":");
							console.log(error);
							console.log("\n");
						},
						success: function(){
							console.beep();
							console.log("    Commented on http://reddit.com/r/" + story.subreddit + "/comments/" + story.id + "\n");
							commentLog.push(story.id);
							saveCommentLog();
						}
					});
					
				});
				
			});
		}
	});
	
}

function saveMirrorLog() {
	
	var data = JSON.stringify(mirrorLog);
	
	fs.writeFile("./data/mirrorLog.json", data, function (error) {
		if(error) {
			console.log("Error saving mirrorLog:");
			console.log(error.message);
			return false;
		}
		return true;
	});
	
}

function saveCommentLog() {
	
	var data = JSON.stringify(commentLog);
	
	fs.writeFile("./data/commentLog.json", data, function (error) {
		if(error) {
			console.log("Error saving commentLog:");
			console.log(error.message);
			return false;
		}
		return true;
	});
	
}