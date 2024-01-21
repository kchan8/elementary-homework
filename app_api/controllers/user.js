var mongoose = require('mongoose');
var userSchema = require('../models/user');
var authentication = require('./authentication');
var dayMS = 60 * 60 * 24 * 1000;

module.exports.getAllUsers = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);
		User.find({email: {"$ne": process.env.SUPERUSER_EMAIL}}, null, {sort:{schoolCity:1, school:1, grade:1, 'name.firstName':1}}, function(err, users){
			res.status(200).json(users);
		});
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
};

module.exports.getAllUsersByGrades = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);		
		User.aggregate([
			{$match: {"email": {"$ne": process.env.SUPERUSER_EMAIL}}},
			{$group: {
				_id: "$grade", 
				users: {
					$push: {
						id: "$_id",
						name: {
//						$concat : ["$name.firstName", " ", "$name.lastName"]
							// $cond takes 3 arguments
							$concat : ["$name.firstName",
								{$cond:[{$ifNull: ["$name.lastName", false]}, {$concat:[" ", "$name.lastName"]}, ""]}
							]
						},
						school: "$school",
						color: "$backgroundColor",
						email: "$parent1Email"
					}
				}
			}},
			{$sort:{
				"_id": 1
			}}
			], function(err, grades){
			res.status(200).json(grades);
		})
	} else {
		res.status(404).json({message: 'Invalid client'})
	}	
};

// update user.active everyday, then if startDate is today, then just count on user.active
function isActive(startDate, endDate, enrollment, user){
	if (enrollment == undefined || enrollment == null || enrollment == ''){
//		console.log("enrollment is missing")
		return true;
	}
	var active = false;
	var startDateTime = startDate.getTime();
	var endDateTime = endDate.getTime();
	// check each day in the range to see if enrolled or not, default is false, exit on one true
	var enrollBegin = new Date(enrollment[0].enroll);
	enrollBegin.setHours(0);
	var enrollBeginTime = enrollBegin.getTime();
	var enrollLast = new Date(enrollment[0].last);
	enrollLast.setHours(23);
	var enrollLastTime = enrollLast.getTime();
	
	timePtr = startDateTime;
	while (timePtr < endDateTime){
		if (timePtr > enrollBeginTime && timePtr < enrollLastTime) {
			return true
		}
		timePtr += dayMS;
	}
	return active;
}

// with date range
module.exports.getAllStudents = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);
		
		var startDate = new Date(req.body.startDate);
		startDate.setHours(12);
		var endDate = new Date(req.body.endDate);
		endDate.setHours(12);
		var usersActive = [];
		User.find({grade: {$in: ["TK", "K", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"]}}, null, {sort:{schoolCity:1, school:1, grade:1, 'name.firstName':1}}, function(err, users){
			if (err)
				throw err;
			console.log("Got " + users.length + " from DB")
			users.forEach(function(user){
				if (isActive(startDate, endDate, user.enrollment, user)){
					usersActive.push(user)
				}
			})
			console.log("Filtered users: " + usersActive.length)
			res.status(200).json(usersActive)
			conn.close();
		})
	} else {
		res.status(404).json({message: 'Invalid client'})
	}
}

module.exports.getAllPickupStudents = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);
		
		var startDate = new Date(req.body.startDate);
		startDate.setHours(12);
		var endDate = new Date(req.body.endDate);
		endDate.setHours(12);
		var usersActive = [];
		User.find({grade: {$in: ["TK", "K", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"]},
				   needPickup: true},
				null, {sort:{schoolCity:1, school:1, grade:1, 'name.firstName':1}}, function(err, users){
			if (err)
				throw err;
			console.log("Got " + users.length + " from DB")
			users.forEach(function(user){
				if (isActive(startDate, endDate, user.enrollment, user)){
					usersActive.push(user)
				}
			})
			console.log("Filtered users: " + usersActive.length)
			res.status(200).json(usersActive)
			conn.close();
		})
	} else {
		res.status(404).json({message: 'Invalid client'})
	}
}

