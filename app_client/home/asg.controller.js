(function(){
	function asgCtrl (){
		var vm = this;
		vm.client = "ASG";
		vm.header = {
			title: 'Home'
		};

	}

	angular
	.module('asgApp')
	.controller('asgCtrl', asgCtrl);
})();