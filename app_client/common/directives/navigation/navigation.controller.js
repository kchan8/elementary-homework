(function(){

function navigationCtrl($scope, $window, $location, $uibModal, authentication){
	var vm = this;
	
	// use function can update directive automatically
	var isLoggedIn = function(client){
//		console.log('isLoggedIn')
		return authentication.isLoggedIn(client);
	};
	var isSuperUser = function(client){
//		console.log('isSuperUser')
		return authentication.isSuperUser(client);
	};
	var isAdmin = function(client){
//		console.log('isAdmin')
		return authentication.isAdmin(client);
	};
	var isTeacher = function(client){
//		console.log('isTeacher')
		return authentication.isTeacher(client);
	};
	var isParent = function(client){
//		console.log('isParent')
		return authentication.isParent(client);
	};
	var isStudent = function(client){
//		console.log('isStudent')
		return authentication.isStudent(client);
	};
	var currentUser = function(client){
//		console.log('currentUser')
		return authentication.currentUser(client);
	};
	var logout = function(client){
//		console.log(client)
		authentication.logout();
		$location.path('/' + client.toLowerCase());
	};
	
	var profile = function(client, id){
		authentication.getUserDetailsById(client, id)
			.then(function(res){
				$uibModal.open({
					templateUrl: './common/directives/navigation/profile.modal.html',
					controller: 'profileModalCtrl',
					size: 'lg',
					resolve: {
						user: function(){
							return res;
						},
						client: function(){
							return client;
						}
					}
				}).result.catch(function(res){
					// this takes care of unhandled rejection backdrop click & escape
					if (['backdrop click', 'escape key press'].indexOf(res) === -1){
						throw res;
					}
				});
			});
	};
	
	var addUser = function(client){
		if (!authentication.isAdmin(client))		
			$location.path('/' + client)
		$uibModal.open({
			templateUrl: './common/directives/navigation/addUser.modal.html',
			controller: 'addUserModalCtrl',
			size: 'lg',
			resolve: {
				client: function(){
					return client;
				}
			}
		}).result.then(function(){
			// https://stackoverflow.com/questions/30356844/angularjs-bootstrap-modal-closing-call-when-clicking-outside-esc
			// 1st function is doClosure
			// 2nd function is doDismiss
//			$window.location.reload();
		}, function(res){
			// this takes care of unhandled rejection backdrop click & escape
			if (['backdrop click', 'escape key press'].indexOf(res) === -1){
				throw res;
			}
		});
	};
	
	var children = isLoggedIn() ? currentUser().children : [];
	var getChildren = function(){
		return children;
	};
	
//	authentication.getClient()
//		.then(function(res){
//			vm.client = res;
//		});
	
	vm.currentPath = $location.path();
	vm.isLoggedIn = isLoggedIn;
	vm.isAdmin = isAdmin;
	vm.isSuperUser = isSuperUser;
	vm.isTeacher = isTeacher;
	vm.isParent = isParent;
	vm.isStudent = isStudent;
	vm.currentUser = currentUser;
	vm.logout = logout;
	vm.profile = profile;
	vm.getChildren = getChildren;
	vm.addUser = addUser;
}

function profileModalCtrl($scope, $uibModal, $uibModalInstance, authentication, client, user){
	$scope.user = user;
	$scope.student = user.userType == ['Student'];
	$scope.cancel = function(){
		$uibModalInstance.close(false);
	};
	$scope.update = function(){
		user.client = client;
		authentication.updateUser(user)
			.then(function(){				
				$uibModalInstance.close('save');
			});
	};
	$scope.profile = function(id){
		authentication.getUserDetailsById(client, id)
		.then(function(res){
			$uibModal.open({
				templateUrl: './common/directives/navigation/profile.modal.html',
				controller: 'profileModalCtrl',
				size: 'lg',
				resolve: {
					user: function(){
						return res;
					}
				}
			}).result.catch(function(res){
				// this takes care of unhandled rejection backdrop click & escape
				if (['backdrop click', 'escape key press'].indexOf(res) === -1){
					throw res;
				}
			});
		});
	};
}

// http://bl.ocks.org/rnkoaa/8333940
// not working yet - form can't validate
function addUserModalCtrl($scope, $uibModalInstance, authentication, client){
	$scope.form = {};
	$scope.active = true;
	$scope.child = "child";	// html can use ng-value="child" or use plain value="child"
	$scope.adult = "adult";
	$scope.days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Min-Day"];
	$scope.daylist = [{pickup:'', driver:''},
		{pickup:'', driver:''},
		{pickup:'', driver:''},
		{pickup:'', driver:''},
		{pickup:'', driver:''},
		{pickup:'', driver:''}];
//	$scope.updateWeekday = function(weekday){
//		console.log(weekday.name + " is clicked state is " + weekday.attend )
//		if (!weekday.attend){
//			console.log("set allWeek to false")
//			// no ng-checked for the 5-days checkbox, ng-model can't be changed in code
//			$scope.allWeek = false;
//		}
//	}
//	$scope.allWeekToggle = function(allWeek){
//		angular.forEach($scope.daylist, function(weekday){
//			weekday.attend = allWeek
//		})
//	}
	
	// doing this will not have $scope.user in create() ??? 
//	$scope.user = []
//	$scope.user.type = "child"
	$scope.enrollDate = new Date();
	$scope.lastDate = new Date();
	$scope.lastDate.setFullYear(2021, 4, 31);	// set last day of school year
	$scope.format = 'M/d/yy'
	$scope.popup1 = {
		opened: false
	}
	$scope.popup2 = {
		opened: false
	}
	$scope.open1 = function(){
		$scope.popup1.opened = true
	}
	$scope.open2 = function(){
		$scope.popup2.opened = true
	}	
		
	$scope.cancel = function(){
		$uibModalInstance.close(false);
	};
	$scope.create = function(){
		if ($scope.form.addUser.$valid){
//			console.log('type: ' + $scope.user.type);
//			console.log('firstname: ' + $scope.user.name.firstName);
//			console.log('userType: ' + $scope.user.userType);
			$scope.user.active = $scope.active;
			$scope.user.pickup = $scope.daylist;
			
			if ($scope.user.name.firstName){
				if ($scope.user.type == "adult"){
					$scope.user.grade = "";
					if ($scope.user.userType == undefined){
						$scope.user.userType = ['Parent'];
					}
				}
				if ($scope.user.type == "child"){
					$scope.user.userType = ['Student'];
				}
				console.log($scope.user.type)
				console.log($scope.user.userType)
				$scope.user.enrollment = [{enroll: $scope.enrollDate, last: $scope.lastDate}]
				$scope.user.client = client
				authentication.createUser($scope.user)
					.then(function(data){
						if (data){
							$scope.formError = data.message;
						} else {
							$uibModalInstance.close('save');
						}
					});
			} 
		}
	};
}

angular
	.module('asgApp')
	.controller('navigationCtrl', navigationCtrl)
	.controller('profileModalCtrl', profileModalCtrl)
	.controller('addUserModalCtrl', addUserModalCtrl);

})();