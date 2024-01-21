var mongoose = require('mongoose');

var logbookSchema = new mongoose.Schema({
	studentID: String,
	date: {type: Date},
	logtype: {
		type: String,
		enum: ['REWARD', 'MESSAGE', 'INCIDENT'],
		default: 'MESSAGE'
	},
	reward: Number,
	color: String,
	message: String,
	teacherID: String,		// store ID of teacher
});

//lower case with 's' at the end will be the name of collection
var Logbook = mongoose.model('Logbook', logbookSchema);
module.exports = logbookSchema;