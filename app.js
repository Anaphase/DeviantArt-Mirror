#!/usr/bin/env node

/*******************************************/
/* 
/* Reddit Bot - DeviantArt Mirror
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

var imgur       = require('./imgur.js'),
    reddit      = require('./reddit.js'),
	deviantart  = require('./deviantart.js');

reddit.getNewStories("/r/mylittlepony", function(story){
	
	// only consider links to DeviantArt
	if(!story.domain.match(/deviantart\.com$/)) return false;
	
	//	console.log("Mirroring: "+story.url);
	
	deviantart.getImage(story.url, function(imageUrl){
		
		imgur.mirror(imageUrl, function(mirroredImageUrl){
			console.log(imageUrl + " -> " + mirroredImageUrl);
		});
		
	});
	
});