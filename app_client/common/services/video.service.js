(function(){

//	videoService.$inject = ['$window', '$http', '$location'];
	function videoService($window, $http, $location){
		var getToken = function(){
			return $window.localStorage['asgApp-token'];
		};
		
		this.upload = function(client, teacherID, video){
			var payload = {client: client, teacherID: teacherID, video: video};
			return $http.post('/api/video/upload', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res);
			}, function(res){
				console.log('Something wrong in video.service - upload');
				return (res);
			});
		}
		this.getByTeacher = function(client, teacherID){
			var payload = {client: client, teacherID};
			return $http.post('/api/video/getByTeacher', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res);
			}, function(res){
				console.log('Something wrong in videoService - getByTeacher');
				return (res);
			});
		}
		this.getByID = function(client, videoID){
			var payload = {client: client, videoID: videoID};
			return $http.post('/api/video/getByID', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res);
			}, function(res){
				console.log('Something wrong in video.service - getByID');
				return (res);
			});
		}
		this.update = function(client, video){
			var payload = {client: client, video: video};
			return $http.post('/api/video/update', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res);
			}, function(res){
				console.log('Something wrong in video.service - update');
				return (res);
			});
		}
		this.remove = function(client, videoIDs){
			var payload = {client: client, videoIDs: videoIDs};
			return $http.post('/api/video/remove', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res);
			}, function(res){
				console.log('Something wrong in video.service - remove');
				return (res);
			});
		}
		
		this.getByGrade = function(client, grade, level){
			var payload = {client: client, grade: grade, level: level};
			return $http.post('/api/video/getByGrade', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res);
			}, function(res){
				console.log('Something wrong in videoService - getByGrade');
				return (res);
			});
		}
		this.getRecords = function(client){
			var payload = {client: client};
			return $http.post('/api/video/getRecords', payload, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res);
			}, function(res){
				console.log('Something wrong in videoService - getRecords');
				return (res);
			});
		}
	}
		
	angular
	.module('asgApp')
	.service('videoService', videoService);
})();
		
		