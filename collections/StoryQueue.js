var fs       = require('fs')
    
  , console  = require('../lib/console.js')
    
  , _        = require('underscore')
  , Backbone = require('backbone')
    
  , Story    = require('../models/Story.js')

module.exports = Backbone.Collection.extend({
    
    model: Story
    
  , comparator: function(Story){
        return -1 * Story.get("queue_position")
    }
    
  , initialize: function(){
        this.load()
    }
    
    // override add function to update story data before Backbone discards duplicates
  , add: function(stories){
        
        var that     = this
          , numAdded = 0
        
        stories.forEach(function(story){
            
            var duplicate = that.where({"id": story.id, "ignore": false})[0]
            
            if (!duplicate) {
                numAdded++
                Backbone.Collection.prototype.add.call(that, story)
            } else {
                // keep the queue up to date with the latest values from Reddit
                duplicate.set({
                    "queue_position": duplicate.get("queue_position") - (duplicate.get("score") - story.score) // updates queue position relative to the change in score
                  , "num_comments": story.num_comments
                  , "score": story.score
                  , "edited": story.edited
                  , "downs": story.downs
                  , "ups": story.ups
                })
            }
            
        })
        
        return numAdded
        
    }
    
    // override normal size function to account for "ignored" models
  , size: function(){
        return this.where({"ignore": false}).length
    }
    
  , load: function(){
        this.reset(JSON.parse(fs.readFileSync('./data/StoryQueue.json')))
    }
    
  , save: function(data){
        
        if (data && typeof data !== "object") data = {}
        
        data = data || {}
        
        //  variable          source           default
        var errorCallback   = data.error    || function(error){ console.error("Error saving StoryQueue:"); console.error(error) },
            successCallback = data.success  || function(){}
        
        fs.writeFile("./data/StoryQueue.json", JSON.stringify(this.toJSON()), function (error) {
            if (error)
                errorCallback(error.message)
            else
                successCallback()
        })
    }
})
