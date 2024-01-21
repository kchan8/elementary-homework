var mongoose = require('mongoose');

module.exports = function(url){
//	var readLine = require('readline')
//	Deprecation warning: mongoose: mpromise
	mongoose.Promise = global.Promise;
//	http://thecodebarbarian.com/mongoose-4.11-use-mongo-client.html
	mongoose.connect(url,
			{useNewUrlParser: true,
			useUnifiedTopology: true,
			useCreateIndex: true});

//	don't know if this code work
//	if (process.platform === "win32"){
//	var rl = readLine.createInterface({
//	input: process.stdin,
//	output: process.stdout
//	})
//	rl.on('SIGINT', function(){
//	process.emit('SIGINT')
//	})
//	}

	mongoose.connection.on('connected', function(){
		console.log('Mongoose connected to ' + url);
	});
	mongoose.connection.on('error', function(err){
		console.log('Mongoose connection error ' + err);
	});
	mongoose.connection.on('disconnected', function(){
		console.log('Mongoose disconnected ' + url);
	});

	var gracefulShutdown = function(msg, callback){
		mongoose.connection.close(function(){
			console.log('Mongoose disconnected through ' + msg);
			callback();
		});
	};
//	nodemon restarts
	process.once('SIGUSR2', function(){
		gracefulShutdown('node restart', function(){
			process.kill(process.pid, 'SIGUSR2');
		});
	});
//	app termination
	process.on('SIGINT', function(){
		gracefulShutdown('app termination', function(){
			process.exit(0);
		});
	});
//	Heroku app termination
	process.on('SIGTERM', function(){
		gracefulShutdown('Heroku app shutdown', function(){
			process.exit(0);
		});
	});
}

require('./user');
require('./pickup');
require('./schedule');
require('./logbook');
