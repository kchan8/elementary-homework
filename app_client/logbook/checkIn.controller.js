(function(){

	function isValid(obj){
		return (obj !== undefined && obj !== null && obj !== "")
	}

	function checkInCtrl($routeParams, $scope, $window, $location, authentication){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();
		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/')
		})

		$scope.isAdmin = function(){
			return authentication.isAdmin();
		};
	    
		$scope.checkIn = function(){
			vm.formError = "";
			if ($scope.form.user.$valid){
				vm.formError = "";
				console.log('Firstname: ' + vm.firstName)
				console.log('Lastname: ' + vm.lastName)
				console.log('Class: ' + vm.class)
				console.log('Grade: ' + vm.grade)
				// send to server
				authentication.classCheckIn(vm.client, vm.firstName, vm.lastName, vm.class, vm.grade)
				.then(function(res){
					console.log(res)
				})
			} else {
				if (vm.firstName == undefined){
					vm.formError = "First name missing"
				}
				if (vm.lastName == undefined){
					if (vm.formError == "")
						vm.formError = "First character of last name missing"
					else
						vm.formError += ", first character of last name missing"
				}
				if (vm.grade == undefined){
					if (vm.formError == "")
						vm.formError = "Grade is not checked"
					else
						vm.formError += ", grade is not checked"
				}
				return false
			}
		}

	}
	angular
	.module('asgApp')
	.controller('checkInCtrl', checkInCtrl)

})();