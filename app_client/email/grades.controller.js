(function(){

	// http://plnkr.co/edit/B13t84j5IPzINMh1F862?p=preview
	// https://medium.com/@ahmedhamedTN/multiple-files-upload-with-angular-2-express-and-multer-1d951a32a1b3
	function ngFileModel ($parse){
		return{
			restrict: 'A',
			link: function (scope, element, attrs) {
				var model = $parse(attrs.ngFileModel);
				var isMultiple = attrs.multiple;
				var modelSetter = model.assign;
				element.bind('change', function () {
					var values = [];
					angular.forEach(element[0].files, function (item) {
						// var value = {
						//    // File Name 
						//     name: item.name,
						//     //File Size 
						//     size: item.size,
						//     //File URL to view 
						//     url: URL.createObjectURL(item),
						//     // File Input Value 
						//     _file: item
						// };
						values.push(item);	// use item, not value 
					});
					scope.$apply(function () {
						if (isMultiple) {
							modelSetter(scope, values);
						} else {
							modelSetter(scope, values[0]);
						}
					});
				});
			}
		}
	}

	function emailValid(email){
		if (email != undefined && email != null && email != "")
			return true;
		else
			return false
	}

	function emailByGradesCtrl ($routeParams, $uibModal, authentication, $location){
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
			title: 'Send E-mail - by grade'
		};

		vm.allGrades = ["TK", "K", "1st", "2nd", "3rd", "4th", "5th", "6th"];

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

		vm.toggle = function(grade){
			// change to according to the select value
			angular.forEach(vm.grades, function(group, key){
				angular.forEach(group, function(data, key){
					if (key === "users") {
						angular.forEach(data, function(field, key){
							if (group._id === grade){
								if (field.select != vm.select[grade]){
									vm.checkTotal = vm.select[grade] ? vm.checkTotal + 1 : vm.checkTotal - 1
								}
//								console.log('Toggle: ' + patrol + ' ' + vm.select[patrol] + ' ' + field.select)
								field.select = vm.select[grade]
							}
						})
					}
				})
			})
		}

		// for html to display elementary grades
		vm.getStudents = function(grade){
			return grade._id == "1st" ||
			grade._id == "2nd" ||
			grade._id == "3rd" ||
			grade._id == "4th" ||
			grade._id == "5th" ||
			grade._id == "6th"
		}

		vm.toggleAll = function(){
			vm.checkTotal = 0
			angular.forEach(vm.grades, function(group, key){
				if (vm.select == undefined) {
					vm.select = []
				}
				vm.select[group._id] = vm.all
				angular.forEach(group, function(data, key){
					// group._id is not '', null works
					if (key == "users" && group._id != 'Parent' && group._id != null) {
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

			angular.forEach(vm.grades, function(group, key){
				angular.forEach(group, function(data, key){
					if (key == "users") {
						angular.forEach(data, function(field, key){
							if (field.select == true){
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
				templateUrl: './email/email.modal.html',
				controller: 'emailModalCtrl',
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
					},
					client: function(){
						return vm.client;
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
			return authentication.getStudentsByGrades(vm.client, date)
			.then(function(res){
				vm.grades = res;
				vm.counts = {
						"TK": 0,
						"K": 0,
						"1st": 0,
						"2nd": 0,
						"3rd": 0,
						"4th": 0,
						"5th": 0,
						"6th": 0
				};
				vm.total = 0;
				angular.forEach(vm.grades, function(group, key){
					// key is only a number, no use for it
//					console.log(group._id + ":" + group._id.length);
					angular.forEach(group, function(data, key){
						if (key === "users") {
							angular.forEach(data, function(child, key){							
								vm.counts[group._id]++;
								if ((group._id !== 'Parent') && (group._id !== null)) {								
									vm.total++;
								}
							})
						}
					});
				});
			});
		}
		if (!authentication.isAdmin(vm.client))		
			$location.path('/home')
		init();
	}

	function emailModalCtrl($scope, $uibModalInstance, recipients, emails, maxCnt, client, sendEmail, authentication){
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
			var senderEmail = authentication.currentUser(client).email;
			var senderName = authentication.currentUser(client).firstname + ' ' + authentication.currentUser(client).lastname;
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
	.controller('emailByGradesCtrl', emailByGradesCtrl)
	.controller('emailModalCtrl', emailModalCtrl)
	.directive('ngFileModel', ngFileModel);
})();