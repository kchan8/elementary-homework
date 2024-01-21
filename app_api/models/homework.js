var mongoose = require('mongoose');

var homeworkSchema = new mongoose.Schema({
	studentID: String,
	teacherID: String,
	workbookID: String,
	uploadPNG: [String],
	dim: [{
		width: Number,
		height: Number
	}],
	pages: Number,	// it can be different from workbook pages
	status: {
		type: String,
		enum: ['ASSIGN', 'SUBMIT', 'REVIEW'],
		default: 'ASSIGN'
	},
	studentPNG: [String],	// for merging with worksheet to lock the image
	studentMark: [[[{x:Number, y:Number, time:Number, color:String}]]],
	studentTextPNG: [String],
	studentTextMark: [[{x:Number, y:Number, key:String, color:String}]],
	teacherPNG: [String],
	teacherMark: [[[{x:Number, y:Number, time:Number, color:String}]]],
	teacherTextPNG: [String],
	teacherTextMark: [[{x:Number, y:Number, key:String, color:String}]]
});

//lower case with 's' at the end will be the name of collection
var Homework = mongoose.model('Homework', homeworkSchema);
module.exports = homeworkSchema;