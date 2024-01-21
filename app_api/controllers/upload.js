var mongoose = require('mongoose');
//var User = mongoose.model('User');
//var Pickup = mongoose.model('Pickup');
var userSchema = require('../models/user');
var pickupSchema = require('../models/pickup');
var videoSchema = require('../models/video');
var workbookSchema = require('../models/workbook');
var authentication = require('./authentication');
var fs = require('fs');
var parse = require('csv-parse');

var userHeader = {};
var parentChildRec = [];
var parentChildRecCount = 0;
var workerHeader = {};
var pickupHeader = {};
var videoHeader = {};

function stringCompare(str1, str2){
	return str1.toLowerCase().trim() === str2.toLowerCase().trim();
}

function getFirstLastName(fullname){
	var name = fullname.split(/[ ,]+/);
	return name;
}

function checkParent(user, parent1name, parent2name){
	if ((user.parent_1_firstName === parent1name[1]) && (user.parent_1_lastName === parent1name[0]) ||
	    (user.parent_2_firstName === parent2name[1]) && (user.parent_2_lastName === parent2name[0])){
		return true;
	} else {
		return false;
	}
}

function genUniqueID(firstname, lastname){
	return firstname.toLowerCase().replace(/\s/g, '') + lastname.toLowerCase().replace(/\s/g, '');
}

