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
	
	
	
	function showDate(date){
		var day = new Date(date);
		var mm = day.getMonth() + 1;
		var dd = day.getDate();
		var yy = day.getFullYear().toString().slice(2);
		return mm.toString() + '/' + dd.toString() + '/' + yy;
	}
	
	function pickupChildCtrl($routeParams, $scope, $uibModal, $window, $location, $localStorage, $sessionStorage, authentication){
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
		$scope.host = $location.protocol() + "://" + $location.host() + ":" + $location.port()
		
		$scope.user = authentication.currentUser(vm.client);
		
		function setDates(start_date, end_date){
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
			var range = {rangeStart: rangeStart, rangeEnd: rangeEnd};
			
			// read user database, read pickup database, NO need to consider bell schedule
			childrenID = []
			$scope.user.children.forEach(function(child, index){
				childrenID.push(child.id)
			})
			console.log(childrenID)
			authentication.getStudentsByID(vm.client, $scope.startDate, $scope.endDate, childrenID)
			.then(function(res){
				$scope.students = res;
//				$scope.students = [];
//				angular.forEach(res, function(student){
//					$scope.students.push(student)
//				})
				angular.forEach($scope.students, function(student){
					// deep copy, otherwise share same reference
					student.pickupSave = JSON.parse(JSON.stringify(student.pickup));
				})
				authentication.getTime()
				.then(function(res){
					$scope.msg1 = res;
				})
				authentication.getPickups(vm.client, $scope.startDate, $scope.endDate)
				.then(function(res){
//					console.log(res);
					$scope.msg = res.length + " " + $scope.startDate.getTimezoneOffset() + " " + JSON.stringify(res);
					// can't use pickup data to loop, if date is updated, then not every box will be updated
					res.forEach(function(entry){
//						console.log(entry.date + " | " + entry.timeStr + " | " + entry.studentID + " | " + entry.driverID)
						var pickupDate = new Date(entry.date);
						var weekday = pickupDate.getDay() - 1;
						entryFound = false;
						for (i=0; i<$scope.students.length; i++){
							if (entry.studentID == $scope.students[i].name.firstName + $scope.students[i].name.lastName){
//								$scope.students[i].pickup[weekday].pickup = entry.timeStr;
								entryFound = true;
								$scope.students[i].pickup[weekday].pickup = time2Str(entry.date);
								$scope.students[i].pickup[weekday].driver = entry.driverID;
							}
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
					$scope.disableSave = false;
					$scope.disablePDF = false;
				})
			})
		}
		
		$scope.isAdmin = function(){
			return authentication.isAdmin();
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
		
		$scope.getDateStr = function(date){
			var day = new Date(date);
			var mm = day.getMonth() + 1;
			if (mm < 10) mm = '0' + mm;
			var dd = day.getDate();
			if (dd < 10) dd = '0' + dd;
			var yy = day.getFullYear().toString().slice(2);
			return mm.toString() + dd.toString() + yy;
		}
		
		function getImgFromUrl(logo_url, callback){
			var img = new Image();
			img.src = logo_url;
			img.onload = function(){
				console.log(img)
				callback(img);
			}
		}
		
		$scope.getColor = function(driver){
			for(var i=0; i<vm.drivers.length; i++){
				if (vm.drivers[i].name == driver){
					return vm.drivers[i].color;
				}
			}
		}

		// function code start here
		authentication.getDrivers(vm.client)
		.then(function(res){
			vm.drivers.push({name:'', color:"#ffffff"});
			vm.drivers.push({name:'Self', color:"#eeeeee"});
			angular.forEach(res, function(user){
				vm.drivers.push({name:user.name.firstName, id:user._id, color:user.backgroundColor});
			})
			setDates($localStorage.start_date, $localStorage.end_date);
		})
	}

	
	angular
	.module('asgApp')
	.controller('pickupChildCtrl', pickupChildCtrl)

})();