(function(){
function footerGeneric(){
	return {
		restrict: 'EA',
		templateUrl: '/common/directives/footerGeneric/footerGeneric.view.html'
	};
}

angular
	.module('asgApp')
	.directive('footerGeneric', footerGeneric);
})();