module.exports.getStudentsByID = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);
		
		var startDate = new Date(req.body.startDate);
		startDate.setHours(12);
		var endDate = new Date(req.body.endDate);
		endDate.setHours(12);
		var ID = req.body.ID;
		console.log('access getstudentsbyid...')
		console.log(ID)
		var usersActive = [];
		User.find({_id: {$in: ID},
			grade: {$in: ["TK", "K", "1st", "2nd", "3rd", "4th", "5th", "6th"]}},
			null, 
			{sort:{schoolCity:1, school:1, grade:1, 'name.firstName':1}}, function(err, users){
				if (err)
					throw err;
				console.log("Got " + users.length + " from DB")
				users.forEach(function(user){
					if (isActive(startDate, endDate, user.enrollment, user)){
						usersActive.push(user)
					}
				})
				console.log("Filtered users: " + usersActive.length)
				conn.close();
				res.status(200).json(usersActive)
			})
	} else {
		res.status(404).json({message: 'Invalid client'})
	}
	
}

module.exports.getStudentsByGrades = function(req, res){
	var start = new Date(req.body.start);
	var end = new Date(req.body.start);
	if (req.body.end !== undefined){
		end = new Date(req.body.end);
	}
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);		
		User.aggregate([
			{$match: {
				"grade": {"$exists": true, "$in": ["TK", "K", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"]},
//				"enrollment": {$elemMatch: {enroll :{$lte: start}, last: {$gte: start}}}
				 $or: [{"enrollment.enroll": {$lte: start}, "enrollment.last": {$gte: start}},
					   {"enrollment.enroll": {$lte: end},  "enrollment.last": {$gte: end}}]
			}},
			{$group: {
				_id: "$grade", 
				users: {
					$push: {
						id: "$_id",
						name: {
							$concat : ["$name.firstName",
//								{$cond:[{$ifNull: ["$name.lastName", false]}, {$concat:[" ", "$name.lastName"]}, ""]}
								{$cond:[{$ifNull: ["$name.lastName", false]},
									{$concat:[" ", {$substr: ["$name.lastName", 0, 1]}]}, ""]}
							]
						},
						school: "$school",
						email1: "$parent1Email",
						email2: "$parent2Email",
						teacher: "$teacher"
					}
				},
				count: {$sum: 1}
			}},
			{$sort:{
				"_id": 1
			}}
			], function(err, grades){
			res.status(200).json(grades);
		})
	} else {
		res.status(404).json({message: 'Invalid client'})
	}
};

module.exports.getMyStudentsByGrades = function(req, res){
	var name = req.body.teacher;
	var start = new Date(req.body.start);
	var end = new Date(req.body.start);
	if (req.body.end !== undefined){
		end = new Date(req.body.end);
	}
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);		
		User.aggregate([
			{$match: {
				"teacher": {$in: [name]},
				"grade": {"$exists": true, "$in": ["TK", "K", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"]},
//				"enrollment": {$elemMatch: {enroll :{$lte: start}, last: {$gte: start}}}
				 $or: [{"enrollment.enroll": {$lte: start}, "enrollment.last": {$gte: start}},
					   {"enrollment.enroll": {$lte: end},  "enrollment.last": {$gte: end}}]
			}},
			{$group: {
				_id: "$grade", 
				users: {
					$push: {
						id: "$_id",
						name: {
							$concat : ["$name.firstName",
//								{$cond:[{$ifNull: ["$name.lastName", false]}, {$concat:[" ", "$name.lastName"]}, ""]}
								{$cond:[{$ifNull: ["$name.lastName", false]},
									{$concat:[" ", {$substr: ["$name.lastName", 0, 1]}]}, ""]}
							]
						},
						school: "$school",
						email1: "$parent1Email",
						email2: "$parent2Email",
//						teacher: "$teacher"
					}
				},
				count: {$sum: 1}
			}},
			{$sort:{
				"_id": 1
			}}
			], function(err, grades){
			res.status(200).json(grades);
		})
	} else {
		res.status(404).json({message: 'Invalid client'})
	}
};

