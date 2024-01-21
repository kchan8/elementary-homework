(function(){
	function videoWatchCtrl($routeParams, $scope, $window, $location, $sce, authentication){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();
		
		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/')
			else if (!authentication.isStudent(vm.client)){
				$location.path('/' + vm.client);
			} else {
				
				console.log($location.absUrl())
				console.log(decodeURI($location.absUrl()))
				console.log($routeParams.url)
				$scope.url = $sce.trustAsResourceUrl($routeParams.url)
			}
		})
		
	}
	
	angular
	.module('asgApp')
	.controller('videoWatchCtrl', videoWatchCtrl)
})();