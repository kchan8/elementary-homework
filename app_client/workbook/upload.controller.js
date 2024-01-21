(function(){
//	view: https://codepen.io/Sebus059/pen/MwMQbP 
//	one reference:
//	http://www.encodedna.com/angularjs/tutorial/angularjs-file-upload-using-http-post-formdata-webapi.htm
	function customChange($parse){
		return {
			restrict: 'A',
			link: function (scope, element, attrs){
				// option 1
				// https://gist.github.com/CMCDragonkai/6282750 method #4
//				var onChangeFunc = scope.$eval(attrs.customChange)
				// bind deprecated, use on, execute the function specified in the attribute value
//				element.on('change', onChangeFunc)
				// option 2
//				element.on('change', function(){
//				scope.$eval(attrs.customChange)()
//				})
				// option 3
				var model = $parse(attrs.customChange);
				var modelSetter = model.assign;
				element.on('change', function(){
					scope.$apply(function(){
						modelSetter(scope, element[0].files[0]);
					});
				});
			}
		};
	}

//	fileUpload is service (controller -> service)
	function workbookUploadCtrl ($routeParams, $scope, fileUpload, authentication, $location){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();
		
		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/')
			else {
				$scope.workbook = {};
				$scope.workbook.dueDate = new Date(new Date().getTime() + 14 * 24 * 3600 * 1000);
				$scope.workbook.expireDate = new Date(new Date().getTime() + 28 * 24 * 3600 * 1000);
				$scope.workbook.studentPenColor = '#000000';
				$scope.workbook.teacherPenColor = [];
				$scope.workbook.teacherPenColor.push('#ff0000');
				$scope.workbook.teacherPenColor.push('#008000');
				vm.teacherID = authentication.currentUser(vm.client).id;
			}
		});
		
		$scope.format = 'M/d/yy';
		$scope.popup1 = {
			opened: false
		};
		$scope.open1 = function(){
			$scope.popup1.opened = true;
		};
		$scope.popup2 = {
			opened: false
		};
		$scope.open2 = function(){
			$scope.popup2.opened = true;
		};
		
		$scope.updatePages = function(){
			$scope.formError = "";
			if ($scope.workbook.pages != '')
				$scope.workbook.pages = parseInt($scope.workbook.pages, 10);
			else
				$scope.workbook.pages = 0;
		}
		
		checkFilename = function(files, pages){
			// paths can be different
			var pdfFile;
			var pngFile = new Array(pages).fill("");
			for(var i=0; i<files.length; i++){
				var extension = files[i].name.split('.').pop().toLowerCase();
				if (extension == 'pdf'){
					pdfFile = files[i].name;
				} else if (extension == 'png'){
					if (pages == 1){	// only 1 png file
						pngFile[0] = files[i].name;
					} else {
						var pngPage = files[i].name.split('-').pop();
						if (pngPage == files[i].name){
							$scope.formError = "PNG file " + files[i].name + " not in correct format"; // checked
							return false;
						}
						// need to catch if the page number is wrong
						var fileIndex = parseInt(pngPage.substring(0, 2)) - 1;
						if (fileIndex >= pages){
							$scope.formError = "PNG file " + files[i].name + " index out of bound."; // checked
							return false;
						}
						pngFile[fileIndex] = files[i].name;
					}
				} else {
					$scope.formError = "Unknown file extension: " + files[i].name; // checked
					return false;
				}
			}
			if (pdfFile == null){
				$scope.formError = "No PDF file specified"; // checked
				return false;
			}
			for(var i=0; i<pngFile.length; i++){
				if (pngFile[i] === ""){
					$scope.formError = "Missing the page " + (i+1) + " png file"; // checked
					return false;
				}
			}
			// check name if they are the same
			var name = pdfFile.split('\\').pop().split('/').pop().slice(0, -4).toLowerCase();
			for (var i=0; i<pngFile.length; i++){
				if (pages == 1)
					var pngName = pngFile[i].split('\\').pop().split('/').pop().slice(0, -4).toLowerCase();
				else
					var pngName = pngFile[i].split('\\').pop().split('/').pop().slice(0, -7).toLowerCase();
				if (name !== pngName){
					$scope.formError = "File " + pngFile[i] + " is invalid, expect " + name;
					return false;
				}
			}
			return true;
		}
		$scope.clear = function(){
			$scope.formError = "";
		}
		
		$scope.upload = function(){
			// only submit when all files specified
			var uploadUrl;
			$scope.formError = "";
			if ($scope.workbook == undefined){
				$scope.formError = "No data entered, please try again.";
			} else if ($scope.workbook.subject == undefined){
				$scope.formError = "No subject entered, please try again.";
			} else if ($scope.workbook.description == undefined){
				$scope.formError = "No description entered, please try again.";	
			} else if ($scope.workbook.file !== undefined){
				if ($scope.workbook.file.name.split('.').pop().toLowerCase() != 'pdf'){
					$scope.formError = "Only PDF file accepted, please try again.";	
				} else {
					var fsize = $scope.workbook.file.size;
					fsize = fsize / 1024 / 1024;
					if (fsize > 15){
						$scope.formError = "Upload files size exceed 15 MB limit.";
					} else {
						uploadUrl = "/api/workbook/uploadWorkbook";
						fileUpload.uploadWorkbookToUrl(vm.client, $scope.workbook, uploadUrl, vm.teacherID, function(e){
							if (e.lengthComputable){
								if (e.loaded > 0){
									$scope.showProgress = true;
								}
								var progress = (e.loaded / e.total) * 100;
								$scope.progressBar = progress.toFixed(2);
							}
						})
						.then(function(res){
							$scope.showProgress = false;
							$scope.formError = res.data.message;
							$scope.workbook = {};
							$scope.workbook.dueDate = new Date(new Date().getTime() + 14 * 24 * 3600 * 1000);
							$scope.workbook.expireDate = new Date(new Date().getTime() + 28 * 24 * 3600 * 1000);
							$scope.workbook.studentPenColor = '#000000';
							$scope.workbook.teacherPenColor = [];
							$scope.workbook.teacherPenColor.push('#ff0000');
							$scope.workbook.teacherPenColor.push('#008000');
						})
						.catch(function(error){
							$scope.showProgress = false;
							$scope.formError = "Upload " + fsize.toFixed(2) + " MB failed: " + error.data.message;
						});
					}
				}
				
			} else {
				if ($scope.formError == "")
					$scope.formError = "No upload files specified.";
			}
		};
	}

	angular
	.module('asgApp')
	.controller('workbookUploadCtrl', workbookUploadCtrl)
	.directive('customChange', customChange);

})();