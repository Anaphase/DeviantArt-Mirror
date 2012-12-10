module.exports = Backbone.Model.extend({
    initialize: function(){
        
        // remove 't1_' from comment id, for comment permalink
        if(this.get('comment_id'))
            this.set('comment_id', this.get('comment_id').substr(3))
        
        switch (this.get('thumbnail')) {
             case '':
             case 'default':
                 this.set('thumbnail', 'images/default.png')
                 break;
             
             case 'nsfw':
                 this.set('thumbnail', 'images/nsfw.png')
        }
    }
})
