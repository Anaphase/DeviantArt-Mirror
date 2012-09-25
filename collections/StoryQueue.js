var fs       = require('fs'),
    _        = require('underscore'),
    Backbone = require('backbone'),
    
    Story    = require('./../models/Story.js');

module.exports = Backbone.Collection.extend({
	
	model: Story,
	
	comparator: function(Story){
		return -1 * Story.get("score"); // keep queue order by story score
	},
	
	initialize: function(){
		this.load();
	},
	
	load: function(){
		this.reset(JSON.parse(fs.readFileSync('./data/StoryQueue.json')));
	},
	
	save: function(){
		
		var data = JSON.stringify(this.toJSON());
		
		fs.writeFile("./data/StoryQueue.json", data, function (error) {
			if(error) {
				console.log("Error saving StoryQueue:");
				console.log(error.message);
				return false;
			}
			return true;
		});
		
	}
	
});
