(function(){

	function signupDoneCtrl($routeParams, $location, authentication){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();

		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/')
		})
	}

	angular
	.module('asgApp')
	.controller('signupDoneCtrl', signupDoneCtrl);
})();