// https://stackoverflow.com/questions/25666187/mongodb-nested-group
//module.exports.getStudentsBySchool1 = function(req, res){
//	User.aggregate([
//		// Note: $match has to preceed $group, like pipeline
//		{$match: {
//			"school": {"$exists": true, "$ne": ''}
//		}},
//		{$group: {
//			_id: {district: "$schoolCity", school: "$school",
//			name: {
//				$concat : ["$name.firstName",
//				{$cond:[{$ifNull: ["$name.lastName", false]}, {$concat:[" ", "$name.lastName"]}, ""]}
//				]
//			},
//			grade: "$grade",
//			email1: "$parent1Email",
//			email2: "$parent2Email",
//			}}
//		},
//		{$group: {
//			_id: "$_id.district",
//			school: {
//				$push: {
//					id: "$_id.school",
//					name: "$_id.name",
//					grade: "$_id.grade",
//					email: "$_id.email"
//				}
//			}
//		}},
////		{$sort:{
////			"_id": 1
////		}}
//	], function(err, schools){
//		res.status(200).json(schools);
//	})
//};

module.exports.getStudentsBySchools = function(req, res){
	var date = new Date(req.body.date);
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);
		User.aggregate([
			// Note: $match has to preceed $group, like pipeline
			// sort first, then group, then sort again, it is like pipe
			{$match: {
//				"active": {$eq: true},
				"school": {"$exists": true, "$ne": ''},
				"enrollment": {$elemMatch: {enroll :{$lte: date}, last: {$gte: date}}}
			}},
			{$sort:{
				"grade": 1
			}},
			{$group: {
				_id: "$school", 
				users: {
					$push: {
						id: "$_id",
						name: {
							$concat : ["$name.firstName",
								{$cond:[{$ifNull: ["$name.lastName", false]}, {$concat:[" ", "$name.lastName"]}, ""]}
							]
						},
						grade: "$grade",
						email1: "$parent1Email",
						email2: "$parent2Email",
					}
				}
			}},
			{$sort:{
				"_id": 1
			}}
			], function(err, schools){
			res.status(200).json(schools);
		})
	} else {
		res.status(404).json({message: 'Invalid client'})
	}
};

module.exports.getStudentsByDistricts = function(req, res){
	var date = new Date(req.body.date);
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);
		User.aggregate([
			// Note: $match has to preceed $group, like pipeline
			{$match: {
//				"active": {$eq: true},
				"school": {"$exists": true, "$ne": ''},
				"enrollment": {$elemMatch: {enroll :{$lte: date}, last: {$gte: date}}}
			}},
			{$sort:{
				"grade": 1
			}},
			{$group: {
				_id: "$schoolCity",
				users: {
					$push: {
						id: "$_id",
						name: {
							$concat : ["$name.firstName",
								{$cond:[{$ifNull: ["$name.lastName", false]}, {$concat:[" ", "$name.lastName"]}, ""]}
							]
						},
						school: "$school",
						grade: "$grade",
						email1: "$parent1Email",
						email2: "$parent2Email",
					}
				}
			}},
			{$sort:{
				"_id": 1
			}},
			], function(err, schools){
			res.status(200).json(schools);
		})
	} else {
		res.status(404).json({message: 'Invalid client'})
	}
};

module.exports.getRegisteredUsers = function(req, res){
//	console.log('server...getRegisteredUsers...')
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);			
		User.find({registered: {$eq: true}}, null, null, function(err, users){
			conn.close();
			res.status(200).json(users)
		})
	} else {
		res.status(404).json({message: 'Invalid client'})
	}
};

module.exports.getAllDistricts = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);		
		User.aggregate([
			// Note: $match has to preceed $group, like pipeline
			{$match: {
				"schoolCity": {"$exists": true, "$ne": ''}
			}},
			{$group: {
				_id: "$schoolCity"
			}},
			{$sort:{
				"_id": 1
			}}
			], function(err, districts){
			res.status(200).json(districts);
		})
	} else {
		res.status(404).json({message: 'Invalid client'})
	}
}

module.exports.getDrivers = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);		
		User.find({userType: {$in: ["Driver"]}}, null, {sort:{'name.firstName':1}}, function(err, users){
			res.status(200).json(users)
		})
	} else {
		res.status(404).json({message: 'Invalid client'})
	}
}

module.exports.getTeachers = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);		
		User.find({userType: {$in: ["Teacher"]}}, null, {sort:{'name.firstName':1}}, function(err, users){
			res.status(200).json(users)
		})
	} else {
		res.status(404).json({message: 'Invalid client'})
	}
}

