var _           = require('underscore'),
    colors      = require('colors')

// adds some convenience functions to the console object
_.extend(console, {
    
    beep: function(){ process.stdout.write("\007") }
    
  , logTime: function(){
        var d       = new Date()
          , hours   = d.getHours()
          , hours   = (hours)?hours-12:hours
          , minutes = d.getMinutes()
          , minutes = (minutes<10)?'0'+minutes:minutes
          , seconds = d.getSeconds()
          , seconds = (seconds<10)?'0'+seconds:seconds
        console.logGrey('\n' + hours + ':' + minutes + ':' + seconds)
    }
    
  , logBold: function(s){ (typeof s === "string")?console.log(s.bold):console.log(s) }
  , logItalic: function(s){ (typeof s === "string")?console.log(s.italic):console.log(s) }
  , logUnderline: function(s){ (typeof s === "string")?console.log(s.underline):console.log(s) }
  , logInverse: function(s){ (typeof s === "string")?console.log(s.inverse):console.log(s) }
  , logZebra: function(s){ (typeof s === "string")?console.log(s.zebra):console.log(s) }
  , logRandom: function(s){ (typeof s === "string")?console.log(s.random):console.log(s) }
  
  , logYellow: function(s){ (typeof s === "string")?console.log(s.yellow):console.log(s) }
  , logCyan: function(s){ (typeof s === "string")?console.log(s.cyan):console.log(s) }
  , logWhite: function(s){ (typeof s === "string")?console.log(s.white):console.log(s) }
  , logMagenta: function(s){ (typeof s === "string")?console.log(s.magenta):console.log(s) }
  , logGreen: function(s){ (typeof s === "string")?console.log(s.green):console.log(s) }
  , logRed: function(s){ (typeof s === "string")?console.log(s.red):console.log(s) }
  , logGrey: function(s){ (typeof s === "string")?console.log(s.grey):console.log(s) }
  , logBlue: function(s){ (typeof s === "string")?console.log(s.blue):console.log(s) }
  , logRainbow: function(s){ (typeof s === "string")?console.log(s.rainbow):console.log(s) }
    
  , info: function(s){ console.logGrey(s) }
  , warn: function(s){ console.logYellow(s) }
  , error: function(s){ console.logRed(s) }
    
})

module.exports = console