function procUserHeader(csvrow){
	var validFormat = true;
	var firstNameFound = false;
	var lastNameFound = false;
	var genderFound = false;
	var gradeFound = false;
	var schoolFound = false;
	var schoolAddressFound = false;
	var schoolCityFound = false;
	var beginDateFound = false;
	var lastDateFound = false;
	var homeAddressFound = false;
	var homeCityFound = false;
	var homeZipFound = false;
	var parent1FirstNameFound = false;
	var parent1LastNameFound = false;
	var parent1PhoneFound = false;
	var parent1EmailFound = false;
	var relationship1Found = false;
	var parent2FirstNameFound = false;
	var parent2LastNameFound = false;
	var parent2PhoneFound = false;
	var parent2EmailFound = false;
	var relationship2Found = false;
	var monPickupFound = false;
	var monDriverFound = false;
	var tuePickupFound = false;
	var tueDriverFound = false;
	var wedPickupFound = false;
	var wedDriverFound = false;
	var thuPickupFound = false;
	var thuDriverFound = false;
	var friPickupFound = false;
	var friDriverFound = false;
	var minPickupFound = false;
	var needPickupFound = false;
	
//	userHeader = {};
	for(var i=0; i<csvrow.length; i++) {
		if (csvrow[i] !== ''){
			userHeader[csvrow[i].toLowerCase().trim()] = i;

			if (stringCompare(csvrow[i], 'first name')) {firstNameFound = true;}
			if (stringCompare(csvrow[i], 'last name')) {lastNameFound = true;}
			if (stringCompare(csvrow[i], 'gender')) {genderFound = true;}
			if (stringCompare(csvrow[i], 'grade')) {gradeFound = true;}
			if (stringCompare(csvrow[i], 'school')) {schoolFound = true;}
			if (stringCompare(csvrow[i], 'school address')) {schoolAddressFound = true;}
			if (stringCompare(csvrow[i], 'school city')) {schoolCityFound = true;}
			if (stringCompare(csvrow[i], 'begin date')) {beginDateFound = true;}
			if (stringCompare(csvrow[i], 'last date')) {lastDateFound = true;}
			if (stringCompare(csvrow[i], 'home address')) {homeAddressFound = true;}
			if (stringCompare(csvrow[i], 'home city')) {homeCityFound = true;}
			if (stringCompare(csvrow[i], 'home zip')) {homeZipFound = true;}
			if (stringCompare(csvrow[i], 'parent 1 first name')) {parent1FirstNameFound = true;}
			if (stringCompare(csvrow[i], 'parent 1 last name')) {parent1LastNameFound = true;}
			if (stringCompare(csvrow[i], 'parent 1 phone')) {parent1PhoneFound = true;}
			if (stringCompare(csvrow[i], 'parent 1 e-mail')) {parent1EmailFound = true;}
			if (stringCompare(csvrow[i], 'relationship 1')) {relationship1Found = true;}
			if (stringCompare(csvrow[i], 'parent 2 first name')) {parent2FirstNameFound = true;}
			if (stringCompare(csvrow[i], 'parent 2 last name')) {parent2LastNameFound = true;}
			if (stringCompare(csvrow[i], 'parent 2 phone')) {parent2PhoneFound = true;}
			if (stringCompare(csvrow[i], 'parent 2 e-mail')) {parent2EmailFound = true;}
			if (stringCompare(csvrow[i], 'relationship 2')) {relationship2Found = true;}
			if (stringCompare(csvrow[i], 'mon-pickup')) {monPickupFound = true;}
			if (stringCompare(csvrow[i], 'mon-driver')) {monDriverFound = true;}
			if (stringCompare(csvrow[i], 'tue-pickup')) {tuePickupFound = true;}
			if (stringCompare(csvrow[i], 'tue-driver')) {tueDriverFound = true;}
			if (stringCompare(csvrow[i], 'wed-pickup')) {wedPickupFound = true;}
			if (stringCompare(csvrow[i], 'wed-driver')) {wedDriverFound = true;}
			if (stringCompare(csvrow[i], 'thu-pickup')) {thuPickupFound = true;}
			if (stringCompare(csvrow[i], 'thu-driver')) {thuDriverFound = true;}
			if (stringCompare(csvrow[i], 'fri-pickup')) {friPickupFound = true;}
			if (stringCompare(csvrow[i], 'fri-driver')) {friDriverFound = true;}
			if (stringCompare(csvrow[i], 'min-pickup')) {minPickupFound = true;}
			if (stringCompare(csvrow[i], 'need pickup')) {needPickupFound = true;}
		}
	}
	console.log(userHeader);
	// exit if there is error in getting the column header
	if (!firstNameFound || !lastNameFound || !genderFound || !gradeFound ||
			!schoolFound || !schoolAddressFound || !schoolCityFound ||
			!beginDateFound || !lastDateFound ||
			!homeAddressFound || !homeCityFound || !homeZipFound ||
			!parent1FirstNameFound || !parent1LastNameFound || !parent1PhoneFound || !parent1EmailFound ||
			!parent2FirstNameFound || !parent2LastNameFound || !parent2PhoneFound || !parent2EmailFound ||
			!monPickupFound || !monDriverFound || !tuePickupFound || !tueDriverFound ||
			!wedPickupFound || !wedDriverFound || !thuPickupFound || !thuDriverFound ||
			!friPickupFound || !friDriverFound || !minPickupFound || !needPickupFound
			){
		console.log('File format error');
		if (!firstNameFound) {console.log('First Name column not found');}
		if (!lastNameFound) {console.log('Last Name column not found');}
		if (!genderFound) {console.log('Gender column not found');}
		if (!gradeFound) {console.log('Grade column not found');}
		if (!schoolFound) {console.log('School column not found');}
		if (!schoolAddressFound) {console.log('School Address column not found');}
		if (!schoolCityFound) {console.log('School City column not found');}
		if (!beginDateFound) {console.log('Begin Date column not found');}
		if (!lastDateFound) {console.log('Last Date column not found');}
		if (!homeAddressFound) {console.log('Home Address column not found');}
		if (!homeCityFound) {console.log('Home City column not found');}
		if (!homeZipFound) {console.log('Home Zip column not found');}
		if (!parent1FirstNameFound) {console.log('Parent 1 First name column not found');}
		if (!parent1LastNameFound) {console.log('Parent 1 Last name column not found');}
		if (!parent1PhoneFound) {console.log('Parent 1 phone column not found');}
		if (!parent1EmailFound) {console.log('Parent 1 e-mail column not found');}
		if (!parent2FirstNameFound) {console.log('Parent 2 First name column not found');}
		if (!parent2LastNameFound) {console.log('Parent 2 Last name column not found');}
		if (!parent2PhoneFound) {console.log('Parent 2 phone column not found');}
		if (!parent2EmailFound) {console.log('Parent 2 e-mail column not found');}
		if (!monPickupFound) {console.log('Monday pickup time column not found');}
		if (!monDriverFound) {console.log('Monday pickup driver column not found');}
		if (!tuePickupFound) {console.log('Tuesday pickup time column not found');}
		if (!tueDriverFound) {console.log('Tuesday pickup driver column not found');}
		if (!wedPickupFound) {console.log('Wednesday pickup time column not found');}
		if (!wedDriverFound) {console.log('Wednesday pickup driver column not found');}
		if (!thuPickupFound) {console.log('Thursday pickup time column not found');}
		if (!thuDriverFound) {console.log('Thursday pickup driver column not found');}
		if (!friPickupFound) {console.log('Friday pickup time column not found');}
		if (!friDriverFound) {console.log('Friday pickup driver column not found');}
		if (!minPickupFound) {console.log('Minimum pickup time column not found');}
		if (!needPickupFound) {console.log('Need Pickup column not found');}
		validFormat = false;
	}
	return validFormat;
}

function getNames(str){
	var names = str.split(/\s*;\s*/);
	var namesArray = [];
	names.forEach(function(name){
		var fullname = name.split(' ');
		namesArray.push({firstName: fullname[0], lastName: fullname[1]});
	});
	return namesArray;
}

function str2Date(string){
	var parts = string.split('/');
	return new Date(parts[2], parts[0] - 1, parts[1]);
}

