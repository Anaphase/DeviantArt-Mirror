var fs       = require('fs')
    
  , console  = require('../lib/console.js')
    
  , _        = require('underscore')
  , Backbone = require('backbone')
    
  , Story    = require('../models/Story.js')

module.exports = Backbone.Collection.extend({
    
    model: Story
    
  , comparator: function(Story){
        return -1 * Story.get('queue_position')
    }
    
  , initialize: function(){
        this.load()
    }
    
    // override add function to update story data before Backbone discards duplicates
  , add: function(stories){
        
        var self     = this
          , numAdded = 0
        
        stories.forEach(function(story){
            
            var duplicate = self.where({'id': story.id})[0]
            
            if (!duplicate) {
                numAdded++
                Backbone.Collection.prototype.add.call(self, story)
            } else {
                // keep the queue up to date with the latest values from Reddit (if we're not ignoring the story)
                if (!duplicate.get('ignore'))
                    duplicate.set({
                        'queue_position': duplicate.get('queue_position') - (duplicate.get('score') - story.score) // updates queue position relative to the change in score
                      , 'num_comments': story.num_comments
                      , 'score': story.score
                      , 'edited': story.edited
                      , 'downs': story.downs
                      , 'ups': story.ups
                    })
            }
            
        })
        
        return numAdded
        
    }
    
    // override normal size function to account for "ignored" models
  , size: function(){
        return this.where({'ignore': false}).length
    }
    
  , load: function(){
        
        var newQueue
        
        try {
            newQueue = JSON.parse(fs.readFileSync('./data/StoryQueue.json'))
        } catch(e) {
            console.error('Could not parse StoryQueue.json')
            console.error(e)
            return
        }
        
        this.reset(newQueue)
    }
    
  , save: function(data){
        
        if (data && typeof data !== 'object') data = {}
        
        data = data || {}
        
        //  variable          source           default
        var errorCallback   = data.error    || function(error){ console.beep(); console.error('Error saving StoryQueue:'); console.error(error) }
          , successCallback = data.success  || function(){}
          , completeCallback = data.complete || function(){}
        
        fs.writeFile('./data/StoryQueue.json', JSON.stringify(this.toJSON()), function (error) {
            if (!error)
                successCallback()
            else
                errorCallback(error.message)
            completeCallback()
        })
    }
})
