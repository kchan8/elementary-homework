var mongoose = require('mongoose')
var pickupSchema = require('../models/pickup')
var userSchema = require('../models/user')
var authentication = require('./authentication');
var sendEmail = require('./sendEmail');

module.exports.getTime = function(req, res){
	var date = new Date();
	res.status(200).json(date.toISOString())
}

module.exports.update = function(req, res){
	var pickups = req.body.pickups;
	var saveCnt = 0;
	var msg = "";
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const Pickup = conn.model('Pickup', pickupSchema);
		pickups.forEach(function(pickup){
			// check if entry exists: studentID, day
			// setHour here may have problem as it is not refer to Los Angeles time zone
			var time_start = new Date(pickup.rangeStart);
//			time_start.setHours(0); time_start.setMinutes(0); time_start.setSeconds(0);
			var time_end = new Date(pickup.rangeEnd);
//			time_end.setHours(23); time_end.setMinutes(59); time_end.setSeconds(59);
//			console.log("Get All from: " + time_start);
//			console.log("Get All to  : " + time_end);
			Pickup.find({studentID: pickup.studentID, date: {'$gte': time_start, '$lt': time_end}}, function(err, entries){
				if (err){
					throw err;
				}
				var entry;
				if (entries.length > 1){
					msg += "Remove entries: " + pickup.studentID + "\n"
					entries.forEach(function(pickup){
						msg += pickup.date + '|' + pickup.timeStr + '|' + pickup.driverID + "\n";
						Pickup.remove({_id: pickup._id}, function(err){
							if (err)
								throw err;
						})
					})
					entry = new Pickup();
					entry.studentID = pickup.studentID;
					entry.school = pickup.school;
					entry.timeStr = pickup.timeStr;
					entry.date = pickup.date;					
					entry.driverID = pickup.driverID;
					entry.save(function(err){
						if (err){
							throw err;
						}
						saveCnt++
						if (saveCnt == pickups.length){
							conn.close();
							res.status(200).json({message1: msg});						
						}
					})
				} else {				
					if (entries.length == 1){
						entry = entries[0];
					} else {
						entry = new Pickup();
						entry.studentID = pickup.studentID;
					}
					entry.school = pickup.school;
					entry.timeStr = pickup.timeStr;
					entry.date = pickup.date;					
					entry.driverID = pickup.driverID;
					entry.save(function(err){
						if (err){
							throw err;
						}
						saveCnt++
						if (saveCnt == pickups.length){
							conn.close();
							res.status(200).json({message2: msg});
						}
					})
				}
			})
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.getAll = function(req, res){
	Pickup.find({}, function(err, pickups){
		if (err){
			throw err;
		}
		console.log("Get count: " + pickups.length)
		res.status(200).json(pickups)
	})
}

module.exports.get = function(req, res){
	var time_start = new Date(req.body.start_date);
	var time_end = new Date(req.body.end_date);
	// do not change hour/minute as timezone may change 
//	console.log("Get All from: " + time_start)
//	console.log("Get All to  : " + time_end)
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const Pickup = conn.model('Pickup', pickupSchema);
		Pickup.find({date: {'$gte': time_start, '$lt': time_end}}, function(err, pickups){
			if (err){
				throw err;
			}
			console.log("Get count: " + pickups.length)
			res.status(200).json(pickups)
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.getByStudents = function(req, res){
	var time_start = new Date(req.body.start_date);
	var time_end = new Date(req.body.end_date);
//	console.log("Get All from: " + time_start)
//	console.log("Get All to  : " + time_end)
	Pickup.aggregate([
		{$match: {
			date: {'$gte': time_start, '$lt': time_end}
		}},
		{$sort:{
			"date": 1
		}},
		{$group: {
			_id: "$studentID",
			pickup: {
				$push: {
					date: "$date",
					time: "$timeStr",
					driver: "$driverID"
				}
			}
		}}
	], function(err, pickups){
		res.status(200).json(pickups)
	})
}

module.exports.getDrivers = function(req, res){
	Pickup.aggregate([
		{$match: {
			"timeStr": {"$exists": true, "$ne": ''}
		}},
		{$group: {
			_id: "$driveID",
			pickup: {
				$push: {
					name: "$studentID"
					
				}
			}
		}}
	], function(err, drivers){
		res.status(200).json(drivers);
	})
}

module.exports.remove = function(req, res){
	var time_start = new Date(req.body.start_date);
	var time_end = new Date(req.body.end_date);
//	console.log("Remove from: " + time_start)
//	console.log("Remove to  : " + time_end)
	Pickup.find({date: {'$gte': time_start, '$lte': time_end}}, function(err, pickups){
		if (err){
			throw err;
		}
		console.log("Remove count: " + pickups.length)
		pickups.forEach(function(pickup){
			Pickup.remove({_id: pickup._id}, function(err){
				if (err)
					throw err;
			})
		})
		res.status(200).json({message: 'data removed'});
	})
}

module.exports.removeOne = function(req, res){
	console.log("Removing pickupID: " + req.body.id)
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
//		const Pickup = conn.model('Pickup', pickupSchema);
//		Pickup.remove({_id: req.body.id}, function(err){
//			if (err)
//				throw err;
			conn.close();
//		})
	}
	res.status(200).json({message: 'data removed'});
}

module.exports.send = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);
		User.findOne({_id: req.body.report.id}, function(err, user){
			if (err){
				throw err;
			}
			var senderEmail = req.body.senderEmail;
			var senderName = req.body.senderName;
			var msg = [];
			var msgTitle = "";
			var tasks = req.body.report.task
//			req.body.report.task.forEach(function(task){
			for (var i=0, len=tasks.length; i<tasks.length; i++){
				var task = tasks[i];
				var date = new Date(task.date)
				var dateStr = date.getMonth() + 1 + '/' + date.getDate() + '\n'
				if (i==0){
					msgTitle += ' ' + dateStr
				} else if (i==(len - 1)){
					msgTitle += ' - ' + dateStr					
				}
				msg += dateStr;
				task.pickup.forEach(function(pickup){
					msg += pickup.time + ' @ ' + pickup.school + ':- '
					pickup.students.forEach(function(student, index){
						msg += ((index == 0) ? '' : ", ") + student;
					})
					msg += '\n';
				})
			}
//			})
			var orgName = req.body.client.toUpperCase();
			var orgEmail = JSON.parse(process.env.ORG_EMAILS_DB)[index].email;
			var msgTitle = orgName + " Pickup Schedule" + msgTitle;
			// get cell phone and carrier
			// daily schedule can be sent via text, but weekly won't work
//			if (user.cellPhone != undefined && user.cellPhone != null && user.cellPhone != ''){			
//				var toText = user.cellPhone.replace(/[- ]/g, '') + '@' + user.carrier;
//				sendEmail.sendgridText([toText], process.env.ORG_EMAIL, process.env.ORG_NAME, "Pickup Schedule", msg, function(code){
//				});
//			}
			// send msg via email
			if (user.email != undefined && user.email != null && user.email != ''){
				msg = msg.replace(/\n/g, '<br>');
				sendEmail.sendgrid([user.email], [], orgEmail, orgName, msgTitle, msg, [], function(code){
				});
			}
			conn.close();
			res.status(200).json({message: 'Report sent successfully!'});
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}