function procUserRecord(User, csvrow){
	// create user in database
	var name = [];
	name[0] = csvrow[userHeader['last name']];
	name[1] = csvrow[userHeader['first name']];	
	var gender = csvrow[userHeader['gender']];
	var grade = csvrow[userHeader['grade']].trim();
	var school = csvrow[userHeader['school']].trim();
	var schoolAddress = csvrow[userHeader['school address']];
	var schoolCity = csvrow[userHeader['school city']];
	var beginDate = csvrow[userHeader['begin date']];
	var lastDate = csvrow[userHeader['last date']];
	var enrollment = [{enroll: str2Date(beginDate), last: str2Date(lastDate)}]
	var active = false;
	var chkDate = new Date();
	var startDate = new Date(enrollment[0].enroll);
	var endDate = new Date(enrollment[0].last);
	if (chkDate.getTime() >= startDate.getTime() && chkDate.getTime() <= endDate.getTime())
		active = true;
	
	var homeAddress = csvrow[userHeader['home address']];
	var homeCity = csvrow[userHeader['home city']];
	var homeZip = csvrow[userHeader['home zip']];
	var parent1FirstName = csvrow[userHeader['parent 1 first name']];
	var parent1LastName = csvrow[userHeader['parent 1 last name']];
	var parent1Phone = csvrow[userHeader['parent 1 phone']];
	var parent1Email = csvrow[userHeader['parent 1 e-mail']];
	var relationship1 = csvrow[userHeader['relationship 1']];
	var parent2FirstName = csvrow[userHeader['parent 2 first name']];
	var parent2LastName = csvrow[userHeader['parent 2 last name']];
	var parent2Phone = csvrow[userHeader['parent 2 phone']];
	var parent2Email = csvrow[userHeader['parent 2 e-mail']];
	var relationship2 = csvrow[userHeader['relationship 2']];

	// discard drivers info
	var monPickup = csvrow[userHeader['mon-pickup']];
	var monDriver = "";
	var tuePickup = csvrow[userHeader['tue-pickup']];
	var tueDriver = "";
	var wedPickup = csvrow[userHeader['wed-pickup']];
	var wedDriver = "";
	var thuPickup = csvrow[userHeader['thu-pickup']];
	var thuDriver = "";
	var friPickup = csvrow[userHeader['fri-pickup']];
	var friDriver = "";
	var minPickup = csvrow[userHeader['min-pickup']];
	var needPickup = csvrow[userHeader['need pickup']] == 'Yes' ? true : false;

	var uniqueID = genUniqueID(name[1], name[0]);
	// setup parent-children relationship array
	var parent1name = ["", ""];
	parent1name[0] = parent1LastName;
	parent1name[1] = parent1FirstName;
	var parent2name = ["", ""];
	parent2name[0] = parent2LastName;
	parent2name[1] = parent2FirstName;
	var proceed = false;
	
	return new Promise(function(resolve, reject){
			User.findOne({uniqueID: uniqueID}, function(err, user){
				if (err) {
					throw err;
				}
				if (!user){
					user = new User();
					console.log('Create: ' + uniqueID);
				} else {
					console.log('Update: ' + uniqueID);
				}
				user.uniqueID = uniqueID;
				user.name = {firstName: name[1],
						lastName: name[0]};
				user.username = user.username || uniqueID;
				user.gender = gender;
				user.grade = grade;
				user.school = school;
				user.schoolAddress = schoolAddress;
				user.schoolCity = schoolCity;
				user.active = active;
				user.enrollment = enrollment;
				user.homeAddress = homeAddress;
				user.homeCity = homeCity;
				user.homeZip = homeZip;
				user.parent1FirstName = parent1FirstName;
				user.parent1LastName = parent1LastName;
				user.parent1Phone = parent1Phone;
				user.parent1Email = parent1Email;
				user.relationship1 = relationship1;
				user.parent2FirstName = parent2FirstName;
				user.parent2LastName = parent2LastName;
				user.parent2Phone = parent2Phone;
				user.parent2Email = parent2Email;
				user.relationship2 = relationship2;
				user.needPickup = needPickup;
				user.pickup = [{pickup:monPickup, driver:monDriver},
					{pickup:tuePickup, driver:tueDriver},
					{pickup:wedPickup, driver:wedDriver},
					{pickup:thuPickup, driver:thuDriver},
					{pickup:friPickup, driver:friDriver},
					{pickup:minPickup, driver:''}
					];
				
				user.registered = user.registered || false;
				user.userType = ["Student"];
				
				user.save(function(err, user){
					// due to async nature, same name will cause duplication error
					if (err) {
						if (err.code === 11000) {
							console.log("Duplicate error on line ?? ");
						} else {
							throw err;
						}
					}
					// need the _id to put in parent record
					addChildData(parent1name, parent1Email, parent1Phone, relationship1, name, user._id);
					addChildData(parent2name, parent2Email, parent2Phone, relationship2, name, user._id);
					resolve("Updated R " + user.uniqueID);
				});
			});
		
	})
}

