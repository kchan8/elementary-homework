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
	
	function assignStudentsCtrl($routeParams, $scope, $uibModal, $window, $document, $localStorage, $sessionStorage, authentication, $location){
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
		
		vm.teachers = [];
		var dayMS = 60 * 60 * 24 * 1000;
		$scope.disableSave = true;
		
		// https://stackoverflow.com/questions/48182912/how-to-detect-browser-with-angular
		$scope.isNotFirefox = function(){
			return !(typeof InstallTrigger !== 'undefined');
		}
		
		function setDates(start_date, end_date){
			
			// read from schedule, display notes
			var rangeStart = new Date();
			rangeStart.setHours(0);
			rangeStart.setMinutes(0);
			rangeStart.setSeconds(0);
			var rangeEnd = new Date();
			rangeEnd.setHours(23);
			rangeEnd.setMinutes(59);
			rangeEnd.setSeconds(59);

			// get active students by grades
			// when dates are specified, then students not active need to be displayed
			authentication.getStudentsByGrades(vm.client, rangeStart, rangeEnd)
			.then(function(res){
				vm.grades = res;
				// populate all message box with null
				for (grade of vm.grades){
					for (user of grade.users){
						user.teacherChange = false;
					}
				}
			})
		}
		
		$scope.change = function(user){
			user.teacherChange = true;
		}
		
		$scope.getColor = function(teacher){
			for(var i=0; i<vm.teachers.length; i++){
				if (vm.teachers[i].name == teacher){
					return vm.teachers[i].color;
				}
			}
		}
		
		$scope.update = function(){
			$scope.disableSave = true;
			var teacherUpdate = [];
			var date = new Date($scope.startDate);
			date.setHours(12);
			date.setMinutes(0);
			date.setSeconds(0);
			for (grade of vm.grades){
				for (user of grade.users){
					if (user.teacherChange){
						console.log(user.name + ' ' + user.teacher);
						teacherUpdate.push({
							studentID: user.id,
							teacher: user.teacher
						})
					}
				}
			}
			
			if (teacherUpdate.length != 0) {
				console.log(teacherUpdate.length + ' user updated')
				authentication.updateTeacher(vm.client, teacherUpdate);
				// if successful, clear the change
				for (grade of vm.grades){
					for (user of grade.users){
						user.teacherChange = false;
					}
				}
			} else
				console.log('No teacher assignment changed')
		}

		// function code start here
		if (!authentication.isSuperUser(vm.client)){
			$location.path('/' + vm.client);
		}
		setDates($localStorage.start_date, $localStorage.end_date);
		authentication.getTeachers(vm.client)
		.then(function(res){
			angular.forEach(res, function(user){
				vm.teachers.push({name:user.name.firstName + ' ' + user.name.lastName,
					id:user._id,
					color:user.backgroundColor});
			})
			
		});
	}
	
	angular
	.module('asgApp')
	.controller('assignStudentsCtrl', assignStudentsCtrl)

})();