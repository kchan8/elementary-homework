(function(){

//	function navigation(){
	var tabset = function(){
		return {
			restrict: 'E',
			replace: true,
			transclude: true,
			
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
	.directive('tabset', tabset);
})();