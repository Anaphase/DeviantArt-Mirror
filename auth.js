var passport    = require('passport')
  , express     = require('express')
  , ouath       = require('express')
  
  , app         = express()
  
  , credentials = require('./lib/credentials.js')
  
  , OAuth       = require('oauth').OAuth
  , oa          = new OAuth(
       "https://api.imgur.com/oauth/request_token"
	 , "https://api.imgur.com/oauth/access_token"
	 , credentials.imgur.key
	 , credentials.imgur.secret
	 , "1.0"
	 , "http://localhost/callback"
	 , "HMAC-SHA1"
    )

app.use(express.cookieParser());
app.use(express.session({secret: 'whatever'}))

app.get('/', function(req, res){
	oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
		if (error) {
			console.log(error)
			res.send("yeah no. didn't work.")
		}
		else {
			req.session.oauth = {}
			req.session.oauth.token = oauth_token
			console.log('oauth.token: ' + req.session.oauth.token)
			req.session.oauth.token_secret = oauth_token_secret
			console.log('oauth.token_secret: ' + req.session.oauth.token_secret)
			res.redirect('https://api.imgur.com/oauth/authorize?oauth_token='+oauth_token)
	}
	})
})

app.get('/callback', function(req, res, next){
	if (req.session.oauth) {
		req.session.oauth.verifier = req.query.oauth_verifier
		var oauth = req.session.oauth

		oa.getOAuthAccessToken(oauth.token,oauth.token_secret,oauth.verifier, 
		function(error, oauth_access_token, oauth_access_token_secret, results){
			if (error){
				console.log(error)
				res.send("yeah something broke.")
			} else {
				req.session.oauth.access_token = oauth_access_token
				req.session.oauth.access_token_secret = oauth_access_token_secret
				console.log(req.query)
				console.log(req.session.oauth.access_token)
				console.log(req.session.oauth.access_token_secret)
				res.send("worked. nice one.")
			}
		}
		)
	} else
		next(new Error("you're not supposed to be here."))
})

app.listen(3000)