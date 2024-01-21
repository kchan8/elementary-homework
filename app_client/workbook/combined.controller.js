(function(){
	function combinedCtrl($routeParams, $scope, $location, $window, authentication, workbookService, $uibModal){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();
		vm.role = $routeParams.role.toLowerCase();  // student, teacher or null
		vm.doc = $routeParams.doc.toLowerCase();	// student - homework, teacher - homework/workbook
		vm.id = $routeParams.id;   // student: workbook ID, teacher: homework ID
		vm.page = parseInt($routeParams.page, 10);
		vm.student = vm.role == 'student';
		vm.studentPenColor = '#000000';
		vm.teacher = vm.role == 'teacher';
		vm.teacherID = 0;
		vm.teacherPenColor = ['#ff0000', '#008000'];
		vm.mode = 'Draw';
		
		vm.mouseX = 0;
		vm.mouseY = 0;
		vm.startingX = 0;
		vm.lastMouseX = [];
		vm.recentWords = [];
		vm.undoList = [];
		vm.textCmdList = [];
		
		$scope.drawButtonClass = 'draw-button-inactive';
		$scope.eraseButtonClass = 'erase-button-inactive';
		
		var homework = document.getElementById('homework');
		var homeworkCtx = homework.getContext('2d');
		var text = document.getElementById('text');
		var textCtx = text.getContext('2d');
		
		var drawing = new SignaturePad(document.getElementById('homework'), {
			minWidth: 1,
			maxWidth: 1,
			backgroundColor: 'rgba(255, 255, 255, 0)',
			penColor: 'rgb(0, 0, 0)'
		});
		
		var setActiveButtonColor = function(colorStr){
			vm.color = colorStr;
			switch(colorStr){
				case 'teacherPen1': 
					drawing.penColor = vm.teacherPenColor[0];
					break;
				case 'teacherPen2': 
					drawing.penColor = vm.teacherPenColor[1];
					break;
				case 'studentPen': 
					drawing.penColor = vm.studentPenColor;
					break;
			}
			textCtx.fillStyle = drawing.penColor;
			if (colorStr == 'studentPen')
				$scope.studentPenStyle = {"color":"#ffffff", "background-color":vm.studentPenColor}
			else
				$scope.studentPenStyle = {"color":vm.studentPenColor, "background-color":"#ffffff"}
			if (colorStr == 'teacherPen1')
				$scope.teacherPen1Style = {"color":"#000000", "background-color":vm.teacherPenColor[0]}
			else
				$scope.teacherPen1Style = {"color":vm.teacherPenColor[0], "background-color":"#ffffff"}
			if (colorStr == 'teacherPen2')
				$scope.teacherPen2Style = {"color":"#000000", "background-color":vm.teacherPenColor[1]}
			else
				$scope.teacherPen2Style = {"color":vm.teacherPenColor[1], "background-color":"#ffffff"}
		} 
		
		var setDrawMode = function(colorStr){
			homeworkCtx.globalCompositeOperation = 'source-over'; // default value
			drawing.minWidth = 1;
			drawing.maxWidth = 1;
			setActiveButtonColor(colorStr);
		};
		
		var changeDetected = function(){
			var currentData = drawing.toData();
			if (currentData.length != vm.startData.length){
				return true;
			} else if (vm.textCmdList.length != vm.startText.length){
				return true;
			} else if (currentData.length == 0){
				return false;
			} else {
				var topIndex = vm.startData.length-1;
				if (currentData[topIndex][0].time != vm.startData[topIndex][0].time){
					return true
				} else {
					return false;
				}
			}
		}
		
		var saveWork = function(client, studentID, id, page){
			vm.startData = drawing.toData().slice();
			vm.startText = vm.textCmdList.slice();
			var png = drawing.toDataURL('image/png');
			var mark = drawing.toData();
			var textPng = text.toDataURL();
			var textMark = vm.textCmdList;
			if (vm.teacher && vm.doc=='workbook'){
				return workbookService.saveWorkbook(client, id, page, png, mark, textPng, textMark);
			} else
				return workbookService.saveHomework(client, vm.role, id, page, png, mark, textPng, textMark, studentID, vm.teacherID, vm.totalPages);
		}
		
		var screenUpdate = function(){
			homeworkCtx.canvas.width = vm.dim.width;
			homeworkCtx.canvas.height = vm.dim.height;
			textCtx.canvas.width = vm.dim.width;
			textCtx.canvas.height = vm.dim.height;
			
			$scope.tagTop = vm.dim.height + 60 + "px";
			drawing.clear();	// clear screen
			if (vm.previousWork.rawData.length != 0){
				drawing.fromData(vm.previousWork.rawData);
			}
			vm.startData = drawing.toData().slice();
			// set to Draw mode on start
			if (!vm.disableDraw){
				drawing.on();
				$scope.drawButtonClass = 'draw-button-active';
			} else {
				drawing.off();
				$scope.drawButtonClass = 'draw-button-inactive';
			}
			vm.draw = true;
			vm.mode = 'Draw';
			$scope.homeworkLocClass = 'drawing';
			$scope.eraseButtonClass = 'erase-button-inactive';
			
			textCtx.font = "16px Arial";
			vm.lastMouseX = [];
			vm.recentWords = [];
			vm.undoList = [];
			vm.textCmdList = [];
			saveState();
			if (vm.previousWork.text.length != 0){
				vm.previousWork.text.forEach(function(entry){
					putText(entry.x, entry.y, entry.key, entry.color);
				})
			}
			vm.startText = vm.textCmdList.slice();
			setActiveButtonColor(vm.color);
		}
		
		$scope.colorButton = function($event){
			$event.target.blur();
			setDrawMode($event.target.id);
		}
		
		var jumpToPage = function(client, studentID, id, page){
			if (vm.student){					
				workbookService.getWorkbookByPage(client, studentID, id, page)
				.then(function(res){
					vm.teacherID = res.data.teacherID;
					vm.totalPages = res.data.totalPages;
					if (vm.page >= vm.totalPages)
						vm.page = vm.totalPages - 1;
					vm.dim = res.data.dim;
					vm.workbook = res.data.workbook;
					vm.previousWork = {rawData: res.data.studentMark,
							text: res.data.studentTextMark,
							status: res.data.status};
					vm.studentPenColor = res.data.studentPenColor;
					vm.disableDraw = vm.previousWork.status != 'ASSIGN';
					setActiveButtonColor('studentPen');
					screenUpdate();
				})
				.catch(function(err){
					$location.path('/' + vm.client + '/student/assignment');
				})
			} else if (vm.teacher) {
				if (vm.doc == 'homework'){
					workbookService.getHomeworkByPage(client, id, page)
					.then(function(res){
						vm.totalPages = res.data.totalPages;
						if (vm.page >= vm.totalPages)
							vm.page = vm.totalPages - 1;
						vm.dim = res.data.dim;
						vm.studentName = res.data.student;
						vm.workbook = res.data.workbook;
						vm.previousWork = {rawData: res.data.teacherMark,
								text: res.data.teacherTextMark,
								status: res.data.status};
						vm.teacherPenColor = res.data.teacherPenColor;
						// need to set true if allow teacher to mark before student submit
						vm.disableDraw = vm.previousWork.status == 'ASSIGN';
						setActiveButtonColor('teacherPen1');
						screenUpdate();
					})
					.catch(function(err){
						$location.path('/' + vm.client + '/teacher/homework/review');
					})
				} else if (vm.doc == 'workbook'){
					workbookService.getWorkbookByPage(client, '0', id, page)
					.then(function(res){
						vm.teacherID = res.data.teacherID;
						vm.totalPages = res.data.totalPages;
						if (vm.page >= vm.totalPages)
							vm.page = vm.totalPages - 1;
						vm.dim = res.data.dim;
						vm.workbook = res.data.workbook;
						vm.previousWork = {rawData: res.data.teacherMark,
								text: res.data.teacherTextMark,
								status: res.data.status};
						vm.teacherPenColor = res.data.teacherPenColor;
						vm.disableDraw = false;
						setActiveButtonColor('teacherPen2');
						screenUpdate();
					})
					.catch(function(err){
						$location.path('/' + vm.client + '/teacher/workbook/manage');
					})
				}
			}
		}
		
		var switchMenuLoc = function(side){
			var menu = angular.element(document.getElementById('col-menu'));
			if (side.toLowerCase() == 'left'){
				$scope.menuLoc = 'Right';
				$scope.nameTag = 'nameTagLeft';
				$scope.workbookLocClass = 'wrapper-right'; // set both 
				$scope.homeworkLocClass = 'drawing-pass';
				$scope.textLocClass = 'drawing';
				menu.removeClass('fixed-right')
				menu.addClass('fixed-left')
			} else {
				$scope.menuLoc = 'Left';
				$scope.nameTag = 'nameTagRight';
				$scope.workbookLocClass = 'wrapper-left';
				$scope.homeworkLocClass = 'drawing-pass';
				$scope.textLocClass = 'drawing';
				menu.removeClass('fixed-left')
				menu.addClass('fixed-right')
			}
		}
		
		$scope.getNext = function($event){
			$event.target.blur();
			if (vm.page + 1 < vm.totalPages){				
				if (changeDetected()){
					$uibModal.open({
						templateUrl: './workbook/popup.modal.html',
						controller: 'popUpCtrl',
						size: 'md',
						resolve: {
							message: function(){
								return "Save changes before proceed?"
							},
							type: function(){
								return 'prevNext'
							}
						}
					}).result.then(function(result){
						if (result == 'save'){
							saveWork(vm.client, vm.studentID, vm.id, vm.page)
							.then(function(res){
								if (res.status == 200){
									vm.page += 1;
									jumpToPage(vm.client, vm.studentID, vm.id, vm.page);
								}
							})
						} else if (result == 'discard'){
							vm.page += 1;
							jumpToPage(vm.client, vm.studentID, vm.id, vm.page);
						}
					}, function(res){
						// this takes care of unhandled rejection backdrop click & escape
						if (['backdrop click', 'escape key press'].indexOf(res) === -1){
							throw res;
						}
					});
				} else {
					vm.page += 1;
					jumpToPage(vm.client, vm.studentID, vm.id, vm.page);
				}
			}
		}
		
		$scope.getPrev = function($event){
			$event.target.blur();
			if (vm.page > 0){
				if (changeDetected()){
					$uibModal.open({
						templateUrl: './workbook/popup.modal.html',
						controller: 'popUpCtrl',
						size: 'md',
						resolve: {
							message: function(){
								return "Save changes before proceed?"
							},
							type: function(){
								return 'prevNext'
							}
						}
					}).result.then(function(result){
						if (result == 'save'){
							
							saveWork(vm.client, vm.studentID, vm.id, vm.page)
							.then(function(res){
								if (res.status == 200){
									vm.page -= 1;
									jumpToPage(vm.client, vm.studentID, vm.id, vm.page);
								}
							})
						} else if (result == 'discard'){
							vm.page -= 1;
							jumpToPage(vm.client, vm.studentID, vm.id, vm.page);
						}
					}, function(res){
						// this takes care of unhandled rejection backdrop click & escape
						if (['backdrop click', 'escape key press'].indexOf(res) === -1){
							throw res;
						}
					});
				} else {
					vm.page -= 1;
					jumpToPage(vm.client, vm.studentID, vm.id, vm.page);
				}
			}
		}
		
		$scope.drawButton = function($event){
			$event.target.blur();
			if (!vm.draw){
				vm.draw = true;
				vm.mode = 'Draw'
				drawing.on();
				setDrawMode(vm.color);
				$scope.drawButtonClass = 'draw-button-active';
				$scope.eraseButtonClass = 'erase-button-inactive';
				$scope.homeworkLocClass = 'drawing';
			} else {
				vm.draw = false;
				vm.mode = 'Text';
				drawing.off();
				$scope.drawButtonClass = 'draw-button-inactive';
				$scope.homeworkLocClass = 'drawing-pass';
			}
		}
		$scope.eraseButton = function(){
			homeworkCtx.globalCompositeOperation = 'destination-out';
			drawing.maxWidth = 10;
			$scope.eraseButtonClass = 'erase-button-active';
			$scope.drawButtonClass = 'draw-button-inactive';
			drawing.on();
			vm.draw = false;
		}
		$scope.clearButton = function($event){
			$event.target.blur();
			var mark = drawing.toData();
			if (mark.length != 0){
				$uibModal.open({
					templateUrl: './workbook/popup.modal.html',
					controller: 'popUpCtrl',
					size: 'md',
					resolve: {
						message: function(){
							return "Please confirm to clear current page."
						},
						type: function(){
							return 'clearAll'
						}
					}
				}).result.then(function(result){
					if (result == 'clearAll'){
						drawing.clear();
					}
				}, function(res){
					// this takes care of unhandled rejection backdrop click & escape
					if (['backdrop click', 'escape key press'].indexOf(res) === -1){
						throw res;
					}
				});
			}
		}
		$scope.undoButton = function($event){
			$event.target.blur();
			var data = drawing.toData();
			if (data) {
				x = data.pop();
				drawing.fromData(data);
			}
			setActiveButtonColor(vm.color);
		}
		
		$scope.saveButton = function($event){
			$event.target.blur();
			saveWork(vm.client, vm.studentID, vm.id, vm.page);
		};
		
		$scope.submit = function($event){
			$event.target.blur();
			if (vm.student){
				$uibModal.open({
					templateUrl: './workbook/popup.modal.html',
					controller: 'popUpCtrl',
					size: 'md',
					resolve: {
						message: function(){
							return "Are you done with all pages? You can't make change after marking it DONE, please confirm."
						},
						type: function(){
							return 'submit'
						}
					}
				}).result.then(function(result){
					if (result == 'submit'){
						vm.disableDraw = true;
						drawing.off();
						$scope.drawButtonClass = 'draw-button-inactive';
						if (changeDetected()){
							saveWork(vm.client, vm.studentID, vm.id, vm.page)
							.then(function(){
								workbookService.submitWorksheet(vm.client, vm.studentID, vm.id);
							})
						} else
							workbookService.submitWorksheet(vm.client, vm.studentID, vm.id);
					}
				}, function(res){
					// this takes care of unhandled rejection backdrop click & escape
					if (['backdrop click', 'escape key press'].indexOf(res) === -1){
						throw res;
					}
				});
			} else if (vm.teacher && vm.doc == 'homework'){
				if (changeDetected()){
					$uibModal.open({
						templateUrl: './workbook/popup.modal.html',
						controller: 'popUpCtrl',
						size: 'md',
						resolve: {
							message: function(){
								return "Save changes before proceed?"
							},
							type: function(){
								return 'prevNext'
							}
						}
					}).result.then(function(result){
						if (result == 'save'){
							saveWork(vm.client, vm.studentID, vm.id, vm.page)
							.then(function(res){
								if (res.status == 200){
									workbookService.reviewHomework(vm.client, vm.id);
								}
							})
						} else if (result == 'discard'){
							workbookService.reviewHomework(vm.client, vm.id);
						}
					}, function(res){
						// this takes care of unhandled rejection backdrop click & escape
						if (['backdrop click', 'escape key press'].indexOf(res) === -1){
							throw res;
						}
					});
				} else {
					workbookService.reviewHomework(vm.client, vm.id);
				}
				// no submit for teacher editing workbook
			}
		}
		
		$scope.switchMenu = function($event){
			$event.target.blur();
			if ($scope.menuLoc == 'Right'){
				switchMenuLoc('right');
			} else {
				switchMenuLoc('left');
			}
		}
		$scope.print = function($event){
			$event.target.blur();
			if (vm.student){
				// for student, vm.id is workbookID
				workbookService.printWorkbook(vm.client, vm.studentID, vm.id)
				.then(function(res){
					var doc = new jsPDF('p', 'pt', 'a4');
					for (var i=0; i<res.data.png.length; i++){
						if (i > 0)
							doc.addPage();
						doc.addImage(res.data.png[i], 'png', 0, 0, res.data.dim[i].width, res.data.dim[i].height);
					}
					doc.save(res.data.filename)
				})
			} else if (vm.teacher && vm.doc == 'workbook'){
				workbookService.printWorkbook(vm.client, '0', vm.id)
				.then(function(res){
					var doc = new jsPDF('p', 'pt', 'a4');
					for (var i=0; i<res.data.png.length; i++){
						if (i > 0)
							doc.addPage();
						doc.addImage(res.data.png[i], 'png', 0, 0, res.data.dim[i].width, res.data.dim[i].height);
					}
					doc.save(res.data.filename)
				})
			} else {
				workbookService.printHomework(vm.client, vm.id)
				.then(function(res){
					var doc = new jsPDF('p', 'pt', 'a4');
					for (var i=0; i<res.data.png.length; i++){
						if (i > 0)
							doc.addPage();
						doc.addImage(res.data.png[i], 'png', 0, 0, res.data.dim[i].width, res.data.dim[i].height);
					}
					doc.save(res.data.filename)
				})
			}
		}
		
		$scope.clickForText = function($event){
			vm.mouseX = $event.pageX - 80;
			vm.mouseY = $event.pageY - 50;
			vm.startingX = vm.mouseX;
		}
		var saveState = function(){
			vm.undoList.push(text.toDataURL());
		}
		
		var undo = function(){
			if (vm.undoList.length > 1){
				vm.undoList.pop();
				var imgData = vm.undoList[vm.undoList.length - 1];
				var image = new Image();
				image.src = imgData;
				image.onload = function(){
					textCtx.clearRect(0, 0, homework.width, homework.height);
					textCtx.drawImage(image, 0, 0, homework.width, homework.height, 0, 0, homework.width, homework.height);
				};
			}
		}
		var putText = function(x, y, keyCode, color){
			if (color != null)
				textCtx.fillStyle = color;
			textCtx.fillText(keyCode, x, y);
			vm.mouseX += textCtx.measureText(keyCode).width;
			saveState();	// for current session
			vm.recentWords.push(keyCode);
			vm.textCmdList.push({x:x, y:y, key:keyCode, color:drawing.penColor})
		}
		document.addEventListener('keydown', function(e){
			textCtx.font = "16px Arial";
			if (!vm.draw){
				if (e.keyCode === 8){
					// firefox - about:config, search browser.backspace_action, set 2
					undo();
					if (vm.recentWords.length > 0){
						var recentWord = vm.recentWords[vm.recentWords.length - 1];
						if (recentWord === 13){
							vm.mouseX = vm.lastMouseX.pop();
							vm.mouseY -= 20;
						} else {
							vm.mouseX -= textCtx.measureText(recentWord).width;
							lastRec = vm.textCmdList.pop();
							vm.mouseX = lastRec.x;
							vm.mouseY = lastRec.y;
						}
						vm.recentWords.pop();
					}
				} else if (e.keyCode === 13){
					vm.lastMouseX.push(vm.mouseX);
					vm.mouseX = vm.startingX;
					vm.mouseY += 20;
					saveState();
					vm.recentWords.push(e.keyCode);
				} else if (e.shiftKey){
					var shiftKey = String.fromCharCode(e.keyCode)
					if (e.keyCode != 16){
						if (e.keyCode == 48) shiftKey = ')';
						if (e.keyCode == 49) shiftKey = '!';
						if (e.keyCode == 50) shiftKey = '@';
						if (e.keyCode == 51) shiftKey = '#';
						if (e.keyCode == 52) shiftKey = '$';
						if (e.keyCode == 53) shiftKey = '%';
						if (e.keyCode == 54) shiftKey = '^';
						if (e.keyCode == 55) shiftKey = '&';
						if (e.keyCode == 56) shiftKey = '*';
						if (e.keyCode == 57) shiftKey = '(';
						if (e.keyCode == 186) shiftKey = ':';
						if (e.keyCode == 187) shiftKey = '+';
						if (e.keyCode == 188) shiftKey = '<';
						if (e.keyCode == 189) shiftKey = '_';
						if (e.keyCode == 190) shiftKey = '>';
						if (e.keyCode == 191) shiftKey = '?';
						if (e.keyCode == 192) shiftKey = '~';
						if (e.keyCode == 219) shiftKey = '{';
						if (e.keyCode == 220) shiftKey = '|';
						if (e.keyCode == 221) shiftKey = '}';
						if (e.keyCode == 222) shiftKey = '"';
						putText(vm.mouseX, vm.mouseY, shiftKey)
					}
				} else {
					putText(vm.mouseX, vm.mouseY, e.key);
				}
			}
		})
		
		if (!authentication.isLoggedIn(vm.client)){
			$location.path('/' + vm.client)
		} else {
			vm.studentID = authentication.currentUser(vm.client).id;
		}
		
		switchMenuLoc('left');
		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid || !(vm.student || vm.teacher))
				$location.path('/');
			else if (vm.student && !authentication.isStudent(vm.client) ||
					 vm.student && (vm.doc != 'homework') ||
					 vm.teacher && !authentication.isTeacher(vm.client)){
				$location.path('/' + vm.client);
			} else {
				jumpToPage(vm.client, vm.studentID, vm.id, vm.page);
			}
		})
		
		var allButtons = angular.element(document.getElementsByClassName('btn'));
		$scope.screenWidth = $window.innerWidth;
		angular.element($window).bind('resize', function(){
			if ($window.innerWidth < 500){
				for (i=0; i<allButtons.length; i++){
					allButtons[i].classList.remove('btn-lg')		  
					allButtons[i].classList.add('btn-md')		  
				}
			} else {
				for (i=0; i<allButtons.length; i++){
					allButtons[i].classList.remove('btn-md')		  
					allButtons[i].classList.add('btn-lg')		  
				}
			}
			$scope.screenWidth = $window.innerWidth;
			$scope.$apply();
		})
	}
	// handle prev/next(save, discard, cancel), clearAll(clear, cancel), submit(submit (after save if change), cancel)
	function popUpCtrl($scope, $uibModalInstance, message, type){
		$scope.prevNext = false;
		$scope.clear = false;
		$scope.submit = false;
		switch (type){
			case 'prevNext': $scope.prevNext = true;
				break;
			case 'clearAll': $scope.clear = true;
				break;
			case 'submit': $scope.submit = true;
				break;
		}
		$scope.message = message;
		$scope.clearAll = function(){
			$scope.$close('clearAll');
		}
		$scope.goSubmit = function(){
			$scope.$close('submit');
		}
		$scope.save = function(){
			$scope.$close('save');
		};
		$scope.discard = function(){
			$scope.$close('discard');
		};
		$scope.cancel = function(){
			$uibModalInstance.close(false);
		};
	}
	
	angular
	.module('asgApp')
	.controller('combinedCtrl', combinedCtrl)
	.controller('popUpCtrl', popUpCtrl)
})();