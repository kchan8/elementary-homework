var mongoose = require('mongoose');
var workbookSchema = require('../models/workbook');
var homeworkSchema = require('../models/homework');
var userSchema = require('../models/user');
var authentication = require('./authentication');
var fs = require('fs');
var mergeImages = require('merge-images');
var {Canvas, Image} = require('canvas');
var sizeOf = require('image-size');
// pdf-poppler does not support Linux
//var pdf = require('pdf-poppler');
var pdf = require('pdf2pic');
var path = require('path');

// this upload_old takes multiple files
module.exports.upload_old = function(req, res, next){
	var client = req.body.client;
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const Workbook = conn.model('Workbook', workbookSchema);
		const files = req.files;
		var pdfStr;
		var pngStr = new Array(req.body.pages);
		var dim = new Array(req.body.pages);
		var promises = [];
		
		var readFileAsync = function(filename){
			return new Promise(function(resolve, reject){
				fs.readFile(filename, 'base64', function(err, data){
					if (err)
						reject(err);
					else {
						var extension = filename.split('.').pop();
						if (extension.toLowerCase() == 'pdf'){		
							pdfStr = data;
						} else {
							if (req.body.pages == 1){
								pngStr[0] = data;
							} else {
								var index = parseInt(filename.split('-').pop().substring(0,2), 10) - 1;
								pngStr[index] = data;
							}
						}
						resolve(data);
					}
				})
			})
		}
		
		var getDimensions = function(filename){
			return new Promise(function(resolve, reject){
				sizeOf(filename, function(err, dimensions){
					if (err)
						reject(err);
					else {
						if (req.body.pages == 1)
							dim[0] = {"width": dimensions.width, "height": dimensions.height};
						else {
							var index = parseInt(filename.split('-').pop().substring(0,2), 10) - 1;
							dim[index] = {"width": dimensions.width, "height": dimensions.height};
						}
						resolve(dimensions);
					}
				})
			})
		}
		
		for (var i=0; i<files.length; i++){
			// IIFE
			(function(index){
//				console.log(files[index].path)
				var filename = files[index].path;
				promises.push(readFileAsync(filename));
				if (filename.split('.').pop() == 'png')
					promises.push(getDimensions(filename));
			})(i);
		}
		Promise.all(promises).then(function(){
			// check if there is duplicate later
			workbook = new Workbook();
			workbook.grade = req.body.grade;
			workbook.subject = req.body.subject;
			workbook.chapter = req.body.chapter;
			workbook.lesson = req.body.lesson;
			workbook.description = req.body.description;
			workbook.due = req.body.dueDate;
			workbook.expire = req.body.expireDate;
			workbook.pdfStr = pdfStr;
			workbook.pngStr = pngStr;
			workbook.pages = req.body.pages;
			workbook.dim = dim;
			workbook.teacherID = req.body.teacherID;
			workbook.save(function(err){
				if (err){
					res.status(507).json({message: err.message});
				} else {					
					res.status(200).json({message: 'Files uploaded'});
				}
				conn.close();
			})
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
};

module.exports.uploadWorkbook = function(req, res, next){
	console.log('in uploadWorkbook...')
	var client = req.body.client;
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
//		var conn = authentication.getMongoConnection(index);
//		const Workbook = conn.model('Workbook', workbookSchema);
		const file = req.file;
		var pdfStr;
		var pngStr = [];
		var dim = [];
		var promises = [];
		var pageCnt = 0;
		
		var getDimensions = function(filename){
			return new Promise(function(resolve, reject){
				sizeOf(filename, function(err, dimensions){
					if (err)
						reject(err);
					else {
						if (pageCnt == 1)
							dim[0] = {"width": dimensions.width, "height": dimensions.height};
						else {
							var index = parseInt(filename.split('-').pop().substring(0,2), 10) - 1;
							dim[index] = {"width": dimensions.width, "height": dimensions.height};
						}
						resolve(dimensions);
					}
				});
			});
		};

		var getFileContent = function(filename){
			return new Promise(function(resolve, reject){
				fs.readFile(filename, 'base64', function(err, data){
					if (err)
						reject(err);
					else {
						if (pageCnt == 1)
							pngStr[0] = data;
						else {
							var name = path.basename(filename, path.extname(filename));
							var index = parseInt(name.split('-').pop(), 10) - 1;
							pngStr[index] = data;
						}
						resolve(data);
					}
				});
			});
		};
		
		var filename = file.path;
		fs.readFile(filename, function(err, data){
			if (err){
				res.status(500).json({message: err.message});
				return;
			} else {
				pdfStr = data;
				var uploadDir = path.join(__dirname, '../../uploads');
//				let opts = {
//					format: 'png',
//					out_dir: uploadDir,
//					out_prefix: path.basename(filename, path.extname(filename)),
//					page: 0,
//					scale: 792
//				}
				var pdf2pic = new pdf({
					density: 72,
					savename: "untitled",
					savedir: uploadDir,
					format: "png",
					size: "612x792"
				})
				console.log('go to pdf2pic...')
				pdf2pic.convert(filename)
				.then(function(response){
					// check the number of png files created
					fs.readdir(uploadDir, function(err, files){
						var fileList = []
						files.forEach(function(file){
							if (file.startsWith(path.basename(filename, path.extname(filename)))){
								pageCnt += 1
								fileList.push(path.join(uploadDir, file));
							}
						})
						console.log("No. of pages: " + pageCnt)
						pngStr = new Array(pageCnt);
						dim = new Array(pageCnt);
						// get dimensions
						for (var i=0; i<fileList.length; i++){
							(function(index){
								promises.push(getDimensions(fileList[i]))
								promises.push(getFileContent(fileList[i]))
							})(i);
						}
						
						Promise.all(promises).then(function(){
							// check if there is duplicate later
							var conn = authentication.getMongoConnection(index);
							const Workbook = conn.model('Workbook', workbookSchema);
							
							workbook = new Workbook();
							workbook.grade = req.body.grade;
							workbook.subject = req.body.subject;
							workbook.chapter = req.body.chapter;
							workbook.lesson = req.body.lesson;
							workbook.description = req.body.description;
							workbook.due = req.body.dueDate;
							workbook.expire = req.body.expireDate;
							workbook.pdfStr = pdfStr;
							workbook.pngStr = pngStr;
							workbook.pages = pageCnt;
							workbook.dim = dim;
							workbook.teacherID = req.body.teacherID;
							workbook.teacherPNG = new Array(pageCnt);
							workbook.teacherMark = new Array(pageCnt);
							for (var i=0; i<pageCnt; i++){
								workbook.teacherPNG[i] = "";
								workbook.teacherMark[i] = [];
							}
							workbook.save(function(err){
								if (err){
									res.status(507).json({message: err.message});
								} else {					
									res.status(200).json({message: 'Files uploaded'});
								}
								conn.close();
//								for (var i=0; i<fileList.length; i++){
//									(function(index){
//										fs.unlinkSync(fileList[i]);
//									})(i);
//								}
							})
						})
					})
				})
				.catch(function(err){
					console.error(err);
					conn.close();
				})
			}
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
};

module.exports.uploadHomework = function(req, res, next){
	console.log('in uploadhomework...')
	var client = req.body.client;
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		const file = req.file;
		var studentID = req.body.studentID;
		var teacherID = req.body.teacherID;
		var workbookID = req.body.workbookID;
		var pages = req.body.pages;
		var pngStr = [];
		var dim = [];
		var promises = [];
		var pageCnt = 0;
		
		var getDimensions = function(filename){
			return new Promise(function(resolve, reject){
				sizeOf(filename, function(err, dimensions){
					if (err)
						reject(err);
					else {
						if (pageCnt == 1)
							dim[0] = {"width": dimensions.width, "height": dimensions.height};
						else {
							var index = parseInt(filename.split('-').pop().substring(0,2), 10) - 1;
							dim[index] = {"width": dimensions.width, "height": dimensions.height};
						}
						resolve(dimensions);
					}
				});
			});
		};

		var getFileContent = function(filename){
			return new Promise(function(resolve, reject){
				fs.readFile(filename, 'base64', function(err, data){
					if (err)
						reject(err);
					else {
						if (pageCnt == 1)
							pngStr[0] = data;
						else {
							var name = path.basename(filename, path.extname(filename));
							var index = parseInt(name.split('-').pop(), 10) - 1;
							pngStr[index] = data;
						}
						resolve(data);
					}
				});
			});
		};
		
		var filename = file.path;
		var uploadDir = path.join(__dirname, '../../uploads');
		let opts = {
			format: 'png',
			out_dir: uploadDir,
			out_prefix: path.basename(filename, path.extname(filename)),
			page: 0,
			scale: 792
		}
//		pdf.convert(filename, opts)
//		.then(function(response){
//			// check the number of png files created
//			fs.readdir(uploadDir, function(err, files){
//				var fileList = []
//				files.forEach(function(file){
//					if (file.startsWith(path.basename(filename, path.extname(filename)))){
//						pageCnt += 1
//						fileList.push(path.join(uploadDir, file));
//					}
//				})
//				if (pageCnt != pages){
//					console.log(pages + ' ' + pageCnt)
//					res.status(500).json({message: 'Pages mismatch'});
//					return
//				}
//				pngStr = new Array(pageCnt);
//				dim = new Array(pageCnt);
//				// get dimensions
//				for (var i=0; i<fileList.length; i++){
//					(function(index){
//						promises.push(getDimensions(fileList[i]))
//						promises.push(getFileContent(fileList[i]))
//					})(i);
//				}
//				
//				Promise.all(promises).then(function(){
//					var conn = authentication.getMongoConnection(index);
//					const Homework = conn.model('Homework', homeworkSchema);
//					Homework.findOne({studentID: studentID, workbookID: workbookID}, function(err, homework){
//						if (err){
//							res.status(507).json({message: err.message});
//							conn.close();
//							return
//						}
//						if (!homework){
//							homework = new Homework();
//							homework.studentID = studentID;
//							homework.teacherID = teacherID;
//							homework.workbookID = workbookID;
//							homework.pages = pageCnt;
//							homework.studentPNG = new Array(pageCnt);	
//							homework.studentMark = new Array(pageCnt);
//							homework.teacherPNG = new Array(pageCnt);
//							homework.teacherMark = new Array(pageCnt);
//							for (var i=0; i<pageCnt; i++){
//								homework.studentPNG[i] = "";	
//								homework.studentMark[i] = [];
//								homework.teacherPNG[i] = "";
//								homework.teacherMark[i] = [];
//							}
//						}
//						homework.uploadPNG = pngStr;
//						homework.dim = dim;
//						homework.status = 'SUBMIT';
//						homework.save(function(err){
//							if (err){
//								res.status(507).json({message: err.message});
//							} else {					
//								res.status(200).json({message: 'Files uploaded'});
//							}
//							conn.close();
//							for (var i=0; i<fileList.length; i++){
//								(function(index){
//									fs.unlinkSync(fileList[i]);
//								})(i);
//							}
//						})
//					})
//				})
//			})
//		})
//		.catch(function(err){
//			console.error(err);
//			conn.close();
//		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
};

module.exports.getByGrade = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var grade = req.body.grade
		var conn = authentication.getMongoConnection(index);
		const Workbook = conn.model('Workbook', workbookSchema);
		// don't get the fileStr
		Workbook.find({grade: grade}, {pdfStr:0, pngStr:0}, function(err, workbooks){
			if (err){
				res.status(500).json({message: err.message});
				return
			}
			conn.close();
			res.status(200).json({data: workbooks});
		});
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.getByID = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var workbookID = req.body.workbookID
		var conn = authentication.getMongoConnection(index);
		const Workbook = conn.model('Workbook', workbookSchema);
		// don't get the fileStr
		Workbook.findOne({_id: workbookID}, {pdfStr:0, pngStr:0}, function(err, workbook){
			conn.close();
			if (err){
				res.status(500).json({message: err.message});
				return
			}
			res.status(200).json({data: workbook});
		});
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.update = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var workbook = req.body.workbook
		var conn = authentication.getMongoConnection(index);
		const Workbook = conn.model('Workbook', workbookSchema);
		Workbook.findOneAndUpdate({_id: workbook._id}, workbook, function(err, entry){
			if (err){
				res.status(500).json({message: err.message});
				return
			}
			conn.close();
			res.status(200).json({message: 'workbook updated'});
		});
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.remove = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var now = new Date();
		console.log(now)
		var conn = authentication.getMongoConnection(index);
		const Workbook = conn.model('Workbook', workbookSchema);
		Workbook.deleteMany({_id: {$in: req.body.workbookIDs}}, function(err){
//		Workbook.deleteMany({_id: {$in: req.body.workbookIDs}, expire: {'$lte': now}}, function(err){
			if (err){
				res.status(500).json({message: err.message});
				return
			}
			conn.close();
			res.status(200).json({message: 'workbook removed'});
		});
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.getStatus = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var studentID = req.body.studentID;
		var workbookIDs = req.body.workbookIDs;
		var conn = authentication.getMongoConnection(index);
		const Homework = conn.model('Homework', homeworkSchema);
		Homework.find({studentID: studentID, workbookID: {$in: workbookIDs}}, {pngStr:0, studentMark:0}, function(err, homeworks){
			conn.close();
			if (err){
				res.status(500).json({message: err.message});
				return
			}
			res.status(200).json({data: homeworks});
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

// will provide workbook info also
module.exports.getByTeacher = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var teacherID = req.body.teacherID;
		var status = req.body.status;
		var homeworkRemoveIDs = [];
		var conn = authentication.getMongoConnection(index);
		const Homework = conn.model('Homework', homeworkSchema);
		// Mongoose return object can't be modified, use lean() to get JSON
		// https://stackoverflow.com/questions/9952649/convert-mongoose-docs-to-json
//		Homework.find({status: status}, {pngStr:0, studentMark:0}, function(err, homeworks){
		Homework.find({teacherID: teacherID, status: {$in: ['SUBMIT', 'REVIEW']}},
				{pngStr:0, studentMark:0}).lean().exec(function(err, homeworks){
			if (err){
				res.status(500).json({message: err.message});
				conn.close();
				return
			}
//			console.log("Get count: " + homeworks.length);
//			console.log(typeof(homeworks))
			// check if the length is 0
			// get students' name
			var studentIDs = homeworks.map(function(value){
				return value.studentID;
			})
			const User = conn.model('User', userSchema);
			User.find({_id: {$in: studentIDs}}, {}, function(err, users){
				if (err){
					res.status(500).json({message: err.message});
					conn.close();
					return
				}
				homeworks.forEach(function(homework){
					users.forEach(function(user){
						if (user._id == homework.studentID){
							homework.firstName = user.name.firstName;
							homework.lastName = user.name.lastName;
						}
					})
				})
				var workbookIDs = homeworks.map(function(value){
					return value.workbookID;
				})
				const Workbook = conn.model('Workbook', workbookSchema);
				Workbook.find({_id: {$in: workbookIDs}}, {pdfStr:0, pngStr:0}, function(err, workbooks){
					if (err){
						res.status(500).json({message: err.message});
						conn.close();
						return
					}
					homeworks.forEach(function(homework){
						// find out missing workbook
						var found = false;
						workbooks.forEach(function(workbook){
							if (workbook._id == homework.workbookID){
								homework.grade = workbook.grade;
								homework.subject = workbook.subject;
								homework.chapter = workbook.chapter;
								homework.lesson = workbook.lesson;
								homework.description = workbook.description;
								homework.due = workbook.due;
								homework.expire = workbook.expire;
								found = true;
							}
						})
						if (!found){
							homeworkRemoveIDs.push(homework._id);
						}
					})
					var homeworks_filtered = homeworks.filter(function(e){
						return homeworkRemoveIDs.indexOf(e._id) < 0; 
					})
					res.status(200).json({data: homeworks_filtered});
					if (homeworkRemoveIDs.length != 0){
						Homework.deleteMany({_id: {$in: homeworkRemoveIDs}}, function(err){
							if (err){
								return
							}
							conn.close();
						});
					} else {
						conn.close();
					}
				})
			})
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.getAllByTeacher = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var teacherID = req.body.teacherID;
		var status = req.body.status;
		var conn = authentication.getMongoConnection(index);
		const Workbook = conn.model('Workbook', workbookSchema);
		Workbook.find({teacherID: teacherID}, {pdfStr:0, pngStr:0}, function(err, workbooks){
			if (err){
				res.status(500).json({message: err.message});
				return
			}
			conn.close();
			res.status(200).json({data: workbooks});
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.getPDFById = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const Workbook = conn.model('Workbook', workbookSchema);
		Workbook.findOne({_id: req.body.id}, {pngStr:0}, function(err, workbook){
			if (err){
				res.status(500).json({message: err.message});
				return
			}
			conn.close();
			res.status(200).json({
				filename: workbook.grade + workbook.subject + workbook.chapter + workbook.lesson + '.pdf',
				data: workbook.pdfStr});
		});
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.getWorkbookByPage = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const Workbook = conn.model('Workbook', workbookSchema);
		var studentID = req.body.studentID;
		var workbookID = req.body.id;
		var page = req.body.page;
		var combinedWork;
		Workbook.findOne({_id: workbookID}, {pdfStr:0}, function(err, workbook){
			if (err){
				res.status(500).json({message: err.message});
				conn.close();
				return
			}
			if (!workbook){
				// what if workbook got deleted ...
				res.status(500).json({message: 'Workbook missing'});
				conn.close();
				return
			}
			// get from homework table, will change to 2 async processes
			const Homework = conn.model('Homework', homeworkSchema);
			Homework.findOne({studentID: studentID, workbookID: workbookID}, function(err, homework){
				conn.close();
				if (err){
					res.status(500).json({message: err.message});
					return
				}
				if (page >= workbook.pages){
					page = workbook.pages - 1
				}
				if (studentID != '0' && workbook.teacherPNG[page].length != 0){
					combinedWork = ['data:image\/png;base64,' + workbook.pngStr[page],
									'data:image\/png;base64,' + workbook.teacherPNG[page]
									]
				} else {
					combinedWork = ['data:image\/png;base64,' + workbook.pngStr[page]]
				}
				if (!homework){
					// 1. student get workbook, convert to homework
					// 2. teacher get workbook to edit, marked by studentID = 0
					mergeImages(combinedWork, {Canvas: Canvas, Image: Image})
					.then(function(base64){
						res.status(200).json({
							teacherID: workbook.teacherID,
							totalPages: workbook.pages,
							dim: workbook.dim[page],
							workbook: base64,
							studentMark: [],
							teacherMark: workbook.teacherMark[page],
							status: "ASSIGN"
						});
					})
				} else if (homework.status != 'REVIEW'){
					// student get previous homework
					var uploaded = homework.uploadPNG[0].length != 0
					mergeImages(combinedWork, {Canvas: Canvas, Image: Image})
					.then(function(base64){
						res.status(200).json({
							teacherID: workbook.teacherID,
							totalPages: workbook.pages,
							dim: workbook.dim[page],
							workbook: uploaded ? 'data:image\/png;base64,' + homework.uploadPNG[page] : base64,
							studentMark: homework.studentMark[page],
							status: homework.status
						});
					})
				} else {  // had been marked by teacher, student access, can't modify
					if (workbook.teacherPNG[page].length != 0){
						combinedWork = ['data:image\/png;base64,' + workbook.pngStr[page],
										'data:image\/png;base64,' + workbook.teacherPNG[page]
										]
					} else {
						combinedWork = ['data:image\/png;base64,' + workbook.pngStr[page]]
					}
					mergeImages(combinedWork, {Canvas: Canvas, Image: Image})
					.then(function(editedWorkbook){
						var uploaded = homework.uploadPNG[0].length != 0;
						var basepage = uploaded ? 'data:image\/png;base64,' + homework.uploadPNG[page] : editedWorkbook;
//						combinedWork = ['data:image\/png;base64,' + basepage,
//										'data:image\/png;base64,' + homework.studentPNG[page],
//										'data:image\/png;base64,' + homework.teacherPNG[page]
//										];
						if (homework.studentPNG[page].length != 0 && homework.teacherPNG[page].length != 0){
							combinedWork = [basepage,
								'data:image\/png;base64,' + homework.studentPNG[page],
								'data:image\/png;base64,' + homework.teacherPNG[page]
							];
						} else if (homework.studentPNG[page].length != 0 && homework.teacherPNG[page].length == 0){
							combinedWork = [basepage,
								'data:image\/png;base64,' + homework.studentPNG[page]
							];
						} else if (homework.studentPNG[page].length == 0 && homework.teacherPNG[page].length != 0){
							combinedWork = [basepage,
								'data:image\/png;base64,' + homework.teacherPNG[page]
							];
						} else {
							combinedWork = [basepage];
						}
						mergeImages(combinedWork, {Canvas: Canvas, Image: Image})
						.then(function(base64){
							// base64 starts with data:image/png;base64,
							// used to display base image
							res.status(200).json({
								teacherID: workbook.teacherID,
								totalPages: homework.pages,
								dim: uploaded ? homework.dim[page] : workbook.dim[page],
								workbook: base64,
								studentMark: [],
								status: homework.status
							});		
						})
					})
				}
			});
		});
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.saveHomework = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		if (req.body.role == 'student'){
			var studentID = req.body.studentID;
			var teacherID = req.body.teacherID;
			var total = req.body.total;
		}
		var id = req.body.id;
		var page = req.body.page;
		var png = req.body.png.replace(/^data:image\/png;base64,/, "");
		var mark = req.body.mark;
		var query;
		if (req.body.role == 'student')
			query = {studentID: studentID, workbookID: id}
		else
			query = {_id: id}
		var conn = authentication.getMongoConnection(index);
		const Homework = conn.model('Homework', homeworkSchema);
		Homework.findOne(query, function(err, homework){
			if (err){
				res.status(500).json({message: err.message});
				return
			}
			if (!homework){ // should be student
				homework = new Homework();
				homework.studentID = studentID;
				homework.teacherID = teacherID;
				homework.workbookID = id;
				homework.pages = total;
				homework.status = 'ASSIGN';
				homework.uploadPNG = new Array(total).fill("");
				homework.studentPNG = new Array(total).fill("");				
				homework.studentPNG[page] = png;
				homework.studentMark = new Array(total).fill([]);
				homework.studentMark[page] = mark;
				homework.teacherPNG = new Array(total).fill("");
				homework.teacherMark = new Array(total).fill([]);
			} else {
				// homework.pngStr[page] = base64Data doesn't work on existing record
				// good problem to investigate...
				// create a temporary buffer, get whatever data in record, then assign back
				if (req.body.role == 'student'){
					var tempBuf = homework.studentPNG.slice();
					tempBuf[page] = png;
					homework.studentPNG = tempBuf;
					var arrayBuf = homework.studentMark.slice();
					arrayBuf[page] = mark;
					homework.studentMark = arrayBuf;
				} else {
					var tempBuf = homework.teacherPNG.slice();
					tempBuf[page] = png;
					homework.teacherPNG = tempBuf;
					var arrayBuf = homework.teacherMark.slice();
					arrayBuf[page] = mark;
					homework.teacherMark = arrayBuf;
				}
			}
			homework.save(function(err){
				if (err){
					res.status(500).json({message: err.message});
					return
				}
				conn.close();
				res.status(200).json({message: 'data saved'});				
			})
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.saveWorkbook = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var id = req.body.id;
		var page = req.body.page;
		var png = req.body.png.replace(/^data:image\/png;base64,/, "");
		var mark = req.body.mark;
		var conn = authentication.getMongoConnection(index);
		const Workbook = conn.model('Workbook', workbookSchema);
		Workbook.findOne({_id: id}, {pdfStr:0}, function(err, workbook){
			if (err){
				res.status(500).json({message: err.message});
				conn.close();
				return
			}
			if (!workbook){
				res.status(500).json({message: 'Workbook missing'});
				conn.close();
				return
			} else {
				var tempBuf = workbook.teacherPNG.slice();
				tempBuf[page] = png;
				workbook.teacherPNG = tempBuf;
				var arrayBuf = workbook.teacherMark.slice();
				arrayBuf[page] = mark;
				workbook.teacherMark = arrayBuf;
				workbook.save(function(err){
					if (err){
						res.status(507).json({message: err.message});
					} else {					
						res.status(200).json({message: 'File updated'});
					}
					conn.close();
				})
			}
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.submit = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var studentID = req.body.studentID;
		var workbookID = req.body.id;
		var conn = authentication.getMongoConnection(index);
		const Homework = conn.model('Homework', homeworkSchema);
		Homework.findOne({studentID: studentID, workbookID: workbookID}, function(err, homework){
			if (err){
				res.status(500).json({message: err.message});
				conn.close();
				return
			}
			homework.status = 'SUBMIT';
			homework.save(function(err){
				if (err){
					res.status(500).json({message: err.message});
					conn.close();
					return
				}
				conn.close();
				res.status(200).json({message: 'data saved'});				
			})
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.getHomeworkByPage = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var homeworkID = req.body.id;
		var page = req.body.page;
		var conn = authentication.getMongoConnection(index);
		const Homework = conn.model('Homework', homeworkSchema);
		Homework.findOne({_id: homeworkID}, function(err, homework){
			if (err){
				res.status(500).json({message: err.message});
				conn.close();
				return
			}
			if (!homework){
				res.status(500).json({message: 'Homework missing'});
				conn.close();
				return
			}
			// get the worksheet ID & studentID
			const User = conn.model('User', userSchema);
			User.findOne({_id: homework.studentID}, function(err, user){
				if (err){
					res.status(500).json({message: err.message});
					conn.close();
					return
				}
				const Workbook = conn.model('Workbook', workbookSchema);
				Workbook.findOne({_id: homework.workbookID}, function(err, workbook){
					if (err){
						res.status(500).json({message: err.message});
						conn.close();
						return
					}
					if (!workbook){
						res.status(500).json({message: 'Workbook missing'});
						conn.close();
						return
					}
					if (page >= workbook.pages){
						page = workbook.pages - 1
					}
					// check if there is uploaded homework
					// need to handle workbook.teacherPNG if exists
					var combinedWork;
					var uploaded = homework.uploadPNG[0].length != 0;
					if (uploaded){
						combinedWork = ['data:image\/png;base64,' + homework.uploadPNG[page]]
					} else if (workbook.teacherMark[page].length == 0 && homework.studentPNG[page].length != 0){
						combinedWork = ['data:image\/png;base64,' + workbook.pngStr[page],
										'data:image\/png;base64,' + homework.studentPNG[page]]
					} else if (workbook.teacherMark[page].length != 0 && homework.studentPNG[page].length != 0){
						combinedWork = ['data:image\/png;base64,' + workbook.pngStr[page],
										'data:image\/png;base64,' + workbook.teacherPNG[page],
										'data:image\/png;base64,' + homework.studentPNG[page]]
					} else if (workbook.teacherMark[page].length == 0 && homework.studentPNG[page].length == 0){
						combinedWork = ['data:image\/png;base64,' + workbook.pngStr[page]]
					} else if (workbook.teacherMark[page].length != 0 && homework.studentPNG[page].length == 0){
						combinedWork = ['data:image\/png;base64,' + workbook.pngStr[page],
										'data:image\/png;base64,' + workbook.teacherPNG[page]]
					}
					mergeImages(combinedWork, {Canvas: Canvas, Image: Image})
						.then(function(base64){
							// base64 starts with data:image/png;base64,
							// used to display base image
							res.status(200).json({
								student: user.name.firstName + ' ' + user.name.lastName,
								totalPages: homework.pages,
								dim: uploaded ? homework.dim[page] : workbook.dim[page],
								workbook: base64,
								teacherMark: homework.teacherMark[page],
								status: homework.status
							});		
							conn.close();
						})
					
				})
			})
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.removeHomework = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var homeworkIDs = req.body.homeworkIDs;
		var conn = authentication.getMongoConnection(index);
		const Homework = conn.model('Homework', homeworkSchema);
		Homework.deleteMany({_id: {$in: homeworkIDs}}, function(err){
			if (err){
				return
			}
			res.status(200).json({message: 'homework removed'});	
			conn.close();
		});
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}
module.exports.review = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var homeworkID = req.body.id;
		var conn = authentication.getMongoConnection(index);
		const Homework = conn.model('Homework', homeworkSchema);
		Homework.findOne({_id: homeworkID}, function(err, homework){
			if (err){
				res.status(500).json({message: err.message});
				conn.close();
				return
			}
			homework.status = 'REVIEW';
			homework.save(function(err){
				conn.close();
				if (err){
					res.status(500).json({message: err.message});
					return
				}
				res.status(200).json({message: 'data saved'});				
			})
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.removeHomework = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const Homework = conn.model('Homework', homeworkSchema);
		Homework.deleteMany({_id: {$in: req.body.homeworkIDs}}, function(err){
			conn.close();
			if (err){
				res.status(500).json({message: err.message});
				return
			}
			res.status(200).json({message: 'homework removed'});
		});
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}
