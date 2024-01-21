(function(){
	function homeworkReviewCtrl($routeParams, $scope, $sce, $window, $location, authentication, workbookService){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();
		
		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/')
			else if (!authentication.isTeacher(vm.client)){			
				$location.path('/' + vm.client)
			} else {
				vm.teacherID = authentication.currentUser(vm.client).id;
				// get SUBMIT and REVIEW homework
				workbookService.getHomeworkByTeacher(vm.client, vm.teacherID)
				.then(function(res){
					// get homework status
					console.log(res.data.data)
					$scope.grades = res.data.data;
//					$scope.homeworks = res.data.data;
				})
			}
		})
		
		$scope.getHomework = function(id){
			$location.path('/' + vm.client + '/teacher/homework/' + id + '/0');
		}
		
		$scope.unlockHomework = function(id){
			workbookService.changeHomeworkStatus(vm.client, id, 'ASSIGN')
			.then(function(res){
				$window.location.reload();
			})
		}
		
		$scope.removeHomework = function(){
			// remove only after expire day
			var homeworkIDs = [];
			$scope.homeworks.forEach(function(homework){
				if (homework.select){
					homeworkIDs.push(homework._id)
				}
			})
			workbookService.removeHomework(vm.client, homeworkIDs)
			.then(function(res){
				$window.location.reload();
			})
		}
	}
	
	angular
	.module('asgApp')
	.controller('homeworkReviewCtrl', homeworkReviewCtrl)
})();