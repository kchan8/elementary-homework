var express = require('express');
var router = express.Router();
var video = require('../controllers/video');

router.post('/upload', video.upload);
router.post('/getByTeacher', video.getByTeacher);
router.post('/getByID', video.getByID);
router.post('/update', video.update);
router.post('/remove', video.remove);
router.post('/getByGrade', video.getByGrade);
router.post('/getRecords', video.getRecords);

module.exports = router;