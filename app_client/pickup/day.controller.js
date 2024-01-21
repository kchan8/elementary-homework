(function(){
	
	function getTime(strTime){
		if (strTime == undefined)
			return {
				hour: 0,
				minute: 0
			}
		var regex = /(\d+):(\d+)\s*(\w+)/;
		var token = regex.exec(strTime)
		if (token == '' || token.length < 4)
			return {
				hour: 0,
				minute: 0
			}
		var hour = parseInt(token[1])
		// if hour is 12 and not PM, then hour is 0
		if (hour == 12 && token[3].toLowerCase() == "am"){
			console.log('detect 12:00am')
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

	function pickupAllCtrl($scope, $uibModal, $window, authentication){
		var vm = this;
		var dayMS = 60 * 60 * 24 * 1000;
		function setDates(start_date, end_date){
			if (start_date == null){			
				$scope.startDate = new Date();
				// always display 5 days
				if ($scope.startDate.getDay() != 1) {
					$scope.startDate.setDate($scope.startDate.getDate() - $scope.startDate.getDay() + 1);
				}
			}
			if (end_date == null){				
				$scope.endDate = new Date($scope.startDate.getTime())
				var numDays = 6 - $scope.startDate.getDay()
				// end date is Friday
				$scope.endDate.setDate($scope.endDate.getDate() + numDays - 1)
			}
			
			$scope.displayDays = []
			for (var i=$scope.startDate.getDay(), j=0; i<=$scope.endDate.getDay(); i++, j++){
				$scope.weekDate = new Date()
				// Warning - setDate will keep the same MONTH!!! use set/getTime
//				$scope.weekDate.setDate($scope.startDate.getDate() + j)
				$scope.weekDate.setTime($scope.startDate.getTime() + j * dayMS);
				// index: 0 is Monday... 4 is Friday, used to access user.pickup
				$scope.displayDays.push({index: i-1, weekday: $scope.days[i], date: $scope.weekDate})
			}
			
			// read user database, read pickup database, NO need to consider bell schedule
			authentication.getAllStudents()
			.then(function(res){
				$scope.students = res;
				angular.forEach($scope.students, function(student){
					// deep copy, otherwise share same reference
					student.pickupSave = JSON.parse(JSON.stringify(student.pickup));
				})
				authentication.getAllPickup($scope.startDate, $scope.endDate)
				.then(function(res){
//					console.log("Pickup data: " + JSON.stringify(res))
					// can't use pickup data to loop, if date is updated, then not every box will be updated
					res.forEach(function(entry){
						var pickupDate = new Date(entry.date);
						var weekday = pickupDate.getDay() - 1;
						for (i=0; i<$scope.students.length; i++){
							if (entry.studentID == $scope.students[i].name.firstName + $scope.students[i].name.lastName){
//								vm.students[i].pickup[weekday].pickup = pickupDate.toLocaleTimeString('en-US',
//									{hour:'2-digit', minute:'2-digit', hour12: true})
								$scope.students[i].pickup[weekday].pickup = entry.timeStr;
								$scope.students[i].pickup[weekday].driver = entry.driverID;
							}
						}
					})
					updateCount();
				})
			})
		}
		function updateCount(){
			angular.forEach($scope.displayDays, function(day){
				day.count = 0;
				angular.forEach($scope.students, function(student){
					if (student.pickup[day.index].pickup != '' || student.pickup[day.index].driver != ''){
						day.count++;
					}
				})
			})
		}
		
		$scope.days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		
		$scope.format = 'MM/d/yy'
			$scope.today = new Date();
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
		}
		$scope.endDateUpdated = function(){
			setDates($scope.startDate, $scope.endDate);
		}
		$scope.update = function(){
			var pickups = [];
			angular.forEach($scope.displayDays, function(day){
				// set school schedule to regular if not set yet, use create
//				anthentication.createSchedule(day.date, 'All', 'Regulsr');
				angular.forEach($scope.students, function(student){
					pickups.push({studentID: student.name.firstName + student.name.lastName,
						school: student.school,
						timeStr: student.pickup[day.index].pickup,
						date: new Date(day.date),
						driverID: student.pickup[day.index].driver});
				})
			})
			authentication.updatePickup(pickups);
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
			authentication.updatePickup(pickups);
		}
		// copy historical week assignment to current week
		$scope.copyFromWeek = function(week){
			var startDate = new Date($scope.displayDays[0].date)
			startDate.setHours(0); startDate.setMinutes(0); startDate.setSeconds(0);
			startDate.setTime(startDate.getTime() - 7 * dayMS * week)
			var endDate = new Date($scope.displayDays.slice(-1)[0].date)
			endDate.setHours(23); endDate.setMinutes(59); endDate.setSeconds(59);
			endDate.setTime(endDate.getTime() - 7 * dayMS * week)
			authentication.getAllPickup(startDate, endDate)
			.then(function(res){
				res.forEach(function(entry){
					var pickupDate = new Date(entry.date);
					var weekday = pickupDate.getDay() - 1;
					for (i=0; i<$scope.students.length; i++){
						if (entry.studentID == $scope.students[i].name.firstName + $scope.students[i].name.lastName){
							$scope.students[i].pickup[weekday].pickup = entry.timeStr;
							$scope.students[i].pickup[weekday].driver = entry.driverID;
						}
					}
				})
				$scope.update();
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
			authentication.getAllDistricts()
			.then(function(res){
				var districts = res;
				// get the schedule in database
				authentication.getSchedule(date)
				.then(function(res){
					var schedules = []
					if (res.length != 0){
						console.log("Find record")
						schedules = res.schedules;
					} else {
						console.log("New record")
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
		function compareDate(date1, date2){
			return date1.getMonth() == date2.getMonth() &&
				   date1.getDay() == date2.getDay() &&
				   date1.getYear() == date2.getYear()
		}
		$scope.report = function(){
			var report = [];	// driver:, task:[{date: pickup:[{time, school, [student]}]}]
			var driver, pickupDate, pickupTime, school, name;
			var foundDriver, foundTask, foundPickup;
			angular.forEach($scope.displayDays, function(day){
				angular.forEach($scope.students, function(student){
					if (student.pickup[day.index].pickup != '' ||
						student.pickup[day.index].driver != ''
						){
						driver = student.pickup[day.index].driver;
						pickupDate = new Date(day.date)
						pickupTime = student.pickup[day.index].pickup;
						school = student.school
						name = student.name.firstName + " " + student.name.lastName
						
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
											if (driver == "Keith"){
												console.log("pickup push")
											}
											report[i].task[j].pickup.push({time: pickupTime,
																		   school: school,
																		   students: [name]})
										}
									}								
								}
								if (!foundTask){
									if (driver == "Keith"){
										console.log("task push")
									}
									report[i].task.push({date: pickupDate,
														 pickup:[{time: pickupTime,
															 	  school: school,
															 	  students: [name]}]})
								}
							}
						}
						if (!foundDriver){
							report.push({driver: driver, 
								task:[{date: pickupDate,
										pickup:[{time: pickupTime,
												 school: school,
												 students: [name]}]
								}]
							})
						}
					}
				})
			})
			console.log(report)
		}
		
		$scope.getColor = function(driver){
			for(var i=0; i<vm.drivers.length; i++){
				if (vm.drivers[i].name == driver){
					return vm.drivers[i].color;
				}
			}
		}

		// function code start here
		authentication.getDrivers()
		.then(function(res){
			vm.drivers = [];
			vm.drivers.push({name:'', color:"#ffffff"});
			vm.drivers.push({name:'Self', color:"#eeeeee"});
			angular.forEach(res, function(user){
				vm.drivers.push({name:user.name.firstName, color:user.backgroundColor});
			})
			setDates(null, null);
			updateCount();
		})
	}
	
	function removePickupModalCtrl($scope, $uibModalInstance, authentication, date, students, $window){
		$scope.date = date;
		$scope.cancel = function(){
			$uibModalInstance.close(false);
		}
		$scope.confirm = function(){
			authentication.removePickup(date)
			.then(function(){
				var index = date.getDay() - 1;
				angular.forEach(students, function(student){
					console.log(student.pickup[index].driver);
				});
				$uibModalInstance.close('save');
				$window.location.reload();
			});
		}
	}
	
	function changeScheduleModalCtrl($scope, $uibModalInstance, authentication, date, schedules, note, students, $window){
		$scope.schedules = schedules;
		$scope.cancel = function(){
			$uibModalInstance.close(false);
		}
		$scope.save = function(){
			authentication.updateSchedule(date, schedules, note)
			.then(function(){
				$uibModalInstance.close('save');
				var weekDay = date.getDay() - 1;
				var pickups = [];
				angular.forEach(students, function(student){
					var schedule = schedules.find(o => o.district == student.schoolCity);
					if (schedule.bell == "1"){	// regular
						student.pickup[weekDay].pickup = student.pickupSave[weekDay].pickup;
					} else if (schedule.bell == "2"){ // minimum
						// only if driver is not null
						if (student.pickup[weekDay].driver != ""){								
							student.pickup[weekDay].pickup = student.pickupSave[5].pickup;						
						}
					} else if (schedule.bell == "3"){ // no school
						student.pickup[weekDay].pickup = "";
					}
					pickups.push({studentID: student.name.firstName + student.name.lastName,
						school: student.school,
						timeStr: student.pickup[weekDay].pickup,
						date: new Date(date),
						driverID: student.pickup[weekDay].driver});
				})
//				$scope.update();  	// this is not a function
				authentication.updatePickup(pickups);
			});
		}
	}

	
	angular
	.module('asgApp')
	.controller('pickupAllCtrl', pickupAllCtrl)
	.controller('removePickupModalCtrl', removePickupModalCtrl)
	.controller('changeScheduleModalCtrl', changeScheduleModalCtrl)

})();