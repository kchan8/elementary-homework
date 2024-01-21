(function(){
	function videoSelectCtrl($routeParams, $scope, $window, $location, authentication, videoService, $uibModal){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();
		
		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/')
			else if (!authentication.isStudent(vm.client)){
				$location.path('/' + vm.client);
			} else {
				vm.studentID = authentication.currentUser(vm.client).id;
				vm.grade = authentication.getStudentGrade(vm.client);
				vm.level = authentication.getStudentLevel(vm.client);
				videoService.getByGrade(vm.client, vm.grade, vm.level)
				.then(function(res){
					$scope.videos = res.data.data;
				})
			}
		})
		
		$scope.watchVideo = function(url){
			console.log(url)
			$location.url('/' + vm.client + '/student/watch?url=' + url);
		}
	}
	
	angular
	.module('asgApp')
	.controller('videoSelectCtrl', videoSelectCtrl)
})();