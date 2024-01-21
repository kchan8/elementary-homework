(function(){
	function aboutCtrl ($routeParams, $location, authentication){
		var vm = this;

		vm.header = {
			title: 'Client Home Page'
		};
		vm.client = $routeParams.client.toLowerCase();
		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/')
		})
	}

	angular
	.module('asgApp')
	.controller('aboutCtrl', aboutCtrl);
})();