var mongoose = require('mongoose');
var workbookSchema = require('../models/workbook');
var homeworkSchema = require('../models/homework');
var userSchema = require('../models/user');
var authentication = require('./authentication');
var fs = require('fs');
var path = require('path');
var mergeImages = require('merge-images');
var {Canvas, Image} = require('canvas');
var sizeOf = require('image-size');
// pdf-poppler does not support Linux, better quality than pdf2pic
//var pdfPoppler = require('pdf-poppler');
var pdf2pic = require('pdf2pic');

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

var pdf2png = function(filename, uploadDir){
	var pageCnt = 0;
	var pdfStr;
	var pngStr = [];
	var dim = [];
	var promises = [];
	
	var getDimensions = function(filename){
		return new Promise(function(resolve, reject){
			sizeOf(filename, function(err, dimensions){
				if (err)
					reject(err);
				else {
					if (pageCnt == 1)
						dim[0] = {"width": dimensions.width, "height": dimensions.height};
					else {
						var index = parseInt(filename.split(/-|_/).pop().substring(0,2), 10) - 1;
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
						var index = parseInt(name.split(/-|_/).pop(), 10) - 1;
						pngStr[index] = data;
					}
					resolve(data);
				}
			});
		});
	};
	
	return new Promise(function(resolve, reject){
		fs.readFile(filename, 'base64', function(err, data){
			if (err)
				reject(err);
			else {
				pdfStr = data;
				// pdf-poppler: scale is the height
//				let opts = {
//					format: 'png',
//					out_dir: uploadDir,
//					out_prefix: path.basename(filename, path.extname(filename)),
//					page: 0,
//					scale: 792
//				}
				// size is the width
				var pdf2Pic = new pdf2pic({
					density: 300,
					savename: path.basename(filename, path.extname(filename)),
					savedir: uploadDir,
					format: "png",
					size: "674"		// adjust to fit tablet
				})
				// pdf-poppler
//				pdfPoppler.convert(filename, opts)
				// pdf2pic
				pdf2Pic.convertBulk(filename, -1)
				.then(function(response){
					// check the number of png files created
					fs.readdir(uploadDir, function(err, files){
						var fileList = [];
						var fileResizeList = [];
						files.forEach(function(file){
							if (file.startsWith(path.basename(filename, path.extname(filename)))){
								pageCnt += 1
								fileList.push(path.join(uploadDir, file));
							}
						})
						console.log("Pages: " + pageCnt)
						pngStr = new Array(pageCnt);
						dim = new Array(pageCnt);
						// get dimensions
						for (var i=0; i<fileList.length; i++){
							(function(index){
								promises.push(getDimensions(fileList[index]))
								promises.push(getFileContent(fileList[index]))
							})(i);
						}
						Promise.all(promises).then(function(){
							console.log('All done...')
							// remove the uploaded files
							for (var i=0; i<fileList.length; i++){
								(function(index){
									fs.unlinkSync(fileList[i]);
								})(i);
							}
							resolve({pdfStr: pdfStr, pngStr: pngStr, dim: dim, pageCnt: pageCnt})
						})
					})
				})
				.catch(function(err){
					console.log(err);
					reject(err);
				})
			}
		})
	})
}

