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

var imgur       = require('./lib/imgur.js')
  , reddit      = require('./lib/reddit.js')
  , deviantart  = require('./lib/deviantart.js')
    
  , colors      = require('colors')
    
  , _           = require('underscore')
  , Backbone    = require('backbone')
    
  , StoryQueue = new (require('./collections/StoryQueue.js'))
    
  , subreddits  = [
    	"mylittlepony"
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
    ]
    
    // setInterval IDs
  , storyLoopID = null
  , mirrorLoopID = null
  , commentLoopID = null
  
    // used to only print "all stories mirrored/commented" once, until there are more stories in the queue
  , printAllMirroredDefault = function(){ console.warn("All stories in queue have been mirrored!"); }
  , printAllCommentedDefault = function(){ console.warn("All mirrored stories in queue have been commented on!"); }
  , printAllMirrored = _.once(printAllMirroredDefault)
  , printAllCommented = _.once(printAllCommentedDefault)
;

_.extend(console, {
	
	beep: function(){
		process.stdout.write("\007");
	},
	
	logBold: function(s){ (typeof s === "string")?console.log(s.bold):console.log(s); },
	logItalic: function(s){ (typeof s === "string")?console.log(s.italic):console.log(s); },
	logUnderline: function(s){ (typeof s === "string")?console.log(s.underline):console.log(s); },
	logInverse: function(s){ (typeof s === "string")?console.log(s.inverse):console.log(s); },
	logYellow: function(s){ (typeof s === "string")?console.log(s.yellow):console.log(s); },
	logCyan: function(s){ (typeof s === "string")?console.log(s.cyan):console.log(s); },
	logWhite: function(s){ (typeof s === "string")?console.log(s.white):console.log(s); },
	logMagenta: function(s){ (typeof s === "string")?console.log(s.magenta):console.log(s); },
	logGreen: function(s){ (typeof s === "string")?console.log(s.green):console.log(s); },
	logRed: function(s){ (typeof s === "string")?console.log(s.red):console.log(s); },
	logGrey: function(s){ (typeof s === "string")?console.log(s.grey):console.log(s); },
	logBlue: function(s){ (typeof s === "string")?console.log(s.blue):console.log(s); },
	logRainbow: function(s){ (typeof s === "string")?console.log(s.rainbow):console.log(s); },
	logZebra: function(s){ (typeof s === "string")?console.log(s.zebra):console.log(s); },
	logRandom: function(s){ (typeof s === "string")?console.log(s.random):console.log(s); },
	
	warn: function(s){ console.logYellow(s); },
	error: function(s){ console.logRed(s); }
	
});

// check new stories every 10 minutes
var startStoryLoop = _.once(function(){
	storyLoop();
	storyLoopID = setInterval(storyLoop, 10000 * 60); 
});

// mirror a link every minute
var startMirrorLoop = _.once(function(){
	mirrorLoop();
	mirrorLoopID = setInterval(mirrorLoop, 1000 * 60);
});

// comment on a link every 5 minutes
var startCommentLoop = _.once(function(){
	commentLoop();
	commentLoopID = setInterval(commentLoop, 5000 * 60);
});

console.log("DeviantArt Mirror Bot - By http://reddit.com/u/Anaphase".cyan.underline.inverse);

reddit.login({
	username: "DeviantArtMirrorBot",
	password: "poopie",
	error: function(errors){
		errors.forEach(function(error){
			console.error("Error logging in: " + error[1]);
		});
	},
	success: function(){
		console.logGrey("Logged in.");
		startStoryLoop();
		//startMirrorLoop();
		//startCommentLoop();
	}
});

function storyLoop() {
	
	process.stdout.write("Getting new stories...".grey);
	
	reddit.getStories({
		subreddit: "/r/" + subreddits.join("+"),
		error: function(error, response, body){
			console.error(" Error getting stories:");
			console.error(error);
		},
		success: function(stories){
			
			// only consider stories from DeviantArt
			stories = stories.filter(function(story){
				return story.domain.match(/deviantart\.com$/);
			});
			
			var oldStoryQueueSize = StoryQueue.size();
			
			StoryQueue.add(stories);
			
			var numAddedStories = StoryQueue.size() - oldStoryQueueSize;
			
			if(numAddedStories > 0){
				StoryQueue.save();
			}
			
			console.logGrey(" Added " + numAddedStories + " new " + ((numAddedStories==1)?"story.":"stories."));
			
		},
		complete: function(){
			startMirrorLoop();
		}
	});
	
}

