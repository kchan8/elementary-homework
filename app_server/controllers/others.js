module.exports.angularApp = function(req, res){
	// bootstrap 3 themes: https://bootswatch.com/3/
	var paths = req.path.split('/');
	if (paths[1].toLowerCase() == 'edu'){		
		res.render('layout-edu', {title: 'EDU Express'});
	} else if (paths[1].toLowerCase() == 'jkc'){		
		res.render('layout-jkc', {title: 'Joyful Kids Club'});
	} else {
		res.render('layout', {title: 'AfterSchoolGenie'});
	}
}