var mongoose = require('mongoose')

var scheduleSchema = new mongoose.Schema({
	date: {type: Date},
	schedules: [{
		district: String,
		bell: String	// 1=Regular, 2=Minimum, 3=No School, 4=Facility Close
	}],
	note: String,
	week_note: String
})

//lower case with 's' at the end will be the name of collection
var Schedule = mongoose.model('Schedule', scheduleSchema)
//module.exports = Schedule;
module.exports = scheduleSchema;