module.exports.getDetails = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);
		User.findOne({_id: req.body.userID}, function(err, user){
			res.status(200).json(user);
		})
	} else {
		res.status(404).json({message: 'Invalid client'})
	}
};

function createParent(index, firstName, lastName, email, phone, student){
//	no entry on web form is undefined if unedited, but can be null once edited
//	if ((firstName !== undefined) && (firstName !== null) && (firstName !== '')){
	if (firstName !== undefined && firstName !== '' && lastName !== undefined && lastName !== ''){
		var uniqueID = firstName.toLowerCase() + lastName.toLowerCase();
		
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);
		User.findOne({uniqueID: uniqueID}, function(err, user){
			if (err){
				throw err;
			}
			if (!user){
				user = new User();
				user.uniqueID = uniqueID;
				user.username = uniqueID;
				user.name.firstName = firstName;
				user.name.lastName = lastName;
				user.email = email;
				user.cellPhone = phone;
				user.userType = ["Parent"];
				user.grade = "";
				user.children = [{firstName: student.name.firstName, lastName: student.name.lastName, id: student._id}];
				user.save(function(err){
					if (err)
						throw err;
					conn.close();
				})
			} else {
				// check if needed to add student
				children = user.children;
				if (children == undefined || children == null || children == []){
					user.children = [{firstName: student.name.firstName, lastName: student.name.lastName, id: student._id}];
				} else {
					if (children.find(o => o.firstName == student.name.firstName && o.lastName == student.name.lastName) == undefined){
						children.push({firstName: student.name.firstName, lastName: student.name.lastName, id: student._id});
						user.children = children;
					}
				}
				user.save(function(err){
					if (err)
						throw err;
					conn.close();
				})
			}
		})
	}
}

module.exports.create = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);
		// uniqueID is used during creation (before user picks username), won't be used once user registered
		// For student: first name, last name, grade
		// For adult: first name, last name, email
		var uniqueID = req.body.name.firstName.toLowerCase();
		// check if user exists already
		if (req.body.name.lastName != undefined){		
			uniqueID += req.body.name.lastName.toLowerCase();
		}
		if (req.body.grade != undefined){
			uniqueID += req.body.grade;
		}
		if (req.body.email != undefined){
			uniqueID += req.body.email.toLowerCase();
		}
		// using email as unique ID doesn't work as student has no email !!!
		User.findOne({uniqueID: uniqueID}, function(err, user){
			if (err){
				throw err;
			}
			if (user){
				conn.close();
				console.log('User exists already')
				res.status(400).json({message: 'User with same name had registered.'});
			} else {
				console.log('create new user ...');
				user = new User();
				user.uniqueID = uniqueID;
				user.username = uniqueID;
				user.name = req.body.name;
				user.gender = req.body.gender;
				user.email = req.body.email;
				user.homeAddress = req.body.homeAddress;
				user.homeCity = req.body.homeCity;
				user.homeZip = req.body.homeZip;
				user.homePhone = req.body.homePhone;
				user.cellPhone = req.body.cellPhone;
				user.carrier = req.body.carrier;
				user.userType = req.body.userType;
				user.backgroundColor = req.body.backgroundColor;
				user.pickup = req.body.pickup;
				user.active = req.body.active;
				user.enrollment = req.body.enrollment;
				
				user.school = req.body.school;
				user.schoolAddress = req.body.schoolAddress;
				user.schoolCity = req.body.schoolCity;
				user.grade = req.body.grade;
				if (user.userType.indexOf('Student') == -1){
					user.grade = "";
				}
				
				user.parent1FirstName = req.body.parent1FirstName;
				user.parent1LastName = req.body.parent1LastName;
				user.parent1Email = req.body.parent1Email;
				user.parent1Phone = req.body.parent1Phone;
				user.parent2FirstName = req.body.parent2FirstName;
				user.parent2LastName = req.body.parent2LastName;
				user.parent2Email = req.body.parent2Email;
				user.parent2Phone = req.body.parent2Phone;
				user.touched = true;
				user.save(function(err){
					if (err) {
						throw err;
					}
					conn.close();
					createParent(index, user.parent1FirstName, user.parent1LastName, user.parent1Email, user.parent1Phone, user);
					createParent(index, user.parent2FirstName, user.parent2LastName, user.parent2Email, user.parent2Phone, user);
					res.status(200).json({message: 'User created'});
				});
			}
		});
	} else {
		res.status(404).json({message: 'Invalid client'})
	}
};

