#!/usr/bin/env node

/*******************************************/
/* 
/* Node-Reddit-Bot
/*
/* A simple Reddit bot
/*
/* by Colin Wood
/* 
/* License: WTFPL (http://sam.zoy.org/wtfpl/)
/* Attribution is cool but not required
/* 
/*******************************************/

// Imgur API Key: ef634f8fc76b2a3feff2f0bba6eddb7e

var http    = require('http'),
	request = require('request'),
	jsdom   = require('jsdom'),
	fs      = require('fs'),
	jquery  = fs.readFileSync("./jquery-1.8.1.js").toString();

var options = {
	url: 'http://www.reddit.com/r/mylittlepony/new.json?limit=200',
	headers: {
		'User-Agent': 'DeviantArt -> Imgur Mirror Bot by /u/Anaphase'
	}
};

request(options, function(error, response, body) {
	
	if (!error && response.statusCode === 200) {
		
		var reddit = JSON.parse(body),
			stories = reddit.data.children.map(function (s) { return s.data; }),
			daLinks = stories.filter(function(story){
				return story.domain.match(/deviantart\.com$/);
			});
		
		daLinks.forEach(function(story){
			mirrorDeviantArtImage(story.url);
		});
		
	}
	
});

//	var request = http.request(options, function (response) {
//		
//		if(response.statusCode != 200) {
//			
//		} else {
//			
//			var body = '';
//			response.on('data', function (chunk) {
//				body += chunk;
//			});
//			
//			response.on('end', function() {
//				
//				var reddit = JSON.parse(body),
//					stories = reddit.data.children.map(function (s) { return s.data; }),
//					daLinks = stories.filter(function(story){
//						return story.domain.match(/deviantart\.com$/);
//					});
//				
//				daLinks.forEach(function(story){
//					mirrorDeviantArtImage(story.url);
//					return;
//				});
//				
//			});
//		}
//		
//	});
//	
//	request.on('error', function(e) {
//		console.log("Error: " + e.message);
//	});
//	
//	request.end();

function mirrorDeviantArtImage(url) {
	
	jsdom.env({
		html: url,
		src: [jquery],
		done: function(errors, window) {
			
			var $ = window.$;
			var image = $('#download-button').attr("href");
			
			if (image) {
				
				request('http://api.imgur.com/2/upload?url='+image, function(error, response, body) {
					
					if (!error && response.statusCode === 200) {
						console.log(url+"\n\t-> http://i.imgur.com"+response.request.uri.path+"\n");
					}
					
				});
				
			}
			
		}
	});
	
}