// when child record saved, get parent and update the child field
// Notice: parent update has to be complete before saving another child
// this function is not used
function addChildData1(parentName, parentEmail, parentPhone, relationship, childName, childID){
	return new Promise(function(resolve, reject){		
		if (parentName[0] && parentName[1]){
			var uniqueID = genUniqueID(parentName[1], parentName[0]);
			User.findOne({uniqueID: uniqueID}, function(err, user){
				if (err) {
					throw err;
				}
				if (!user){
					user = new User();
					user.uniqueID = uniqueID;
					user.name = {firstName: parentName[1], lastName: parentName[0]};
					user.children = {firstName: childName[1], lastName: childName[0], id: childID};
				} else {
					console.log("Update: " + uniqueID);
					var children = user.children;
					var present = children.find(o => o.id === childID.toString());
					if (!present){
						console.log("cannot find " + childName)
						children.push({firstName: childName[1], lastName: childName[0], id: childID});
						user.children = children;
					}
				}
				
				user.email = parentEmail;
				user.cellPhone = parentPhone;
				user.grade = "NA";
				user.save(function(err, user){
					if (err) {
						throw err;
					}
					console.log("Save: " + uniqueID);
					resolve("Done on " + uniqueID);
				})
			})
		}
	})
}

//this system can't handle 2 parents with same name
// this routine builds the array parentChildRec which will be used to update DB at the end
function addChildData(parentName, parentEmail, parentPhone, relationship, childName, childID){
	if (parentName[0] && parentName[1]){
//		console.log("Add " + parentName[0] + " " + parentName[1])
		var uniqueID = genUniqueID(parentName[1], parentName[0]);
		var recFound = false;
		var gender = "Female";
		for (var i=0; i<parentChildRec.length; i++){
			if (parentChildRec[i].uniqueID === uniqueID) {
				recFound = true;
				var children = parentChildRec[i].children;
				var present = children.find(o => o.id == childID.toString());
				if (!present){
					children.push({firstName: childName[1], lastName: childName[0], id: childID});
					parentChildRec[i].children = children;
				}
				break;
			}
		}
		if (!recFound){
			if (stringCompare(relationship, 'father') || stringCompare(relationship, 'dad')){						
				gender = "Male";
			}
			var rec = {uniqueID: uniqueID,
					firstname: parentName[1], 
					lastname: parentName[0],
					gender: gender,
					email: parentEmail,
					phone: parentPhone,
					children: [{firstName: childName[1], lastName: childName[0], id: childID}]};
			parentChildRec.push(rec);
		}
	}
}

//// to update the guardians and children link, replace with _id
//function updateGuardiansChildrenLinks(){
//	var relatedField;
//	User.find({}, function(err, users){
//		users.forEach(function(user){
//			console.log('Checking ' + user.username + ' type: ' + user.userType + ' ' + user.userType.length);
//			if (user.userType.indexOf("Parent") !== -1){
//				relatedField = user.children;
//			} else if (user.userType.indexOf("Student") !== -1){
//				relatedField = user.guardians;
//			}
//			console.log('parent = ' + user.uniqueID);
//			if (relatedField !== undefined){	// todo: check for null
//				var nameIDs = [];
//				console.log('Relatives: ' + relatedField);
//				relatedField.forEach(function(name){
//					nameIDs.push(name.firstName.toLowerCase() + name.lastName.toLowerCase());
//				});
//				console.log('nameIDs : ' + nameIDs);
//				User.find({uniqueID : {$in: nameIDs}}, function(err, relatives){
//					var relativeIDs = [];
//					relatives.forEach(function(relative){
//						relativeIDs.push({firstName: relative.name.firstName, lastName: relative.name.lastName, id: relative._id.toString()});
//					});
//					console.log(user.username + ' - relativeIDs : ' + relativeIDs);
//					if (user.userType.indexOf("Parent") !== -1){
//						user.guardians = [];
//						user.children = relativeIDs;
//					} else if (user.userType.indexOf("Student") !== -1){
//						user.guardians = relativeIDs;
//						user.children = [];
//					}
//					user.save(function(err){
//						if (err){
//							throw err;
//						}
//					});
//				});
//			}
//		});
//	});
//}

function addChildrenToAdultRec(callback){
//	console.log(JSON.stringify(parentChildRec))
//	parentChildRec.forEach(function(rec){
	var count = 0;
	for(var i=0; i<parentChildRec.length; i++){
		// need to use IIFE, otherwise the last rec will be used for all
		(function(rec){			
			User.findOne({uniqueID: rec.uniqueID}, function(err, user){
				if (!user){
					user = new User();
					user.uniqueID = rec.uniqueID;
					console.log('Create adult ' + user.uniqueID);
					user.name = {firstName: rec.firstname, lastName: rec.lastname};
				} else {
					console.log('Update adult ' + user.uniqueID);
				}
				user.userType = ["Parent"];
				user.email = rec.email;
				user.cellPhone = rec.phone;
				user.grade = "";
				user.gender = rec.gender;
				user.children = rec.children;
				user.save(function(err){
					if (err) {
						throw err;
					}
					count++;
					if (count == parentChildRec.length - 1){
						callback();
					}
				});
			});
		})(parentChildRec[i]);
	}
//	});
}

function getKeyByValue(object, value){
	return Object.keys(object).find(key => object[key] === value);
}

