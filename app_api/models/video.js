var mongoose = require('mongoose');

var videoSchema = new mongoose.Schema({
	grade: String,
	subject: String,
	chapter: String,
	lesson: String,
	description: String,
	expire: {type: Date},
	teacherID: String,
	url: String,
});

//lower case with 's' at the end will be the name of collection
var Video = mongoose.model('Video', videoSchema);
module.exports = videoSchema;