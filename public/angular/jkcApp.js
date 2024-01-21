(function(){
	
//function bellCtrl($scope){
var bellCtrl = function($scope){
	$scope.value = 'ABC';
	$scope.ringBell = function(){
		console.log('bell pressed');		
	}
};

// need to add '[]' as second parameter in module, otherwise result in injector no module error
angular
  .module('jkcApp', [])
  .controller('bellCtrl', bellCtrl);

})();