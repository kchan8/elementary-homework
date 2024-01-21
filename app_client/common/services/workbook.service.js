(function(){

//	workbook.$inject = ['$window', '$http', '$location'];
	function workbookService($window, $http, $location){
		var getToken = function(){
			return $window.localStorage['asgApp-token'];
		};
		
		this.getAssignmentByGrade = function(client, grade, level){
			var payload = {client: client, grade: grade, level: level};
			return $http.post('/api/workbook/getByGrade', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res);
			}, function(res){
				console.log('Something wrong in workbookService - getAssignmentByGrade');
				return (res);
			});
		}
		this.getAssignmentStatus = function(client, studentID, workbookIDs){
			var payload = {client: client, studentID: studentID, workbookIDs: workbookIDs};
			return $http.post('/api/workbook/getStatus', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res);
			}, function(res){
				console.log('Something wrong in workbookService - getAssignmentStatus');
				return (res);
			});
		}
		this.getHomeworkByTeacher = function(client, teacherID){
			var payload = {client: client, teacherID: teacherID};
			return $http.post('/api/workbook/getHomeworkByTeacher', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res);
			}, function(res){
				console.log('Something wrong in workbook.service - getHomeworkByTeacher');
				return (res);
			});
		}
		this.getWorkbookByTeacher = function(client, teacherID){
			var payload = {client: client, teacherID: teacherID};
			return $http.post('/api/workbook/getWorkbookByTeacher', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res);
			}, function(res){
				console.log('Something wrong in workbook.service - getWorkbookByTeacher');
				return (res);
			});
		}
		this.getWorkbookByID = function(client, workbookID){
			var payload = {client: client, workbookID: workbookID};
			return $http.post('/api/workbook/getByID', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res);
			}, function(res){
				console.log('Something wrong in workbook.service - getWorkbookByID');
				return (res);
			});
		}
		this.getWorkbookPDF = function(client, workbookID){
			var payload = {client: client, workbookID: workbookID};
			return $http.post('/api/workbook/getWorkbookPDF', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res);
			}, function(res){
				console.log('Something wrong in workbook.service - getWorkbookPDF');
				return (res);
			});
		}
		
		this.updateWorkbook = function(client, workbook){
			var payload = {client: client, workbook: workbook};
			return $http.post('/api/workbook/update', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res);
			}, function(res){
				console.log('Something wrong in workbook.service - updateWorkbook');
				return (res);
			});
		}
		
		this.removeWorkbook = function(client, workbookIDs){
			var payload = {client: client, workbookIDs: workbookIDs};
			return $http.post('/api/workbook/remove', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res);
			}, function(res){
				console.log('Something wrong in workbook.service - removeWorkbook');
				return (res);
			});
		}
		this.getWorkbookByPage = function(client, studentID, id, page){
			var payload = {client: client, studentID: studentID, id: id, page: page};
			return $http.post('/api/workbook/getWorkbookByPage', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res);
			}, function(res){
				console.log('Something wrong in workbook.service - getWorkbookByPage');
			});
		}
		this.saveHomework = function(client, role, id, page, png, mark, textPng, textMark, studentID, teacherID, total){
			var payload = {client: client, role: role, 
					id: id, page: page, png: png, mark: mark, textPng: textPng, textMark: textMark,
					studentID: studentID, teacherID: teacherID, total: total} 
			return $http.post('/api/workbook/saveHomework', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return(res);
			}, function(res){
				console.log('Something wrong in workbook.service - saveHomework, status: ' + res.status);
				return (res);
			});
		}
		this.saveWorkbook = function(client, id, page, png, mark, textPng, textMark){
			var payload = {client: client, id: id, page: page, png: png, mark: mark,
					textPng: textPng, textMark: textMark} 
			return $http.post('/api/workbook/saveWorkbook', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return(res);
			}, function(res){
				console.log('Something wrong in workbook.service - saveWorkbook, status: ' + res.status);
				return (res);
			});
		}
		
		this.printWorkbook = function(client, studentID, workbookID){
			var payload = {client: client, studentID: studentID, workbookID: workbookID} 
			return $http.post('/api/workbook/printWorkbook', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return(res);
			}, function(res){
				console.log('Something wrong in workbook.service - printWorkbook, status: ' + res.status);
				return (res);
			});
		}
		this.printHomework = function(client, homeworkID){
			var payload = {client: client, homeworkID: homeworkID} 
			return $http.post('/api/workbook/printHomework', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return(res);
			}, function(res){
				console.log('Something wrong in workbook.service - printHomework, status: ' + res.status);
				return (res);
			});
		}
		this.getHomeworkByPage = function(client, id, page){
			var payload = {client: client, id: id, page: page};
			return $http.post('/api/workbook/getHomeworkByPage', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res);
			}, function(res){
				console.log('Something wrong in workbook.service - getHomeworkByPage');
			});
		}
		
		this.changeHomeworkStatus = function(client, id, status){
			var payload = {client: client, id: id, status: status};
			return $http.post('/api/workbook/changeHomeworkStatus', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return(res);
			}, function(res){
				console.log('Something wrong in workbook.service - changeHomeworkStatus, status: ' + res.status);
				return (res);
			});
		}
		this.submitWorksheet = function(client, studentID, id){
			var payload = {client: client, studentID: studentID, id: id};
			return $http.post('/api/workbook/submit', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return(res);
			}, function(res){
				console.log('Something wrong in workbook.service - submitWorksheet, status: ' + res.status);
				return (res);
			});
		}
		this.reviewHomework = function(client, id){
			var payload = {client: client, id: id};
			return $http.post('/api/workbook/review', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return(res);
			}, function(res){
				console.log('Something wrong in workbook.service - reviewHomework, status: ' + res.status);
				return (res);
			});
		}
		this.removeHomework = function(client, homeworkIDs){
			var payload = {client: client, homeworkIDs: homeworkIDs};
			return $http.post('/api/workbook/removeHomework', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res);
			}, function(res){
				console.log('Something wrong in workbook.service - removeHomework');
				return (res);
			});
		}
		this.getWorkbookRecords = function(client){
			var payload = {client: client};
			return $http.post('/api/workbook/getWorkbookRecords', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res);
			}, function(res){
				console.log('Something wrong in workbookService - getWorkbookRecords');
				return (res);
			});
		}
	}
		
	angular
	.module('asgApp')
	.service('workbookService', workbookService);
})();