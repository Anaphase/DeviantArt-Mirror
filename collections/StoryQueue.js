var fs       = require('fs'),
    _        = require('underscore'),
    Backbone = require('backbone'),
    
    Story    = require('./../models/Story.js');

module.exports = Backbone.Collection.extend({
	
	model: Story,
	
	comparator: function(Story){
		return -1 * Story.get("queue_position"); // keep queue order by story score
	},
	
	initialize: function(){
		this.load();
	},
	
	// override add function to update story data before Backbone discards duplicates
	add: function(stories){
		var that = this;
		stories.forEach(function(story){
			
			var duplicate = that.where({"id": story.id, "ignore": false})[0];
			
			if(!duplicate) {
				Backbone.Collection.prototype.add.call(that, story);
			} else {
				// replace a few values to get the queue up to date
				duplicate.set({
					"queue_position": duplicate.get("queue_position") - (duplicate.get("score") - story.score), // updates queue position relative to the change in score
					"num_comments": story.num_comments,
					"score": story.score,
					"edited": story.edited,
					"downs": story.downs,
					"ups": story.ups
				});
			}
			
		});
	},
	
	// override normal size function to account for "ignored" models
	size: function(){
		return this.where({"ignore": false}).length;
	},
	
	numMirrored: function(){
		return this.filter(function(story){
			return story.get("mirrored_image") !== null && !story.get("ignore")
		}).length;
	},
	
	numCommented: function(){
		return this.filter(function(story){
			return story.get("comment_id") !== null && !story.get("ignore")
		}).length;
	},
	
	numNotMirrored: function(){
		return this.filter(function(story){
			return story.get("mirrored_image") === null && !story.get("ignore")
		}).length;
	},
	
	numNotCommented: function(){
		return this.filter(function(story){
			return story.get("comment_id") === null && !story.get("ignore")
		}).length;
	},
	
	// find the first story that hasn't been mirrored yet
	getNextStoryForMirror: function(){
		return this.find(function(story){
			return story.get("mirrored_image") === null && !story.get("ignore");
		});	
	},
	
	// find the first story that has been mirrored, but hasn't been commented on yet
	getNextStoryForComment: function(){
		return this.find(function(story){
			return story.get("mirrored_image") !== null && story.get("comment_id") === null && !story.get("ignore");
		});	
	},
	
	load: function(data){
		data = data || {};
		this.reset(JSON.parse(fs.readFileSync('./data/StoryQueue.json')));
	},
	
	save: function(data){
		
		data = data || {};
		
		//  variable          source           default
		var errorCallback   = data.error    || function(){ console.log("Error saving StoryQueue:"); console.log(error.message); },
		    successCallback = data.success  || function(){};
		
		fs.writeFile("./data/StoryQueue.json", JSON.stringify(this.toJSON()), function (error) {
			if(error) {
				errorCallback(error.message);
				return false;
			}
			successCallback();
			return true;
		});
		
	}
	
});
