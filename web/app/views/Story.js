var template = require('./templates/Story')

module.exports = Backbone.View.extend({
    
    tagName: 'div'
  , className: 'row story'
  , template: template
    
  , render: function(){
        var modelJSON = this.model.toJSON()
        if (modelJSON.ignore) this.$el.addClass('ignore')
        this.$el.html(this.template(modelJSON))
        return this
    }
    
})
