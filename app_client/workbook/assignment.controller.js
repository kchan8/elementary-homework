(function(){
	function assignmentCtrl($routeParams, $scope, $sce, $window, $location, authentication, workbookService, $uibModal){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();
		
		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/')
			else if (!authentication.isStudent(vm.client)){
				$location.path('/' + vm.client);
			} else {
				vm.studentID = authentication.currentUser(vm.client).id;
				vm.grade = authentication.getStudentGrade(vm.client);
				vm.level = authentication.getStudentLevel(vm.client);
				workbookService.getAssignmentByGrade(vm.client, vm.grade, vm.level)
				.then(function(res){
					// these are from workbook data, convert from general to specific
					$scope.homeworks = res.data.data;
					// get homework status
					var workbookIDs = $scope.homeworks.map(function(value){
						return value._id;
					})
					workbookService.getAssignmentStatus(vm.client, vm.studentID, workbookIDs)
					.then(function(res){
						$scope.homeworks.forEach(function(homework){
							homework.status = "ASSIGN";	// set default
							// go through each homework
							res.data.data.forEach(function(entry){
								if (entry.workbookID == homework._id){
									homework.status = entry.status;
									homework.id = entry._id;
								}
							})
						})
					})
					
				})
			}
		})
		
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
		
		$scope.getHomework = function(id){
			$location.path('/' + vm.client + '/student/homework/' + id + '/0');
		}
		
		$scope.uploadHomework = function(homework){
			$uibModal.open({
				templateUrl: './workbook/upload.modal.html',
				controller: 'uploadHomeworkCtrl',
				size: 'md',
				resolve: {
					client: function(){
						return vm.client;
					},
					studentID: function(){
						return vm.studentID;
					},
					work: function(){
						return homework;
					}
//					teacherID: function(){
//						return homework.teacherID;
//					},
//					workbookID: function(){
//						return homework._id;
//					},
//					pages: function(){
//						return homework.pages;
//					}
				}
			}).result.then(function(result){
				
			}, function(res){
				// this takes care of unhandled rejection backdrop click & escape
				if (['backdrop click', 'escape key press'].indexOf(res) === -1){
					throw res;
				}
			});
		}
		
		$scope.removeHomework = function(){
			var homeworkIDs = [];
			$scope.homeworks.forEach(function(homework){
				if (homework.select){
					homeworkIDs.push(homework.id)
				}
			})
			console.log(homeworkIDs)
			workbookService.removeHomework(vm.client, homeworkIDs)
			.then(function(res){
				$window.location.reload();
			})
		}
	}
	
	function uploadHomeworkCtrl($scope, $uibModalInstance, fileUpload, client, studentID, work){
		$scope.type = 'Homework';
		$scope.record = work;
		$scope.upload = function(){
			console.log($scope.record.file.name)
			uploadUrl = "/api/workbook/uploadHomework";
			fileUpload.uploadHomeworkToUrl(client, studentID, work.teacherID, work.workbookID, work.pages, $scope.record.file, uploadUrl, function(e){
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
		};
		$scope.cancel = function(){
			$uibModalInstance.close(false);
		};
	}
	
	angular
	.module('asgApp')
	.controller('assignmentCtrl', assignmentCtrl)
	.controller('uploadHomeworkCtrl', uploadHomeworkCtrl)
})();