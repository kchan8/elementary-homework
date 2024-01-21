(function(){

	function confirmCtrl($routeParams, authentication){
		var vm = this
		vm.client = $routeParams.client.toLowerCase();
		
		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid){				
				$location.path('/');
				return
			}
			var userID = $routeParams.userID;
			vm.credentials = {
					client: vm.client,
					userID: $routeParams.userID,
			};
			authentication.userRegistration(vm.credentials)
			.then(function(res){
				if (res.message){
					vm.validUser = false
				} else {					
					vm.validUser = true
					vm.currentUser = res
				}
				return
			})
		})
	}
	
	angular
	.module('asgApp')
	.controller('confirmCtrl', confirmCtrl)
})()