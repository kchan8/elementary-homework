(function(){

	function schoolsCtrl($routeParams, $uibModal, authentication, $location){
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
		vm.calendar = {
				'Donlon': 'https://drive.google.com/file/d/1L_LQUfuZ8LpUvff1MF-N8KOA4B7n9VFX/view',
				'Fairlands': 'https://4.files.edl.io/2aec/06/05/19/205017-ab79efd4-a077-473c-b150-41b205cbdd5e.pdf',
				'Hart': 'https://www.hartmiddleschool.org/apps/events/',
				'Harvest Park': 'https://harvest.pleasantonusd.net/apps/events/',
				'Hearst': 'https://hearst.pleasantonusd.net/apps/events/',
				'Lydiksen': 'https://lydiksen.pleasantonusd.net/apps/events/',
				'Mohr': 'https://mohr.pleasantonusd.net/apps/events/',
				'Walnut Grove': 'https://walnutgrove.pleasantonusd.net/apps/events/',

				'Amador': 'https://www.dublin.k12.ca.us/cms/lib/CA01001424/Centricity/Domain/1085/Amador%20Calendar%20of%20Events%202019-2020.pdf',
				'Dublin': 'https://www.dublin.k12.ca.us/Page/573',
				'John Green': 'https://www.dublin.k12.ca.us/Page/2391',
				'Kolb': 'https://www.dublin.k12.ca.us/Page/3461',
				'James Dougherty': 'https://www.dublin.k12.ca.us/Page/240#calendar734',

				'Country Club': 'https://www.srvusd.net/file/1531973258588/1275747792895/4411367642820857024.pdf',
				'Live Oak': 'https://www.srvusd.net/file/1408076113298/1407474792799/190112748876772575.pdf',
				'Quail Run': 'https://www.srvusd.net/file/1408076113298/1407474792799/3615514100960259214.pdf',
				'WRMS': 'https://www.srvusd.net/file/1531973258588/1275747792895/1249037832970069823.pdf',
				'GRMS': 'https://www.srvusd.net/file/1531973258588/1275747792895/5616638931292082604.pdf',
				'Iron Horse': 'https://www.srvusd.net/file/1531973258588/1275747792895/6275595116470106230.pdf',
				
				'Greenbrook': 'http://srvusd-ca.schoolloop.com/file/1531973258588/1486205695952/3663408273156842979.pdf',
				'Vista Grande': 'https://www.srvusd.net/file/1531973258588/1275747792895/6421206134189452552.pdf',
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
			authentication.getStudentsBySchools(vm.client, vm.date)
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
				vm.schools = res;
//				console.log("Result: " + JSON.stringify(res))

				angular.forEach(vm.schools, function(group, key){
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
		if (!authentication.isAdmin(vm.client)){			
			console.log('Not admin')
			$location.path('/' + vm.client)
		}
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
	.controller('schoolsCtrl', schoolsCtrl)
	.controller('userModalCtrl', userModalCtrl)
})()