(function(){
	function autoResize($timeout){
		return {
			restrict: 'A',
			link: function autoResizeLink(scope, element, attribute){
				element.css({ 'height': 'auto', 'vertical-align': 'text-top' });
                $timeout(function () {
                    element.css('height', element[0].scrollHeight + 'px');
                }, 100);
                element.on('input', function () {
                    element.css({'height': 'auto', 'vertical-align': 'text-top' });
                    element.css('height', element[0].scrollHeight + 'px');
                });
			}
		};
	}

	angular
	.module('asgApp')
	.directive('autoResize', autoResize);
})();