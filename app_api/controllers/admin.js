var path = require('path');
var fs = require('fs');
var upload = require('./upload');
var sendEmail = require('./sendEmail');
var mongoose = require('mongoose');
var workbookSchema = require('../models/workbook');
var authentication = require('./authentication');

var sendJSONresponse = function(res, status, content){
//	res.status(status)
//	res.json(content)
	res.status(status).json(content);
};

module.exports.fileUpload = function(req, res, next){
//	console.log('In api upload... ' + req.params.filetype)
//	console.log('File: ' + JSON.stringify(req.file))
	var client = req.body.client;
	// make sure ../uploads directory has been created
	var targetFile = path.join(__dirname, '../uploads/' + req.params.filetype);
	console.log('req.file.path=' + req.file.path + '; Target file: ' + targetFile);
	// fs.statSync doesn't work
	fs.stat(targetFile, function(err, stats){
		if (err){
			if (err.code !== "ENOENT") {				
				console.log('Error: ' + err.code);
			}
		} else {
			if (stats.isFile()){				
				fs.unlinkSync(targetFile);
			}	
		}	
		fs.rename(req.file.path, targetFile, function(err){		
			if (err){				
				throw err;
			}
			// get data from file to database
			if (req.params.filetype === "student_file"){
				upload.uploadStudent(client, targetFile, function(){
					console.log('Done upload...');
					fs.unlinkSync(targetFile); // remove the uploaded file
					sendJSONresponse(res, 200, {message: req.file.originalname + ' uploaded'});				
				});
			}
			if (req.params.filetype == "worker_file"){
				upload.uploadWorker(client, targetFile, function(){
					console.log('Done upload...');
					fs.unlinkSync(targetFile); // remove the uploaded file
					sendJSONresponse(res, 200, {message: req.file.originalname + ' uploaded'});				
				});
			}
			if (req.params.filetype == "pickup_file"){
				upload.uploadPickup(client, targetFile, function(){
					console.log('Done upload...');
					fs.unlinkSync(targetFile); // remove the uploaded file
					sendJSONresponse(res, 200, {message: req.file.originalname + ' uploaded'});				
				});
			}
			if (req.params.filetype == "video_file"){
				upload.uploadVideo(client, targetFile, function(){
					console.log('Done upload...');
					fs.unlinkSync(targetFile); // remove the uploaded file
					sendJSONresponse(res, 200, {message: req.file.originalname + ' uploaded'});				
				});
			}
			if (req.params.filetype == "workbook_file"){
				upload.uploadWorkbookInfo(client, targetFile, function(){
					console.log('Done upload...');
					fs.unlinkSync(targetFile); // remove the uploaded file
					sendJSONresponse(res, 200, {message: req.file.originalname + ' uploaded'});				
				});
			}
		});
	});
};

function base64Encode(file){
	var body = fs.readFileSync(file);
	return body.toString('base64');
}

module.exports.email = function(req, res, next){
	console.log("In admin/email...")
	console.log('req.file: ' + JSON.stringify(req.files));
	var files = req.files;
	var fileCnt = 0;
	var attachment = [];
	if (files.length !== 0 ){
		files.forEach(function(file){
			console.log(JSON.stringify(file));
			var targetFile = path.join(__dirname, '../uploads/' + file.filename);

			console.log(targetFile);
			fs.stat(targetFile, function(err, stats){
				console.log('fs.stat callback...');
				if (err){
					if (err.code !== "ENOENT") {				
						console.log('Error: ' + err.code);
					}
				} else {
					if (stats.isFile()){
						console.log('Delete file: ' + targetFile);
						fs.unlinkSync(targetFile);	// delete existing file
					}	
				}
				console.log('Go to file rename');
				fs.rename(file.path, targetFile, function(err){
					if (err){
						throw err;
					}
					console.log('rename file done');
					var value = {
						filename: file.filename,
						content: base64Encode(targetFile)
					}
					attachment.push(value);
					fileCnt++;
					fs.unlinkSync(targetFile); // remove the uploaded file
					if (fileCnt === files.length){
						sendEmail.sendgrid(req.body.recipients, [], req.body.senderEmail, req.body.senderName, req.body.subject, req.body.message, attachment, function(response){
							// todo- remove files
							if (response.statusCode != 202){				
								// need to send status=200 even sendgrid fail, otherwise http protoccol will fail
								sendJSONresponse(res, 202, response.body.errors[0]);
							} else {				
								sendJSONresponse(res, 202, {message: 'Email sent successfully!'});
							}
						});
					}
				})
			})
		})
	} else {
		sendEmail.sendgrid(req.body.recipients, [], req.body.senderEmail, req.body.senderName, req.body.subject, req.body.message, [], function(response){
			console.log("Code: " + response.statusCode)
			if (response.statusCode != 202){				
				// need to send status=200 even sendgrid fail, otherwise http protoccol will fail
				sendJSONresponse(res, 202, response.body.errors[0]);
			} else {				
				sendJSONresponse(res, 202, {message: 'Email sent successfully!'});
			}
		});
	}
}

module.exports.sms = function(req, res, next){
	console.log("In admin/sms...")
	sendEmail.sendgridText(req.body.recipients, req.body.senderEmail, req.body.message, function(code){
		sendJSONresponse(res, code, {message: 'SMS sent successfully!'});
	});
}

module.exports.unsecure_email = function(req, res, next){
	if (process.env.RUN_MODE === 'TEST') {
		var recipients = [
			'9257853303@txt.att.net'		// vtext / vzwpix for Verizon		
			];
	} else {
		var recipients = [
//			'5103660602@txt.att.net',		// Kendis 5103660602@txt.att.net
//			'4088585417@tmomail.net',	// Amy 4088585417@tmomail.net
//			'9255491788@txt.att.net',	// Theresa 9255491788@
			'9257853303@txt.att.net',		// vtext / vzwpix for Verizon
			];
	}
	// subject and message can't be empty
	sendEmail.sendgridText(recipients, process.env.ORG_EMAIL, process.env.ORG_NAME, ' ', req.body.message, function(code){
		sendJSONresponse(res, code, {message: 'SMS sent successfully!'});
	});
}