var mongoose = require('mongoose')
var logbookSchema = require('../models/logbook');
var checkinSchema = require('../models/checkin');
var authentication = require('./authentication');
var sendEmail = require('./sendEmail');

module.exports.getMessages = function(req, res){
	var time_start = new Date(req.body.start_date);
	var time_end = new Date(req.body.end_date);
//	console.log('Start: ' + time_start);
//	console.log('End  : ' + time_end);
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const Logbook = conn.model('Logbook', logbookSchema);	
		Logbook.find({date: {'$gte': time_start, '$lt': time_end}}, function(err, messages){
			if (err){
				throw err;
			}
			console.log("Get count: " + messages.length);
			conn.close();
			res.status(200).json(messages);
		});
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
};

module.exports.getMyMessages = function(req, res){
	var time_start = new Date(req.body.start_date);
	var time_end = new Date(req.body.end_date);
	var teacherID = req.body.teacherID;
//	console.log('Start: ' + time_start);
//	console.log('End  : ' + time_end);
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const Logbook = conn.model('Logbook', logbookSchema);	
		Logbook.find({date: {'$gte': time_start, '$lt': time_end},
			teacherID: teacherID}, function(err, messages){
			if (err){
				throw err;
			}
			console.log("Get count: " + messages.length);
			conn.close();
			res.status(200).json(messages);
		});
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
};

module.exports.updateMessages = function(req, res){
	var messages = req.body.logbook;
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const Logbook = conn.model('Logbook', logbookSchema);
		messageCnt = messages.length;
		count = 0;
		messages.forEach(function(message){
			var time_start = new Date(message.date);
			time_start.setHours(0);
			time_start.setMinutes(0);
			time_start.setSeconds(0);
			var time_end = new Date(message.date);
			time_end.setHours(23);
			time_end.setMinutes(59);
			time_end.setSeconds(59);
			Logbook.find({studentID: message.studentID, logtype: 'MESSAGE', date: {'$gte': time_start, '$lt': time_end}}, function(err, entries){
				if (err){
					throw err;
				}
				var entry;
				if (entries.length == 0){
					console.log('Save a new message')
					entry = new Logbook();
					entry.studentID = message.studentID;
					entry.date = message.date;
					entry.logtype = message.logtype;
					entry.reward = message.reward;
					entry.message = message.message;
					entry.teacherID = message.teacher;
					entry.save(function(err){
						if (err)
							throw err
						count++;
						if (count == messageCnt){
							conn.close();
							res.status(200).json({message: 'message created'});
						}
					})
				} else if (entries.length == 1){
					console.log('Update a message')
					entry = entries[0];
					entry.message = message.message;
					entry.teacherID = message.teacher;
					entry.save(function(err){
						if (err)
							throw err
						count++
						if (count == messageCnt){
							conn.close();
							res.status(200).json({message: 'message updated'});
						}
					})
				} else if (entries.length > 1){
					console.log('Multiple messages got')
					res.status(200).json({message: 'multiple messages found, operation aborted'});
					return
				}
			})
			
		});
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
};

module.exports.getCheckIns = function(req, res){
	var time_start = new Date(req.body.start_date);
	var time_end = new Date(req.body.end_date);
//	var teacherID = req.body.teacherID;
//	console.log('Start: ' + time_start);
//	console.log('End  : ' + time_end);
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const Checkin = conn.model('Checkin', checkinSchema);	
		Checkin.find({date: {'$gte': time_start, '$lt': time_end}}, function(err, checkins){
			if (err){
				throw err;
			}
			console.log("Get count: " + checkins.length);
			conn.close();
			res.status(200).json(checkins);
		});
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
};