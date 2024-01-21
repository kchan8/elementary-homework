var passport = require('passport')
var mongoose = require('mongoose')
//var User = mongoose.model('User')
var userSchema = require('../models/user');
var sendEmail = require('./sendEmail');
var crypto = require('crypto')

var sendJSONresponse = function(res, status, content){
	// somehow these 2 lines can't set the status
//	res.status = status
//	res.json(content)
	res.status(status).json(content);
};

var clientValidate = function(client){
	var clientsDB = JSON.parse(process.env.CLIENTS_DB);
	var clients = [];
	clientsDB.forEach(function(entry){
		clients.push(entry.client.toLowerCase());
	});
	return clients.indexOf(client.toLowerCase());
};

var getMongoConnection = function(index){	
	var clientsDB = JSON.parse(process.env.CLIENTS_DB);
	var mongo_url = clientsDB[index].mongo_url;
	return mongoose.createConnection(mongo_url,
									 {useNewUrlParser: true,
									  useUnifiedTopology: true,
									  useCreateIndex: true});
};

var checkClient = function(req, res){
//	console.log('Client is ' + req.body.client);
//	console.log('CLENTSDB: ' + process.env.CLIENTS_DB);
	if (clientValidate(req.body.client) !== -1){
//		console.log('return true');
		sendJSONresponse(res, 200, {valid: true});
	} else {
//		console.log('return false');
		sendJSONresponse(res, 200, {valid: false});
	}
};

// these functions are called from api
var signup = function(req, res){
	// need to get client from req.body
	if (!req.body.firstname || !req.body.lastname ||
		!req.body.email ||
		!req.body.username ||
		!req.body.password ||
		!req.body.confirm_password
	){
		sendJSONresponse(res, 400, {message: 'All fields required'});
		return;
	}
	if (req.body.password !== req.body.confirm_password){
		sendJSONresponse(res, 400, {message: 'Passwords not match'});
		return;
	}
	var index = clientValidate(req.body.client);
	if (index !== -1){
		var firstname = req.body.firstname;
		var lastname = req.body.lastname;
		var email = req.body.email.toLowerCase();
		var username = req.body.username;
		var password = req.body.password;
		
		var uniqueID = firstname.toLowerCase() + lastname.toLowerCase();
		var isAdmin = (firstname.toLowerCase() === process.env.SUPERUSER_FIRSTNAME.toLowerCase())
				   && (lastname.toLowerCase() === process.env.SUPERUSER_LASTNAME.toLowerCase())
				   && (email.toLowerCase() === process.env.SUPERUSER_EMAIL.toLowerCase()
		);
		var msg, link;
		var conn = getMongoConnection(index);
		const User = conn.model('User', userSchema);
		if (isAdmin) {
			// check if registered already
			User.findOne({email: email}, function(err, user){
				if (user){
					console.log("Duplicate admin registration");
					sendJSONresponse(res, 400, {message: 'Duplicate admin registration'})
					return
				} else {
					// skip checking database for admin, this is the first signup, no database yet
					var newUser = User({
						uniqueID: uniqueID,
						username: username,
						password: password,
						name: {firstName: firstname,
							lastName: lastname},
							userType: ["Admin", "Teacher", "Driver", "Parent"],
							registered: false,
							email: email,
							grade: ""
					});
					newUser.save(function(err, user){
						// due to async nature, same name will cause duplication error
						if (err) {
							throw err;
						}
						conn.close();
						link = req.protocol + '://' + req.get('host') + '/' + req.body.client + '/confirm/' + user._id
						msg = "Hello " + firstname + "!"
						+ "\n\nYou recently registered an account. To activate your account, click the link below or paste it in web broswer.\n\n"
						+ "<a href=\"" + link + "\">" + link + "<\/a>"
						+ "\n\nWebmaster";
						msg = msg.replace(/\n/g, '<br>');
						// from and to addresses can't be the same ??
						sendEmail.sendgrid([user.email], [], process.env.SUPERUSER_EMAIL, process.env.SUPERUSER_FIRSTNAME + " " + process.env.SUPERUSER_LASTNAME, "Registration confirmation", msg, [], null)
						sendJSONresponse(res, 200, {message: 'Admin registration successful'})
					})
				}
			})
		} else {
			// the goal of sign up is to use it interactively, able to recover password
			// search by firstname, lastname and email address
//			var re = new RegExp(uniqueID, "g")
			console.log('go to find user...')
			// need to check if username had been taken, who had registered
			User.find({username: username, registered: false}, function(err, users){
				if (err)
					throw err;
				if (users.length != 0){
					// 01 - username had been used
					sendJSONresponse(res, 400, {message: 'Invalid Registration (01)'});
					return
				}
				var email_ci = new RegExp("^" + email.toLowerCase(), "i");
				var firstname_ci = new RegExp("^" + firstname.toLowerCase(), "i");
				var lastname_ci = new RegExp("^" + lastname.toLowerCase(), "i");
				User.find({email: email_ci, "name.firstName": firstname_ci, "name.lastName": lastname_ci}, function(err, users){
					if (err){
						throw err
					}
					if ((users.length == 0) && (process.env.OPEN_REGISTRATION == 'false')){
						// 02 - Can't find preset user in the closed system
						sendJSONresponse(res, 400, {message: 'Invalid Registration (02)'});
						return
					} else if ((users.length == 1) && (users[0].email != "" && users[0].email.toLowerCase() != email.toLowerCase())) {
						return
					} else {
						var user
						if (users.length == 1){					
							user = users[0];
						} else {
							user = new User()
							user.uniqueID = uniqueID
							user.name.firstName = firstname
							user.name.lastName = lastname
						}
						user.username = username;
						user.password = password;
						user.email = email;
						user.registered = false;
						user.save(function(err){
							if (err)
								throw err
							conn.close();
						})
						link = req.protocol + '://' + req.get('host') + '/' + req.body.client + '/confirm/' + user._id
						msg = "Hello " + user.name.firstName + "!"
						+ "\n\nYou recently registered an account on " + req.body.client.toUpperCase()
						+ " website. To activate your account, click the link below or paste it in web broswer.\n\n"
						+ "<a href=\"" + link + "\">" + link + "<\/a>"
						+ "\n\nWebmaster";
						msg = msg.replace(/\n/g, '<br>');
						sendEmail.sendgrid([user.email], [], process.env.SUPERUSER_EMAIL, process.env.SUPERUSER_FIRSTNAME + " " + process.env.SUPERUSER_LASTNAME, "Registration confirmation", msg, [], null)
						sendJSONresponse(res, 200, {message: 'Create new registration'})
					}
				});
			})
		}
	} else {
		sendJSONresponse(res, 404, {message: 'Invalid client'})
	}
}