function preProcStr(inStr, quoteChar, replaceChar){
	var outStr = '';
	var tmpChar;
	var quotedField = false;
	if (inStr.indexOf(quoteChar) !== -1){
		for (var j=0; j<inStr.length; j++){
			tmpChar = inStr.charAt(j);
			if (tmpChar === quoteChar){
				quotedField = !quotedField;
			} else if (quotedField && tmpChar === ','){
				outStr = outStr.concat(replaceChar);
			} else {
				outStr = outStr.concat(tmpChar);
			}
		}
		return outStr;
	} else {
		return inStr;
	}
}
module.exports.uploadStudent = function(client, file, callback){
	scoutHeader = {};
	parentChildRec = [];
	var promiseArray = [];
	fs.readFile(file, function(err, data){
		var text = data.toString().split(/[\n]/)
		// remove from text if the last line is empty, that is a must because
		// we need to specify when to run callback, the last input line
//		console.log(text[text.length-1].split(/[,\r]/).length);
		while (text[text.length - 1].split(/[,\r]/).length <= 2){
			text.splice(-1, 1)
		}
		
		var lineno = 0
		var csvrow
		var index = authentication.clientValidate(client);
		if (index !== -1){
			var conn = authentication.getMongoConnection(index);
			const User = conn.model('User', userSchema);
			
			for (var i=0; i<text.length; i++){
				lineno++
				csvrow = text[i].split(/[,\r]/)
				if (csvrow.length > 1){
					if (lineno == 1){
						if (!procUserHeader(csvrow)){
							console.log('Invalid format')
							return
						}
					} else if (csvrow[0] == '') {
						console.log("exit at: " + lineno)
						break;
					} else {
						var promise = procUserRecord(User, csvrow)
						promiseArray.push(promise);
					}
				}
			}
		}
		
		Promise.all(promiseArray).then(function(){
			console.log("All children data saved! Going to add parent records")
//			console.log(parentChildRec)
//			addChildrenToAdultRec(callback);
			conn.close();
			callback();
		})
	})
}

function processWorkerHeader(csvrow){
//	workerHeader = {};
	var validFormat = true;
	var firstNameFound = false;
	var lastNameFound = false;
	var cellPhoneFound = false;
	var carrierFound = false;
	var emailFound = false;
	var rolesFound = false;
	var colorFound = false;
	for(var i=0; i<csvrow.length; i++) {
		if (csvrow[i] !== ''){
			workerHeader[csvrow[i].toLowerCase().trim()] = i;
			if (stringCompare(csvrow[i], 'first name')) {firstNameFound = true;}
			if (stringCompare(csvrow[i], 'last name')) {lastNameFound = true;}
			if (stringCompare(csvrow[i], 'cell phone')) {cellPhoneFound = true;}
			if (stringCompare(csvrow[i], 'carrier')) {carrierFound = true;}
			if (stringCompare(csvrow[i], 'e-mail')) {emailFound = true;}
			if (stringCompare(csvrow[i], 'roles')) {rolesFound = true;}
			if (stringCompare(csvrow[i], 'color')) {colorFound = true;}
		}
	}
	if (!firstNameFound || !lastNameFound || !cellPhoneFound || !carrierFound
			|| !emailFound || !rolesFound || !colorFound){
		validFormat = false;
		if (!firstNameFound) {console.log('First Name column not found');}
		if (!lastNameFound) {console.log('Last Name column not found');}
		if (!cellPhoneFound) {console.log('Cell Phone column not found');}
		if (!carrierFound) {console.log('Carrier column not found');}
		if (!emailFound) {console.log('E-mail column not found');}
		if (!rolesFound) {console.log('Roles column not found');}
		if (!colorFound) {console.log('Background color column not found');}
	}
	return validFormat;
}

function processWorkerRecord(User, csvrow){
	var name = [];
	name[0] = csvrow[workerHeader['last name']];
	name[1] = csvrow[workerHeader['first name']];	
	var cellPhone = csvrow[workerHeader['cell phone']];
	var carrier = csvrow[workerHeader['carrier']];
	var email = csvrow[workerHeader['e-mail']];
	var roles = csvrow[workerHeader['roles']].split('-');
	var color = csvrow[workerHeader['color']];
	var uniqueID = genUniqueID(name[1], name[0]);
	User.findOne({uniqueID: uniqueID}, function(err, user){
		if (err)
			throw err;
		if (!user){
			console.log("Create: " + uniqueID)
			user = new User();
			user.uniqueID = uniqueID;
			user.name = {firstName: name[1],
					lastName: name[0]};
			user.username = user.username || uniqueID;
		} else {
			console.log("Update: " + uniqueID)
		}
		user.cellPhone = cellPhone;
		user.carrier = carrier;
		user.email = email;
		user.userType = roles;
		user.backgroundColor = color;
		user.grade = "";
		user.save(function(err){
			if (err) {
				throw err;
			}
		})
	})
}

