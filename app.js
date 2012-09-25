#!/usr/bin/env node

/*******************************************
 
 DeviantArt Mirror (Reddit Bot)
 
 A simple Reddit bot that polls Reddit
 for links to DeviantArt and mirrors the
 images onto Imgur.
 
 by Colin Wood (http://reddit.com/u/Anaphase)
 
 License: WTFPL (http://sam.zoy.org/wtfpl/)
 Attribution is cool but not required
 
*******************************************/

// Imgur API Key: ef634f8fc76b2a3feff2f0bba6eddb7e

var imgur       = require('./lib/imgur.js'),
    reddit      = require('./lib/reddit.js'),
    deviantart  = require('./lib/deviantart.js'),
    
    _           = require('underscore'),
    Backbone    = require('backbone'),
    
    StoryQueue = new (require('./collections/StoryQueue.js')),
    
    subreddits  = [
    	"totally_not_a_bot"
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
        //	"mylittlepony",
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
		storyLoop();
		setInterval(storyLoop, 5000 * 60); // check new stories every 5 minutes
		setInterval(mirrorLoop, 1000 * 60); // mirror a link every minute
		setInterval(commentLoop, 10000 * 60); // comment on a link every 10 minutes
	}
});

function storyLoop() {
	
	console.log("Getting new stories...");
	
	reddit.getStories({
		subreddit: "/r/" + subreddits.join("+"),
		error: function(error, response, body){
			console.log("    Error getting stories:");
			console.log(error);
			console.log(response.statusCode);
			//console.log(response.request);
		},
		success: function(stories){
			
			// only consider stories from DeviantArt
			stories = stories.filter(function(story){
				return story.domain.match(/deviantart\.com$/);
			});
			
			var oldStoryQueueSize = StoryQueue.size();
			
			StoryQueue.add(stories).save({
				success: function(){
					var numAddedStories = StoryQueue.size() - oldStoryQueueSize;
					console.log("    Added " + numAddedStories + " new " + ((numAddedStories==1)?"story.":"stories."));
				}
			});
			
		}
	});
	
}

function mirrorLoop() {
	
	// find the first story that hasn't been mirrored yet
	var story = StoryQueue.find(function(story){ return story.get("mirrored_image") === null; });
	
	if(!story) {
		console.log("All stories in queue have been mirrored!");
		return true;
	}
	
	deviantart.getImage(story.get("url"), function(deviantart_image){
		
		imgur.mirror(deviantart_image, function(mirrored_image){
			
			// there was an error mirroring this image, abort
			// and move it down the queue (handled internally)
			if(!deviantart_image || mirrored_image == "http://imgur.com/?error") {
				
				console.log("Failed to mirror image:");
				console.log('    "' + story.get("title") + '" (http://reddit.com' + story.get("permalink") + ')');
				console.log('    -> ' + story.get("url"));
				
				story.failedToMirror();
				
				return false;
			}
			
			story.set({
				"deviantart_image": deviantart_image,
				"mirrored_image": mirrored_image
			});
			
			StoryQueue.save({
				success: function(){
					console.log("Mirrored image:");
					console.log('    "' + story.get("title") + '" (http://reddit.com' + story.get("permalink") + ')');
					console.log('    -> ' + story.get("url"));
					console.log('    -> ' + story.get("deviantart_image"));
					console.log('    -> ' + story.get("mirrored_image"));
				}
			});
			
		});
		
	});
}

function commentLoop() {
	
	// find the first story that hasn't been commented on yet
	var story = StoryQueue.find(function(story){ return story.get("comment_id") === null; });
	
	if(!story) {
		console.log("All stories in queue have been commented on!");
		return true;
	}
	
	// put Scootaloo in the comment if we're on MLP :D
	var pony = (story.subreddit.toLowerCase() == "mylittlepony")?"[](/scootacheer)":"",
	    
	    commentText = pony + "[Here's an Imgur mirror!](" + story.get("mirrored_image") + ")\n- - -\n^I ^am ^a ^bot. ^| [^FAQ](http://www.reddit.com/r/DeviantArtMirrorBot/comments/10cupp/faq/) ^| [^Report ^a ^Problem](http://www.reddit.com/r/DeviantArtMirrorBot/submit?title=Problem%20Report%26text=Describe%20the%20problem%20here.) ^| [^Contact ^the ^Creator](http://www.reddit.com/message/compose/?to=Anaphase%26subject=ATTN:%20DeviantArtMirrorBot)";
	
	reddit.comment({
		thingId: story.id,
		thingType: "link",
		text: commentText,
		error: function(error){
			
			console.log("Failed to comment on story:");
			console.log('    "' + story.get("title") + '" (http://reddit.com' + story.get("permalink") + ')');
			console.log('    -> ' + story.get("url"));
			console.log(error);
			
			story.failedToComment();
			
			return false;
			
		},
		success: function(response){
			
			var commentID = response.data.id;
			
			story.set({"comment_id": response.data.id});
			
			StoryQueue.save({
				success: function(){
					console.beep();
					console.log("Commented on story:");
					console.log('    "' + story.get("title") + '" (http://reddit.com' + story.get("permalink") + ')');
					console.log('    -> ' + story.get("url"));
					console.log('    -> Comment ID: ' + commentID);
				}
			});
			
		}
	});
	
}