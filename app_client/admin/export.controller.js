(function(){
//	https://atasteofsandwich.wordpress.com/2014/02/03/client-side-csv-download-with-angularjs/
	var stringConstructor = "test".constructor;
	var arrayConstructor = [].constructor;
	var objectConstructor = {}.constructor;

	function whatIsIt(object) {
		if (object === null) {
			return "null";
		}
		else if (object === undefined) {
			return "undefined";
		}
		else if (object.constructor === stringConstructor) {
			return "String";
		}
		else if (object.constructor === arrayConstructor) {
			return "Array";
		}
		else if (object.constructor === objectConstructor) {
			return "Object";
		}
		else {
			return "don't know";
		}
	}

//	https://codepen.io/sandeep821/pen/JKaYZq
	function saveTextAsFile (data, filename){
		if(!data) {
			console.error('Console.save: No data')
			return;
		}

		if(!filename) filename = 'console.json'

			var blob = new Blob([data], {type: 'text/plain'})
		var e    = document.createEvent('MouseEvents')
		var a    = document.createElement('a')
		// FOR IE:

		if (window.navigator && window.navigator.msSaveOrOpenBlob) {
			window.navigator.msSaveOrOpenBlob(blob, filename);
		} else {
			// var e = document.createEvent('MouseEvents');
			// var a = document.createElement('a');
			a.download = filename;
			a.href = window.URL.createObjectURL(blob);
			a.dataset.downloadurl = ['text/plain', a.download, a.href].join(':');
			e.initEvent('click', true, false, window,
					0, 0, 0, 0, 0, false, false, false, false, 0, null);
			a.dispatchEvent(e);
		}
	}

	function date2Str(date){
		var date_ = new Date(date)
		return (date_.getMonth() + 1 + '/' + date_.getDate() + '/' + date_.getFullYear())
	}

	function getWeekDays(begin, end){
		var dayMS = 60 * 60 * 24 * 1000;
		var dayBegin = new Date(begin);
		dayBegin.setHours(0); dayBegin.setMinutes(0);
		var dayEnd = new Date(end);
		dayEnd.setHours(23); dayEnd.setMinutes(59);
		var dayPtr = dayBegin;
		dayPtr.setHours(12); dayPtr.setMinutes(0);
		var days = []
		while (dayPtr.getTime() < dayEnd.getTime()){
			if (dayPtr.getDay() >= 1 && dayPtr.getDay() <= 5){
				days.push(dayPtr.getMonth() + 1 + '/' + dayPtr.getDate() + '/' + dayPtr.getFullYear().toString().substr(-2))
				days.push("")
			}
			dayPtr.setTime(dayPtr.getTime() + dayMS);
		}
		return days;
	}

	function getDate(date){
		var day = new Date(date);
		return day.getMonth() + 1 + '/' + day.getDate() + '/' + day.getFullYear().toString().substr(-2);
	}

	function getDateStr(date){
		var day = new Date(date);
		return day.toISOString().substr(0, 10).replace(/-/g, '');
	}

	function exportCtrl($routeParams, $scope, $sce, authentication, workbookService, videoService, $location){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();

		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/');
		})

		if (!authentication.isAdmin(vm.client)){		
			$location.path('/' + vm.client);
		}		
		$scope.format = 'M/d/yy';
		$scope.date = new Date();
		$scope.fromDate = new Date();
		$scope.fromDate.setDate($scope.fromDate.getDate() - $scope.fromDate.getDay() + 1);
		$scope.toDate = new Date($scope.fromDate);
		$scope.toDate.setDate($scope.toDate.getDate() + 4);
		$scope.popup = {
				opened: false
		}
		$scope.popup1 = {
				opened: false
		}
		$scope.popup2 = {
				opened: false
		}	
		$scope.open = function(){
			$scope.popup.opened = true;
		}
		$scope.open1 = function(){
			$scope.popup1.opened = true;
		}
		$scope.open2 = function(){
			$scope.popup2.opened = true;
		}

		function findDriver(pickups, student, date){
			for(var i=0; i<pickups.length; i++){
				var pickupDate = new Date(pickups[i].date);
				if (pickups[i].studentID == student.name.firstName + student.name.lastName &&
						pickupDate.getDay() == date){
//					console.log('found: ' + student.name.firstName + student.name.lastName)
					return pickups[i].driverID;
				}
			}
			return "";
		}

		function checkGender(relationship){
			if (relationship == undefined || relationship == null || relationship == '')
				return '';
			relationship_lc = relationship.toLowerCase();
			if (relationship_lc == 'dad' || relationship_lc == 'father'){
				return 'Male';
			} else
				return 'Female';
		}
		function getTime(strTime){
			if ((strTime == undefined) || strTime == '')
				return '';
			var regex = /(\d+):(\d+)\s*(\w+)/;
			var token = regex.exec(strTime)
//			console.log(strTime)
			if (token == '' || token.length < 4)
				return '';
			var hour = parseInt(token[1])
			// if hour is 12 and not PM, then hour is 0
//			if (hour == 12 && token[3].toLowerCase() == "am"){
//			hour = 0;
//			} else if (hour != 12 && token[3].toLowerCase() == "pm") {			
//			hour = hour + 12
//			}
			if (hour < 10){
				hour = '0' + hour.toString();
			} else {
				hour = hour.toString();
			}
//			var minute = parseInt(token[2])
			time_output = hour + ':' + token[2] + ' ' + token[3];
			return time_output ;
		}
		function needPickup(pickup0, pickup1, pickup2, pickup3, pickup4){
			if (pickup0 == '' && pickup1 == '' && pickup2 == '' && pickup3 == '' && pickup4 == '')
				return 'FALSE';
			else
				return 'TRUE';
		}


		$scope.exportStudents_procare = function(){
			// get this Monday to Friday
			var startDate = new Date($scope.date);
			if (startDate.getDay() != 1) {
				startDate.setDate(startDate.getDate() - startDate.getDay() + 1);
			}
			startDate.setHours(0);
			startDate.setMinutes(0);
			var endDate = new Date(startDate);
			// end date is Friday
			endDate.setDate(endDate.getDate() + 5 - startDate.getDay());
			endDate.setHours(23);
			endDate.setMinutes(59);		
			authentication.getPickups(vm.client, startDate, endDate)
			.then(function(pickups){
				authentication.getAllUsers()
				.then(function(res){
//					console.log(res);
					res.sort(function(a,b){
						var a_value;
						var b_value;
						if (a.schoolCity === "Livermore") a_value = 1;
						if (a.schoolCity === "Pleasanton") a_value = 2;
						if (a.schoolCity === "Dublin") a_value = 3;
						if (a.schoolCity === "San Ramon") a_value = 4;
						if (b.schoolCity === "Livermore") b_value = 1;
						if (b.schoolCity === "Pleasanton") b_value = 2;
						if (b.schoolCity === "Dublin") b_value = 3;
						if (b.schoolCity === "San Ramon") b_value = 4;
						// need to returns 1, -1 or 0
						return a_value - b_value;
					})
					var students = '';
					var sHdr = ["FamilyID", "StudentFirstName", "StudentLastName", "DOB", "Classroom",
						"EnrollmentDate", "WithDrawDate",
						"P1First", "p1Last", "p1Street", "p1City", "p1State", "p1Zip", "p1HomePhone",
						"p1CellPhone", "p1WorkPhone", "p1Email",
						"p2First", "p2Last", "p2Street", "p2City", "p2State", "p2Zip", "p2HomePhone",
						"p2CellPhone", "p2WorkPhone", "p2Email"
						];
					students += sHdr.join(',') + '\n';               
					res.forEach(function(record){
						if (record.userType.indexOf('Student') !== -1){
							var fields = ["", record.name.firstName, record.name.lastName, "", "", 
								date2Str(record.enrollment[0].enroll), date2Str(record.enrollment[0].last),
								record.parent1FirstName, record.parent1LastName, record.homeAddress,
								record.homeCity, "CA", record.homeZip,
								record.parent1Phone, "", "", record.parent1Email,
								record.parent2FirstName, record.parent2LastName, record.homeAddress,
								record.homeCity, "CA", record.homeZip,
								record.parent2Phone, "", "", record.parent2Email
								];
							students += fields.join(',') + '\n';
						}
					})
					saveTextAsFile(students, vm.client + "_student_" + getDateStr(new Date()) + ".csv");
				})
			})
		}

		$scope.exportStudents = function(){
			// get this Monday to Friday
			var startDate = new Date($scope.date);
			if (startDate.getDay() != 1) {
				startDate.setDate(startDate.getDate() - startDate.getDay() + 1);
			}
			startDate.setHours(0);
			startDate.setMinutes(0);
			var endDate = new Date(startDate);
			// end date is Friday
			endDate.setDate(endDate.getDate() + 5 - startDate.getDay());
			endDate.setHours(23);
			endDate.setMinutes(59);		
			authentication.getPickups(vm.client, startDate, endDate)
			.then(function(pickups){
				authentication.getAllUsers(vm.client)
				.then(function(res){
//					console.log(res);
					res.sort(function(a,b){
						var a_value;
						var b_value;
						if (a.schoolCity === "Livermore") a_value = 1;
						if (a.schoolCity === "Pleasanton") a_value = 2;
						if (a.schoolCity === "Dublin") a_value = 3;
						if (a.schoolCity === "San Ramon") a_value = 4;
						if (b.schoolCity === "Livermore") b_value = 1;
						if (b.schoolCity === "Pleasanton") b_value = 2;
						if (b.schoolCity === "Dublin") b_value = 3;
						if (b.schoolCity === "San Ramon") b_value = 4;
						// need to returns 1, -1 or 0
						return a_value - b_value;
					})
					var students = '';
					var sHdr = ["First Name", "Last Name", "Gender", "Grade",
						"Home Address", "Home City", "Home Zip",
						"School", "School Address", "School City",
						"Begin Date", "Last Date",
						"Parent 1 First Name", "Parent 1 Last Name", "Parent 1 Phone", "Parent 1 e-mail", "Relationship 1",
						"Parent 2 First Name", "Parent 2 Last Name", "Parent 2 Phone", "Parent 2 e-mail", "Relationship 2",
						"Mon-Pickup", "Mon-Driver", "Tue-Pickup", "Tue-Driver", "Wed-Pickup", "Wed-Driver",
						"Thu-Pickup", "Thu-Driver", "Fri-Pickup", "Fri-Driver", "Min-Pickup", "Need Pickup"
						];
					students += sHdr.join(',') + '\n';               
					res.forEach(function(record){
						if (record.userType.indexOf('Student') !== -1){
							var fields = [record.name.firstName, record.name.lastName, record.gender, record.grade,
								record.homeAddress, record.homeCity, record.homeZip,
								record.school, record.schoolAdress, record.schoolCity,
								date2Str(record.enrollment[0].enroll), date2Str(record.enrollment[0].last),
								record.parent1FirstName, record.parent1LastName, record.parent1Phone, record.parent1Email, record.relationship1,
								record.parent2FirstName, record.parent2LastName, record.parent2Phone, record.parent2Email, record.relationship2,
								record.pickup[0].pickup, findDriver(pickups, record, 1),
								record.pickup[1].pickup, findDriver(pickups, record, 2),
								record.pickup[2].pickup, findDriver(pickups, record, 3),
								record.pickup[3].pickup, findDriver(pickups, record, 4),
								record.pickup[4].pickup, findDriver(pickups, record, 5),
								record.pickup[5].pickup, record.needPickup ? "Yes" : "No"
								];
							students += fields.join(',') + '\n';
						}
					})
					saveTextAsFile(students, vm.client + "_student_" + getDateStr(new Date()) + ".csv");
				})
			})
		}

		$scope.exportWorkers = function(){
			authentication.getAllUsers()
			.then(function(res){
				var workers = '';
				var wHdr = ["First Name", "Last Name", "Cell PHone", "Carrier", "E-mail", "Roles", "Color"]
				workers += wHdr.join(',') + '\n';
				res.forEach(function(record){
					if ((record.userType.indexOf('Student') == -1) && (record.userType.indexOf('Parent') == -1)){
						var fields = [record.name.firstName, record.name.lastName, record.cellPhone, record.carrier,
							record.email, record.userType.join('-'), record.backgroundColor]
						workers += fields.join(',') + '\n';
					}
				})
				saveTextAsFile(workers, vm.client + "_worker_" + getDateStr(new Date()) + ".csv");
			})
		}

		$scope.exportPickups = function(){
			authentication.getAllPickups()
			.then(function(res){
				var pickups = '';
				var pickupHdr = ["Student ID", "School", "Date", "Time", "Driver"];
				pickups += pickupHdr.join(',') + '\n';
				res.forEach(function(record){
					var fields = [record.studentID, record.school, date2Str(record.date), record.timeStr, record.driverID];
					pickups += fields.join(',') + '\n';
				})
				saveTextAsFile(pickups, vm.client + "_pickup_" + getDateStr(new Date()) + ".csv");
			})
		}

		$scope.exportAttendance = function(){
			var startDate = new Date($scope.fromDate);
			startDate.setHours(0);
			startDate.setMinutes(0);
			var endDate = new Date($scope.toDate);
			endDate.setHours(23);
			endDate.setMinutes(59);
			authentication.getPickupsByStudents(startDate, endDate)
			.then(function(pickups){
				authentication.getAllStudents(vm.client, $scope.fromDate, $scope.toDate)
				.then(function(res){
					// sort the result on school district 
					res.sort(function(a,b){
						var a_value;
						var b_value;
						if (a.schoolCity === "Livermore") a_value = 1;
						if (a.schoolCity === "Pleasanton") a_value = 2;
						if (a.schoolCity === "Dublin") a_value = 3;
						if (a.schoolCity === "San Ramon") a_value = 4;
						if (b.schoolCity === "Livermore") b_value = 1;
						if (b.schoolCity === "Pleasanton") b_value = 2;
						if (b.schoolCity === "Dublin") b_value = 3;
						if (b.schoolCity === "San Ramon") b_value = 4;
						// need to returns 1, -1 or 0
						return a_value - b_value;
					})

					var students = '';
					var sHdr = ["Student Name", "Gender", "Grade", "School", "JKC sign up days"];
					// add the dates
					var days = getWeekDays($scope.fromDate, $scope.toDate)
					sHdr = sHdr.concat(days);
					students += sHdr.join(',') + '\n';
					// get notes
//					var notes = [];

//					authentication.getSchedule({rangeStart: startDate, rangeEnd: endDate})
//					.then(function(res){
//					var dayPtr;
//					if (isValid(res)){					
//					res.forEach(function(bell){
//					// get the note
//					dayPtr = $scope.displayDays.find(o => cmpDate(o.date, bell.date));
//					$scope.dayNote[dayPtr.index] = bell.note;
//					$scope.noteRow[dayPtr.index] = getLines(bell.note);
//					})
//					}
//					})


					res.forEach(function(record){
						var fields = [record.name.firstName + ' ' + record.name.lastName,
							record.gender[0], record.grade, record.school
							];
						// get sign up days
						var weekdays = ["Mon", "Tue", "Wed", "Thur", "Fri"];
						var signUpDays = [];
						for(var i=0; i<5; i++){
							if (record.pickup[i].pickup != undefined &&
									record.pickup[i].pickup != null &&
									record.pickup[i].pickup != ""){
								signUpDays.push(weekdays[i]);
							}
						}
						if (signUpDays.length != 5){
							fields.push(signUpDays.join('/'));
						} else {
							fields.push("5 days");
						}
						// find the id
						var studentID = record.name.firstName + record.name.lastName;
						var user = pickups.find(e => e._id == studentID);
						days.forEach(function(day){
							if (day != ""){							
								var dayFound = false;
								for(var i=0; i<user.pickup.length; i++){
									if (day == getDate(user.pickup[i].date)){
										dayFound = true;
										fields.push(user.pickup[i].time);
										fields.push(user.pickup[i].driver);
										break;
									}
								}
								if (!dayFound) {
									fields.push('');
								}
							}
						})
						students += fields.join(',') + '\n';
					})
					saveTextAsFile(students, vm.client + "_attendance_" + getDateStr($scope.fromDate) + '-' + getDateStr($scope.toDate) + ".csv");
				})
			})
		}
		
		$scope.exportVideos = function(){
			videoService.getRecords(vm.client)
			.then(function(res){
				var rec = '';
				var recHeader = ["Teacher ID", "Grade", "Subject", "Chapter", "Lesson", "Desc", "Expire", "URL"];
				rec += recHeader.join(',') + '\n';
				res.data.data.forEach(function(record){
					var fields = [record.teacherID,
						record.grade,
						record.subject,
						record.chapter,
						record.lesson,
						record.description,
//						'"' + record.description + '"',
						date2Str(record.expire),
						record.url
						]
					rec += fields.join(',') + '\n';
				})
				saveTextAsFile(rec, vm.client + "_videos_" + getDateStr(new Date()) + ".csv");
			})
		}

		$scope.exportWorkbooks = function(){
			workbookService.getWorkbookRecords(vm.client)
			.then(function(res){
				var rec = '';
				var recHeader = ["Teacher ID", "Grade", "Subject", "Chapter", "Lesson", "Desc",
					"Student Pen", "Teacher Pen 1", "Teacher Pen 2", "Due", "Expire", "PDF file"];
				rec += recHeader.join(',') + '\n';
				res.data.data.forEach(function(record){
					var filename = record.grade + '_Grade_' + record.subject + '_ch_' + record.chapter + '_' + record.lesson + '.pdf';
					var fields = [record.teacherID,
						record.grade,
						record.subject,
						record.chapter,
						record.lesson,
//						record.description,
						'"' + record.description + '"',
						record.studentPenColor,
						record.teacherPenColor[0],
						record.teacherPenColor[1],
						date2Str(record.due),
						date2Str(record.expire),
						filename
						]
					rec += fields.join(',') + '\n';
					
					var base64String = record.pdfStr;
					var binaryImg = atob(base64String);
					var binaryImgLength = binaryImg.length;
					var arrayBuffer = new ArrayBuffer(binaryImgLength);
					var uInt8Array = new Uint8Array(arrayBuffer);
					for (var i=0; i<binaryImgLength; i++){
						uInt8Array[i] = binaryImg.charCodeAt(i);
					}
					var outputBlob = new Blob([uInt8Array], {type: 'application/pdf'});
					// https://stackoverflow.com/questions/21628378/how-to-display-blob-pdf-in-an-angularjs-app
					pdfUrl = window.URL.createObjectURL(outputBlob);
					$scope.content = $sce.trustAsResourceUrl(pdfUrl);
					var a = document.createElement('a')
					a.href = pdfUrl
					a.download = filename;
					a.click();
				})
				saveTextAsFile(rec, vm.client + "_workbooks_" + getDateStr(new Date()) + ".csv");
			})
		}
	}

	angular
	.module('asgApp')
	.controller('exportCtrl', exportCtrl)
})();