#!/usr/bin/env node

var damb    = require('./damb.js')
  , console = require('./lib/console.js') // requires 'colors' too

console.log('DeviantArtMirrorBot - By http://reddit.com/u/Anaphase'.underline.inverse)

// login and do once cycle of commenting before starting loops
damb.login(function(){
    damb.getStories(function(){
        damb.getDeviantArtData(function(){
            damb.shortenUrl(function(){
                damb.watermark(function(){
                    damb.mirror(function(){
                        //damb.comment(function(){
                        //    // comment every 2 minutes
                        //    setInterval(function(){ damb.comment() }, 2000 * 60)
                        //})
                        // mirror every minute
                        setInterval(function(){ damb.mirror() }, 1000 * 60)
                    })
                    // watermark every 30 seconds
                    setInterval(function(){ damb.watermark() }, 1000 * 30)
                })
                // shorten a link every 30 seconds
                setInterval(function(){ damb.shortenUrl() }, 1000 * 30)
            })
            // get DA data 30 seconds
            setInterval(function(){ damb.getDeviantArtData() }, 1000 * 30)
        })
        // get new stories every 10 minutes
        setInterval(function(){ damb.getStories() }, 1000 * 60 * 10)
    })
})
