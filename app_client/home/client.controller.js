(function(){
	function clientCtrl ($routeParams, $location, authentication, $scope){
		var vm = this;

		// Code for testing
		// http://embed.plnkr.co/dYuLXQAsA0GE5cQj33AX/
		$scope.sendData = function(data){
			console.log('send data to server');
			authentication.sendData(vm.client, data);
		};

		vm.refresh = 0;
		vm.client = $routeParams.client.toLowerCase();
		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/');
//			else {				
//				// Code for testing
//				// get sig.png as data if exists
//				vm.workbook = 'doc/workbook.png';
//				authentication.getSigData(vm.client)
//				.then(function(res){
//					// size changed, so use width and height on fromDataURL
//					// https://github.com/szimek/signature_pad/issues/105
//					if (res.message == 'success')
//						$scope.sig = {data: res.data};
//					else
//						$scope.sig = {data: null};
//					screenUpdate();
//				});
//			}
		});
		
	}

	angular
	.module('asgApp')
	.controller('clientCtrl', clientCtrl);
})();