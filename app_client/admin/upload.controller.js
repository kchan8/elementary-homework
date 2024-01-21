(function(){
//	view: https://codepen.io/Sebus059/pen/MwMQbP 
//	one reference:
//	http://www.encodedna.com/angularjs/tutorial/angularjs-file-upload-using-http-post-formdata-webapi.htm
	function customChange($parse){
		return {
			restrict: 'A',
			link: function (scope, element, attrs){
				// option 1
				// https://gist.github.com/CMCDragonkai/6282750 method #4
//				var onChangeFunc = scope.$eval(attrs.customChange)
				// bind deprecated, use on, execute the function specified in the attribute value
//				element.on('change', onChangeFunc)
				// option 2
//				element.on('change', function(){
//				scope.$eval(attrs.customChange)()
//				})
				// option 3
				var model = $parse(attrs.customChange);
				var modelSetter = model.assign;
				element.on('change', function(){
					scope.$apply(function(){
						modelSetter(scope, element[0].files[0]);
					});
				});
			}
		};
	}

//	fileUpload is service (controller -> service)
	function uploadCtrl ($routeParams, $scope, fileUpload, authentication, $location){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();

		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/')
		})

		if (!authentication.isSuperUser(vm.client)){			
			$location.path('/' + vm.client)
		}		
		$scope.upload = function(){
			var uploadUrl;
			if ($scope.student_file !== undefined){			
				console.log('Filename: ' + $scope.student_file.name);
				uploadUrl = "/api/upload/student_file";
				fileUpload.uploadFileToUrl(vm.client, $scope.student_file, uploadUrl)
				.then(function(res){
					console.log('File uploaded: ' + JSON.stringify(res));
				});
			}
			if ($scope.worker_file !== undefined){
				console.log('Filename: ' + $scope.worker_file.name);
				uploadUrl = "/api/upload/worker_file";
				fileUpload.uploadFileToUrl(vm.client, $scope.worker_file, uploadUrl)
				.then(function(res){
					console.log('File uploaded: ' + JSON.stringify(res));
				});
			}
			if ($scope.pickup_file !== undefined){
				console.log('Filename: ' + $scope.pickup_file.name);
				uploadUrl = "/api/upload/pickup_file";
				fileUpload.uploadFileToUrl(vm.client, $scope.pickup_file, uploadUrl)
				.then(function(res){
					console.log('File uploaded: ' + JSON.stringify(res));
				});
			}
			if ($scope.video_file !== undefined){
				console.log('Filename: ' + $scope.video_file.name);
				uploadUrl = "/api/upload/video_file";
				fileUpload.uploadFileToUrl(vm.client, $scope.video_file, uploadUrl)
				.then(function(res){
					console.log('File uploaded: ' + JSON.stringify(res));
				});
			}
			if ($scope.workbook_file !== undefined){
				console.log('Filename: ' + $scope.workbook_file.name);
				uploadUrl = "/api/upload/workbook_file";
				fileUpload.uploadFileToUrl(vm.client, $scope.workbook_file, uploadUrl)
				.then(function(res){
					console.log('File uploaded: ' + JSON.stringify(res));
				});
			}
		};
	}

	angular
	.module('asgApp')
	.controller('uploadCtrl', uploadCtrl)
	.directive('customChange', customChange);

})();