var _        = require('underscore')
  , Backbone = require('backbone')
    
  , console  = require('../lib/console.js')
    
  , ignoreThreshold = 5 // how many failed mirrors, comments, etc before we stop trying?

module.exports = Backbone.Model.extend({
    
    defaults: {
        
        "queue_position": 0 // initially set to the story's score, but can change dynamically
        
      , "reddit": {} // data returned from http://www.reddit.com/api/comment
      , "comment_id": null // the Reddit "Thing ID" that denotes the comment I've made on this story
        
      , "deviantart": {} // data returned from http://www.backend.deviantart.com
      , "deviantart_image": null // a shortcut to this.deviantart.url
        
      , "bitly": {} // data returned from http://api.bitly.com/v3/shorten
      , "bitly_url": null // a shortcut to this.bitly.url
        
      , "watermarked_image": null
        
      , "imgur": {} // data returned from imgur api upload
      , "imgur_image": null // a shortcut to "http://imgur.com/" + this.upload.image.hash
        
      , "ignore": false // set to true when this story has failed to mirror/comment a lot
      , "ignore_threshold": ignoreThreshold // how many failed mirrors or comments before we stop trying?
      
      , "failures": { // determines how far down the queue we'll place this story upon failures
            "deviantart": 0
          , "mirror": 0
          , "bitly": 0
          , "watermark": 0
          , "comment": 0
        }
        
        // REDDIT DATA
      , "kind": "t3"
      , "domain": null
      , "banned_by": null
      , "media_embed": {}
      , "subreddit": null
      , "selftext_html": null
      , "selftext": null
      , "likes": null
      , "link_flair_text": null
      , "id": null
      , "clicked": false
      , "title": null
      , "num_comments": 0
      , "score": 0
      , "approved_by": null
      , "over_18": false
      , "hidden": false
      , "thumbnail": null
      , "subreddit_id": null
      , "edited": false
      , "link_flair_css_class": null
      , "author_flair_css_class": null
      , "downs": 0
      , "saved": false
      , "is_self": false
      , "permalink": null
      , "name": null
      , "created": 0
      , "url": null
      , "author_flair_text": null
      , "author": null
      , "created_utc": 0
      , "media": null
      , "num_reports": null
      , "ups": 0
    }
    
  , initialize: function(){
        
        this.set({
            "queue_position": this.get("score")
          , "ignore_threshold": ignoreThreshold
        })
        
        this.on("change:failures", function(){
            _.each(this.get("failures"), function(value, key, list){
                if (value >= this.get("ignore_threshold"))
                    this.set({"ignore": true})
                else if (value > 0)
                    this.backoff(value)
            }, this)
            this.collection.save()
        }, this)
        
        this.trigger("change:failures")
    }
    
  , failed: function(type, value){
        
        if(!this.get("failures")[type]) this.get("failures")[type] = 0
        
        if(value)
            this.get("failures")[type] = value
        else
            this.get("failures")[type]++
            
        this.trigger("change:failures")
        
    }
    
    // move down in the queue with an exponential backoff
  , backoff: function(exponent){
        
        var oldQueuePosition = this.get("queue_position"),
            newQueuePosition = this.get("score") - Math.pow(2, exponent)
        
        if(newQueuePosition < 0)
            newQueuePosition = 0
        
        this.set({"queue_position": newQueuePosition})
        
        this.collection.sort().save()
        
        console.info("Story " + this.get("id") + " moved in queue from " + oldQueuePosition + " to " + this.get("queue_position") + ".")
        
    }
    
})
