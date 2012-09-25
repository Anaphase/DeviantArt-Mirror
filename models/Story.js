var _        = require('underscore'),
    Backbone = require('backbone');

module.exports = Backbone.Model.extend({
	
	defaults: {
		
		"queue_position": 0, // initially set to the story's score, but can change dynamically
		"failed_mirrors": 0, // determines how far down the queue we'll place this story if a mirror fails
		"failed_comments": 0, // determines how far down the queue we'll place this story if a comment fails
		"deviantart_image": null,
		"mirrored_image": null,
		"comment_id": null, // the Reddit "Thing ID" that denotes the comment I've made in this story
		
		// REDDIT DATA
		"kind": "t3",
		"domain": null,
		"banned_by": null,
		"media_embed": {},
		"subreddit": null,
		"selftext_html": null,
		"selftext": null,
		"likes": null,
		"link_flair_text": null,
		"id": null,
		"clicked": false,
		"title": null,
		"num_comments": 0,
		"score": 0,
		"approved_by": null,
		"over_18": false,
		"hidden": false,
		"thumbnail": null,
		"subreddit_id": null,
		"edited": false,
		"link_flair_css_class": null,
		"author_flair_css_class": null,
		"downs": 0,
		"saved": false,
		"is_self": false,
		"permalink": null,
		"name": null,
		"created": 0,
		"url": null,
		"author_flair_text": null,
		"author": null,
		"created_utc": 0,
		"media": null,
		"num_reports": null,
		"ups": 0
	},
	
	initialize: function(){
		this.set({"queue_position": this.get("score")});
		this.on("change:failed_mirrors", function(){
			this.updateQueuePosition(this.get("failed_mirrors"));
		}, this);
		this.on("change:failed_comments", function(){
			this.updateQueuePosition(this.get("failed_comments"));
		}, this);
	},
	
	failedToMirror: function(){
		var failed_mirrors = this.get("failed_mirrors");
		failed_mirrors++;
		this.set({"failed_mirrors": failed_mirrors});
	},
	
	failedToComment: function(){
		var failed_comments = this.get("failed_comments");
		failed_comments++;
		this.set({"failed_comments": failed_comments});
	},
	
	updateQueuePosition: function(perpetrator){
		
		var oldQueuePosition = this.get("queue_position"),
		    newQueuePosition = this.get("score") - Math.pow(2, perpetrator);
		
		if(newQueuePosition < 0) newQueuePosition = 0;
		
		this.set({"queue_position": newQueuePosition});
		
		this.collection.sort();
		
		console.log("Story " + this.get("id") + " moved in queue from " + oldQueuePosition + " to " + this.get("queue_position") + ". (Perpetrator: " + perpetrator + ")");
		
	}
	
});
