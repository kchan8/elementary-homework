//view -> controller(client) -> service(client) -> controller(api)
//info: https://toddmotto.com/factory-versus-service
(function(){

	function forgotPasswordCtrl($routeParams, $location, authentication){
		var vm = this
		vm.client = $routeParams.client.toLowerCase();

		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/')
		})
		
		vm.pageHeader = {
			title: 'Forgot Your Password?'
		}

		vm.credentials = {
			client: vm.client,
			email: "",
			firstName: "",
			lastName: ""
		}
		vm.onSubmit = function(){
			vm.formError = "";
			if (!vm.credentials.email){
				vm.formError = "E-mail required, please try again";
				return false;
			} else if (!vm.credentials.firstName){
				vm.formError = "First name required, please try again";
				return false;
			} else if (!vm.credentials.lastName){
				vm.formError = "Last name required, please try again";
				return false;
			} else {
				vm.doResetPassword();
			}
		}
		vm.doResetPassword = function(){
//			console.log("In controller reset password...")
			vm.formError = ""
				authentication.resetPassword(vm.credentials)
				.then(function(data){
					if (data){
//						console.log(data)
						vm.formError = data.message
					} else {
						$location.path('/')
					}
				})
		}
	}
	angular
	.module('asgApp')
	.controller('forgotPasswordCtrl', forgotPasswordCtrl)
})()