module.exports.update = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);
		User.findOne({_id: req.body._id}, function(err, user){
			user.username = req.body.username;
			user.email = req.body.email;
			user.name = req.body.name;
			user.userType = req.body.userType;
			user.gender = req.body.gender;
			user.homeAddress = req.body.homeAddress;
			user.homeCity = req.body.homeCity;
			user.homeZip = req.body.homeZip;
			user.homePhone = req.body.homePhone;
			user.cellPhone = req.body.cellPhone;
			user.carrier = req.body.carrier;
			user.backgroundColor = req.body.backgroundColor;
			
			user.school = req.body.school;
			user.schoolAddress = req.body.schoolAddress;
			user.schoolCity = req.body.schoolCity;
			user.grade = req.body.grade;
			console.log(req.body.level)
			user.level = req.body.level;
			
			user.needPickup = req.body.needPickup;
			user.pickup = req.body.pickup;
			user.active = req.body.active;
			user.enrollment = req.body.enrollment;
			
			user.parent1FirstName = req.body.parent1FirstName;
			user.parent1LastName = req.body.parent1LastName;
			user.parent1Email = req.body.parent1Email;
			user.parent1Phone = req.body.parent1Phone;
			user.parent2FirstName = req.body.parent2FirstName;
			user.parent2LastName = req.body.parent2LastName;
			user.parent2Email = req.body.parent2Email;
			user.parent2Phone = req.body.parent2Phone;
			user.save(function(err){
				if (err) {
					throw err;
				} else {
					conn.close();
					createParent(index, user.parent1FirstName, user.parent1LastName, user.parent1Email, user.parent1Phone, user);
					createParent(index, user.parent2FirstName, user.parent2LastName, user.parent2Email, user.parent2Phone, user);
					res.status(200).json({message: 'User updated'});				
				}
			});
		});
	} else {
		res.status(404).json({message: 'Invalid client'})
	}
};

module.exports.remove = function(req, res){
	console.log('user remove...')
	// do not use angular.forEach
	// to remove student, get parents
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);
		User.deleteMany({_id: {$in: req.body.id}}, function(err){
			if (err){
				throw err;
			}
			conn.close();
			res.status(200).json({message: 'User removed'});		
		})
	} else {
		res.status(404).json({message: 'Invalid client'})
	}
};

module.exports.updateTeacher = function(req, res){
	console.log('user update teacher...')
	// do not use angular.forEach
	// to remove student, get parents
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const User = conn.model('User', userSchema);
		var recNum = req.body.userRec;
		var userRecs = req.body.userRec;
		userRecs.forEach(function(userRec){
			User.findOne({_id: userRec.studentID}, function(err, user){
				if (err){
					throw err;
				}
				user.teacher = userRec.teacher;
				user.save(function(err){
					if (err){
						throw err;
					}
					recNum = recNum - 1;
					if (recNum == 0){
						conn.close();
						res.status(200).json({message: 'All records updated'})
					}
				})
			})
		})
	} else {
		res.status(404).json({message: 'Invalid client'})
	}
}

module.exports.fixPhone = function(req, res){
	var phone = "";
	User.find({}, function(err, users){
		if (err)
			throw err;
		users.forEach(function(user){
			if (user.cellPhone != undefined && user.cellPhone != null && user.cellPhone != ""){
				phone = user.cellPhone.replace(/[- ]/g, '');
				if (phone.length == 10){
					phone = phone.slice(0,3) + '-' + phone.slice(3,6) + '-' + phone.slice(6)
					user.cellPhone = phone;
					user.save(function(err){
						if (err)
							throw err;
					})
				} else if (phone.length == 11){
					phone = phone.slice(0,1) + '-' + phone.slice(1,4) + '-' + phone.slice(4,7) + '-' + phone.slice(7)
					user.cellPhone = phone;
					user.save(function(err){
						if (err)
							throw err;
					})
				}
				
			} 
		})
		res.status(200).json({message: "Data updated"})
	})
}
