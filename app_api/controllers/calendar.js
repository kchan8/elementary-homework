var mongoose = require('mongoose')
var calendarSchema = require('../models/calendar');
var authentication = require('./authentication');

module.exports.get = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const Calendar = conn.model('Calendar', calendarSchema);
		Calendar.find({}, function(err, records){
			conn.close();
			res.status(200).json(records);
		});
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.update = function(req, res){
	var calendars = req.body.calendars;
	var recCnt = req.body.recCnt;
	console.log('recCnt: ' + recCnt)
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const Calendar = conn.model('Calendar', calendarSchema);
		for(const[index, calendar] of Object.entries(calendars)){
			if (calendar.dates != undefined){				
//				console.log("district: " + calendar.district);
//				console.log("schedule: " + calendar.schedule);
//				console.log("dates: " + JSON.stringify(calendar.dates));
				Calendar.findOne({district: calendar.district, schedule: calendar.schedule}, function(err, record){
					if (err){
						throw err;
					}
					if (!record){
						record = new Calendar();
						record.schedule = calendar.schedule;
						record.district = calendar.district;
						record.dates = calendar.dates;
					} else {
						record.dates = calendar.dates;
					}
					record.save(function(err){
						if (err){
							throw err;
						}
						recCnt--;
						if (recCnt == 0){
							conn.close();
							res.status(200).json({message: 'Calendar updated'});
						}
					})
				});
			}
		}
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
};

