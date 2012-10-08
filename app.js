#!/usr/bin/env node

var damb    = require('./damb.js')
  , console = require('./lib/console.js') // requires 'colors' too

console.log("DeviantArt Mirror Bot - By http://reddit.com/u/Anaphase".underline.inverse)

// login and do once cycle of commenting before starting loops
damb.login(function(){
    damb.getStories(function(){
        damb.processStory(function(){
            
            // get new stories every 5 minutes
            setInterval(function(){ damb.getStories() }, 1000 * 60 * 5)
            
            // get DA data 30 seconds
            setInterval(function(){ damb.getDeviantArtData() }, 1000 * 30)
            
            // shorten a link every 30 seconds
            setInterval(function(){ damb.shortenUrl() }, 1000 * 30)
            
            // watermark every 10 seconds
            setInterval(function(){ damb.watermark() }, 1000 * 10)
            
            // mirror every minute
            setInterval(function(){ damb.mirror() }, 1000 * 60)
            
            // comment every minute
            setInterval(function(){ damb.comment() }, 1000 * 60)
        })
    })
})