var login = function(req, res){
	if (!req.body.username || !req.body.password){
		sendJSONresponse(res, 400, {message: 'All fields required'})
		return
	}
	var index = clientValidate(req.body.client);
	if (index !== -1){
		var conn = getMongoConnection(index);
		const User = conn.model('User', userSchema);
		User.findOne({username: req.body.username}, function(err, user){
			conn.close();
			if (err){				
				sendJSONresponse(res, 404, err);	// User had not registered yet
				return
			}
			if (!user){
				sendJSONresponse(res, 404, {message: 'Invalid user.'});
				return
			}
			user.checkPassword(req.body.password, function(err, isMatch){
				if (err) {
					sendJSONresponse(res, 404, {message: 'Something wrong...'});
					return
				}
				if (isMatch && user.registered) {
					var token = user.generateJwt(req.body.client);
					sendJSONresponse(res, 200, {token: token});
					return
				} else if (isMatch) {
					// waiting for confirmation via email link
					sendJSONresponse(res, 401, {message: 'Account not activated, please check your e-mail.'});
					return
				} else {
					sendJSONresponse(res, 401, {message: 'Invalid password.'});
					return
				}
			})			
		})
	} else {
		sendJSONresponse(res, 404, {message: 'Invalid client'})
	}
}

var hackin = function(req, res){
//	console.log('server hackin ' + req.body.superuser)
	var index = clientValidate(req.body.client);
	if (index !== -1){
		var conn = getMongoConnection(index);
		const User = conn.model('User', userSchema);
		User.findOne({_id: req.body.superuser}, function(err, user){
			if (err){
				sendJSONresponse(res, 403, {message: 'Unauthorized access'})
				throw err
			}
			// check if it is coming from superuser
			if (user.email.toLowerCase() == process.env.SUPERUSER_EMAIL){
				User.findOne({username: req.body.username}, function(err, user){
					conn.close();
					if (err){				
						sendJSONresponse(res, 404, {message: 'User not exists'});
						return
					}
					var token = user.generateJwt(req.body.client);
					sendJSONresponse(res, 200, {token: token});
					return
				})
			} else {
				conn.close();
				sendJSONresponse(res, 403, {message: 'Unauthorized access'})
			}
		})
	} else {
		sendJSONresponse(res, 404, {message: 'Invalid client'})
	}
}