module.exports.uploadWorker = function(client, file, callback){
	console.log('In uploadWorker ...')
	fs.readFile(file, function(err, data){
		var text = data.toString().split(/[\n]/)
		while (text[text.length - 1].split(/[,\r]/).length <= 2){
			text.splice(-1, 1)
		}
		
		var lineno = 0
		var csvrow
		var index = authentication.clientValidate(client);
		if (index !== -1){
			var conn = authentication.getMongoConnection(index);
			const User = conn.model('User', userSchema);
			for (var i=0; i<text.length; i++){
				lineno++
				csvrow = text[i].split(/[,\r]/)
				console.log(lineno + "|" + csvrow)
				if (csvrow.length > 1){
					if (lineno == 1){
						if (!processWorkerHeader(csvrow)){
							console.log("File error");
							return
						}
					} else {
						processWorkerRecord(User, csvrow)
					}
				}
			}
		}
		callback();
	})
}

function processPickupHeader(csvrow){
	var validFormat = true;
	var studentIDFound = false;
	var schoolFound = false;
	var dateFound = false;
	var timeStrFound = false;
	var driverFound = false;
	
	for(var i=0; i<csvrow.length; i++) {
		if (csvrow[i] !== ''){
			pickupHeader[csvrow[i].toLowerCase().trim()] = i;
			if (stringCompare(csvrow[i], 'student id')) {studentIDFound = true;}
			if (stringCompare(csvrow[i], 'school')) {schoolFound = true;}
			if (stringCompare(csvrow[i], 'date')) {dateFound = true;}
			if (stringCompare(csvrow[i], 'time')) {timeStrFound = true;}
			if (stringCompare(csvrow[i], 'driver')) {driverFound = true;}
		}
	}
	if (!studentIDFound || !schoolFound || !dateFound || !timeStrFound || !driverFound){
		validFormat = false;
		if (!studentIDFound) {console.log('Student ID column not found');}
		if (!schoolFound) {console.log('School column not found');}
		if (!dateFound) {console.log('Date column not found');}
		if (!timeStrFound) {console.log('Time column not found');}
		if (!driverFound) {console.log('Driver column not found');}
	}
	return validFormat;
}

function str2Time(strTime){
	if (strTime == undefined || strTime == null || strTime == '')
		return {
			hour: 23,
			minute: 59
		}
	var regex = /(\d+):(\d+)\s*(\w+)/;
	var token = regex.exec(strTime);
	if (token.length < 4 || !(token[3].toLowerCase() === "am" || token[3].toLowerCase() === "pm"))
		return {
			hour: 23,
			minute: 59
		}
	var hour = parseInt(token[1])
	// if hour is 12 and not PM, then hour is 0
	if (hour == 12 && token[3].toLowerCase() == "am"){
		hour = 0;
	} else if (hour != 12 && token[3].toLowerCase() == "pm") {			
		hour = hour + 12
	}
	var minute = parseInt(token[2])
	return {
		hour: hour,
		minute: minute
	}
}

function processPickupRecord(Pickup, csvrow){	
	var studentID = csvrow[pickupHeader['student id']];
	var school = csvrow[pickupHeader['school']];
	var time_start = str2Date(csvrow[pickupHeader['date']]);
	time_start.setHours(0); time_start.setMinutes(0); time_start.setSeconds(0);
	var time_end = str2Date(csvrow[pickupHeader['date']]);
	time_end.setHours(23); time_end.setMinutes(59); time_end.setSeconds(59);
	var timeStr = csvrow[pickupHeader['time']];
	var driver = csvrow[pickupHeader['driver']];
	Pickup.find({studentID: studentID, date: {'$gte': time_start, '$lt': time_end}}, function(err, entries){
		if (err){
			throw err;
		}
		var entry;
		if (entries.length > 1){
			console.log("More than 1 entries: " + pickup.studentID)
			entries.forEach(function(pickup){
				console.log(pickup.date + '|' + pickup.timeStr + '|' + pickup.driverID);
				Pickup.remove({_id: pickup._id}, function(err){
					if (err)
						throw err;
				})
			})
		}
		if (entries.length == 1){
			entry = entries[0];
		} else {
			entry = new Pickup();
			entry.studentID = studentID;
		}
		entry.school = school;
		entry.timeStr = timeStr;
		time_start.setHours(str2Time(timeStr).hour)
		time_start.setMinutes(str2Time(timeStr).minute)
		entry.date = time_start;					
		entry.driverID = driver;
		entry.save(function(err){
			if (err){
				throw err;
			}
		})
	})
}

module.exports.uploadPickup = function(client, file, callback){
	console.log('In uploadPickup ...')
	fs.readFile(file, function(err, data){
		var text = data.toString().split(/[\n]/)
		while (text[text.length - 1].split(/[,\r]/).length <= 2){
			text.splice(-1, 1)
		}
		
		var lineno = 0
		var csvrow
		var index = authentication.clientValidate(client);
		if (index !== -1){
			var conn = authentication.getMongoConnection(index);
			const Pickup = conn.model('Pickup', pickupSchema);

			for (var i=0; i<text.length; i++){
				lineno++
				csvrow = text[i].split(/[,\r]/)
				console.log(lineno + "|" + csvrow)
				if (csvrow.length > 1){
					if (lineno == 1){
						if (!processPickupHeader(csvrow)){
							console.log("File error");
							return
						}
					} else {
						processPickupRecord(Pickup, csvrow)
					}
				}
			}
		}
		callback();
	})
}

