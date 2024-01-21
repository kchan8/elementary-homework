(function(){
	// convert from string to hour and minute, null will be converted to 11:59 PM
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
	
	// get hour and minute info to string format
	function time2Str(date){
		var time = new Date(date);
		var hour = time.getHours();
		var minute = time.getMinutes();
		if (hour == 23 && minute == 59)
			return '';
		else if (hour <= 11) 
			return hour + ":" + minute.toLocaleString(undefined, {minimumIntegerDigits:2}) + " AM";
		else if (hour == 12)
			return hour + ":" + minute.toLocaleString(undefined, {minimumIntegerDigits:2}) + " PM";
		else
			return hour - 12 + ":" + minute.toLocaleString(undefined, {minimumIntegerDigits:2}) + " PM";
	}
	
	function getTime(strTime){
		if ((strTime == undefined) || strTime == '')
			return 1440
		var regex = /(\d+):(\d+)\s*(\w+)/;
		var token = regex.exec(strTime)
//		console.log(strTime)
		if (token == '' || token.length < 4)
			return 1440
		var hour = parseInt(token[1])
		// if hour is 12 and not PM, then hour is 0
		if (hour == 12 && token[3].toLowerCase() == "am"){
			console.log('detect 12:00am')
			hour = 0;
		} else if (hour != 12 && token[3].toLowerCase() == "pm") {			
			hour = hour + 12
		}
		var minute = parseInt(token[2])
		return hour * 60 + minute
	}

	// return boolean result
	function cmpDate(date1, date2){
		var date_1 = new Date(date1);
		var date_2 = new Date(date2);
		return (date_1.toISOString().slice(0,10) == date_2.toISOString().slice(0,10))
	}
	
	function isValid(obj){
		return (obj !== undefined && obj !== null && obj !== "")
	}
	
	function getNoteLines(string, width){
		if (!isValid(string))
			return 2;
		if (string.indexOf('\n') !== -1){
			var lines = string.split('\n');
			var count = 0;
			for(var i=0; i<lines.length; i++){
				count += Math.ceil(lines[i].length / width)
			}
			return count
		} else {
			return Math.ceil(string.length / width);
		}
	}
	
	function to24Hour(string){
		if (string == null || string == '')
			return '';
		var time = str2Time(string);
		var hh = time.hour.toString();
		if (time.hour < 10){
			hh = '0' + hh;
		}
		var mm = time.minute.toString();
		if (time.minute < 10){
			mm = '0' + mm;
		}
		return hh + ':' + mm;
	}
	
	function getDateStr(date){
		var day = new Date(date);
		var mm = day.getMonth() + 1;
		if (mm < 10) mm = '0' + mm;
		var dd = day.getDate();
		if (dd < 10) dd = '0' + dd;
		var yy = day.getFullYear().toString().slice(2);
		return mm.toString() + dd.toString() + yy;
	}
	
	function showDate(date){
		var day = new Date(date);
		var mm = day.getMonth() + 1;
		var dd = day.getDate();
		var yy = day.getFullYear().toString().slice(2);
		return mm.toString() + '/' + dd.toString() + '/' + yy;
	}
	
	function pickupAllCtrl($routeParams, $scope, $uibModal, $window, $localStorage, $sessionStorage, authentication, $location){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();

		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/')
		})
		
		vm.drivers = [];
		var dayMS = 60 * 60 * 24 * 1000;
		$scope.disableSave = true;
		$scope.disablePDF = true;
		
		// https://stackoverflow.com/questions/48182912/how-to-detect-browser-with-angular
//		$scope.isNotFirefox = function(){
//			return !(typeof InstallTrigger !== 'undefined');
//		}
		
		function setDates(start_date, end_date){
			// determine start and end date, if null then use today as start till Friday
			if (angular.isUndefined(start_date) || start_date == null){
//				console.log("change start date")
				$scope.startDate = new Date();
				$scope.startDate.setHours(0);
				$scope.startDate.setMinutes(0);
				$scope.startDate.setSeconds(0);
				// always display 5 days
				if ($scope.startDate.getDay() == 6){
					$scope.startDate.setTime($scope.startDate.getTime() + 2 * dayMS);
				} else if ($scope.startDate.getDay() == 0){
					$scope.startDate.setTime($scope.startDate.getTime() + 1 * dayMS);					
				} 
				// this will display from Monday all the time
//				else if ($scope.startDate.getDay() != 1) {
//					$scope.startDate.setTime($scope.startDate.getTime() - ($scope.startDate.getDay() - 1) * dayMS);
//				}
//				console.log("Start " +$scope.startDate)
				
			} else {
				$scope.startDate = new Date(start_date);
			}
			if (end_date == undefined || end_date == null){				
				$scope.endDate = new Date($scope.startDate.getTime())
				$scope.endDate.setHours(23);
				$scope.endDate.setMinutes(59);
				$scope.endDate.setSeconds(59);
				// show 5 days
				var numDays = 6 - $scope.startDate.getDay()
				// end date is Friday
				$scope.endDate.setTime($scope.endDate.getTime() + (numDays - 1) * dayMS)
//				console.log("End " +$scope.endDate)
				$localStorage.end_date = $scope.endDate;
			} else {
				$scope.endDate = new Date(end_date);
			}
			
			// fill the date info - 
			$scope.displayDays = [];
			$scope.dayNote = [];
			$scope.noteRow = Array(5).fill(2);	// set default 2 rows
			$scope.weekNote = "";
			for (var i=$scope.startDate.getDay(), j=0; i<=$scope.endDate.getDay(); i++, j++){
				$scope.weekDate = new Date();
				// Warning - setDate will keep the same MONTH!!! use set/getTime
//				$scope.weekDate.setDate($scope.startDate.getDate() + j)
				$scope.weekDate.setTime($scope.startDate.getTime() + j * dayMS);
				$scope.weekDate.setHours(12);
				$scope.weekDate.setMinutes(0);
				$scope.weekDate.setSeconds(0);
				// index: 0 is Monday... 4 is Friday, used to access user.pickup
				$scope.displayDays.push({index: i-1, weekday: $scope.days[i], date: $scope.weekDate});
				$scope.dayNote.push("");
				$scope.noteRow.push(2);
			}
			// read from schedule, display notes
			var rangeStart = new Date($scope.displayDays[0].date);
			rangeStart.setHours(0);
			rangeStart.setMinutes(0);
			rangeStart.setSeconds(0);
			var rangeEnd = new Date($scope.displayDays.slice(-1)[0].date);
			rangeEnd.setHours(23);
			rangeEnd.setMinutes(59);
			rangeEnd.setSeconds(59);
			// get the note per display day
			authentication.getSchedule(vm.client, rangeStart, rangeEnd)
			.then(function(res){
				var dayPtr;
				if (isValid(res)){					
					res.forEach(function(bell){
						// get the note
						dayPtr = $scope.displayDays.find(o => cmpDate(o.date, bell.date));
						$scope.dayNote[dayPtr.index] = bell.note;
						$scope.noteRow[dayPtr.index] = getNoteLines(bell.note, 22);
					})
					$scope.weekNote = res[0].week_note;
					$scope.noteWeek = getNoteLines(res[0].week_note, 30);
				}
				// get calendar and find min/no/close days
				authentication.getCalendar(vm.client)
				.then(function(res){
				
				})
			})
			
			// read user database, read pickup database, NO need to consider bell schedule
			authentication.getAllPickupStudents(vm.client, $scope.startDate, $scope.endDate)
			.then(function(res){
				$scope.students = res;
				angular.forEach($scope.students, function(student){
					// deep copy, otherwise share same reference
					student.pickupSave = JSON.parse(JSON.stringify(student.pickup));
				})
				authentication.getPickups(vm.client, $scope.startDate, $scope.endDate)
				.then(function(res){
//					console.log(res);
//					$scope.msg = res.length + " " + $scope.startDate.getTimezoneOffset() + " " + JSON.stringify(res);
					// can't use pickup data to loop, if date is updated, then not every box will be updated
					res.forEach(function(entry){
//						console.log(entry.date + " | " + entry.timeStr + " | " + entry.studentID + " | " + entry.driverID)
						var pickupDate = new Date(entry.date);
						var weekday = pickupDate.getDay() - 1;
						entryFound = false;
						for (i=0; i<$scope.students.length; i++){
							if (entry.studentID == $scope.students[i].name.firstName + $scope.students[i].name.lastName){
								entryFound = true;
								$scope.students[i].pickup[weekday].pickup = time2Str(entry.date);
								$scope.students[i].pickup[weekday].driver = entry.driverID;
//								console.log(entry.studentID + ' ' + time2Str(entry.date) + ' ' + entry.driverID)
							}
						}
						// remove this pickup entry as it can't match any student
						// ONLY do it for viewing all students
						if (!entryFound){
							console.log("Entry remove: " + entry.studentID + " " + entry.driverID)
							authentication.removeOnePickup(vm.client, entry._id)
						}
					})
					// default sort students based on district, school, grade, first name
					// sort students based on time, then school
//					$scope.students.sort(function(a,b){
//						index = $scope.displayDays[0].index
//						if (getTime(a.pickup[index].pickup) > getTime(b.pickup[index].pickup)){
//							return 1;
//						} else if (getTime(a.pickup[index].pickup) < getTime(b.pickup[index].pickup)){
//							return -1;
//						} else {
//							// sort name in ascending order
//							if (a.pickup[index].driver == null ||
//								a.pickup[index].driver == undefined ||
//								a.pickup[index].driver == "") {
//								return 1
//							} else if (b.pickup[index].driver == null ||
//									b.pickup[index].driver == undefined ||
//									b.pickup[index].driver == "") {
//								return -1
//							}
//							return a.pickup[index].driver.localeCompare(b.pickup[index].driver)
//						}
//					})
					$scope.students.sort(function(a,b){
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
					updateCount();
					$scope.disableSave = false;
					$scope.disablePDF = false;
				})
			})
		}
		function updateCount(){
			angular.forEach($scope.displayDays, function(day){
				day.count = 0;
				angular.forEach($scope.students, function(student){
					if (student.pickup[day.index].pickup != ''){
						day.count++;
					}
				})
			})
		}
		
		$scope.isAdmin = function(){
			return authentication.isAdmin(vm.client);
		};
		
		$scope.days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		
		$scope.format = 'M/d/yy'
		$scope.popup1 = {
			opened: false
		}
		$scope.popup2 = {
			opened: false
		}
		$scope.open1 = function(){
			$scope.popup1.opened = true
		}
		$scope.open2 = function(){
			$scope.popup2.opened = true
		}
		$scope.startDateUpdated = function(){
			// change date to future or it is greater than 5 days 
			if ($scope.startDate > $scope.endDate || ($scope.endDate.getTime() - $scope.startDate.getTime()) / (60 * 60* 24 * 1000) > 5){
				setDates($scope.startDate, null);
			} else { 
				setDates($scope.startDate, $scope.endDate);
			}
			$localStorage.start_date = $scope.startDate;
		}
		$scope.endDateUpdated = function(){
			setDates($scope.startDate, $scope.endDate);
			$localStorage.end_date = $scope.endDate;
		}
		$scope.autoExpand = function(index) {
			$scope.noteRow[index] = getNoteLines($scope.dayNote[index], 22);
	    };
	    $scope.autoExpandWeekNote = function() {
			$scope.noteRow[index] = getNoteLines($scope.weekNote, 30);
	    };
		
		$scope.getSchoolDistrict = function(district){
			return district.replace(/ /, '-');
		}
		
		$scope.update = function(){
			$scope.disableSave = true;
			var pickups = [];
			var rangeStart;
			var rangeEnd;
			angular.forEach($scope.displayDays, function(day){
				// set school schedule to regular if not set yet, use create
//				anthentication.createSchedule(day.date, 'All', 'Regulsr');
				angular.forEach($scope.students, function(student){
					var pickupTime = new Date(day.date);
					pickupTime.setHours(str2Time(student.pickup[day.index].pickup).hour);
					pickupTime.setMinutes(str2Time(student.pickup[day.index].pickup).minute);
					pickupTime.setSeconds(0);
					// server date may have different time zone, set range for local time
					rangeStart = new Date(day.date);
					rangeStart.setHours(0);
					rangeStart.setMinutes(0);
					rangeStart.setSeconds(0);
					rangeEnd = new Date(day.date);
					rangeEnd.setHours(23);
					rangeEnd.setMinutes(59);
					rangeEnd.setSeconds(59);
					var modTimeStr = student.pickup[day.index].pickup;
					if (student.pickup[day.index].driver == ""){
						modTimeStr = "";
					}
					// may add the student ID to DB
					pickups.push({studentID: student.name.firstName + student.name.lastName,
						school: student.school,
						timeStr: modTimeStr,
						date: pickupTime,
						rangeStart: rangeStart,
						rangeEnd: rangeEnd,
						driverID: student.pickup[day.index].driver});
				})
			})
			var displayRecords = $scope.displayDays.length * $scope.students.length;
			if (pickups.length != displayRecords){
				console.log("Update count incorrect, expected to get " + displayRecords + " got only " + pickups.length);
			}
			authentication.updatePickup(vm.client, pickups)
			.then(function(res){
//				console.log("res: " + JSON.stringify(res))
				$scope.disableSave = false;
			});
			
			// todo: add logic that detect if there is note change
			if ($scope.dayNote.length != 0){				
				if ($scope.dayNote.length != $scope.displayDays.length){
					var extraField = $scope.displayDays.length - $scope.dayNote.length;
					for (var i=0; i < extraField; i++){
						$scope.dayNote.push("")
					}
				}
				rangeStart = new Date($scope.displayDays[0].date);
				rangeStart.setHours(0);
				rangeStart.setMinutes(0);
				rangeStart.setSeconds(0);
				rangeEnd = new Date($scope.displayDays.slice(-1)[0].date);
				rangeEnd.setHours(23);
				rangeEnd.setMinutes(59);
				rangeEnd.setSeconds(59);
//				var range = {rangeStart: rangeStart, rangeEnd: rangeEnd};
				authentication.getSchedule(vm.client, rangeStart, rangeEnd)
				.then(function(bells){
					authentication.getAllDistricts(vm.client)
					.then(function(districts){
						var scheduleDB = []
						angular.forEach($scope.displayDays, function(day){
							// check if bells have the record
							if (bells != undefined && bells != null && bells != "" &&
								(rec = bells.find(o => cmpDate(o.date, day.date)))){
								scheduleDB.push({date: day.date, schedules:rec.schedules, note: $scope.dayNote[day.index], week_note:$scope.weekNote})
							} else {									
								schedules = []
								districts.forEach(function(district){
									schedules.push({district: district._id, bell:"1"})
								})
								scheduleDB.push({date: day.date, schedules:schedules, note: $scope.dayNote[day.index], week_note:$scope.weekNote})
							}
						})
						authentication.updateSchedule(vm.client, rangeStart, rangeEnd, scheduleDB);
					})
				})
			}
		}
		// copy current week assignment to week in the future
		$scope.copyToWeek = function(week){
			var pickups = [];
			angular.forEach($scope.displayDays, function(day){
				var nextWeek = new Date(day.date);
				nextWeek.setTime(nextWeek.getTime() + 7 * dayMS * week);
				console.log(nextWeek.getDate())
				angular.forEach($scope.students, function(student){
					pickups.push({studentID: student.name.firstName + student.name.lastName,
						school: student.school,
						timeStr: student.pickup[day.index].pickup,
						date: new Date(nextWeek),
						driverID: student.pickup[day.index].driver});
				})
//				console.log(pickups)
			})
			authentication.updatePickup(vm.client, pickups);
		}
		// copy historical week assignment to current week
		$scope.copyFromWeek = function(week){
			var startDate = new Date($scope.displayDays[0].date)
			startDate.setHours(0); startDate.setMinutes(0); startDate.setSeconds(0);
			startDate.setTime(startDate.getTime() - 7 * dayMS * week)
			var endDate = new Date($scope.displayDays.slice(-1)[0].date)
			endDate.setHours(23); endDate.setMinutes(59); endDate.setSeconds(59);
			endDate.setTime(endDate.getTime() - 7 * dayMS * week)
			var message = "Going to copy pickup schedule from " + week + " week before?";
			$uibModal.open({
				templateUrl: './pickup/copyPickup.modal.html',
				controller: 'copyPickupModalCtrl',
				size: 'md',
				resolve: {
					client: function(){
						return vm.client;
					},
					msg: function(){
						return message;
					},
					startDate: function(){
						return startDate;
					},
					endDate: function(){
						return endDate;
					},
					students: function(){
						return $scope.students;
					}
				}
			}).result.then(function(){
				// https://stackoverflow.com/questions/30356844/angularjs-bootstrap-modal-closing-call-when-clicking-outside-esc
				// 1st function is doClosure
				// 2nd function is doDismiss
//				$window.location.reload();
			}, function(res){
				// this takes care of unhandled rejection backdrop click & escape
				if (['backdrop click', 'escape key press'].indexOf(res) === -1){
					throw res;
				}
			})
		}
		
		$scope.remove = function(date){
//			console.log($scope.students)
			$scope.date = date;
			$uibModal.open({
				templateUrl: './pickup/removePickup.modal.html',
				controller: 'removePickupModalCtrl',
				size: 'lg',
				resolve: {
					date: function(){
						return date;
					},
					students: function(){
						return $scope.students;
					}
				}
			}).result.then(function(){
				// https://stackoverflow.com/questions/30356844/angularjs-bootstrap-modal-closing-call-when-clicking-outside-esc
				// 1st function is doClosure
				// 2nd function is doDismiss
//				$window.location.reload();
			}, function(res){
				// this takes care of unhandled rejection backdrop click & escape
				if (['backdrop click', 'escape key press'].indexOf(res) === -1){
					throw res;
				}
			});			
		}
		$scope.changeSchedule = function(date){
			// get all districts
//			return
			authentication.getAllDistricts(vm.client)
			.then(function(res){
				var districts = res;
				// get the schedule in database
				var rangeStart = new Date(date);
				rangeStart.setHours(0);
				rangeStart.setMinutes(0);
				rangeStart.setSeconds(0);
				var rangeEnd = new Date(date);
				rangeEnd.setHours(23);
				rangeEnd.setMinutes(59);
				rangeEnd.setSeconds(59);
//				var range = {rangeStart: rangeStart, rangeEnd: rangeEnd};
				authentication.getSchedule(vm.client, rangeStart, rangeEnd)
				.then(function(res){
					console.log(res)
					var schedules = []
					if (res.length != 0){
						schedules = res[0].schedules;
					} else {
						districts.forEach(function(district){
							schedules.push({district: district._id, bell:"1"})
						})
					}

					var note = "";
					$uibModal.open({
						templateUrl: './pickup/changeSchedule.modal.html',
						controller: 'changeScheduleModalCtrl',
						size: 'md',
						resolve: {
							client: function(){
								return vm.client;
							},
							date: function(){
								return date;
							},
							schedules: function(){
								return schedules;
							},
							note: function(){
								return note;
							},
							students: function(){
								return $scope.students;
							}
						}
					}).result.then(function(){
						// https://stackoverflow.com/questions/30356844/angularjs-bootstrap-modal-closing-call-when-clicking-outside-esc
						// 1st function is doClosure
						// 2nd function is doDismiss
					}, function(res){
						// this takes care of unhandled rejection backdrop click & escape
						if (['backdrop click', 'escape key press'].indexOf(res) === -1){
							throw res;
						}
					});
				})
			})
		}
		
		$scope.drivers = function(){
			report = genReport();
			drivers = vm.drivers.slice(1);
			// show drivers that are in the report
			removeList = [];
			angular.forEach(drivers, function(driver){
				if (report.find(o => o.driver === driver.name) == undefined){
					removeList.push(driver)
				}
			})
//			console.log("Remove: " + JSON.stringify(removeList))
			angular.forEach(removeList, function(entry){
				var index = drivers.map(function(item){
					return item.name
				}).indexOf(entry.name)
				drivers.splice(index, 1);
			})
			drivers.push({name:'ALL', color:"#dddddd"})
			$uibModal.open({
				templateUrl: './pickup/driver.modal.html',
				controller: 'driverModalCtrl',
				size: 'md',
				resolve: {
					drivers: function(){
						return drivers;
					},
					client: function(){
						return vm.client;
					},
					report: function(){
						return report;
					}
				}
			}).result.then(function(){
				// https://stackoverflow.com/questions/30356844/angularjs-bootstrap-modal-closing-call-when-clicking-outside-esc
				// 1st function is doClosure
				// 2nd function is doDismiss
			}, function(res){
				// this takes care of unhandled rejection backdrop click & escape
				if (['backdrop click', 'escape key press'].indexOf(res) === -1){
					throw res;
				}
			});
		}
		
		function getImgFromUrl(logo_url, callback){
			var img = new Image();
			img.src = logo_url;
			img.onload = function(){
				console.log(img)
				callback(img);
			}
		}
		
		function createPDFgrid(){
			var doc = new jsPDF('p', 'pt', 'a4');
			for (var x = 1; x < 552; x += 50){
				for (var y = 1; y < 802; y += 50){					
					doc.rect(x, y, 2, 2);
				}
			}
			doc.save("grid.pdf");
		}
		
		function createPDF(img){
			var doc = new jsPDF('p', 'pt', 'a4');
			doc.addImage(img, 'JPEG', 40, 10);
			doc.setFontSize(22);
			doc.setTextColor(0, 255, 0);
			doc.text(450, 140, "Invoice");
			// put table
			var header = ['Date', 'Description', 'Amount'];
			var body = [];
			var line = [];
			line.push('2/28/19')
			line.push('After school program Feb 2019')
			line.push('$500.00');
			body.push(line);

			doc.autoTable({
				styles: {fontSize: 12},
				startX: 10,
				startY: 150,
				columnStyles: {
					0: {cellWidth: 25},		// date
					1: {cellWidth: 240},	// description
					2: {cellWidth: 25},		// amount
				
					
				},
				head: [header],
				body: body
			})
			
			
			//----------------------------------------------
			addFooter(doc);
			doc.save('invoice.pdf')
		}
		
		function addFooter(doc){
			// footer
			var pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
			var pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
			doc.setLineWidth(1);
			doc.setDrawColor(255, 0, 0);
			doc.line(30, 780, 560, 780);
			doc.setFont("helvetica");
			doc.setFontType("bold");
			doc.setFontSize(12);
			doc.setTextColor(0, 0, 0);
//			doc.text(50, 800, 'Crosspoint Church - Pleasanton Campus : 5627 Gibraltar Drive, Pleasanton, CA 94588');
//			doc.text(50, 815, 'BeCrosspoint.org/JoyfulKidsClub/        jkc@crosspointchurchsv.org        510-366-0602');
			doc.text('Crosspoint Church - Pleasanton Campus : 5627 Gibraltar Drive, Pleasanton, CA 94588', pageWidth / 2, 800, 'center');
			doc.text('BeCrosspoint.org/JoyfulKidsClub/        jkc@crosspointchurchsv.org        510-366-0602', pageWidth / 2, 815, 'center');
			doc.save('output.pdf');
		}
		
		$scope.htmlPDF_1 = function(){
			// header image
			// get from: http://dataurl.net/#dataurlmaker
//			var headerLogo = 'data:image/jpeg;base64,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';
//			getImgFromUrl('/JKC_logo.jpeg', createPDF);
			createPDFgrid();
		}
		
		// http://mesonet.org/scripts/okfire/node_modules/jspdf-autotable/README.md
		$scope.htmlPDF = function(){
//			const color = {'Dublin': '#29A13D', 'Pleasanton': '#ff0000', 'Livermore': '#0000ff', 'San Ramon': '#bb33ff'};
			var header = ['#', 'Name', 'gr', 'School'];
			$scope.displayDays.forEach(function(day){
				header.push(day.weekday + " - " + (day.date.getMonth() + 1) + '/' + day.date.getDate() + ' (' + day.count + ')')
			});
			var body = [];
			var line = [];
			line.push({content: $scope.weekNote, colSpan: 4, styles: {textColor: '#ff0000'}});
			$scope.displayDays.forEach(function(day){
				line.push({content: $scope.dayNote[day.index], styles: {textColor: '#ff0000'}})
			})
			body.push(line);
			var count = 1;
			$scope.students.forEach(function(student){
				var entry = [];
				var gradeColor = window.getComputedStyle(document.querySelector('.Grade-' + student.grade)).backgroundColor
				var element = document.querySelector('.' + student.schoolCity.replace(' ', '-'));
				var schoolColor = window.getComputedStyle(element).color
				entry.push(count++);
				var nameBackground = student.gender == 'Male' ? '#d9e7ff' : '#ffdad9';
				entry.push({content: student.name.firstName, styles: {fillColor: nameBackground}});
				entry.push({content: student.grade, styles: {fillColor: gradeColor}});
//				entry.push({content: student.school, styles: {textColor: color[student.schoolCity]}});
				entry.push({content: student.school, styles: {textColor: schoolColor}});
				// for debugging PDF output
//				console.log('Student: ' + student.name.firstName + ' ' )
				$scope.displayDays.forEach(function(day){
					if (student.pickup[day.date.getDay()-1].pickup != '' ||
						student.pickup[day.date.getDay()-1].driver != ''){
//						console.log(student.pickup[day.date.getDay()-1].pickup)
//						console.log(student.pickup[day.date.getDay()-1].driver + ' ' + student.pickup[day.date.getDay()-1].driver.length)
						try {							
							if (student.pickup[day.date.getDay()-1].driver == '' || student.pickup[day.date.getDay()-1].driver == 'Nothing')
								entry.push({content: to24Hour(student.pickup[day.date.getDay()-1].pickup)});
							else 
								entry.push({content: to24Hour(student.pickup[day.date.getDay()-1].pickup) + ' ' + student.pickup[day.date.getDay()-1].driver, 
									styles: {fillColor: vm.drivers.find(o => o.name == student.pickup[day.date.getDay()-1].driver).color}});
						} catch (e){
							if (e instanceof TypeError){
								console.log(day.weekday + ': Student: ' + student.name.firstName)
							}
						}
					} else {
						entry.push({content: '', styles: {fillColor: '#bfbfbf'}});
					}
				})
				body.push(entry);
			});
			var doc = new jsPDF('p', 'pt', 'a4');
			var pageHeader = vm.client.toUpperCase() + " Pickup Schedule: " + showDate($scope.startDate) + ' to ' + showDate($scope.endDate);
			doc.autoTable({
				styles: {fontSize: 8},
				theme: 'grid',
				startY: 50,
				beforePageContent: function(data){
					doc.text(pageHeader, 40, 40);
				},
				columnStyles: {
					0: {cellWidth: 20},		// #
					1: {cellWidth: 50},		// first name
					2: {cellWidth: 25},		// grade
					3: {cellWidth: 65},		// school
					4: {cellWidth: 70},
					5: {cellWidth: 70},
					6: {cellWidth: 70},
					7: {cellWidth: 70},
					8: {cellWidth: 70}
				},
				head: [header],
				body: body
			})
	    	doc.save(vm.client.toUpperCase() + ' Pickup Schedule ' + getDateStr($scope.startDate) + ' to ' + getDateStr($scope.endDate) + '.pdf')
		}
		
		function compareDate(date1, date2){
			return date1.getMonth() == date2.getMonth() &&
				   date1.getDay() == date2.getDay() &&
				   date1.getFullYear() == date2.getFullYear()
		}
		
		function genReport(){
			var report = [];	// driver:, id:, task:[{date: pickup:[{time:, school:, students:[]}]}]
			var driver, pickupDate, pickupTime, school, name;
			var foundDriver, foundTask, foundPickup;
			angular.forEach($scope.displayDays, function(day){
				angular.forEach($scope.students, function(student){
					if (student.pickup[day.index].pickup != '' ||
						student.pickup[day.index].driver != ''
						){
						driver = student.pickup[day.index].driver;
						pickupTime = student.pickup[day.index].pickup;
						pickupDate = new Date(day.date)
						pickupDate.setHours(str2Time(pickupTime).hour)
						pickupDate.setMinutes(str2Time(pickupTime).minute)
						school = student.school
//						name = student.name.firstName + " " + student.name.lastName
						name = student.name.firstName
						
						foundDriver = false;
						foundTask = false;
						foundPickup = false
						for(var i=0; i<report.length; i++){
							if (report[i].driver == driver){
								foundDriver = true
								for(var j=0; j<report[i].task.length; j++){
									if (compareDate(report[i].task[j].date, pickupDate)){
										foundTask = true
										for(var k=0; k<report[i].task[j].pickup.length; k++){
											if (report[i].task[j].pickup[k].time == pickupTime &&
												report[i].task[j].pickup[k].school == school){
												foundPickup = true
												report[i].task[j].pickup[k].students.push(name)
											}
										}
										if (!foundPickup){
											report[i].task[j].pickup.push({time: pickupTime,
																		   school: school,
																		   students: [name]})
										}
									}								
								}
								if (!foundTask){
									report[i].task.push({date: pickupDate,
														 pickup:[{time: pickupTime,
															 	  school: school,
															 	  students: [name]}]})
								}
							}
						}
						if (!foundDriver && driver.toLowerCase() !== "self" && driver !== ''){
							// driver field may have unrecognizable content
							try{								
								report.push({driver: driver, id: vm.drivers.find(o => o.name == driver).id,
									task:[{date: pickupDate,
										pickup:[{time: pickupTime,
											school: school,
											students: [name]}]
									}]
								})
							} catch (e){
								if (e instanceof TypeError){
									console.log(day.weekday + ': Student: ' + name + ' Driver: ' + driver)
								}
							}
						}
					}
				})
			})
			// sort the pickup by time
			angular.forEach(report, function(entry){
				angular.forEach(entry.task, function(task){
					task.pickup.sort(function(a,b){
						return getTime(a.time) - getTime(b.time)
					})
				})
			})
			return report;
		}
		
		$scope.getColor = function(driver){
			for(var i=0; i<vm.drivers.length; i++){
				if (vm.drivers[i].name == driver){
					return vm.drivers[i].color;
				}
			}
		}

		// function code start here
		if (!authentication.isAdmin(vm.client)){
			$location.path('/' + vm.client)
		}
		authentication.getDrivers(vm.client)
		.then(function(res){
			vm.drivers.push({name:null, color:"#ffffff"});
			vm.drivers.push({name:'Self', color:"#eeeeee"});
			angular.forEach(res, function(user){
				vm.drivers.push({name:user.name.firstName, id:user._id, color:user.backgroundColor});
			})
			setDates($localStorage.start_date, $localStorage.end_date);
			updateCount();
		})
	}
	
	function driverModalCtrl($scope, $uibModalInstance, authentication, drivers, client, report){
		$scope.drivers = drivers;
		$scope.getReport = function(driver){
			if (driver == "ALL"){
				$scope.report = report
			} else {
				entry = [];
				entry.push(report.find(o => o.driver === driver));
				$scope.report = entry;
			}
		}
		$scope.cancel = function(){
			$uibModalInstance.close(false);
		}
		$scope.send = function(reports){
			angular.forEach(reports, function(report){
				if (report != undefined){
					console.log("Send to " + report.driver)
					authentication.sendReport(client, report)
				}
			})
			$uibModalInstance.close('save');
		}
	}
	
	// todo - add option to distinguish close vs no school
	function removePickupModalCtrl($scope, $uibModalInstance, authentication, date, students, $window){
		$scope.date = date;
		$scope.index = date.getDay() - 1;
		$scope.cancel = function(){
			$uibModalInstance.close(false);
		}
		// No school, students dropped off by parents, no driver assignments
		$scope.noSchool = function(){
			for (i=0; i<students.length; i++){
				students[i].pickup[$scope.index].pickup = '9:00 AM';
				students[i].pickup[$scope.index].driver = 'Self';
			}
			$uibModalInstance.close('save');
		}
		// facility close, remove all pickup time and driver assignment
		$scope.close = function(){	
			for (i=0; i<students.length; i++){
				students[i].pickup[$scope.index].pickup = '';
				students[i].pickup[$scope.index].driver = '';
			}
			$uibModalInstance.close('save');
			
//			authentication.removePickup(date)
//			.then(function(){
//				var index = date.getDay() - 1;
//				angular.forEach(students, function(student){
//					console.log(student.pickup[index].driver);
//				});
//				$uibModalInstance.close('save');
//				$window.location.reload();
//			});
		}
	}
	
	function changeScheduleModalCtrl($scope, $uibModalInstance, authentication, client, date, schedules, note, students, $window){
		$scope.schedules = schedules;
		$scope.cancel = function(){
			$uibModalInstance.close(false);
		}
		$scope.save = function(){
			var rangeStart = new Date(date);
			rangeStart.setHours(0);
			rangeStart.setMinutes(0);
			rangeStart.setSeconds(0);
			var rangeEnd = new Date(date);
			rangeEnd.setHours(23);
			rangeEnd.setMinutes(59);
			rangeEnd.setSeconds(59);
			var scheduleDB = [{date: date, schedules: schedules, note: note}]
			authentication.updateSchedule(client, rangeStart, rangeEnd, scheduleDB)
			.then(function(){
				$uibModalInstance.close('save');
				var weekDay = date.getDay() - 1;
				var pickups = [];
				angular.forEach(students, function(student){
					var schedule = schedules.find(o => o.district == student.schoolCity);
					if (schedule != undefined){						
						if (schedule.bell == "1"){	// regular
							student.pickup[weekDay].pickup = student.pickupSave[weekDay].pickup;
						} else if (schedule.bell == "2"){ // minimum
							// only if driver is not null
							if (student.pickup[weekDay].driver != ""){								
								student.pickup[weekDay].pickup = student.pickupSave[5].pickup;						
							}
						} else if (schedule.bell == "3"){ // no school
							student.pickup[weekDay].pickup = "9:00 AM";
							student.pickup[weekDay].driver = "Self";
						}
						var pickupTime = new Date(date);
						pickupTime.setHours(str2Time(student.pickup[weekDay].pickup).hour);
						pickupTime.setMinutes(str2Time(student.pickup[weekDay].pickup).minute);
						var rangeStart = new Date(date);
						rangeStart.setHours(0);
						rangeStart.setMinutes(0);
						rangeStart.setSeconds(0);
						var rangeEnd = new Date(date);
						rangeEnd.setHours(23);
						rangeEnd.setMinutes(59);
						rangeEnd.setSeconds(59);
						pickups.push({studentID: student.name.firstName + student.name.lastName,
							school: student.school,
							timeStr: student.pickup[weekDay].pickup,
							date: pickupTime,
							rangeStart: rangeStart,
							rangeEnd: rangeEnd,
							driverID: student.pickup[weekDay].driver});
					}
				})
//				authentication.updatePickup(pickups);
			});
		}
	}
	
	function copyPickupModalCtrl($scope, $uibModalInstance, authentication, msg, client, startDate, endDate, students){
		$scope.message = msg;
		$scope.cancel = function(){
			$uibModalInstance.close(false);
		}
		$scope.proceed = function(){
			$uibModalInstance.close('save');
			authentication.getPickups(client, startDate, endDate)
			.then(function(res){
				res.forEach(function(entry){
					var pickupDate = new Date(entry.date);
					var weekday = pickupDate.getDay() - 1;
					for (i=0; i<students.length; i++){
						if (entry.studentID == students[i].name.firstName + students[i].name.lastName){
							if (entry.driverID != ""){
								students[i].pickup[weekday].pickup = entry.timeStr;
								students[i].pickup[weekday].driver = entry.driverID;
							}
						}
					}
				})
			})
		}
	}

	
	angular
	.module('asgApp')
	.controller('pickupAllCtrl', pickupAllCtrl)
	.controller('copyPickupModalCtrl', copyPickupModalCtrl)
	.controller('removePickupModalCtrl', removePickupModalCtrl)
	.controller('changeScheduleModalCtrl', changeScheduleModalCtrl)
	.controller('driverModalCtrl', driverModalCtrl)

})();