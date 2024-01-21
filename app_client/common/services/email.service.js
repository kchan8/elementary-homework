
(function(){

	function sendEmail($http, authentication){
		this.sendFromServer = function(senderEmail, senderName, recipients, subject, message, attachment){
			var fd = new FormData();
			// no need to use file[], need multer's array on api route
			if (attachment){
				for (var i=0; i<attachment.length; i++){
					fd.append('file', attachment[i]);
				}
			}
			fd.append('senderEmail', senderEmail);
			fd.append('senderName', senderName);
			for (var i=0; i<recipients.length; i++){
				fd.append('recipients', recipients[i]);
			}
			fd.append('subject', subject);
			fd.append('message', message);

			return $http.post('/api/email', fd, {
				transformRequest: angular.identity,
				headers: {'Content-Type': undefined,
					'Authorization': 'Bearer ' + authentication.getToken()
					}
				})
				.then(function(res){
					return res.data
				})
		}
	}
	
//	function sendSMSWOAuth($http){
//		this.sendFromServer = function(senderEmail, recipients, message){
//			var fd = new FormData();
//			fd.append('senderEmail', senderEmail);
//			for (var i=0; i<recipients.length; i++){
//				fd.append('recipients', recipients[i]);
//			}
//			fd.append('message', message);
//			return $http.post('/api/sms', fd, {
//				transformRequest: angular.identity,
//				headers: {'Content-Type': undefined}
//				})
//				.then(function(res){
//					return res.data
//				})
//		}
//	}
	
	function sendEmailWOAuth($http){
		this.sendFromServer = function(subject){
			var fd = new FormData();
			fd.append('message', subject);
			// for (var key of fd.keys()){
			// 	console.log(key + ': ' + fd.get(key))
			// }
			return $http.post('/api/op_email', fd, {
				// prevents serializing payload
				transformRequest: angular.identity,
				// assign content-type as undefined, the browser will assign the correct boundary for it
				headers: {'Content-Type': undefined}
				})
				.then(function(res){
					return res.data
				})
		}
	}

	angular
	.module('asgApp')
	.service('sendEmail', sendEmail)
	.service('sendEmailWOAuth', sendEmailWOAuth)
//	.service('sendSMSWOAuth', sendSMSWOAuth)

})();