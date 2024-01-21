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
	
	function checkInRptCtrl($routeParams, $scope, $uibModal, $window, $document, $localStorage, $sessionStorage, authentication, $location){
		var vm = this;
		var SHOWDAYS = 13;
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
				$scope.startDate = new Date();
				$scope.startDate.setHours(0);
				$scope.startDate.setMinutes(0);
				$scope.startDate.setSeconds(0);
			} else {
				$scope.startDate = new Date(start_date);
			}
			if (end_date == undefined || end_date == null){				
				$scope.endDate = new Date($scope.startDate.getTime())
				$scope.endDate.setHours(23);
				$scope.endDate.setMinutes(59);
				$scope.endDate.setSeconds(59);
				$scope.endDate.setTime($scope.endDate.getTime() + (SHOWDAYS - 1) * dayMS)
				$localStorage.end_date = $scope.endDate;
			} else {
				$scope.endDate = new Date(end_date);
			}
			$scope.displayDays = [];
			for (var i=$scope.startDate.getDay(), j=0; j<SHOWDAYS; i++, j++){
				$scope.weekDate = new Date();
				// Warning - setDate will keep the same MONTH!!! use set/getTime
//				$scope.weekDate.setDate($scope.startDate.getDate() + j)
				$scope.weekDate.setTime($scope.startDate.getTime() + j * dayMS);
				$scope.weekDate.setHours(12);
				$scope.weekDate.setMinutes(0);
				$scope.weekDate.setSeconds(0);
				// index: 0 is Monday... 4 is Friday, used to access user.pickup
				$scope.displayDays.push({index: j,	// starts from 0 if begin at Monday
										 weekday: $scope.days[i%7],
										 date: $scope.weekDate});
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
						}
					}
				}

				authentication.getCheckIns(vm.client, rangeStart, rangeEnd)
				.then(function(res){
					checkins = res;
					angular.forEach(checkins, function(checkin){
						var checkInDate = new Date(checkin.date);
						checkInDate.setHours(23);
						checkInDate.setMinutes(59);
						checkInDate.setSeconds(59);
						var index = Math.floor((checkInDate.getTime() - $scope.startDate.getTime())/dayMS);
						console.log(index)
						for (grade of vm.grades){
							for (user of grade.users){
								if (user.id == checkin.studentID){
									checkInDateTime = new Date(checkin.date);
									user.message[index] = checkInDateTime.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
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
//			if ($scope.startDate > $scope.endDate || ($scope.endDate.getTime() - $scope.startDate.getTime()) / (60 * 60* 24 * 1000) > SHOWDAYS){
//				setDates($scope.startDate, null);
//			} else { 
//				setDates($scope.startDate, $scope.endDate);
//			}
			$scope.endDate.setTime($scope.startDate.getTime() + (SHOWDAYS - 1) * dayMS);
			setDates($scope.startDate, $scope.endDate);
			$localStorage.start_date = $scope.startDate;
		}
		$scope.endDateUpdated = function(){
			setDates($scope.startDate, $scope.endDate);
			$localStorage.end_date = $scope.endDate;
		}
				
		// function code start here
		if (!authentication.isTeacher(vm.client)){
			$location.path('/' + vm.client);
		}
		setDates($localStorage.start_date, $localStorage.end_date);
	}
	
	angular
	.module('asgApp')
	.controller('checkInRptCtrl', checkInRptCtrl)

})();