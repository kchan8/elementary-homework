module.exports.index = function(req, res){
	res.render('index', {title: 'Home | Joyful Kids Club'});
};

module.exports.about = function(req, res){
	res.render('about', {title: 'About Us | Joyful Kids Club'});
};

module.exports.classes = function(req, res){
	res.render('classes', {title: 'Classes | Joyful Kids Club'});
};

module.exports.register = function(req, res){
	res.render('register', {title: 'Register | Joyful Kids Club'});
};

module.exports.contact = function(req, res){
	res.render('contact', {title: 'Contact Us | Joyful Kids Club'});
};

module.exports.angularApp = function(req, res){
	res.render('layout', {title: 'Home | Joyful Kids Club'});
};