// https://blog.tompawlak.org/generate-random-values-nodejs-javascript
function randomValueBase64(len){
	return crypto.randomBytes(Math.ceil(len * 3 / 4))
		.toString('base64')		// convert to base64 format
		.slice(0, len)			// return required number of characters
		.replace(/\+/g, '0')	// replace '+' with '0'
		.replace(/\//g, '0');	// replace '/' with '0'
}

var resetPassword = function(req, res){
	var index = clientValidate(req.body.client);
	if (index !== -1){
		var conn = getMongoConnection(index);
		const User = conn.model('User', userSchema);
		var email_ci = new RegExp("^" + req.body.email.toLowerCase(), "i");
		var firstname_ci = new RegExp("^" + req.body.firstName.toLowerCase(), "i");
		var lastname_ci = new RegExp("^" + req.body.lastName.toLowerCase(), "i");
		User.findOne({"name.firstName": firstname_ci,
			"name.lastName": lastname_ci,
			email: email_ci}, function(err, user){
			if (err){
				throw err;
			}
			if (user){
				var key = randomValueBase64(12);
				var link = req.protocol + '://' + req.get('host') + '/' + req.body.client + '/resetPassword/' + user._id + "/" + key
				var msg = "Hello, " + user.name.firstName + "!"
				+ "\n\nYou recently requested a password reset. To update your login information, click the link below or paste it in web broswer to reset password.\n\n"
				+ "<a href=\"" + link + "\">" + link + "<\/a>"
				+ "\n\nPLEASE NOTE: If you do not want to update your password, you may ignore this email and nothing will be changed."
				+ "\n\nWebmaster";
				msg = msg.replace(/\n/g, '<br>');
				user.resetPasswordKey = key
				user.save(function(err){
					if (err){
						throw err;
					}
					conn.close();
					// from and to can't be the same
					if (user.email.toLowerCase() !== process.env.SUPERUSER_EMAIL){						
						sendEmail.sendgrid([user.email], [], process.env.SUPERUSER_EMAIL, process.env.SUPERUSER_FIRSTNAME + " " + process.env.SUPERUSER_LASTNAME, "Password reset", msg, [], null)
					} else {						
						sendEmail.sendgrid([user.email], [], process.env.SUPERUSER_ALT_EMAIL, process.env.SUPERUSER_FIRSTNAME + " " + process.env.SUPERUSER_LASTNAME, "Password reset", msg, [], null)
					}
					sendJSONresponse(res, 200, {message: 'Email for reseting password had been sent, please check inBox'})
				})
			} else {
				sendJSONresponse(res, 404, {message: 'Invalid user'})
				conn.close();
			}
		})
	} else {
		sendJSONresponse(res, 404, {message: 'Invalid client'})
	}
}

var setPassword = function(req, res){
	var index = clientValidate(req.body.client);
	if (index !== -1){
		var conn = getMongoConnection(index);
		const User = conn.model('User', userSchema);
		User.findOne({_id: req.body.userID}, function(err, user){
			if (err){
				throw err;
			}
			if (user.resetPasswordKey == req.body.key){
				user.password = req.body.password;
				user.resetPasswordKey = "";
				user.save(function(err){
					if (err){
						throw err;
					}
					conn.close();
					sendJSONresponse(res, 200, {message: ''});
				})
			} else {
				sendJSONresponse(res, 404, {message: 'Invalid link'});
				conn.close();
			}
		});
	} else {
		sendJSONresponse(res, 404, {message: 'Invalid client'})
	}
}

// Used for confirming registration, called without authentication
var userRegistration = function(req, res){
	// check if the ID is valid
	var userID = req.body.userID;
	if (mongoose.Types.ObjectId.isValid(userID)){
		var index = clientValidate(req.body.client);
		if (index !== -1){
			var conn = getMongoConnection(index);
			const User = conn.model('User', userSchema);
			User.findOne({_id: userID}, function(err, user){
				if (err){
					throw err;
				}
				if (user){
					console.log(user.name.firstName);
					sendJSONresponse(res, 200, {firstname: user.name.firstName});
					user.registered = true;
					user.save(function(err){
						if (err){							
							throw err;
						}
						conn.close();
					});
				} else {
					sendJSONresponse(res, 404, {message: "Invalid request"});
					conn.close();
				}
			});
		} else {
			sendJSONresponse(res, 404, {message: 'Invalid client'});
		}
		
	} else {
		sendJSONresponse(res, 404, {message: "Invalid ID"})
	}
}

module.exports = {
		clientValidate: clientValidate,
		getMongoConnection: getMongoConnection,
		checkClient: checkClient,
		signup: signup,
		login: login,
		hackin: hackin,
		resetPassword: resetPassword,
		setPassword: setPassword,
		userRegistration: userRegistration
}