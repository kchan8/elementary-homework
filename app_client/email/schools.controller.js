(function(){

	function emailValid(email){
		if (email != undefined && email != null && email != "")
			return true;
		else
			return false
	}

	function emailBySchoolsCtrl ($routeParams, $uibModal, authentication, $location){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();

		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/')
		})
		vm.maxAttachmentCnt = 4;
		vm.checkTotal = 0;
		vm.header = {
				title: 'Send E-mail - by School'
		};

		vm.allGrades = ["TK", "K", "1st", "2nd", "3rd", "4th", "5th"];

		vm.checkCount = function(newVal, oldVal){
			// in html, {{ user.select }} is used for old value, but it can be null before click
			if (newVal !== oldVal) {
				if (newVal === true) {
					vm.checkTotal++;
				} else {
					vm.checkTotal--;
				}
			}
		};

		vm.toggle = function(school){
			// change to according to the select value
			angular.forEach(vm.schools, function(group, key){
				angular.forEach(group, function(data, key){
					if (key === "users") {
						angular.forEach(data, function(field, key){
							if (group._id === school){
								if (field.select != vm.select[school]){
									vm.checkTotal = vm.select[school] ? vm.checkTotal + 1 : vm.checkTotal - 1
								}
//								console.log('Toggle: ' + patrol + ' ' + vm.select[patrol] + ' ' + field.select)
								field.select = vm.select[school]
							}
						})
					}
				})
			})
		}

		vm.toggleAll = function(){
			vm.checkTotal = 0
			angular.forEach(vm.schools, function(group, key){
				if (vm.select == undefined) {
					vm.select = []
				}
				vm.select[group._id] = vm.all
				angular.forEach(group, function(data, key){
					// group._id is not '', null works
					if (key == "users" && group._id != null) {
						angular.forEach(data, function(field, key){
							field.select = vm.all
							if (vm.all == true){							
								vm.checkTotal++
							}
						})
					}
				})
			})
		}

		vm.composeMail = function(){
			// get selected
			var recipientSet = new Set();
			var emailSet = new Set();
			angular.forEach(vm.schools, function(group, key){
				angular.forEach(group, function(data, key){
					if (key == "users") {
						angular.forEach(data, function(field, key){
							if (field.select == true){							
//								console.log(group._id + ": " + field.name + ', ' + field.email1);
								recipientSet.add(field.name)
								if (emailValid(field.email1))
									emailSet.add(field.email1)
									if (emailValid(field.email2))
										emailSet.add(field.email2)
							}
						})
					}
				})
			})
			var recipientList = [...recipientSet];
			var emailList = [...emailSet];
			// https://www.formget.com/angularjs-popup/
//			var modalInstance = $uibModal.open({
			$uibModal.open({
//				ariaLabelledBy: 'modal-title',
//				ariaDescribedBy: 'modal-body',
				templateUrl: './auth/admin/email.modal.html',
				controller: 'emailBySchoolModalCtrl',
//				controllerAs: '$ctrl',
				size: 'lg',			// default is lg, others like sm, md
				resolve: {
					recipients: function(){
						return recipientList;
					},
					emails: function(){
						return emailList;
					},
					maxCnt: function(){
//						vm.maxAttachmentCnt = res;
						return vm.maxAttachmentCnt;
					}
				}
			}).result.catch(function(res){
				// this takes care of unhandled rejection backdrop click & escape
				if (['backdrop click', 'escape key press'].indexOf(res) === -1){
					throw res;
				}
			});
		}

		function init(){
			date = new Date();
			date.setHours(12);	// set time to the beginning of day
			return authentication.getStudentsBySchools(vm.client, date)
			.then(function(res){
				vm.schools = res;
				vm.counts = {
						"TK": 0,
						"K": 0,
						"1st": 0,
						"2nd": 0,
						"3rd": 0,
						"4th": 0,
						"5th": 0
				};
				vm.total = 0;
				angular.forEach(vm.schools, function(group, key){
					// key is only a number, no use for it
					angular.forEach(group, function(data, key){
						if (key === "users") {
							angular.forEach(data, function(child, key){							
								vm.counts[child.grade]++;
								if (child.grade !== null) {								
									vm.total++;
								}
							})
						}
					});
				});
			});
		}
		if (!authentication.isAdmin(vm.client)){			
			$location.path('/' + vm.client);
		}		
		init();
	}

	function emailBySchoolsModalCtrl($scope, $uibModalInstance, recipients, emails, maxCnt, sendEmail, authentication){
		$scope.recipients = recipients.join(', ');
		$scope.maxAttachmentCnt = maxCnt;
		$scope.disabled = false;
		if (!Array.isArray(emails) || !emails.length){
			$scope.disabled = true;
			$scope.error = "No valid e-mail address";
		}
		$scope.cancel = function(){
			$uibModalInstance.close(false);
		};
		$scope.send = function(){
//			$uibModalInstance.close('save');
			var senderEmail = authentication.currentUser().email;
			var senderName = authentication.currentUser().firstname + ' ' + authentication.currentUser().lastname;
			// send email thru api on server
			sendEmail.sendFromServer(senderEmail, senderName, emails, $scope.subject, $scope.message, $scope.files)
			.then(function(res){
				$scope.disabled = true;
				$scope.error = res.message;
			});
		};
	}

	angular
	.module('asgApp')
	.controller('emailBySchoolsCtrl', emailBySchoolsCtrl)
	.controller('emailBySchoolsModalCtrl', emailBySchoolsModalCtrl)
//	.directive('ngFileModel', ngFileModel);
})();