module.exports.uploadWorkbook = function(req, res, next){
	var client = req.body.client;
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		const file = req.file;
		var filename = file.path;
		console.log(filename + 'upload workbook...')
		var uploadDir = path.join(__dirname, '../uploads');
		pdf2png(filename, uploadDir)
		.then(function(result){
			var conn = authentication.getMongoConnection(index);
			const Workbook = conn.model('Workbook', workbookSchema);
			Workbook.findOne({teacherID: req.body.teacherID,
				grade: req.body.grade,
				subject: req.body.subject,
				chapter: req.body.chapter,
				lesson: req.body.lesson}, function(err, workbook){
					if (err){
						res.status(507).json({message: err.message});
						conn.close();
						return
					}
					if (!workbook){
						workbook = new Workbook();
						workbook.teacherID = req.body.teacherID;
						workbook.grade = req.body.grade;
						workbook.subject = req.body.subject;
						workbook.chapter = req.body.chapter;
						workbook.lesson = req.body.lesson;
						workbook.description = req.body.description;
						workbook.due = req.body.dueDate;
						workbook.expire = req.body.expireDate;
						workbook.studentPenColor = req.body.studentPenColor;
						// string array get converted to string on upload!
						workbook.teacherPenColor = req.body.teacherPenColor.split(',');
					} else {
						console.log('found existing record in DB...')
					}
					
					workbook.pdfStr = result.pdfStr;
					workbook.pngStr = result.pngStr;
					workbook.pages = result.pageCnt;
					workbook.dim = result.dim;
					workbook.teacherPNG = new Array(result.pageCnt);
					workbook.teacherMark = new Array(result.pageCnt);
					workbook.teacherTextPNG = new Array(result.pageCnt);
					workbook.teacherTextMark = new Array(result.pageCnt);
					for (var i=0; i<result.pageCnt; i++){
						workbook.teacherPNG[i] = "";
						workbook.teacherMark[i] = [];
						workbook.teacherTextPNG[i] = "";
						workbook.teacherTextMark[i] = [];
					}
					workbook.save(function(err){
						if (err){
							res.status(507).json({message: err.message});
						} else {					
							res.status(200).json({message: 'Files uploaded'});
						}
						conn.close();
					})
				})
		})
		.catch(function(){
			res.status(500).json({message: 'Server error'});
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
		console.log(studentID + 'upload homework...')
		var teacherID = req.body.teacherID;
		var workbookID = req.body.workbookID;
		var filename = file.path;
		var uploadDir = path.join(__dirname, '../uploads');
		pdf2png(filename, uploadDir)
		.then(function(result){
			var conn = authentication.getMongoConnection(index);
			const Homework = conn.model('Homework', homeworkSchema);
			Homework.findOne({studentID: studentID, workbookID: workbookID}, function(err, homework){
				if (err){
					res.status(507).json({message: err.message});
					conn.close();
					return
				}
				if (!homework){
					homework = new Homework();
					homework.studentID = studentID;
					homework.teacherID = teacherID;
					homework.workbookID = workbookID;
					homework.pages = result.pageCnt;
					homework.studentPNG = new Array(result.pageCnt);	
					homework.studentMark = new Array(result.pageCnt);
					homework.studentTextPNG = new Array(result.pageCnt);	
					homework.studentTextMark = new Array(result.pageCnt);
					homework.teacherPNG = new Array(result.pageCnt);
					homework.teacherMark = new Array(result.pageCnt);
					homework.teacherTextPNG = new Array(result.pageCnt);
					homework.teacherTextMark = new Array(result.pageCnt);
					for (var i=0; i<result.pageCnt; i++){
						homework.studentPNG[i] = "";	
						homework.studentMark[i] = [];
						homework.studentTextPNG[i] = "";	
						homework.studentTextMark[i] = [];
						homework.teacherPNG[i] = "";
						homework.teacherMark[i] = [];
						homework.teacherTextPNG[i] = "";
						homework.teacherTextMark[i] = [];
					}
				}
				homework.uploadPNG = result.pngStr;
				homework.dim = result.dim;
				homework.status = 'SUBMIT';
				homework.save(function(err){
					if (err){
						res.status(507).json({message: err.message});
					} else {					
						res.status(200).json({message: 'Files uploaded'});
					}
					conn.close();
				})
			})			
		})
		.catch(function(){
			res.status(500).json({message: 'Server error'});
		})
		
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
};

module.exports.getByGrade = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var grade = req.body.grade;
		// map can't have null item
		var level = req.body.level.filter(x => x);
		var conn = authentication.getMongoConnection(index);
		const Workbook = conn.model('Workbook', workbookSchema);
		var grades = level.map(function(value){
			return value.grade;
		})
		var levelSubjects = level.map(function(value){
			return value.subject;
		})
		grades.push(grade);
		grades = Array.from(new Set(grades))
		
		var workbooks_filtered = [];
		Workbook.find({grade: {$in: grades}}, {pngStr:0, teacherPNG:0, teacherMark:0})
			.sort({chapter:1, lesson:1}).lean().exec(function(err, workbooks){
			if (err){
				res.status(500).json({message: err.message});
				return
			}
			// get teachers' name
			var teacherIDs = workbooks.map(function(value){
				return value.teacherID;
			})
			const User = conn.model('User', userSchema);
			User.find({_id: {$in: teacherIDs}}, {}, function(err, users){
				if (err){
					res.status(500).json({message: err.message});
					conn.close();
					return
				}
				workbooks.forEach(function(workbook){
					users.forEach(function(user){
						if (user._id == workbook.teacherID){
							workbook.teacherFirstName = user.name.firstName;
							workbook.teacherLastName = user.name.lastName;
						}
					})
				})
				conn.close();
				if (level.length == 0){
					res.status(200).json({data: workbooks});
				} else {
					workbooks.forEach(function(workbook){
						var included = false;
						level.forEach(function(lvl){
							if (lvl.subject == workbook.subject && lvl.grade == workbook.grade){
								workbooks_filtered.push(workbook);
								included = true;
							}
						})
						if (!included &&
								workbook.grade == grade &&
								levelSubjects.indexOf(workbook.subject) == -1){
							workbooks_filtered.push(workbook);
						}
					})
					res.status(200).json({data: workbooks_filtered});
				}
			})
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

module.exports.getHomeworkByTeacher = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var teacherID = req.body.teacherID;
		var status = req.body.status;
		var homeworkRemoveIDs = [];
		var conn = authentication.getMongoConnection(index);
		const Homework = conn.model('Homework', homeworkSchema);
		// Mongoose return object can't be modified, use lean() to get JSON
		// https://stackoverflow.com/questions/9952649/convert-mongoose-docs-to-json
//		Homework.find({teacherID: teacherID, status: {$in: ['SUBMIT', 'REVIEW']}},
		Homework.find({teacherID: teacherID },
				{uploadPNG:0, studentPNG:0, studentMark:0, studentTextPNG:0, studentTextMark:0,
				 teacherPNG:0, teacherMark:0, teacherTextPNG:0, teacherTextMark:0}).lean().exec(function(err, homeworks){
			if (err){
				res.status(500).json({message: err.message});
				conn.close();
				return
			}
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
				Workbook.find({_id: {$in: workbookIDs}}, {pngStr:0}, function(err, workbooks){
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
					// put into grades
					var grades = [];
					homeworks_filtered.forEach(function(homework){
						if (grades.find(o => o._id == homework.grade) == undefined){
							grades.push({_id: homework.grade, homeworks: [homework]});
						} else {
							grades.find(o => o._id == grades).homeworks.push(homework)
						}
					})
					res.status(200).json({data: grades});
					
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

module.exports.getWorkbookByTeacher = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var teacherID = req.body.teacherID;
		var status = req.body.status;
		var conn = authentication.getMongoConnection(index);
		const Workbook = conn.model('Workbook', workbookSchema);
		Workbook.aggregate([
			{$sort: {chapter: 1, lesson: 1}},
			{$match: {"teacherID": teacherID}},
			{$group: {
				_id: "$grade",
				workbooks: {
					$push:{
						_id: "$_id",
						teacherID: "$teacherID",
						grade: "$grade",
						subject: "$subject",
						chapter: "$chapter",
						lesson: "$lesson",
						description: "$description",
						pages: "$pages",
						due: "$due",
						expire: "$expire"
					}
				},
			}},
			{$sort:{
				"_id": 1
			}}
		], function(err, grades){
			if (err){
				res.status(500).json({message: err.message});
				return
			}
			conn.close();
			res.status(200).json({data: grades});
		})
		
//		Workbook.find({teacherID: teacherID}, {pngStr:0, teacherPNG:0, teacherMark:0,
//			teacherTextPNG:0, teacherTextMark:0}, function(err, workbooks){
//			if (err){
//				res.status(500).json({message: err.message});
//				return
//			}
//			conn.close();
//			res.status(200).json({data: workbooks});
//		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

// 1. teacher get workbook : studentID='0', !homework
// 2. teacher get workbook with instructions for all
// 3. student get workbook : !homework with teacher instructions if present
// 4. student get workbook with editing : homework exists 
// 5. teacher get homework with instructions and student work and marks    (getHomework)
// 6. student get workbook with instructions, work and teacher marks 
module.exports.getWorkbookByPage = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const Workbook = conn.model('Workbook', workbookSchema);
		var studentID = req.body.studentID;
		var workbookID = req.body.id;
		var page = req.body.page;
		var combinedWork = [];
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
				
				// (3) student gets workbook, no teacherPNG
				// (1, 2) teacher gets workbook (studentID=0), return teacherMark for editing
				combinedWork = ['data:image\/png;base64,' + workbook.pngStr[page]];
				// (3) student gets workbook, include teacherPNG
				// for teacher the followings won't be hard coded so that can be edited
				if (studentID != '0' && workbook.teacherPNG[page].length != 0){
					combinedWork.push('data:image\/png;base64,' + workbook.teacherPNG[page]);
				}
				if (studentID != '0' && workbook.teacherTextPNG[page].length != 0){
					combinedWork.push(workbook.teacherTextPNG[page]);
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
							studentTextMark: [],
							studentPenColor: workbook.studentPenColor,
							teacherMark: workbook.teacherMark[page],
							teacherTextMark: workbook.teacherTextMark[page],
							teacherPenColor: workbook.teacherPenColor,
							status: "ASSIGN"
						});
					})
				} else if (homework.status != 'REVIEW'){	// either ASSIGN (still working) or SUBMIT (can't change)
					// (4) student get previous homework, add teacher marking if present
					var uploaded = homework.uploadPNG[0].length != 0
					if (uploaded){
						combinedWork = ['data:image\/png;base64,' + homework.uploadPNG[page]]
					}
					if (homework.teacherPNG[page].length != 0){
						combinedWork.push('data:image\/png;base64,' + homework.teacherPNG[page])
					}
					if (homework.teacherTextPNG[page].length != 0){
						combinedWork.push(homework.teacherTextPNG[page])
					}
					mergeImages(combinedWork, {Canvas: Canvas, Image: Image})
					.then(function(base64){
						res.status(200).json({
							teacherID: workbook.teacherID,
							totalPages: homework.pages,
							dim: workbook.dim[page],
							workbook: base64,
							studentMark: homework.studentMark[page],
							studentTextMark: homework.studentTextMark[page],
							studentPenColor: workbook.studentPenColor,
							status: homework.status
						});
					})
				} else {  
					// (6) had been marked by teacher, student access, can't modify previous work
					var uploaded = homework.uploadPNG[0].length != 0
					if (uploaded){
						combinedWork = ['data:image\/png;base64,' + homework.uploadPNG[page]]
					}
					if (homework.teacherPNG[page].length != 0){
						combinedWork.push('data:image\/png;base64,' + homework.teacherPNG[page])
					}
					if (homework.teacherTextPNG[page].length != 0){
						combinedWork.push(homework.teacherTextPNG[page])
					}
					if (homework.studentPNG[page].length != 0){
						combinedWork.push('data:image\/png;base64,' + homework.studentPNG[page])
					}
					if (homework.studentTextPNG[page].length != 0){
						combinedWork.push(homework.studentTextPNG[page])
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
							studentTextMark: [],
							studentPenColor: workbook.studentPenColor,
							status: homework.status
						});		
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
		var textPng = req.body.textPng;
		var textMark = req.body.textMark;
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
				homework.studentTextPNG = new Array(total).fill("");				
				homework.studentTextPNG[page] = textPng;
				homework.studentTextMark = new Array(total).fill([]);
				homework.studentTextMark[page] = textMark;
				
				homework.teacherPNG = new Array(total).fill("");
				homework.teacherMark = new Array(total).fill([]);
				homework.teacherTextPNG = new Array(total).fill("");
				homework.teacherTextMark = new Array(total).fill([]);
			} else {
				// homework.pngStr[page] = base64Data doesn't work on existing record
				// good problem to investigate...
				// create a temporary buffer, get whatever data in record, then assign back
				if (req.body.role == 'student'){
					var studentPngBuf = homework.studentPNG.slice();
					studentPngBuf[page] = png;
					homework.studentPNG = studentPngBuf;
					var studentMarkBuf = homework.studentMark.slice();
					studentMarkBuf[page] = mark;
					homework.studentMark = studentMarkBuf;
					var studentTextPngBuf = homework.studentTextPNG.slice();
					studentTextPngBuf[page] = textPng;
					homework.studentTextPNG = studentTextPngBuf;
					var studentTextMarkBuf = homework.studentTextMark.slice();
					studentTextMarkBuf[page] = textMark;
					homework.studentTextMark = studentTextMarkBuf;
				} else {
					var teacherPngBuf = homework.teacherPNG.slice();
					teacherPngBuf[page] = png;
					homework.teacherPNG = teacherPngBuf;
					var teacherMarkBuf = homework.teacherMark.slice();
					teacherMarkBuf[page] = mark;
					homework.teacherMark = teacherMarkBuf;
					var teacherTextPngBuf = homework.teacherTextPNG.slice();
					teacherTextPngBuf[page] = textPng;
					homework.teacherTextPNG = teacherTextPngBuf;
					var teacherTextMarkBuf = homework.teacherTextMark.slice();
					teacherTextMarkBuf[page] = textMark;
					homework.teacherTextMark = teacherTextMarkBuf;
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
		var textPng = req.body.textPng;
		var textMark = req.body.textMark;
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
				var teacherPngBuf = workbook.teacherPNG.slice();
				teacherPngBuf[page] = png;
				workbook.teacherPNG = teacherPngBuf;
				var teacherMarkBuf = workbook.teacherMark.slice();
				teacherMarkBuf[page] = mark;
				workbook.teacherMark = teacherMarkBuf;
				var teacherTextPngBuf = workbook.teacherTextPNG.slice();
				teacherTextPngBuf[page] = textPng;
				workbook.teacherTextPNG = teacherTextPngBuf;
				var teacherTextMarkBuf = workbook.teacherTextMark.slice();
				teacherTextMarkBuf[page] = textMark;
				workbook.teacherTextMark = teacherTextMarkBuf;
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
					var combinedWork = [];
					var uploaded = homework.uploadPNG[0].length != 0;
					combinedWork = ['data:image\/png;base64,' + workbook.pngStr[page]];
					if (workbook.teacherPNG[page].length != 0){
						combinedWork.push('data:image\/png;base64,' + workbook.teacherPNG[page])
					}
					if (workbook.teacherTextPNG[page].length != 0){
						combinedWork.push(workbook.teacherTextPNG[page])
					}
					if (uploaded){
						combinedWork = ['data:image\/png;base64,' + homework.uploadPNG[page]]
					}
					if (homework.studentPNG[page].length != 0){
						combinedWork.push('data:image\/png;base64,' + homework.studentPNG[page])
					}
					if (homework.studentTextPNG[page].length != 0){
						combinedWork.push(homework.studentTextPNG[page])
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
								teacherTextMark: homework.teacherTextMark[page],
								teacherPenColor: workbook.teacherPenColor,
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

module.exports.changeHomeworkStatus = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var homeworkID = req.body.id;
		var status = req.body.status;
		var conn = authentication.getMongoConnection(index);
		const Homework = conn.model('Homework', homeworkSchema);
		Homework.findOne({_id: homeworkID}, function(err, homework){
			if (err){
				res.status(500).json({message: err.message});
				conn.close();
				return
			}
			homework.status = status;
			homework.save(function(err){
				if (err){
					res.status(500).json({message: err.message});
					conn.close();
					return
				}
				conn.close();
				res.status(200).json({message: 'status saved'});				
			})
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

var mergeContent = function(combinedWork){
	return new Promise(function(resolve, reject){
		mergeImages(combinedWork, {Canvas: Canvas, Image: Image})
		.then(function(base64){
			resolve(base64);
		})
		.catch(function(err){
			console.log(err);
			reject(err);
		})
	})
}
module.exports.printWorkbook = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var studentID = req.body.studentID;
		var workbookID = req.body.workbookID;
		var promises = [];
		var conn = authentication.getMongoConnection(index);
		const Workbook = conn.model('Workbook', workbookSchema);
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
				var combinedWork = new Array(workbook.pages).fill([]);
				for (var i=0; i<workbook.pages; i++){
					combinedWork[i] = ['data:image\/png;base64,' + workbook.pngStr[i]]
					if (workbook.teacherPNG[i].length != 0){
						combinedWork[i].push('data:image\/png;base64,' + workbook.teacherPNG[i])
					}
				}
				if (!homework){
					for (var i=0; i<workbook.pages; i++){
						(function(index){
							promises.push(mergeContent(combinedWork[index]))
						})(i);
					}
					Promise.all(promises).then(function(editedWorkbook){
						var filename = workbook.grade + 'Gr' + workbook.subject + 'Ch' + workbook.chapter + 'L' + workbook.lesson + '.pdf';
						res.status(200).json({filename: filename, png: editedWorkbook, dim: workbook.dim});
						return
					})
				} else {
					var uploaded = homework.uploadPNG[0].length != 0;
					for (var i=0; i<homework.pages; i++){
						if (uploaded){
							combinedWork[i] = ['data:image\/png;base64,' + homework.uploadPNG[i]]
						}
						if (homework.studentPNG[i].length != 0){
							combinedWork[i].push('data:image\/png;base64,' + homework.studentPNG[i])
						}
						if (homework.teacherPNG[i].length != 0){
							combinedWork[i].push('data:image\/png;base64,' + homework.teacherPNG[i])
						}
					}
					for (var i=0; i<homework.pages; i++){
						(function(index){
							promises.push(mergeContent(combinedWork[index]))
						})(i);
					}
					Promise.all(promises).then(function(combinedHomework){
						var filename = workbook.grade + 'Gr' + workbook.subject + 'Ch' + workbook.chapter + 'L' + workbook.lesson + '.pdf';
						res.status(200).json({filename: filename, png: combinedHomework, dim: uploaded ? homework.dim: workbook.dim});
						return
					})
				}
			});
		});
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.printHomework = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var homeworkID = req.body.homeworkID;
		var promises = [];
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
					conn.close();
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
					// check if there is uploaded homework
					// need to handle workbook.teacherPNG if exists
					var uploaded = homework.uploadPNG[0].length != 0;
					var combinedWork = new Array(homework.pages).fill([]);
					for (var i=0; i<homework.pages; i++){
						if (uploaded){
							combinedWork[i] = ['data:image\/png;base64,' + homework.uploadPNG[i]]
						} else {
							combinedWork[i] = ['data:image\/png;base64,' + workbook.pngStr[i]]
							if (workbook.teacherPNG[i].length != 0){
								combinedWork[i].push('data:image\/png;base64,' + workbook.teacherPNG[i])
							}
						}
						if (homework.studentPNG[i].length != 0){
							combinedWork[i].push('data:image\/png;base64,' + homework.studentPNG[i])
						} 
						if (homework.teacherPNG[i].length != 0){
							combinedWork[i].push('data:image\/png;base64,' + homework.teacherPNG[i])
						}
					}
					for (var i=0; i<homework.pages; i++){
						(function(index){
							promises.push(mergeContent(combinedWork[index]))
						})(i);
					}
					Promise.all(promises).then(function(combinedHomework){
						var filename = user.name.firstName + workbook.grade + 'Gr' + workbook.subject + 'Ch' + workbook.chapter + 'L' + workbook.lesson + '.pdf';
						res.status(200).json({filename: filename, png: combinedHomework, dim: uploaded ? homework.dim: workbook.dim});
						return
					})
				})
			})
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.getWorkbookPDF = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const Workbook = conn.model('Workbook', workbookSchema);
		Workbook.findOne({_id: req.body.workbookID},
				{pngStr:0, teacherPNG:0, teacherMark:0, teacherTextPNG:0, teacherTextMark:0},
				function(err, workbook){
			conn.close();
			if (err){
				res.status(500).json({message: err.message});
				return
			}
			res.status(200).json({
				filename: workbook.grade + '_Grade_' + workbook.subject + '_ch_' + workbook.chapter + '_' + workbook.lesson + '.pdf',
				data: workbook.pdfStr});
		});
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.getWorkbookRecords = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const Workbook = conn.model('Workbook', workbookSchema);
		Workbook.find({}, function(err, workbooks){
			conn.close();
			if (err){
				res.status(500).json({message: err.message});
				return
			}
			res.status(200).json({data: workbooks})
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}


