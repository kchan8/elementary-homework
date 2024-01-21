(function(){

//	function navigation(){
	var navigation = function(){
		return {
			restrict: 'E',
			// Listing 10.5
			scope: {
				client: '=client'
			},
			templateUrl: '/common/directives/navigation/navigation.template.html',
			controller: 'navigationCtrl as navvm'
		};
	}

	angular
	.module('asgApp')
	.directive('navigation', navigation);
})();