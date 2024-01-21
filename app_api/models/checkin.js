var mongoose = require('mongoose');
// check-in: name, grade, subject, date
// message: message, date
var checkinSchema = new mongoose.Schema({
	studentID: String,
	grade: String,
	subject: String,
	date: {type: Date},
	logtype: {
		type: String,
		enum: ['CHECKIN', 'MESSAGE'],
		default: 'CHECKIN'
	},
	message: String,
});

//lower case with 's' at the end will be the name of collection
var Checkin = mongoose.model('Checkin', checkinSchema);
module.exports = checkinSchema;