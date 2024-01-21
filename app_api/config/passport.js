var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var mongoose = require('mongoose')
var User = mongoose.model('User')

passport.use('local', new LocalStrategy({
	usernameField: 'username',
	passwordField: 'password'
	},
	function(username, password, done){
		User.findOne({username: username}, function(err, user){
			// verify callback - http://passportjs.org/docs/authenticate
			// find the user who has the credentials
			if (err) {
				return done(err);
			}
			if (!user) {
				return done(null, false, {message: 'Invalid user'});
			}
			user.checkPassword(password, function(err, isMatch){
				if (err) {
					return done(null, false, {message: 'Account not registered'});
				}
				if (isMatch && user.registered) {
					return done(null, user);
				} else if (isMatch) {
					// waiting for confirmation via email link
					return done(null, false, {message: 'Account not activated, please check your e-mail.'});
				} else {
					return done(null, false, {message: 'Invalid password'});
				}
			});
		});
	}
));

passport.use('hack', new LocalStrategy({
	usernameField: 'username',
	passwordField: 'password'
	},
	function(username, password, done){
		User.findOne({username: username}, function(err, user){
			// verify callback - http://passportjs.org/docs/authenticate
			// find the user who has the credentials
			if (err) {
				return done(err);
			}
			if (!user) {
				return done(null, false, {message: 'Invalid user'});
			}
			user.checkPassword(password, function(err, isMatch){
				if (err) {
					return done(null, false, {message: 'Account not registered'});
				}
				if (user.registered) {
					return done(null, user);
				} else if (isMatch) {
					// waiting for confirmation via email link
					return done(null, false, {message: 'Account not activated, please check your e-mail.'});
				} else {
					return done(null, false, {message: 'Invalid password'});
				}
			});
		});
	}
));

