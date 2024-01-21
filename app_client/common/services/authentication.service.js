//info: https://toddmotto.com/factory-versus-service
//service acts as a constructor that is invoked once at runtime with new, like api
(function(){

//	authentication.$inject = ['$window', '$http', '$location'];
	function authentication($window, $http, $location){
		var checkClient = function(client){
			var data = {client: client};
			return $http.post('/api/checkClient', data)
			.then(function(res){
				return(res.data);
			});
		};
		
		var saveToken = function(token){
			$window.localStorage['asgApp-token'] = token;
		};
		var getToken = function(){
			return $window.localStorage['asgApp-token'];
		};
		var login = function(user){
			return $http.post('/api/login', user)
			.then(function(res){
				saveToken(res.data.token);
				// return nothing if successful
			}, function(res){
//				console.log(res.data.message);
				return (res.data);
			});
		};
		
		var logout = function(){
			$window.localStorage.removeItem('asgApp-token');
		};
		
		var signup = function(user){
			return $http.post('/api/signup', user)
			.then(function(res){
//				console.log(res.data.token);
				saveToken(res.data.token);
				// return nothing
			}, function(res){
//				console.log(res.status);
//				console.log(res.data.message);
				return (res.data);
			})
			.catch(function(err){
				console.log("Error: " + err);
			});
		};
		
		var getClient = function(){
			var url = $location.protocol() + "://" + $location.host() + ":" + $location.port() + "/api/getclient/";
			return $http.post(url, null)
			.then(function(res){
//				console.log(res.data)
				return (res.data);
			}, function(res){
				return (res.data);
			})
			.catch(function(err){
				console.log("Error: " + err);
			});
		};
		var hackin = function(user){
			return $http.post('/api/hackin', user)
			.then(function(res){
				saveToken(res.data.token);
				// return nothing if successful
			}, function(res){
//				console.log(res.data.message);
				return (res.data);
			});
		};
		var resetPassword = function(user){
			return $http.post('/api/resetPassword', user)
			.then(function(res){
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - resetPassword, status: ' + res.status);
				return (res.data);
			});
		};
		var setPassword = function(user){
			return $http.post('/api/setPassword', user)
			.then(function(res){
				console.log('Res.data: ', res.data);
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - setPassword, status: ' + res.status);
				return (res.data);
			});
		};
		var isLoggedIn = function(client){
//			console.log('client: ' + client)
			// on page load, client can be undefined
			if (client == undefined){
//				console.log('client undefined')
				return false;
			}
			var token = getToken();
			if ((token !== 'undefined') && (token !== undefined)){
				// token = header.payload.signature
				var payload = JSON.parse($window.atob(token.split('.')[1]));
//				console.log('token: ' + payload.client)
				if (client == payload.client){
//					console.log('Login success')
					return payload.exp > Date.now()/1000;
				} else {
					// this will force user to log in again when switching clients
//					$window.localStorage.removeItem('asgApp-token');
					return false;
				}
			} else {
//				console.log('token is undefined...')
				$window.localStorage.removeItem('asgApp-token');
				return false;
			}
		};
		var isSuperUser = function(client){
			if (isLoggedIn(client)){
				var token = getToken();
				var payload = JSON.parse($window.atob(token.split('.')[1]));
				return payload.superuser;
			} else {
				return false;
			}
		};
		var isAdmin = function(client){
			if (isLoggedIn(client)){
				var token = getToken();
				var payload = JSON.parse($window.atob(token.split('.')[1]));
				if (payload.usertype.indexOf('Admin') > -1){
					return true;
				} else {
					return false;
				}
			} else {
				return false;
			}
		};
		var isTeacher = function(client){
			if (isLoggedIn(client)){
				var token = getToken();
				var payload = JSON.parse($window.atob(token.split('.')[1]));
				if (payload.usertype.indexOf('Teacher') > -1){
					return true;
				} else {
					return false;
				}
			} else {
				return false;
			}
		};
		var isParent = function(client){
			if (isLoggedIn(client)){
				var token = getToken();
				var payload = JSON.parse($window.atob(token.split('.')[1]));
				if (payload.usertype.indexOf('Parent') > -1){
					return true;
				} else {
					return false;
				}
			} else {
				return false;
			}
		};
		var isStudent = function(client){
			if (isLoggedIn(client)){
				var token = getToken();
				var payload = JSON.parse($window.atob(token.split('.')[1]));
				if (payload.usertype.indexOf('Student') > -1){
					return true;
				} else {
					return false;
				}
			} else {
				return false;
			}
		};
		var getStudentGrade = function(client){
			if (isLoggedIn(client)){
				var token = getToken();
				var payload = JSON.parse($window.atob(token.split('.')[1]));
				return payload.grade;
			} else {
				return false;
			}
		}
		var getStudentLevel = function(client){
			if (isLoggedIn(client)){
				var token = getToken();
				var payload = JSON.parse($window.atob(token.split('.')[1]));
				return payload.level;
			} else {
				return false;
			}
		}
		var currentUser = function(client){
			if (isLoggedIn(client)){
				var token = getToken();
				var payload = JSON.parse($window.atob(token.split('.')[1]));
				return{
					id: payload.id,
					firstname: payload.firstname,
					lastname: payload.lastname,
					usertype: payload.usertype,
					email: payload.email,
					children: payload.children
				};
			}
		};
		
		var userRegistration = function(user){
			return $http.post('/api/userRegistration', user)
			.then(function(res){
//				console.log('Res.data: ', res.data);
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - userRegistration, status: ' + res.status);
				return (res.data);
			});
		};
		
		var getStudentPickup = function(client, parentID, startDate, endDate){
			var user = {client: client, parentID: parentID, startDate: startDate, endDate: endDate};
			return $http.post('/api/info/pickup', user)
			.then(function(res){
//				console.log('Res.data: ', res.data);
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getStudentPickup, status: ' + res.status);
				return (res.data);
			});
		}
		
		// will be moved
		var sendData = function(client, data){
			var payload = {client: client, data: data};
			return $http.post('/api/info/senddata', payload)
			.then(function(res){
				return(res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - sendData, status: ' + res.status);
				return (res.data);
			})
		}
		var getSigData = function(client){
			var payload = {client: client};
			return $http.post('/api/info/getsigdata', payload)
			.then(function(res){
				return(res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getSigData, status: ' + res.status);
				return (res.data);
			})
		}
		
		var getUserDetailsById = function(client, userID){
			var user = {client: client, userID: userID};
			return $http.post('/api/user/details', user, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
//				console.log('Res.data: ' + JSON.stringify(res.data));
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getUserDetailsById');
			});
		};

		var getAllUsers = function(client){
			var data = {client: client};
			return $http.post('/api/user/all', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
//				console.log('Res.data: ' + JSON.stringify(res.data));
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getAllUsers');
			});
		}
		var getAllUsersByGrades = function(client){
			var data = {client: client};
			return $http.post('/api/user/allByGrades', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
//				console.log('Res.data: ' + JSON.stringify(res.data));
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getAllUsersByGrade');
			});
		}
		var getAllStudents = function(client, startDate, endDate){
			var data = {client: client, startDate: startDate, endDate: endDate}
			return $http.post('/api/user/students', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
//				console.log('Res.data: ' + JSON.stringify(res.data));
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getAllStudents');
			});
		}
		var getAllPickupStudents = function(client, startDate, endDate){
			var data = {client: client, startDate: startDate, endDate: endDate}
			return $http.post('/api/user/pickupstudents', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
//				console.log('Res.data: ' + JSON.stringify(res.data));
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getAllPickupStudents');
			});
		}
		var getStudentsByID = function(client, startDate, endDate, ID){
			var data = {client:client, startDate: startDate, endDate: endDate, ID: ID}
			return $http.post('/api/user/studentsID', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
//				console.log('Res.data: ' + JSON.stringify(res.data));
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getStudentsByID');
			});
		}
		var getStudentsByGrades = function(client, start, end){
			var data = {client: client, start: start, end: end}
			return $http.post('/api/user/byGrades', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
//				console.log('Res.data: ' + JSON.stringify(res.data));
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getStudentsByGrades');
			});
		}
		var getMyStudentsByGrades = function(client, teacher, start, end){
			var data = {client: client, teacher:teacher, start: start, end: end}
			return $http.post('/api/user/myStudents', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
//				console.log('Res.data: ' + JSON.stringify(res.data));
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getMyStudentsByGrades');
			});
		}

		var getStudentsBySchools = function(client, date){
			var data = {client: client, date: date};
			return $http.post('/api/user/bySchools', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
//				console.log('Res.data: ' + JSON.stringify(res.data));
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getStudentsBySchools');
			});
		}

		var getStudentsByDistricts = function(client, date){
			var data = {client: client, date: date};
			return $http.post('/api/user/byDistricts', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
//				console.log('Res.data: ' + JSON.stringify(res.data));
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getStudentsByDistricts');
			});
		}

		var getRegisteredUsers = function(client){
			var data = {client: client};
			return $http.post('/api/user/registered', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getRegisteredUsers');
			});
		}

		var getAllDistricts = function(client){
			var data = {client: client}
			return $http.post('/api/user/districts', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
//				console.log('Res.data: ' + JSON.stringify(res.data));
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getAllDistricts');
			});
		}

		var getDrivers = function(client){
			var data = {client: client};
			return $http.post('/api/user/drivers', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
//				console.log('Res.data: ' + JSON.stringify(res.data));
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getDrivers');
			});
		}
		
		var getTeachers = function(client){
			var data = {client: client};
			return $http.post('/api/user/teachers', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
//				console.log('Res.data: ' + JSON.stringify(res.data));
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getTeachers');
			});
		}

		var createUser = function(user){
			return $http.post('/api/user/create', user, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
//				console.log('Res.data: ' + JSON.stringify(res.data));
				return (res.data);
			}, function(res){
				// code other than 200 ends here
				console.log('Something wrong in authentication.service - createUser');
				return res.data;
			});
		}

		var updateUser = function(user){
			return $http.post('/api/user/update', user, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
//				console.log('Res.data: ' + JSON.stringify(res.data));
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - updateUser');
			});
		}

		var removeUser = function(client, userID){
			var data = {client: client, id: userID};
			return $http.post('/api/user/remove', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
//				console.log('Res.data: ' + JSON.stringify(res.data));
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - removeUser');
			});
		}

		var fixPhone = function(){
			return $http.post('/api/user/fixphone', null, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
//				console.log('Res.data: ' + JSON.stringify(res.data));
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - fixPhone');
			});
		}

		var updatePickup = function(client, pickups){
			var data = {client: client, pickups: pickups};
			return $http.post('/api/pickup/update', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - updatePickup');
			})
		}

		var getPickups = function(client, start_date, end_date){
			var data = {client: client, start_date: start_date, end_date: end_date}
			return $http.post('/api/pickup/get', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getPickups');
			})
		}

		var getPickupsByStudents = function(start_date, end_date){
			var data = {start_date: start_date, end_date: end_date}
			return $http.post('/api/pickup/getbystudents', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getPickupsByStudents');
			})
		}

		var getAllPickups = function(){
			return $http.post('/api/pickup/get_all', null, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getAllPickups');
			})
		}

		var removePickup = function(date) {
			var data = {start_date: date, end_date: date}
			return $http.post('/api/pickup/remove', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - removePickup');
			})
		}

		var removeOnePickup = function(client, id){
			var data = {client:client, id: id};
			return $http.post('/api/pickup/remove_one', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - removeOnePickup');
			})
		}

		var getTime = function(){
			return $http.post('/api/pickup/get_time', null, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getTime');
			})
		}

		var sendReport = function(client, report){
			var data = {client: client,
					senderEmail: currentUser(client).email,
					senderName: currentUser(client).firstname + " " + currentUser(client).lastname,
					report: report}
			return $http.post('/api/pickup/send', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - sendReport');
			})
		}

		var updateSchedule = function(client, rangeStart, rangeEnd, schedules){
			var data = {client: client, rangeStart: rangeStart, rangeEnd: rangeEnd, scheduleDB: schedules}
			return $http.post('/api/schedule/update', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - updateSchedule');
			})
		}

		var getSchedule = function(client, start, end){
			var data = {client: client, start: start, end: end};
			return $http.post('/api/schedule/get', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getSchedule');
			})
		}

		var fileDownload = function(){
			return $http.post('/api/download', null, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - fileDownload');
			})
		}

		var getMessages = function(client, start_date, end_date){
			var data = {client: client, start_date: start_date, end_date: end_date}
			return $http.post('/api/logbook/getmessages', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getMessages');
			})
		}
		
		var getMyMessages = function(client, teacherID, start_date, end_date){
			var data = {client: client, teacherID: teacherID, start_date: start_date, end_date: end_date}
			return $http.post('/api/logbook/getmymessages', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getMyMessages');
			})
		}

		var updateMessages = function(client, logbook){
			var data = {client:client, logbook: logbook}
			return $http.post('/api/logbook/updatemessages', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - updateMessages');
			})
		}

		var updateTeacher = function(client, userRec){
			var data = {client:client, userRec: userRec}
			return $http.post('/api/user/updateteacher', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - updateTeacher');
			})
		}
		
		var getCalendar = function(client, calendars, recCnt){
			var data = {client:client};
			return $http.post('/api/calendar/get', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getCalendar');
			})
		}
		
		var updateCalendar = function(client, calendars, recCnt){
			var data = {client:client,
						calendars: calendars,
						recCnt: recCnt};
			return $http.post('/api/calendar/update', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - updateCalendar');
			})
		}
		
		var classCheckIn = function(client, firstName, lastName, subject, grade){
			var data = {client: client,
						firstName: firstName, 
						lastName: lastName,
						subject: subject,
						grade: grade};
			return $http.post('/api/class/checkin', data)
			.then(function(res){
//				console.log('Res.data: ', res.data);
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - classCheckIn, status: ' + res.status);
				return (res.data);
			});
		}
		
		var getCheckIns = function(client, start_date, end_date){
			var data = {client: client, start_date: start_date, end_date: end_date}
			return $http.post('/api/logbook/getcheckin', data, {
				headers:{
					'Authorization': 'Bearer ' + getToken()
				}
			})
			.then(function(res){
				return (res.data);
			}, function(res){
				console.log('Something wrong in authentication.service - getCheckIn');
			})
		}
		
		return {
			checkClient: checkClient,
			saveToken: saveToken,
			getToken: getToken,
			getClient: getClient,
			signup: signup,
			login: login,
			userRegistration: userRegistration,
			getStudentPickup: getStudentPickup,
			getStudentGrade: getStudentGrade,
			getStudentLevel: getStudentLevel,
			sendData: sendData,
			getSigData: getSigData,
			
			hackin: hackin,
			resetPassword: resetPassword,
			setPassword: setPassword,
			logout: logout,
			isLoggedIn: isLoggedIn,
			isSuperUser: isSuperUser,
			isAdmin: isAdmin,
			isTeacher: isTeacher,
			isParent: isParent,
			isStudent: isStudent,
			currentUser: currentUser,
			getUserDetailsById: getUserDetailsById,
			getAllUsers: getAllUsers,
			getAllUsersByGrades: getAllUsersByGrades,
			getAllStudents: getAllStudents,
			getAllPickupStudents: getAllPickupStudents,
			getStudentsByID: getStudentsByID,
			getStudentsByGrades: getStudentsByGrades,
			getMyStudentsByGrades: getMyStudentsByGrades,
			getStudentsBySchools: getStudentsBySchools,
			getStudentsByDistricts: getStudentsByDistricts,
			getRegisteredUsers: getRegisteredUsers,
			getAllDistricts: getAllDistricts,
			getDrivers: getDrivers,
			getTeachers: getTeachers,
			createUser: createUser,
			updateUser: updateUser,
			removeUser: removeUser,
			fixPhone: fixPhone,
			updatePickup: updatePickup,
			getPickups: getPickups,
			getPickupsByStudents: getPickupsByStudents,
			getAllPickups: getAllPickups,
			removePickup: removePickup,
			removeOnePickup: removeOnePickup,
			getTime: getTime,
			sendReport: sendReport,
			updateSchedule: updateSchedule,
			getSchedule: getSchedule,
			fileDownload: fileDownload,
			getMessages: getMessages,
			getMyMessages: getMyMessages,
			updateMessages: updateMessages,
			updateTeacher: updateTeacher,
			getCalendar: getCalendar,
			updateCalendar: updateCalendar,
			classCheckIn: classCheckIn,
			getCheckIns: getCheckIns,
		};
	}

	angular
	.module('asgApp')
	.service('authentication', authentication);
})();