(function(){
	function videoManageCtrl($routeParams, $scope, $location, $window, authentication, videoService, $uibModal){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();
		
		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/');
			else if (!authentication.isTeacher(vm.client)){			
				$location.path('/' + vm.client);
			} else {
				vm.teacherID = authentication.currentUser(vm.client).id;
				// get all workbook by teacher
				videoService.getByTeacher(vm.client, vm.teacherID)
				.then(function(res){
					$scope.grades = res.data.data;
					$scope.oneAtATime = true;
				})
			}
		})
		
		$scope.updateVideo = function(id){
			videoService.getByID(vm.client, id)
			.then(function(res){
				$uibModal.open({
					templateUrl: './video/edit.modal.html',
					controller: 'videoEditCtrl',
					size: 'md',
					resolve: {
						client: function(){
							return vm.client;
						},
						video: function(){
							return res.data.data;
						}
					}
				}).result.then(function(result){
					if (result != 'cancel')
						$window.location.reload();
				}, function(res){
					// this takes care of unhandled rejection backdrop click & escape
					if (['backdrop click', 'escape key press'].indexOf(res) === -1){
						throw res;
					}
				});
			})
		}
		
		$scope.removeVideo = function(){
			// remove only after expire day
			var videoIDs = [];
			$scope.grades.forEach(function(grade){
				grade.videos.forEach(function(video){
					if (video.select){
						videoIDs.push(video._id)
					}
				})
			})
			console.log(videoIDs)
			videoService.remove(vm.client, videoIDs)
			.then(function(res){
				$window.location.reload();
			})
		}
	}
	
	function videoEditCtrl($scope, $uibModalInstance, videoService, client, video){
		$scope.video = video;
		$scope.video.expireDate = new Date(video.expire);
		$scope.format = 'M/d/yy';
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
		$scope.update = function(){
			video.expire = video.expireDate;
			videoService.update(client, video)
			.then(function(res){
				$uibModalInstance.close('save');
			})
		}
		
		$scope.cancel = function(){
			$uibModalInstance.close('cancel')
		}
	}
	
	angular
	.module('asgApp')
	.controller('videoManageCtrl', videoManageCtrl)
	.controller('videoEditCtrl', videoEditCtrl)
	
})();