function processVideoRecord(Video, csvrow){	
	var teacherID = csvrow[videoHeader['teacher id']];
	var grade = csvrow[videoHeader['grade']];
	var subject = csvrow[videoHeader['subject']];
	var chapter = csvrow[videoHeader['chapter']];
	var lesson = csvrow[videoHeader['lesson']];
	var description = csvrow[videoHeader['desc']].replace(/"""/g, '');
	var expire = str2Date(csvrow[videoHeader['expire']]);
	var url = csvrow[videoHeader['url']];
	
	Video.findOne({teacherID: teacherID,
		grade: grade,
		subject: subject,
		chapter: chapter,
		lesson: lesson}, function(err, video){
		if (err){
			throw err;
		}
		if (!video){
			video = new Video();
			video.teacherID = teacherID;
			video.grade = grade,
			video.subject = subject;
			video.chapter = chapter;
			video.lesson = lesson;
		}
		video.description = description;
		video.expire = expire;
		video.url = url;
		video.save(function(err){
			if (err){
				throw err;
			}
		})
	})
}

function processVideoHeader(csvrow){
	var validFormat = true;
	var teacherIDFound = false;
	var gradeFound = false;
	var subjectFound = false;
	var chapterFound = false;
	var lessonFound = false;
	var descriptionFound = false;
	var expireFound = false;
	var urlFound = false;
	
	for(var i=0; i<csvrow.length; i++) {
		if (csvrow[i] !== ''){
			videoHeader[csvrow[i].toLowerCase().trim()] = i;
			if (stringCompare(csvrow[i], 'teacher id')) {teacherIDFound = true;}
			if (stringCompare(csvrow[i], 'grade')) {gradeFound = true;}
			if (stringCompare(csvrow[i], 'subject')) {subjectFound = true;}
			if (stringCompare(csvrow[i], 'chapter')) {chapterFound = true;}
			if (stringCompare(csvrow[i], 'lesson')) {lessonFound = true;}
			if (stringCompare(csvrow[i], 'desc')) {descriptionFound = true;}
			if (stringCompare(csvrow[i], 'expire')) {expireFound = true;}
			if (stringCompare(csvrow[i], 'url')) {urlFound = true;}
		}
	}
	if (!teacherIDFound || !gradeFound || !subjectFound || !chapterFound || !lessonFound ||
			!descriptionFound || !expireFound || !urlFound){
		validFormat = false;
		if (!teacherIDFound) {console.log('Teacher ID column not found');}
		if (!gradeFound) {console.log('Grade column not found');}
		if (!subjectFound) {console.log('Subject column not found');}
		if (!chapterFound) {console.log('Chapter column not found');}
		if (!lessonFound) {console.log('Lesson column not found');}
		if (!descriptionFound) {console.log('Description column not found');}
		if (!expireFound) {console.log('Expire column not found');}
		if (!urlFound) {console.log('URL column not found');}
	}
	return validFormat;
}

module.exports.uploadVideo = function(client, file, callback){
	console.log('In uploadVideo ...')
	fs.readFile(file, function(err, data){
		var text = data.toString().split(/[\n]/)
		while (text[text.length - 1].split(/[,\r]/).length <= 2){
			text.splice(-1, 1)
		}
		
		var lineno = 0
		var csvrow
		var index = authentication.clientValidate(client);
		if (index !== -1){
			var conn = authentication.getMongoConnection(index);
			const Video = conn.model('Video', videoSchema);
			
			for (var i=0; i<text.length; i++){
				lineno++
//				csvrow = text[i].split(/[,\r]/)
				// https://stackoverflow.com/questions/23582276/split-string-by-comma-but-ignore-commas-inside-quotes/23582323
				// regex101.com
//				,               ','
//				(?=             look ahead to see if there is:
//				(?:             group, but do not capture (0 or more times):
//				(?:             group, but do not capture (2 times):
//				 [^"]*          any character except: '"' (0 or more times)
//				 "              '"'
//				){2}            end of grouping
//				)*              end of grouping
//				 [^"]*          any character except: '"' (0 or more times)
//				$               before an optional \n, and the end of the string
//				)               end of look-ahead
				csvrow = text[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
				console.log(lineno + "|" + csvrow[5])
				
				if (csvrow.length > 1){
					if (lineno == 1){
						if (!processVideoHeader(csvrow)){
							console.log("File error");
							return
						}
					} else {
						processVideoRecord(Video, csvrow)
					}
				}
			}
		}
		callback();
	})
}

function processWorkbookHeader(csvrow){
	var validFormat = true;
	var teacherIDFound = false;
	var gradeFound = false;
	var subjectFound = false;
	var chapterFound = false;
	var lessonFound = false;
	var descriptionFound = false;
	var dueFound = false;
	var expireFound = false;
	var studentPenFound = false;
	var teacherPen1Found = false;
	var teacherPen2Found = false;
	
	for(var i=0; i<csvrow.length; i++) {
		if (csvrow[i] !== ''){
			videoHeader[csvrow[i].toLowerCase().trim()] = i;
			if (stringCompare(csvrow[i], 'teacher id')) {teacherIDFound = true;}
			if (stringCompare(csvrow[i], 'grade')) {gradeFound = true;}
			if (stringCompare(csvrow[i], 'subject')) {subjectFound = true;}
			if (stringCompare(csvrow[i], 'chapter')) {chapterFound = true;}
			if (stringCompare(csvrow[i], 'lesson')) {lessonFound = true;}
			if (stringCompare(csvrow[i], 'desc')) {descriptionFound = true;}
			if (stringCompare(csvrow[i], 'due')) {dueFound = true;}
			if (stringCompare(csvrow[i], 'expire')) {expireFound = true;}
			if (stringCompare(csvrow[i], 'student pen')) {studentPenFound = true;}
			if (stringCompare(csvrow[i], 'teacher pen 1')) {teacherPen1Found = true;}
			if (stringCompare(csvrow[i], 'teacher pen 2')) {teacherPen2Found = true;}
		}
	}
	if (!teacherIDFound || !gradeFound || !subjectFound || !chapterFound || !lessonFound ||
			!descriptionFound || !dueFound || !expireFound || !studentPenFound ||
			!teacherPen1Found || !teacherPen2Found){
		validFormat = false;
		if (!teacherIDFound) {console.log('Teacher ID column not found');}
		if (!gradeFound) {console.log('Grade column not found');}
		if (!subjectFound) {console.log('Subject column not found');}
		if (!chapterFound) {console.log('Chapter column not found');}
		if (!lessonFound) {console.log('Lesson column not found');}
		if (!descriptionFound) {console.log('Description column not found');}
		if (!dueFound) {console.log('Due column not found');}
		if (!expireFound) {console.log('Expire column not found');}
		if (!studentPenFound) {console.log('Student Pen column not found');}
		if (!teacherPen1Found) {console.log('Teacher Pen 1 column not found');}
		if (!teacherPen2Found) {console.log('Teacher Pen 2 column not found');}
	}
	return validFormat;
}

function processWorkbookRecord(Workbook, csvrow){	
	var teacherID = csvrow[videoHeader['teacher id']];
	var grade = csvrow[videoHeader['grade']];
	var subject = csvrow[videoHeader['subject']];
	var chapter = csvrow[videoHeader['chapter']];
	var lesson = csvrow[videoHeader['lesson']];
	var description = csvrow[videoHeader['desc']].replace(/"""/g, '');
	var due = str2Date(csvrow[videoHeader['due']]);
	var expire = str2Date(csvrow[videoHeader['expire']]);
	var studentPen = csvrow[videoHeader['student pen']];
	var teacherPen1 = csvrow[videoHeader['teacher pen 1']];
	var teacherPen2 = csvrow[videoHeader['teacher pen 2']];
	
//	Workbook.findOne({teacherID: teacherID,
	// can reassign workbook to another teacher
	Workbook.findOne({
		grade: grade,
		subject: subject,
		chapter: chapter,
		lesson: lesson}, function(err, workbook){
		if (err){
			throw err;
		}
		if (!workbook){
			workbook = new Workbook();
			workbook.grade = grade,
			workbook.subject = subject;
			workbook.chapter = chapter;
			workbook.lesson = lesson;
		}
		workbook.teacherID = teacherID;
		workbook.description = description;
		workbook.due = due;
		workbook.expire = expire;
		workbook.studentPenColor = studentPen;
		workbook.teacherPenColor = [teacherPen1, teacherPen2];
		workbook.save(function(err){
			if (err){
				throw err;
			}
		})
	})
}

module.exports.uploadWorkbookInfo = function(client, file, callback){
	console.log('In uploadWorkbookInfo ...')
	fs.readFile(file, function(err, data){
		var text = data.toString().split(/[\n]/)
		while (text[text.length - 1].split(/[,\r]/).length <= 2){
			text.splice(-1, 1)
		}
		
		var lineno = 0
		var csvrow
		var index = authentication.clientValidate(client);
		if (index !== -1){
			var conn = authentication.getMongoConnection(index);
			const Workbook = conn.model('Workbook', workbookSchema);
			
			for (var i=0; i<text.length; i++){
				lineno++
				csvrow = text[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
				console.log(lineno + "|" + csvrow[5])
				
				if (csvrow.length > 1){
					if (lineno == 1){
						if (!processWorkbookHeader(csvrow)){
							console.log("File error");
							return
						}
					} else {
						processWorkbookRecord(Workbook, csvrow)
					}
				}
			}
		}
		callback();
	})
}
