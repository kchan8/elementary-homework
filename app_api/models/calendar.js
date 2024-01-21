var mongoose = require('mongoose')

var calendarSchema = new mongoose.Schema({
	schedule: {
		type: String,
		enum: ['MINDAY', 'NOSCHOOL', 'CLOSE'],
		default: 'MINDAY'
	},
	district: String,
	dates: [{type: Date}],
})

//lower case with 's' at the end will be the name of collection
//var Schedule = mongoose.model('Schedule', scheduleSchema)
//module.exports = Schedule;
module.exports = calendarSchema;