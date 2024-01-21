var mongoose = require('mongoose')

var pickupSchema = new mongoose.Schema({
	studentID: String,
	school: String,
	timeStr: String,
	date: {type: Date},
	driverID: String
})

//lower case with 's' at the end will be the name of collection
var Pickup = mongoose.model('Pickup', pickupSchema)
module.exports = pickupSchema;