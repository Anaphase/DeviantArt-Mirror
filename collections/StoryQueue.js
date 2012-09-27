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
