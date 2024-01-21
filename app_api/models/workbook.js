var mongoose = require('mongoose');

var workbookSchema = new mongoose.Schema({
	grade: String,
	subject: String,
	chapter: String,
	lesson: String,
	description: String,
	due: {type: Date},
	expire: {type: Date},
	pages: Number,
	teacherID: String,
	pdfStr: String,
	pngStr: [String],
	dim: [{
		width: Number,
		height: Number
	}],
	studentPenColor: String,
	teacherPenColor: [String],
	teacherPNG: [String],
	teacherMark: [[[{x:Number, y:Number, time:Number, color:String}]]],
	teacherTextPNG: [String],
	teacherTextMark: [[{x:Number, y:Number, key:String, color:String}]]
});

//lower case with 's' at the end will be the name of collection
var Workbook = mongoose.model('Workbook', workbookSchema);
module.exports = workbookSchema;