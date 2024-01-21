(function(){
	function homeworkTransferCtrl($routeParams, $scope, $window, $location, authentication, workbookService, $uibModal){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();
		
//		vm.getStudents = function(grade){
//			console.log(grade)
//			$scope.grades.find(o => o._id == grade).users
//		}
		
		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/')
			else if (!authentication.isTeacher(vm.client)){			
				$location.path('/' + vm.client)
			} else {
				vm.teacherID = authentication.currentUser(vm.client).id;
				// get all workbook by teacher
				workbookService.getWorkbookByTeacher(vm.client, vm.teacherID)
				.then(function(res){
					$scope.workbooks = res.data.data;
				})
				// get all students assigned to teacher
				var rangeStart = new Date();
				rangeStart.setHours(0);
				rangeStart.setMinutes(0);
				rangeStart.setSeconds(0);
				var rangeEnd = new Date();
				rangeEnd.setHours(23);
				rangeEnd.setMinutes(59);
				rangeEnd.setSeconds(59);
				authentication.getMyStudentsByGrades(vm.client, vm.teacherID, rangeStart, rangeEnd)
				.then(function(res){
					console.log(res)
					$scope.grades = res;
				})
			}
		})
		
		$scope.uploadHomework = function(workbook){
			$uibModal.open({
				templateUrl: './workbook/upload.modal.html',
				controller: 'uploadHomeworkCtrl',
				size: 'md',
				resolve: {
					client: function(){
						return vm.client;
					},
					studentID: function(){
						return workbook.studentID;
					},
					teacherID: function(){
						return workbook.teacherID;
					},
					workbookID: function(){
						return workbook._id;
					},
					pages: function(){
						return workbook.pages;
					}
				}
			}).result.then(function(result){
				
			}, function(res){
				// this takes care of unhandled rejection backdrop click & escape
				if (['backdrop click', 'escape key press'].indexOf(res) === -1){
					throw res;
				}
			});
		}
		
		
	}
	
	angular
	.module('asgApp')
	.controller('homeworkTransferCtrl', homeworkTransferCtrl)
})();