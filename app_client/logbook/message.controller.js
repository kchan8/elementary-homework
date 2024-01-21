(function(){
	
	function isValid(obj){
		return (obj !== undefined && obj !== null && obj !== "");
	}
	
	// this function can't add a line with zero length, so it will not adjust
	// textarea right after pressing carriage return, one key afterwards will correct it
	function getNoteLines(string, width){
		if (!isValid(string))
			return 1;	// put 1 line for empty message
		if (string.indexOf('\n') !== -1){
			var lines = string.split('\n');
			var count = 0;
			for(var i=0; i<lines.length; i++){
				count += Math.ceil(lines[i].length / width);
			}
			return count;
		} else {
			return Math.ceil(string.length / width);
		}
	}
	
	function daysDifferent(date1, date2){
		var date1Obj = new Date(date1);
		var date2Obj = new Date(date2);
		var timeDiff = date2Obj.getTime() - date1Obj.getTime();
		return timeDiff / (60 * 60 * 24 * 1000);
	}
	
	function messageCtrl($routeParams, $scope, $uibModal, $window, $document, $localStorage, $sessionStorage, authentication, $location){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();

		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/')
		})
		
		$scope.oneAtATime = true;
		
		$scope.tabs = [{
			grade: '1st',
			title: '1st Grade',
		}, {
			grade: '2nd',
			title: '2nd Grade',
		}, {
			grade: '3rd',
			title: '3rd Grade',
		}, {
			grade: '4th',
			title: '4th Grade',
		}, {
			grade: '5th',
			title: '5th Grade',
		}, {
			grade: '6th',
			title: '6th Grade',
		}];
		
		var dayMS = 60 * 60 * 24 * 1000;
		$scope.disableSave = true;
		$scope.msgRow = [];
		
		// https://stackoverflow.com/questions/48182912/how-to-detect-browser-with-angular
		$scope.isNotFirefox = function(){
			return !(typeof InstallTrigger !== 'undefined');
		}
		
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
			for (var i=$scope.startDate.getDay(), j=0; i<=$scope.endDate.getDay(); i++, j++){
				$scope.weekDate = new Date();
				// Warning - setDate will keep the same MONTH!!! use set/getTime
//				$scope.weekDate.setDate($scope.startDate.getDate() + j)
				$scope.weekDate.setTime($scope.startDate.getTime() + j * dayMS);
				$scope.weekDate.setHours(12);
				$scope.weekDate.setMinutes(0);
				$scope.weekDate.setSeconds(0);
				// index: 0 is Monday... 4 is Friday, used to access user.pickup
				$scope.displayDays.push({index: i-1,	// starts from 0 if begin at Monday
										 weekday: $scope.days[i],
										 date: $scope.weekDate});
//				$scope.dayNote.push("");
//				$scope.noteRow.push(2);
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

			// get active students by grades
			// when dates are specified, then students not active need to be displayed
			authentication.getStudentsByGrades(vm.client, rangeStart, rangeEnd)
			.then(function(res){
				vm.grades = res;
				// populate all message box with null
				for (day of $scope.displayDays){
					for (grade of vm.grades){
						for (user of grade.users){
							if (user.message == undefined){
								user.message = [];
								user.messageChange = [];
							}
							user.message.push("");
							user.messageChange.push(false);
							user.messageRow = 2;
						}
					}
				}

				authentication.getMessages(vm.client, rangeStart, rangeEnd)
				.then(function(res){
					messages = res;
					angular.forEach(messages, function(message){
						var msgDate = new Date(message.date);
						var weekday = msgDate.getDay() - 1;	// 0=Mon, 1=Tue etc.
						
						for (grade of vm.grades){
							for (user of grade.users){
								if (user.id == message.studentID){
									user.message[weekday] = message.message;
									var rows = getNoteLines(message.message, 25);
									if (rows > user.messageRow){
										user.messageRow = rows;
									}
								}
							}
						}
					})
				})
			})
		}
		
		$scope.days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		$scope.format = 'M/d/yy'
		$scope.popup1 = {
			opened: false
		}
		$scope.open1 = function(){
			$scope.popup1.opened = true
		}
		$scope.popup2 = {
				opened: false
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
		
		$scope.autoExpand = function(user, index){
			console.log('in autoExpand...')
			var rows = getNoteLines(user.message[index], 25);
			if (rows > user.messageRow){
				console.log ('set rows to ' + rows)
				user.messageRow = rows;
			}
	    };
		
		$scope.change = function(user, index){
			user.messageChange[index] = true;
		}
		
		$scope.update = function(){
			$scope.disableSave = true;
			var logbook = [];
			var date = new Date($scope.startDate);
			date.setHours(12);
			date.setMinutes(0);
			date.setSeconds(0);
			for (day of $scope.displayDays){
				for (grade of vm.grades){
					for (user of grade.users){
						if (user.messageChange[day.index]){
							console.log(user.name + ' ' + day.weekday + ' ' + user.message[day.index])
							logbook.push({studentID: user.id,
								date: new Date(day.date),
								logtype: 'MESSAGE',
								message: user.message[day.index]
								})
						}
					}
				}
			}
			
			if (logbook.length != 0) {
				console.log(logbook.length + ' message updated')
				authentication.updateMessages(vm.client, logbook);
				// if successful, clear the change
				for (day of $scope.displayDays){
					for (grade of vm.grades){
						for (user of grade.users){
							user.messageChange[day.index] = false;
						}
					}
				}
			} else
				console.log('No entry changed')
		}

		// function code start here
		if (!authentication.isSuperUser(vm.client)){
			$location.path('/' + vm.client);
		}
		// check only shows 5 days
		if (daysDifferent($localStorage.start_date, $localStorage.end_date) <= 5){			
			setDates($localStorage.start_date, $localStorage.end_date);
		} else {
			setDates($localStorage.start_date, null);			
		}
	}
	
	angular
	.module('asgApp')
	.controller('messageCtrl', messageCtrl)

})();