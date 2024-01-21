var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var userSchema = require('../models/user');

/* GET users listing. */
// https://mongoosejs.com/docs/connections.html
router.get('/', function(req, res, next) {
	var client = req.originalUrl.replace(/\//g, '');
	console.log('client=' + client)
	var validClients = process.env.CLIENTS;
	if (validClients.toLowerCase().indexOf(client.toLowerCase()) != -1){
		mongoose.Promise = global.Promise;
		var conn;
		if (client.toLowerCase() == 'jkc'){			
			// connect to database
			conn = mongoose.createConnection(process.env.MONGO_URL_TEST,
				{useNewUrlParser: true,
				useUnifiedTopology: true,
				useCreateIndex: true});
		} else if (client.toLowerCase() == 'edu'){
			conn = mongoose.createConnection(process.env.MONGO_URL_ASG,
				{useNewUrlParser: true,
				useUnifiedTopology: true,
				useCreateIndex: true});
		}
		const User = conn.model('User', userSchema);
		User.findOne({username: 'kchan'}, function(err, user){
			if (err)
				throw err;
			conn.close();
			res.send(user.email);
		})
	} else {
		res.send('Invalid Client')
	}
});

module.exports = router;
