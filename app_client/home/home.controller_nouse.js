(function(){
function homeCtrl (authentication, sendEmailWOAuth, $timeout){
	var vm = this;
	
	vm.header = {
		title: 'Home | JKC'
	};
	
	var isLoggedIn = function(){
		return authentication.isLoggedIn();
	};
	
	var bell = function(){
		// get time
		var now = new Date();
		var timeStr = now.toLocaleTimeString();
		if (vm.name !== undefined) {
			console.log(vm.name)
			sendEmailWOAuth.sendFromServer('@' + timeStr + ' for ' + vm.name);
		} else {
			sendEmailWOAuth.sendFromServer('Accessed @' + timeStr);
		}
		vm.isDisabled = true;
		$timeout(function(){
			vm.isDisabled = false
		}, 5000)
	};
	
	vm.isLoggedIn = isLoggedIn;
	vm.bell = bell;
	vm.isDisabled = false;
}

angular
  .module('asgApp')
  .controller('homeCtrl', homeCtrl);
})();