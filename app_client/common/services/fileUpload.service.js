(function(){

	function fileUpload($http, authentication){
		this.uploadFileToUrl = function(client, file, uploadUrl){
			var fd = new FormData();
			fd.append('client', client);
			fd.append('file', file);

			return $http.post(uploadUrl, fd, {
				transformRequest: angular.identity,
				headers: {'Content-Type': undefined}
			})
			.then(function(res){
				return res.data;
			});
		};
		
		this.uploadWorkbookToUrl = function(client, workbook, uploadUrl, teacherID, progressCB){
			var fd = new FormData();
			fd.append('client', client);
			fd.append('grade', workbook.grade);
			fd.append('subject', workbook.subject);
			fd.append('chapter', workbook.chapter);
			fd.append('lesson', workbook.lesson);
			fd.append('description', workbook.description);
			fd.append('teacherID', teacherID);
			fd.append('dueDate', workbook.dueDate);
			fd.append('expireDate', workbook.expireDate);
			fd.append('studentPenColor', workbook.studentPenColor);
			fd.append('teacherPenColor', workbook.teacherPenColor);
			
			fd.append('file', workbook.file);
//			var pages = workbook.files.length;
//			for (var x=0; x<pages; x++){
//				fd.append('file', workbook.files[x]);
//			}
			
			console.log('in uploadWorkbookToUrl...')
			return $http.post(uploadUrl, fd, {
				transformRequest: angular.identity,
				headers: {'Content-Type': undefined,
					'Authorization': 'Bearer ' + authentication.getToken()
					},
				// https://stackoverflow.com/questions/45409067/how-to-show-progress-bar-for-file-upload-using-angularjs
				uploadEventHandlers:{progress: progressCB}
				})
				.then(function(res){
					return res;
				});
		};
		
		this.uploadHomeworkToUrl = function(client, studentID, teacherID, workbookID, pages, file, uploadUrl, progressCB){
			// homework may or may not exist in DB
			// Case 1: Student print out workbook and work on paper => no homework record
			//	create a homework record
			// Case 2: Student started online, then print out to work till finish => homework exists
			// need to allow student to print out online partially done homework
			var fd = new FormData();
			fd.append('client', client);
			fd.append('studentID', studentID);
			fd.append('teacherID', teacherID);
			fd.append('workbookID', workbookID);
			fd.append('pages', pages);
			fd.append('file', file);
			
			return $http.post(uploadUrl, fd, {
				transformRequest: angular.identity,
				headers: {'Content-Type': undefined,
					'Authorization': 'Bearer ' + authentication.getToken()
					},
				// https://stackoverflow.com/questions/45409067/how-to-show-progress-bar-for-file-upload-using-angularjs
				uploadEventHandlers:{progress: progressCB}
				})
				.then(function(res){
					return res;
				});
		};
	}

	angular
	.module('asgApp')
	.service('fileUpload', fileUpload);
})();