(function(){

	function districtsCtrl($routeParams, $uibModal, authentication, $location){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();

		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid){
				$location.path('/')
			}
		})
		vm.date = new Date();
		vm.date.setHours(12);	// set time to the beginning of day
		vm.format = 'M/d/yy';
		vm.popup1 = {
				opened: false
		}	
		vm.open1 = function(){
			vm.popup1.opened = true;
		}
		vm.dateUpdated = function(){
			vm.date.setHours(12);
			init();
		}
		vm.allGrades = ["TK", "K", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
		vm.calendar = {'Dublin': 'https://www.dublin.k12.ca.us/cms/lib/CA01001424/Centricity/Domain/1085/DUSD%202019.20%20Board%20Approved%2004.23.2019%20FINAL.pdf',
				'Pleasanton': 'https://4.files.edl.io/1fec/12/20/18/215127-09b5ba29-3913-456e-b7e7-94741ceed68f.pdf',
				'San Ramon': 'https://srvusd-ca.schoolloop.com/file/1251436463630/1407474792799/3690818556079166086.pdf?filename=2019-20.pdf'
		};
		vm.userinfo = function(user){
			authentication.getUserDetailsById(vm.client, user.id)
			.then(function(res){
				$uibModal.open({
					templateUrl: './roster/user.modal.html',
					controller: 'userModalCtrl',
					size: 'md',
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
				})
			})
		}

		function init(){
			authentication.getStudentsByDistricts(vm.client, vm.date)
			.then(function(res){
				vm.counts = {
						"TK": 0,
						"K": 0,
						"1st": 0,
						"2nd": 0,
						"3rd": 0,
						"4th": 0,
						"5th": 0,
						"6th": 0,
						"7th": 0,
						"8th": 0
				};
				vm.total = 0;
				vm.districts = res;
//				console.log("Result: " + JSON.stringify(res))

				angular.forEach(vm.districts, function(group, key){
					// key is only a number, no use for it
//					console.log(group._id + ":" + group._id.length);
					angular.forEach(group, function(data, key){
						if (key === "users") {
							angular.forEach(data, function(child, key){							
								vm.counts[child.grade]++;
								vm.total++;
							})
						}
					});
				});
			});
		}
		if (!authentication.isAdmin(vm.client))		
			$location.path('/' + vm.client);
		init();
	}

	function userModalCtrl($scope, $uibModalInstance, user){
		$scope.user = user;
		$scope.cancel = function(){
			$uibModalInstance.close(false);
		};
		$scope.ok = function(){
			$uibModalInstance.close('save');
		};
	}

	angular
	.module('asgApp')
	.controller('districtsCtrl', districtsCtrl)
	.controller('userModalCtrl', userModalCtrl)

})()