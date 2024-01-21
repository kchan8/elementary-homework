//var nodemailer	= require('nodemailer');

var helper = require('sendgrid').mail
var sg = require('sendgrid')(process.env.SENDGRID_APIKEY)

//exports.google = function (toAddr, ccAddr, from_email, subject, content, attachment){
//	var transporter = nodemailer.createTransport({
//		service: 'gmail',
//		auth: {
//			user: config.get('ADMIN_EMAIL'),
//			pass: config.get('ADMIN_PASSWORD')
//		}
//	});
//	// can put text AND html, but html will appear in the body,
//	// text will only show for a short time
//	var mailOptions = {
//		from: from_email || config.get('ADMIN_EMAIL'),
//		to: toAddr,
//		cc: ccAddr,
//		subject: subject,
//		text: content,
//		attachments: attachment
//	};
//	transporter.sendMail(mailOptions, function(err, info){
//		if (err) {
//			return console.log(err);
//		}
//		console.log('Message %s sent: %s', info.messageId, info.response);
//	});
//}

//https://github.com/sendgrid/sendgrid-nodejs#hello-email
exports.sendgrid = function(toList, ccList, from_email, from_name, subject, content, attachment, callback){
	var toListObj = [];
	var ccListObj = [];
	// one email address is not an object
	if (typeof toList === "string"){
		toList = [toList];
	}

	toListObj = toList.map(function(email){
		return {email: email};
	});

	if (process.env.RUN_MODE === 'DEBUG') {
		console.log("email in debug...");
		toListObj = [{email: "kchan.ca@gmail.com"}]
	}
//	console.log(toListObj);

	if (ccList.length != 0) {		
		ccListObj = ccList.map(function(email){
			return {email: email};
		});
	}

	var config = {
		method: 'POST',
		path: '/v3/mail/send',
		body: {
			personalizations: [{
				to: toListObj,
//				bcc: [{email: from_email}],
				subject: subject
			}],
			from: {
				email: from_email,
				name: from_name
				},
			content: [{
				type: 'text/html',	// text/plain will not format the message, text/html
				value: content
			}]
		}
	};
	if (ccList.length !== 0) {
		config.body.personalizations[0].cc = ccListObj;
	}
	if (attachment && attachment.length !== 0) {
		console.log("Look for attachments...")
		config.body.attachments = attachment;
	}
	var request = sg.emptyRequest(config);
	
	sg.API(request, function(err, response){
		console.log('statusCode: ' + response.statusCode);
		console.log('body: ' + JSON.stringify(response.body));
		console.log('headers: ' + JSON.stringify(response.headers));
		if (callback) {
			callback(response);
		}
	});
}

exports.sendgridText = function(toList, from_email, from_name, subject, content, callback){
	var toListObj = [];
	// one email address is not an object
	if (typeof toList === "string"){
		toList = [toList];
	}

	toListObj = toList.map(function(email){
		return {email: email};
	});

	var config = {
		method: 'POST',
		path: '/v3/mail/send',
		body: {
			personalizations: [{
				to: toListObj,
				subject: subject
			}],
			from: {
				email: from_email,
				name: from_name
				},
			content: [{
				type: 'text/plain',	// text/plain will not format the message, text/html
				value: content
			}]
		}
	};

	var request = sg.emptyRequest(config);
	
	sg.API(request, function(err, response){
		console.log('statusCode: ' + response.statusCode);
		console.log('body: ' + JSON.stringify(response.body));
		console.log('headers: ' + JSON.stringify(response.headers));
		if (callback) {
			callback(response.statusCode);
		}
	});
}