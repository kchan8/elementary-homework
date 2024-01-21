angular
	.module('asgApp')
	.filter('removeSpace', removeSpace)
	
function removeSpace(){
	return function(value){
		if (angular.isString(value)){
			return value.replace(/ /g, '-')
		} else {
			return value
		}
	}
}