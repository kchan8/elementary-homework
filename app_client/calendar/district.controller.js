(function(){
	function str2Date(str){
		var datesStr = str.split(", ");
//		console.log(datesStr);
		var dates = [];
		for(var i=0; i<datesStr.length; i++){
			let isValidDate = Date.parse(datesStr[i]);
			if (!isNaN(isValidDate)){				
				dates.push(new Date(datesStr[i]));
			}
		}
//		console.log(dates);
		return dates;
	}
	
	function date2Str(date){
		var day = new Date(date);
		var mm = day.getMonth() + 1;
//		if (mm < 10) mm = '0' + mm;
		var dd = day.getDate();
//		if (dd < 10) dd = '0' + dd;
		var yy = day.getFullYear().toString().slice(2);
		return mm.toString() + '/' + dd.toString() + '/' + yy;
	}
	
	function districtCalendarCtrl($routeParams, authentication){
		var vm = this;
		vm.client = $routeParams.client.toLowerCase();

		authentication.checkClient(vm.client)
		.then(function(res){
			if (!res.valid)
				$location.path('/')
		})
		
		vm.header = {title: "District Calendar"};
		// vm.calendars = [{schedule: "MINDAY", district: "Danville", dates:[]},...] 
		vm.calendars = [];
		authentication.getAllDistricts(vm.client)
		.then(function(res){
			vm.districts = res;
			authentication.getCalendar(vm.client)
			.then(function(res){				
				vm.districts.forEach(function(district){
					for(schedule of ["MINDAY", "NOSCHOOL", "CLOSE"]){
						// check each Calendar entry
						var dateStr = ""
						res.forEach(function(record){
							if (record.district == district._id && record.schedule == schedule){
								for(var i=0; i<record.dates.length; i++){					
									dateStr += date2Str(record.dates[i])
									if (i<record.dates.length-1){
										dateStr += ", "
									}
								}
							}
						})
						vm.calendars.push({
							schedule: schedule,
							district: district._id,
							datesStr: dateStr
						})
					}
				})
			})
		})
		
		vm.getDates = function(schedule, district){
			return vm.calendars.find(x=> x.schedule===schedule && x.district===district);
		}

		vm.check = function(){
			var recCount = 0;
			vm.districts.forEach(function(district){
				for(schedule of ["MINDAY", "NOSCHOOL", "CLOSE"]){
					console.log(district._id + ' ' + schedule)
					console.log(vm.getDates(schedule, district._id).datesStr)
					if (vm.getDates(schedule, district._id).datesStr != ""){
						vm.getDates(schedule, district._id).dates = str2Date(vm.getDates(schedule, district._id).datesStr)
						recCount++
					}
				}
			})
//			console.log("minimum day: " + JSON.stringify(minDay));
//			console.log("no school day: " + JSON.stringify(noSchoolDay));
//			console.log("close day: " + JSON.stringify(closeDay));
//			console.log(recCount);
			authentication.updateCalendar(vm.client, vm.calendars, recCount)
			.then(function(res){
				// may display a message
			})
		}
	}

	angular
	.module('asgApp')
	.controller('districtCalendarCtrl', districtCalendarCtrl);
})();