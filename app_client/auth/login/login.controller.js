//view -> controller(client) -> service(client) -> controller(api)
//info: https://toddmotto.com/factory-versus-service

(function(){

	function loginCtrl($routeParams, $location, authentication){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();

		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/')
		})

		vm.pageHeader = {
			title: 'Login'
		};
		vm.returnPage = $location.path();

		vm.credentials = {
				client: vm.client,
				username: "",
				password: ""
		};
		vm.onSubmit = function(){
			vm.formError = "";
			if (!vm.credentials.username || !vm.credentials.password){
				vm.formError = "All fields required, please try again";
				return false;
			} else {
				vm.doLogin();
			}
		};
		vm.doLogin = function(){
			vm.formError = "";
			authentication.login(vm.credentials)
			.then(function(data){
				if (data){
//					console.log(data)
					vm.formError = data.message;
				} else {
					$location.path('/' + vm.client.toLowerCase());
				}
			});
		};
	}

	angular
	.module('asgApp')
	.controller('loginCtrl', loginCtrl);

})();