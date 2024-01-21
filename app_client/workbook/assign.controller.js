(function(){
	function workbookAssignCtrl($routeParams, $scope, $sce, $window, $location, authentication){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();

		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/')
		})
		
		$scope.getAssignment = function(){
			console.log('getAssignment...')
			authentication.getAssignment(vm.client)
			.then(function(res){
				// https://github.com/sayanee/angularjs-pdf/issues/110#issuecomment-269547160
				var base64String = res.data;
				var binaryImg = atob(base64String);
				var binaryImgLength = binaryImg.length;
				var arrayBuffer = new ArrayBuffer(binaryImgLength);
				var uInt8Array = new Uint8Array(arrayBuffer);
				for (var i=0; i<binaryImgLength; i++){
					uInt8Array[i] = binaryImg.charCodeAt(i);
				}
				var outputBlob = new Blob([uInt8Array], {type: 'application/pdf'});
				// https://stackoverflow.com/questions/21628378/how-to-display-blob-pdf-in-an-angularjs-app
				pdfUrl = window.URL.createObjectURL(outputBlob);
				$scope.content = $sce.trustAsResourceUrl(pdfUrl);
				var a = document.createElement('a')
				a.href = pdfUrl
				a.download = '1stMathCh15_1.pdf'
				a.click();
			})
		}
	}
	
	angular
	.module('asgApp')
	.controller('workbookAssignCtrl', workbookAssignCtrl)
})();