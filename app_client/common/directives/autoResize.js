(function(){
	function autoResize($timeout){
		return {
			restrict: 'A',
			link: function AutogrowLink(scope, element, attributes) {
				if (!element.hasClass("autogrow")) {
					// no autogrow for you today
					return;
				}

				// get possible minimum height style
				var minHeight = parseInt(window.getComputedStyle(element[0]).getPropertyValue("min-height")) || 0;

				// prevent newlines in textbox
				element.on("keydown", function(evt) {
					if (evt.which === 13){
						evt.preventDefault();
					}
				});

				element.on("input" , function(evt) {
					element.css({
						paddingTop: 4 + "px",
						height: 0 + "px",
						minHeight: 10 + "px"
					});

					var contentHeight = this.scrollHeight;
					var borderHeight = this.offsetHeight;

					element.css({
						paddingTop: ~~Math.max(0, minHeight - contentHeight) / 2 + "px",
						minHeight: 14 + "px", // remove property
						height: contentHeight + borderHeight + "px" // because we're using border-box
					});
				});

				// watch model changes from the outside to adjust height
				scope.$watch(attributes.ngModel, trigger);

				// set initial size
				trigger();

				function trigger() {
					setTimeout(element.triggerHandler.bind(element, "input"), 1);
				}
			}
		};
	}


	angular
	.module('asgApp')
	.directive('autoResize', autoResize);
})();