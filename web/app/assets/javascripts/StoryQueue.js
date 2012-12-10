var Story      = require('./models/Story')
  , StoryView  = require('./views/Story')
  , StoryQueue = undefined
  , SQ         = Backbone.Collection.extend({
        
        model: Story
        
      , fullQueue: []
        
      , updateIntervalID: undefined
      , resetIntervalID: undefined
        
      , initialize: function(){
            var that = this
            _.bindAll(this)
            this.on('reset', this.render)
            $('input.search-query').on('keyup', _.debounce(this.filter, 500))
            this.update(function(){ this.reset(this.fullQueue) })
            this.updateIntervalID = setInterval(this.update, 30 * 1000)
            this.resetIntervalID  = setInterval(this.resetFullQueue, 30 * 1000)
        }
        
      , render: function(){
            $('.stories').html('')
            _.each(this.models, function(story){
                this.renderStory(story)
            }, this)
        }
        
      , renderStory: function(story){
            var storyView = new StoryView({
                model: story
            })
            $('.stories').append(storyView.render().el)
        }
    
      , filter: function(e){
            
            var query    = $('input.search-query').val().toLowerCase()
              , regex    = new RegExp(query)
              , filtered = []
            
            clearInterval(this.resetIntervalID)
            
            if (query == '') {
                this.reset(this.fullQueue)
                this.resetIntervalID = setInterval(this.resetFullQueue, 30 * 1000)
                return
            }
            
            filtered = _.filter(this.fullQueue, function(story){
                var matchAgainst = [
                    story.get('title')
                  , story.get('author')
                  , story.get('subreddit')
                  , story.get('deviantart').author_name
                  , story.get('deviantart').title
                ]
                return regex.test(matchAgainst.join(' ').toLowerCase())
            })
            
            this.reset(filtered)
        }
        
      , update: function(callback){
            var that = this
            $.getJSON('../../data/StoryQueue.json?r=' + Math.random(), function(data){
                console.log('Updating StoryQueue')
                that.fullQueue = _.map(data, function(story){ return new Story(story) })
                if (typeof callback === 'function') callback.call(that)
            })
            .error(function(error){
                console.log('Error updating StoryQueue: ')
                console.log(error)
                if (typeof callback === 'function') that.update(callback)
            })
        }
        
      , resetFullQueue: function(){
            this.reset(this.fullQueue)
        }
        
    })

$(document).ready(function(){
    StoryQueue = new SQ()
})
