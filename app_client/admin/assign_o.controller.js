(function(){
	
	function isValid(obj){
		return (obj !== undefined && obj !== null && obj !== "")
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
				count += Math.ceil(lines[i].length / width)
			}
			return count
		} else {
			return Math.ceil(string.length / width);
		}
	}
	
	function assignStudentCtrl($routeParams, $scope, $uibModal, $window, $localStorage, $sessionStorage, authentication, $location){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();

		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/')
		})
		
		var dayMS = 60 * 60 * 24 * 1000;
		$scope.disableSave = true;
		$scope.msgRow = [];
		
		
		function setDates(start_date, end_date){
			if (angular.isUndefined(start_date) || start_date == null){
//				console.log("change start date")
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
			} else {
				$scope.endDate = new Date(end_date);
			}
			
			// get all active students
			authentication.getAllStudents($scope.startDate, $scope.endDate)
			.then(function(res){
				$scope.students = res;
				// add index to student
				var count = 0;
				authentication.getMessages($scope.startDate, $scope.endDate)
				.then(function(res){
					messages = res;
					angular.forEach($scope.students, function(student){
						student.index = count;
						count++;
						$scope.msgRow.push(1);
						// update student.message
						log = messages.find(o => o.studentID == student._id)
						if (log != null){							
							student.message = log.message;
						} else {
							student.message = ""
						}
						$scope.autoExpand(student.index)
						student.change = false;
					})
				})
			})
		}
		
		$scope.format = 'M/d/yy'
		$scope.popup1 = {
			opened: false
		}
		$scope.open1 = function(){
			$scope.popup1.opened = true
		}
		$scope.startDateUpdated = function(){
			setDates($scope.startDate, null);
		}
		
		$scope.autoExpand = function(index){
			$scope.msgRow[index] = getNoteLines($scope.students[index].message, 101);
//			console.log('index: ' + index + ' row: ' + $scope.msgRow[index])
	    };
		
		$scope.getSchoolDistrict = function(district){
			return district.replace(/ /, '-');
		}
		$scope.change = function(index){
			$scope.students[index].change = true
		}
		
		$scope.update = function(){
			$scope.disableSave = true;
			var logbook = [];
			var date = new Date($scope.startDate);
			date.setHours(12);
			date.setMinutes(0);
			date.setSeconds(0);
			angular.forEach($scope.students, function(student){
				if (student.change){					
					logbook.push({
						studentID: student._id,
						date: date,
						logtype: 'MESSAGE',
						reward: 0,
						message: student.message
					})
				}
			})
			if (logbook.length != 0) {
				console.log(logbook.length + ' message updated')
				authentication.updateMessages(logbook);
				// if successful, clear the change
				angular.forEach($scope.students, function(student){
					student.change = false;
				});
			} else
				console.log('No entry changed')
		}

		// function code start here
		if (!authentication.isSuperUser()){
			$location.path('/home')
		}
		setDates();
	}
	
	angular
	.module('asgApp')
	.controller('assignStudentCtrl', assignStudentCtrl)

})();