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
	
	logBold: function(s){ console.log(s.bold); },
	logItalic: function(s){ console.log(s.italic); },
	logUnderline: function(s){ console.log(s.underline); },
	logInverse: function(s){ console.log(s.inverse); },
	logYellow: function(s){ console.log(s.yellow); },
	logCyan: function(s){ console.log(s.cyan); },
	logWhite: function(s){ console.log(s.white); },
	logMagenta: function(s){ console.log(s.magenta); },
	logGreen: function(s){ console.log(s.green); },
	logRed: function(s){ console.log(s.red); },
	logGrey: function(s){ console.log(s.grey); },
	logBlue: function(s){ console.log(s.blue); },
	logRainbow: function(s){ console.log(s.rainbow); },
	logZebra: function(s){ console.log(s.zebra); },
	logRandom: function(s){ console.log(s.random); },
	
	warn: function(s){ console.log(s.yellow); },
	error: function(s){ console.log(s.red); }
	
});

// check new stories every 5 minutes
var startStoryLoop = _.once(function(){
	storyLoop();
	storyLoopID = setInterval(storyLoop, 5000 * 60); 
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

console.log("DeviantArt Mirror Bot - By http://reddit.com/u/Anaphase".blue.invert);

reddit.login({
	username: "DeviantArtMirrorBot",
	password: "poopie",
	error: function(errors){
		errors.forEach(function(error){
			console.error("Error logging in: " + error[1]);
		});
	},
	success: function(){
		console.log("Logged in.");
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
			console.error("    Error getting stories:");
			console.log(error);
			console.log(response.statusCode);
			console.log(response.request);
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
		return true;
	}
	
	printAllMirrored = _.once(printAllMirroredDefault);
	
	var mirrorProgress = (StoryQueue.numNotMirrored() + 1) + "/" + StoryQueue.size();
	
	deviantart.getImage(story.get("url"), function(deviantart_image){
		
		imgur.mirror(deviantart_image, function(mirrored_image){
			
			// there was an error mirroring this image, abort
			// and move it down the queue (handled internally)
			if(!deviantart_image || !mirrored_image || mirrored_image == "http://imgur.com/?error") {
				
				console.error(("Failed to mirror image " + mirrorProgress + " (attempt " + (story.get("failed_mirrors")+1) + " of " + story.get("ignore_threshold") + "):").bold);
				console.error('    [' + story.get("score") + '] "' + story.get("title").italic + '" (' + ('http://reddit.com' + story.get("permalink")).underline + ')');
				console.error('    -> ' + story.get("url").underline);
				
				story.failedToMirror();
				
				startCommentLoop();
				
				return false;
			}
			
			story.set({
				"deviantart_image": deviantart_image,
				"mirrored_image": mirrored_image
			});
			
			console.logBold("Mirrored image " + mirrorProgress + ":");
			console.log('    [' + story.get("score") + '] "' + story.get("title").italic + '" (' + ('http://reddit.com' + story.get("permalink")).underline + ')');
			console.log('    -> ' + story.get("url").underline);
			console.log('    -> ' + story.get("deviantart_image").underline);
			console.log('    -> ' + story.get("mirrored_image").underline);
			
			startCommentLoop();
			
			StoryQueue.save();
			
		});
		
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
	    
	    commentText = pony + "[Here's an Imgur mirror!](" + story.get("mirrored_image") + ")\n- - -\n^I ^am ^a ^bot. ^| [^FAQ](http://www.reddit.com/r/DeviantArtMirrorBot/comments/10cupp/faq/) ^| [^Report ^a ^Problem](http://www.reddit.com/r/DeviantArtMirrorBot/submit?title=Problem%20Report%26text=Describe%20the%20problem%20here.) ^| [^Contact ^the ^Creator](http://www.reddit.com/message/compose/?to=Anaphase%26subject=ATTN:%20DeviantArtMirrorBot)";
	
	console.logCyan("About to comment:");
	console.logCyan("    -> ignore         = " + story.get("ignore"));
	console.logCyan("    -> comment_id     = " + story.get("comment_id"));
	console.logCyan("    -> mirrored_image = " + story.get("mirrored_image"));
	
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
			
			console.logCyan("About to update comment_id to " + response.data.id + ":");
			console.logCyan("    -> ignore         = " + story.get("ignore"));
			console.logCyan("    -> comment_id     = " + story.get("comment_id"));
			console.logCyan("    -> mirrored_image = " + story.get("mirrored_image"));
			
			story.set({"comment_id": response.data.id});
			
			console.beep();
			console.logGreen(("Commented on story " + commentProgress + ":").bold);
			console.logGreen('    [' + story.get("score") + '] "' + story.get("title").italic + '" (' + ('http://reddit.com' + story.get("permalink")).underline + ')');
			console.logGreen('    -> ' + story.get("url").underline);
			console.logGreen('    -> Comment ID: ' + commentID);
			
			StoryQueue.save();
			
		},
		complete: function(){
			console.logCyan("Just Commented:");
			console.logCyan("    -> ignore         = " + story.get("ignore"));
			console.logCyan("    -> comment_id     = " + story.get("comment_id"));
			console.logCyan("    -> mirrored_image = " + story.get("mirrored_image"));
		}
	});
	
}