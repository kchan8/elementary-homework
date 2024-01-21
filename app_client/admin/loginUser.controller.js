(function(){
	function loginUserCtrl($routeParams, authentication, $window, $location){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();

		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/');
		});
		
		function init(){
			authentication.getRegisteredUsers(vm.client)
			.then(function(res){
				vm.users = res
				console.log(vm.users)
			});
		}

		var hackin = function(username){
			var user = {client:vm.client, username: username, password:' ', superuser:authentication.currentUser(vm.client).id};
			authentication.hackin(user)
			.then(function(data){
				if (data){
					console.log(data.message);
				} else {
					console.log('login successful')
					$window.location.reload();
					$location.path('/' + vm.client + '/home');
				}
			});
		}

		if (!authentication.isSuperUser(vm.client)){			
			$location.path('/' + vm.client)
		}		
		init();
		vm.hackin = hackin;
	}

	angular
	.module('asgApp')
	.controller('loginUserCtrl', loginUserCtrl);
})();