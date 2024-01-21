//view -> controller(client) -> service(client) -> controller(api)
//info: https://toddmotto.com/factory-versus-service

(function(){

	function resetPasswordCtrl($routeParams, $location, authentication){
		var vm = this
		vm.client = $routeParams.client.toLowerCase();

		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/')
		})
		
		vm.pageHeader = {
			title: 'Reset Your Password'
		}

		vm.credentials = {
			client: vm.client,
			password: "",
			confirmPassword: ""
		}
		vm.onSubmit = function(){
			vm.formError = "";
			if (!vm.credentials.password || !vm.credentials.confirmPassword
					|| vm.credentials.password != vm.credentials.confirmPassword){
				vm.formError = "Passwords not matching, please try again.";
				return false;
			} else {
				vm.doSetPassword();
			}
		}
		vm.doSetPassword = function(){
			console.log("In controller set password...")
			vm.formError = "";
			vm.credentials.userID = $routeParams.userID;
			vm.credentials.key = $routeParams.key;
			authentication.setPassword(vm.credentials)
			.then(function(data){
				if (data.message){
					vm.formError = data.message
				} else {
					$location.path('/' + vm.client.toLowerCase() + '/login')
				}
			})
		}
	}
	angular
	.module('asgApp')
	.controller('resetPasswordCtrl', resetPasswordCtrl)
})()