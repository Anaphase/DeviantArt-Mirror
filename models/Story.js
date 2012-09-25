var _        = require('underscore'),
    Backbone = require('backbone');

module.exports = Backbone.Model.extend({
	
	defaults: {
		
		"mirrored_image": null,
		"comment_id": null,
		
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
		
	},
	
});
