// 9.4.1 wrap code in IIFE - encapsulating code in a unique scope, hide from global scope
(function(){
	function configRouter($routeProvider, $locationProvider){
		$routeProvider
		.when('/', {
			templateUrl: '/home/asg.home.html',
			controller: 'asgCtrl',
			controllerAs: 'vm'
		})
		.when('/:client', {
			templateUrl: function(params){
				return '/home/' + params.client + '.home.html';
			},
			controller: 'clientCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/about', {
			templateUrl: function(params){
				return '/home/' + params.client + '.about.html';
			},
			controller: 'aboutCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/login', {
			templateUrl: '/auth/login/login.view.html',
			controller: 'loginCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/forgotPassword', {
			templateUrl: '/auth/login/forgotPassword.view.html',
			controller: 'forgotPasswordCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/resetPassword/:userID/:key', {
			templateUrl: '/auth/login/resetPassword.view.html',
			controller: 'resetPasswordCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/signup', {
			templateUrl: '/auth/signup/signup.view.html',
			controller: 'signupCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/signupDone', {
			templateUrl: '/auth/signup/signupDone.view.html',
			controller: 'signupDoneCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/confirm/:userID', {
			templateUrl: '/auth/signup/confirm.view.html',
			controller: 'confirmCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/roster/grades', {
			templateUrl: '/roster/grades.view.html',
			controller: 'gradesCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/roster/schools', {
			templateUrl: '/roster/schools.view.html',
			controller: 'schoolsCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/roster/districts', {
			templateUrl: '/roster/districts.view.html',
			controller: 'districtsCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/email/grades', {
			templateUrl: '/email/grades.view.html',
			controller: 'emailByGradesCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/email/schools', {
			templateUrl: '/email/schools.view.html',
			controller: 'emailBySchoolsCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/email/districts', {
			templateUrl: '/email/districts.view.html',
			controller: 'emailByDistrictsCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/logbook/message', {
			templateUrl: '/logbook/message.view.html',
			controller: 'messageCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/logbook/checkInRpt', {
			templateUrl: '/logbook/checkInRpt.view.html',
			controller: 'checkInRptCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/teacher/logbook/message', {
			templateUrl: '/logbook/teacherMessage.view.html',
			controller: 'teacherMessageCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/teacher/workbook/upload', {
			templateUrl: '/workbook/upload.view.html',
			controller: 'workbookUploadCtrl',
			controllerAs: 'vm'
		})
//		.when('/:client/teacher/upload/assign', {
//			templateUrl: '/workbook/assign.view.html',
//			controller: 'workbookAssignCtrl',
//			controllerAs: 'vm'
//		})
		.when('/:client/teacher/homework/review', {
			templateUrl: '/workbook/review.view.html',
			controller: 'homeworkReviewCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/teacher/homework/upload', {
			templateUrl: '/workbook/transfer.view.html',
			controller: 'homeworkTransferCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/student/assignment', {
			templateUrl: '/workbook/assignment.view.html',
			controller: 'assignmentCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/teacher/workbook/manage', {
			templateUrl: '/workbook/manage.view.html',
			controller: 'workbookManageCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/:role/:doc/:id/:page', {
			templateUrl: '/workbook/combined.view.html',
			controller: 'combinedCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/teacher/video/upload', {
			templateUrl: '/video/upload.view.html',
			controller: 'videoUploadCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/teacher/video/manage', {
			templateUrl: '/video/manage.view.html',
			controller: 'videoManageCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/student/video', {
			templateUrl: '/video/select.view.html',
			controller: 'videoSelectCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/student/watch', {
			templateUrl: '/video/watch.view.html',
			controller: 'videoWatchCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/admin/edituser', {
			templateUrl: '/admin/editUser.view.html',
			controller: 'editUserCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/admin/removeuser', {
			templateUrl: '/admin/removeUser.view.html',
			controller: 'removeUserCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/admin/export', {
			templateUrl: '/admin/export.view.html',
			controller: 'exportCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/admin/upload', {
			templateUrl: '/admin/upload.view.html',
			controller: 'uploadCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/admin/loginuser', {
			templateUrl: '/admin/loginUser.view.html',
			controller: 'loginUserCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/admin/assignstudents', {
			templateUrl: '/admin/assign.view.html',
			controller: 'assignStudentsCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/admin/pickup', {
			templateUrl: '/pickup/all.view.html',
			controller: 'pickupAllCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/pickup/child', {
			templateUrl: '/pickup/child.view.html',
			controller: 'pickupChildCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/info/pickup/:parentID', {
			templateUrl: '/pickup/parentChild.view.html',
			controller: 'parentChildCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/class/checkin', {
			templateUrl: '/logbook/checkIn.view.html',
			controller: 'checkInCtrl',
			controllerAs: 'vm'
		})
		.when('/:client/admin/calendar', {
			templateUrl: '/calendar/district.view.html',
			controller: 'districtCalendarCtrl',
			controllerAs: 'vm'
		})
		.otherwise({redirectTo: '/'});
		$locationProvider.html5Mode(true);	// remove # on url
	}
	
	angular
	.module('asgApp', ['ngRoute', 'ui.bootstrap', 'ngStorage'])
	.config(['$routeProvider', '$locationProvider', configRouter]);
})();