function mirrorLoop() {
	
	// find the first story that hasn't been mirrored yet
	var story = StoryQueue.getNextStoryForMirror();
	
	if(!story) {
		printAllMirrored();
		startCommentLoop();
		return true;
	}
	
	printAllMirrored = _.once(printAllMirroredDefault);
	
	var mirrorProgress = (StoryQueue.numMirrored() + 1) + "/" + StoryQueue.size();
	
	deviantart.getImage({
		url: story.get("url"),
		error: function(error){
			console.error(error);
			startCommentLoop();
		},
		success: function(deviantart){
			
			imgur.mirror({
				url: deviantart.url,
				error: function(error){
					console.error(error);
				},
				success: function(mirrored_image){
					
					// there was an error mirroring this image, abort
					// and move it down the queue (handled internally)
					if(!deviantart.url || !mirrored_image || mirrored_image == "http://imgur.com/?error") {
						
						console.error(("Failed to mirror image " + mirrorProgress + " (attempt " + (story.get("failed_mirrors")+1) + " of " + story.get("ignore_threshold") + "):").bold);
						console.error('    [' + story.get("score") + '] "' + story.get("title").italic + '" (' + ('http://reddit.com' + story.get("permalink")).underline + ')');
						console.error('    -> ' + story.get("url").underline);
						
						story.failedToMirror();
						
						return false;
					}
					
					story.set({
						"deviantart_image": deviantart.url,
						"mirrored_image": mirrored_image
					});
					
					console.logBold("Mirrored image " + mirrorProgress + ":");
					console.log('    [' + story.get("score") + '] "' + story.get("title").italic + '" (' + ('http://reddit.com' + story.get("permalink")).underline + ')');
					console.log('    -> ' + story.get("url").underline);
					console.log('    -> ' + story.get("deviantart_image").underline);
					console.log('    -> ' + story.get("mirrored_image").underline);
					
					StoryQueue.save();
					
				},
				complete: function(){
					startCommentLoop();
				}
				
			});
			
		}
		
	});
}

function commentLoop() {
	
	// find the first story that has been mirrored, but hasn't been commented on yet
	var story = StoryQueue.getNextStoryForComment();
	
	if(!story) {
		printAllCommented();
		return true;
	}
	
	printAllCommented = _.once(printAllCommentedDefault);
	
	var commentProgress = (StoryQueue.numCommented() + 1) + "/" + StoryQueue.size();
	
	// put Scootaloo in the comment if we're on MLP :D
	var pony = (story.get("subreddit").toLowerCase() == "mylittlepony")?"[](/scootacheer)":"",
	    
	    commentText = pony + "[Here's an Imgur mirror!](" + story.get("mirrored_image") + ")\n- - -\n^I ^am ^a ^bot. ^| [^FAQ](http://www.reddit.com/r/DeviantArtMirrorBot/comments/10cupp/faq/) ^| [^Report ^a ^Problem](http://www.reddit.com/r/DeviantArtMirrorBot/submit?title=Problem%20Report&text=Describe%20the%20problem%20here.) ^| [^Contact ^the ^Creator](http://www.reddit.com/message/compose/?to=Anaphase&subject=ATTN:%20DeviantArtMirrorBot)";
	
	if(StoryQueue.where({"id": story.get("id"), "comment_id": null}).length == 0) {
		console.error(("DUPLICATE COMMENT DETECTED " + commentProgress + ":").bold.inverse);
		console.error('    [' + story.get("score") + '] "' + story.get("title").italic + '" (' + ('http://reddit.com' + story.get("permalink")).underline + ')');
		console.error('    -> ' + story.get("url").underline);
		return false;
	}
	
	reddit.comment({
		thingId: story.get("id"),
		thingType: "link",
		text: commentText,
		error: function(error){
			
			console.error("Failed to comment on story " + commentProgress + " (attempt " + (story.get("failed_comments")+1) + " of " + story.get("ignore_threshold") + "):");
			console.error('    [' + story.get("score") + '] "' + story.get("title").italic + '" (' + ('http://reddit.com' + story.get("permalink")).underline + ')');
			console.error('    -> ' + story.get("url").underline);
			console.error(error);
			
			story.failedToComment();
			
			return false;
			
		},
		success: function(response){
			
			var commentID = response.data.id;
			
			story.set({"comment_id": response.data.id});
			
			console.beep();
			console.logGreen(("Commented on story " + commentProgress + ":").bold);
			console.logGreen('    [' + story.get("score") + '] "' + story.get("title").italic + '" (' + ('http://reddit.com' + story.get("permalink")).underline + ')');
			console.logGreen('    -> ' + story.get("url").underline);
			console.logGreen('    -> Comment ID: ' + commentID);
			
			StoryQueue.save();
			
		}
	});
	
}