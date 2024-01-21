var mongoose = require('mongoose');
var videoSchema = require('../models/video');
var userSchema = require('../models/user');
var authentication = require('./authentication');

module.exports.upload = function(req, res){
	console.log('video upload...')
	var client = req.body.client;
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const Video = conn.model('Video', videoSchema);
		video = new Video();
		video.grade = req.body.video.grade;
		video.subject = req.body.video.subject;
		video.chapter = req.body.video.chapter;
		video.lesson = req.body.video.lesson;
		video.description = req.body.video.description;
		video.expire = req.body.video.expire;
		video.url = req.body.video.url;
		video.teacherID = req.body.teacherID;
		video.save(function(err){
			conn.close();
			if (err){
				res.status(500).json({message: err.message});
				return
			}
			res.status(200).json({message: 'video url uploaded'});
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.getByTeacher = function(req, res){
	console.log('video getbyteacher...')
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var teacherID = req.body.teacherID;
		var conn = authentication.getMongoConnection(index);
		const Video = conn.model('Video', videoSchema);
		Video.aggregate([
			{$sort: {expire: 1}},
			{$match: {"teacherID": teacherID}},
			{$group: {
				_id: "$grade",
				videos: {
					$push:{
						_id: "$_id",
						subject: "$subject",
						chapter: "$chapter",
						lesson: "$lesson",
						description: "$description",
						expire: "$expire",
						url: "$url"
					}
				},
			}},
			{$sort:{
				"_id": 1
			}}
		], function(err, grades){
//			console.log(grades)
			conn.close();
			if (err){
				res.status(500).json({message: err.message});
				return
			}
			res.status(200).json({data: grades});
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.getByID = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var videoID = req.body.videoID
		var conn = authentication.getMongoConnection(index);
		const Video = conn.model('Video', videoSchema);
		Video.findOne({_id: videoID}, function(err, video){
			conn.close();
			if (err){
				res.status(500).json({message: err.message});
				return
			}
			res.status(200).json({data: video});
		});
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.update = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var video = req.body.video
		var conn = authentication.getMongoConnection(index);
		const Video = conn.model('Video', videoSchema);
		Video.findOneAndUpdate({_id: video._id}, video, function(err, entry){
			conn.close();
			if (err){
				res.status(500).json({message: err.message});
				return
			}
			res.status(200).json({message: 'video info updated'});
		});
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.remove = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var now = new Date();
		var conn = authentication.getMongoConnection(index);
		const Video = conn.model('Video', videoSchema);
		Video.deleteMany({_id: {$in: req.body.videoIDs}}, function(err){
//		Video.deleteMany({_id: {$in: req.body.videoIDs}, expire: {'$lte': now}}, function(err){
			if (err){
				res.status(500).json({message: err.message});
				return
			}
			conn.close();
			res.status(200).json({message: 'video removed'});
		});
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.getByGrade = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var grade = req.body.grade;
		// map can't have null item
		var level = req.body.level.filter(x => x);
		var conn = authentication.getMongoConnection(index);
		const Video = conn.model('Video', videoSchema);
		var grades = level.map(function(value){
			return value.grade;
		})
		var levelSubjects = level.map(function(value){
			return value.subject;
		})
		grades.push(grade);
		grades = Array.from(new Set(grades))
		
		var videos_filtered = [];
		Video.find({grade: {$in: grades}}).sort({chapter:1, lesson:1}).lean().exec(function(err, videos){
			if (err){
				res.status(500).json({message: err.message});
				return
			}
			// get teachers' name
			var teacherIDs = videos.map(function(value){
				return value.teacherID;
			})
			const User = conn.model('User', userSchema);
			User.find({_id: {$in: teacherIDs}}, {}, function(err, users){
				if (err){
					res.status(500).json({message: err.message});
					conn.close();
					return
				}
				videos.forEach(function(video){
					users.forEach(function(user){
						if (user._id == video.teacherID){
							video.teacherFirstName = user.name.firstName;
							video.teacherLastName = user.name.lastName;
						}
					})
				})
				conn.close();
				if (level.length == 0){
					res.status(200).json({data: videos});
				} else {
					videos.forEach(function(video){
						var included = false;
						level.forEach(function(lvl){
							if (lvl.subject == video.subject && lvl.grade == video.grade){
								videos_filtered.push(video);
								included = true;
							}
						})
						if (!included &&
								video.grade == grade &&
								levelSubjects.indexOf(video.subject) == -1){
							videos_filtered.push(video);
						}
					})
					res.status(200).json({data: videos_filtered});
				}
			})
		});
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}

module.exports.getRecords = function(req, res){
	var index = authentication.clientValidate(req.body.client);
	if (index !== -1){
		var conn = authentication.getMongoConnection(index);
		const Video = conn.model('Video', videoSchema);
		Video.find({}, function(err, videos){
			conn.close();
			if (err){
				res.status(500).json({message: err.message});
				return
			}
			res.status(200).json({data: videos})
		})
	} else {
		res.status(404).json({message: 'Invalid client'});
	}
}
