(function(){
//	fileUpload is service (controller -> service)
	function videoUploadCtrl ($routeParams, $scope, authentication, videoService, $location){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();
		
		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/')
			else {
				$scope.video = {};
				$scope.video.expireDate = new Date(new Date().getTime() + 28 * 24 * 3600 * 1000);
				vm.teacherID = authentication.currentUser(vm.client).id;
			}
		});
		
		$scope.format = 'M/d/yy';
		$scope.popup1 = {
			opened: false
		};
		$scope.open1 = function(){
			$scope.popup1.opened = true;
		};
		$scope.popup2 = {
			opened: false
		};
		$scope.open2 = function(){
			$scope.popup2.opened = true;
		};
		
		$scope.clear = function(){
			$scope.formError = "";
		}
		
		$scope.upload = function(){
			// only submit when all files specified
			var uploadUrl;
			$scope.formError = "";
			if ($scope.video == undefined){
				$scope.formError = "No data entered, please try again.";
			} else if ($scope.video.grade == undefined){
				$scope.formError = "No grade specified, please try again.";
			} else if ($scope.video.subject == undefined){
				$scope.formError = "No subject entered, please try again.";
			} else if ($scope.video.description == undefined){
				$scope.formError = "No description entered, please try again.";	
			} else if ($scope.video.url == undefined){
				$scope.formError = "No URL entered, please try again.";	
			} else {
				videoService.upload(vm.client, vm.teacherID, $scope.video)
			}
		};
	}

	angular
	.module('asgApp')
	.controller('videoUploadCtrl', videoUploadCtrl)

})();