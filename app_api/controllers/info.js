var mongoose = require('mongoose');
var pickupSchema = require('../models/pickup');
var userSchema = require('../models/user');
var checkinSchema = require('../models/checkin');
var authentication = require('./authentication');
var fs = require('fs');
var mergeImages = require('merge-images');
var {Canvas, Image} = require('canvas');

module.exports.pickup = function(req, res){
	var parentID = req.body.parentID;
	var startDate = new Date(req.body.startDate);
	var endDate = new Date(req.body.endDate);
	
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		if (mongoose.Types.ObjectId.isValid(parentID)){
			var conn = authentication.getMongoConnection(index);
			const User = conn.model('User', userSchema);
			User.findOne({_id: parentID}, function(err, user){
				if (err){
					throw err;
				}
				if (user){					
					var childrenName = [];
					var studentsFirstName = [];
					if (user.children != null){					
						user.children.forEach(function(child){
							childrenName.push(child.firstName + child.lastName);
							studentsFirstName.push(child.firstName);
						});
						// get studentID, then get from Pickup
						const Pickup = conn.model('Pickup', pickupSchema);
						Pickup.find({studentID: {$in: childrenName}, date: {'$gte': startDate, '$lt': endDate}}, function(err, pickups){
//					console.log(pickups);
							var driversSet = new Set();
							var drivers = []
							drivers.push({name: "Cancel", color:"#ffffff"});
//							drivers.push({name: "Parent", color:"#eeeeee"});
							pickups.forEach(function(pickup){
								if (pickup.driverID != "" && pickup.driverID != "Self"){							
									driversSet.add(pickup.driverID)
								}
							})
							driversSet.forEach(function(driver){
								drivers.push({name: driver, color:"#c0a7e8"})
							})
							// get driver name and color
//					console.log(drivers)
							res.status(200).json({students: studentsFirstName,
								pickups: pickups,
								drivers: drivers});
							conn.close();
						});
					} else {
						res.status(200).json({students: [],
							pickups: [],
							drivers: []});
						conn.close();
					}
				} else {
					res.status(200).json({students: [],
						pickups: [],
						drivers: []});
					conn.close();
				}
			});
		}
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.checkin = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var firstName = req.body.firstName;
		var lastName = req.body.lastName;
		var subject = req.body.subject;
		var grade = req.body.grade;
		console.log(firstName + ' ' + lastName + ' ' + subject + ' ' + grade)
		
		var uniqueID = firstName.toLowerCase() + lastName.toLowerCase()
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);
		User.findOne({uniqueID:{$regex: uniqueID}}, function(err, user){
			if (err)
				throw err;
			if (user){				
				console.log(user.name);
				const Checkin = conn.model('Checkin', checkinSchema);
				entry = new Checkin();
				entry.studentID = user._id;
				entry.grade = grade;
				entry.subject = subject;
				entry.logtype = 'CHECKIN';
				entry.date = new Date();
				entry.save(function(err){
					if (err)
						throw err
					conn.close();
					res.status(200).json({message: 'noted'});
				})
			}
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.sendData = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		console.log("sendData called...")
		var base64Data = req.body.data.replace(/^data:image\/png;base64,/, "")
		console.log(base64Data.substring(0,100));
		fs.writeFile('uploads/sig.png', base64Data, 'base64', function(err){
			if (err)
				throw err
			mergeImages(['public/doc/workbook.png', 'uploads/sig.png'], {Canvas: Canvas, Image: Image})
			.then(function(b64){
				var base64 = b64.replace(/^data:image\/png;base64,/, "")
				fs.writeFile('uploads/final.png', base64, 'base64', function(err){
					if (err)
						throw err
				})
			})
			res.status(200).json({message: 'data saved'});
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}
module.exports.getSigData = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		console.log("getSigData called...")
		fs.readFile('uploads/sig.png', 'base64', function(err, data){
			if (err){
				res.status(200).json({message: 'fail'})
			} else {				
				res.status(200).json({message: 'success', data: data})
			}
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}