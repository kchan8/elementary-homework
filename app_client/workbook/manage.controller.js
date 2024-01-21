(function(){
	function workbookManageCtrl($routeParams, $scope, $location, $window, $sce, authentication, workbookService, $uibModal){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();
		
		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/');
			else if (!authentication.isTeacher(vm.client)){			
				$location.path('/' + vm.client);
			} else {
				vm.teacherID = authentication.currentUser(vm.client).id;
				// get all workbook by teacher
				workbookService.getWorkbookByTeacher(vm.client, vm.teacherID)
				.then(function(res){
					$scope.grades = res.data.data;
					$scope.oneAtATime = true;
				})
			}
		})
		
		$scope.isSuperUser = function(client){
			return authentication.isSuperUser(client);
		};
		
		$scope.editWorkbook = function(id){
			$location.path('/' + vm.client + '/teacher/workbook/' + id + '/0');
		}
		
		$scope.updateWorkbook = function(id){
			workbookService.getWorkbookByID(vm.client, id)
			.then(function(res){
				$uibModal.open({
					templateUrl: './workbook/editWorkbook.modal.html',
					controller: 'editWorkbookCtrl',
					size: 'md',
					resolve: {
						client: function(){
							return vm.client;
						},
						workbook: function(){
							return res.data.data;
						}
					}
				}).result.then(function(result){
					if (result != 'cancel')
						$window.location.reload();
				}, function(res){
					// this takes care of unhandled rejection backdrop click & escape
					if (['backdrop click', 'escape key press'].indexOf(res) === -1){
						throw res;
					}
				});
			})
		}
		
		$scope.downloadWorkbook = function(id){
			workbookService.getWorkbookPDF(vm.client, id)
			.then(function(res){
				// https://github.com/sayanee/angularjs-pdf/issues/110#issuecomment-269547160
				var base64String = res.data.data;
				var binaryImg = atob(base64String);
				var binaryImgLength = binaryImg.length;
				var arrayBuffer = new ArrayBuffer(binaryImgLength);
				var uInt8Array = new Uint8Array(arrayBuffer);
				for (var i=0; i<binaryImgLength; i++){
					uInt8Array[i] = binaryImg.charCodeAt(i);
				}
				var outputBlob = new Blob([uInt8Array], {type: 'application/pdf'});
				// https://stackoverflow.com/questions/21628378/how-to-display-blob-pdf-in-an-angularjs-app
				pdfUrl = window.URL.createObjectURL(outputBlob);
				$scope.content = $sce.trustAsResourceUrl(pdfUrl);
				var a = document.createElement('a')
				a.href = pdfUrl
				a.download = res.data.filename;
				a.click();
			})
		}
		
		$scope.uploadWorkbook = function(workbook){
			$uibModal.open({
				templateUrl: './workbook/upload.modal.html',
				controller: 'uploadWorkbookCtrl',
				size: 'md',
				resolve: {
					client: function(){
						return vm.client;
					},
					workbook: function(){
						return workbook;
					}
				}
			}).result.then(function(result){
				if (result != 'cancel')
					$window.location.reload();
			}, function(res){
				// this takes care of unhandled rejection backdrop click & escape
				if (['backdrop click', 'escape key press'].indexOf(res) === -1){
					throw res;
				}
			});
		}
		
		$scope.removeWorkbook = function(){
			// remove only after expire day
			var workbookIDs = [];
			$scope.grades.forEach(function(grade){
				grade.workbooks.forEach(function(workbook){
					if (workbook.select){
						workbookIDs.push(workbook._id)
					}
				})
			})
			console.log(workbookIDs)
			workbookService.removeWorkbook(vm.client, workbookIDs)
			.then(function(res){
				$window.location.reload();
			})
		}
	}
	
	function editWorkbookCtrl($scope, $uibModalInstance, workbookService, client, workbook){
		$scope.workbook = workbook;
		$scope.workbook.dueDate = new Date(workbook.due);
		$scope.workbook.expireDate = new Date(workbook.expire);
		$scope.format = 'M/d/yy';
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
		$scope.update = function(){
			workbook.due = workbook.dueDate;
			workbook.expire = workbook.expireDate;
			workbookService.updateWorkbook(client, workbook)
			.then(function(res){
				$uibModalInstance.close('save');
			})
		}
		
		$scope.cancel = function(){
			$uibModalInstance.close('cancel')
		}
	}
	
	function uploadWorkbookCtrl($scope, $uibModalInstance, fileUpload, client, workbook){
		$scope.type = 'Workbook';
		$scope.record = workbook;
		$scope.upload = function(){
			if ($scope.record.file != undefined){
				console.log($scope.record.file.name)
				console.log(workbook)
				workbook.dueDate = workbook.due;
				workbook.expireDate = workbook.expire;
				uploadUrl = "/api/workbook/uploadWorkbook";
				fileUpload.uploadWorkbookToUrl(client, workbook, uploadUrl, workbook.teacherID, function(e){
					if (e.lengthComputable){
						if (e.loaded > 0){
							$scope.showProgress = true;
						}
						var progress = (e.loaded / e.total) * 100;
						$scope.progressBar = progress.toFixed(2);
					}
				})
				.then(function(res){
					$uibModalInstance.close('save');
				})
				.catch(function(err){
					$scope.formError = err.data.message;
					console.log(err)
				})
			} else {
				$scope.formError = 'No file specified'
			}
		};
		$scope.cancel = function(){
			$uibModalInstance.close(false);
		};
	}
	
	angular
	.module('asgApp')
	.controller('workbookManageCtrl', workbookManageCtrl)
	.controller('editWorkbookCtrl', editWorkbookCtrl)
	.controller('uploadWorkbookCtrl', uploadWorkbookCtrl)
	
})();