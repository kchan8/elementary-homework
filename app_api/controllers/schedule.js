var mongoose = require('mongoose');
//var Schedule = mongoose.model('Schedule');
var scheduleSchema = require('../models/schedule');
var authentication = require('./authentication');

//return boolean result
function cmpDate(date1, date2){
	var date_1 = new Date(date1);
	var date_2 = new Date(date2);
//	console.log('1: ' + date_1);
//	console.log('2: ' + date_2);
	return (date_1.toISOString().slice(0,10) == date_2.toISOString().slice(0,10))
}

module.exports.get = function(req, res){
	var time_start = new Date(req.body.start);
	var time_end = new Date(req.body.end);
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const Schedule = conn.model('Schedule', scheduleSchema);
//		console.log("Get schedule from: " + time_start);
//		console.log("Get schedule to  : " + time_end);
		Schedule.find({date: {'$gte': time_start, '$lt': time_end}}, function(err, records){
			if (err)
				throw err;
			if (records.length == 0){
				res.status(200).json();
			} else {			
				res.status(200).json(records);
			}
			conn.close();
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.update = function(req, res){
	var time_start = new Date(req.body.rangeStart);
	var time_end = new Date(req.body.rangeEnd);
	var scheduleDB = req.body.scheduleDB;	// not null
	console.log("Get schedule from: " + time_start);
	console.log("Get schedule to  : " + time_end);
	
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const Schedule = conn.model('Schedule', scheduleSchema);
		
		Schedule.find({date: {'$gte': time_start, '$lt': time_end}}, function(err, records){
			if (err)
				throw err;
			// records can be null
			console.log("scheduleDB: " + JSON.stringify(scheduleDB))
			console.log("records   : " + JSON.stringify(records))
			console.log(typeof(scheduleDB))
			scheduleDB.forEach(function(schedule){
				var record;
				if (records != undefined && records != null){
					console.log('schedule.date: ' + schedule.date)
					if (record = records.find(o => cmpDate(o.date, schedule.date))){
						record.schedules = schedule.schedules;
						record.note = schedule.note;
						record.week_note = schedule.week_note;
						record.save(function(err){
							if (err)
								throw err;
							conn.close();
						})
					} else {
						record = new Schedule();
						record.date = new Date(schedule.date);
						record.schedules = schedule.schedules;
						record.note = schedule.note;
						record.week_note = schedule.week_note;
						record.save(function(err){
							if (err)
								throw err;
							conn.close();
						})
					}
				} else {
					record = new Schedule();
					record.date = new Date(schedule.date);
					record.schedules = schedule.schedules;
					record.note = schedule.note;
					record.week_note = schedule.week_note;
					record.save(function(err){
						if (err)
							throw err;
						conn.close();
					})
				}
				// find if it exists in record
			})
			res.status(200).json({message: "Schedule updated!"});
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}