var express = require('express');
var router = express.Router();
var workbook = require('../controllers/workbook');
var multer = require('multer')
var storage = multer.diskStorage({
	destinatin: function(req, file, callback){
		callback(null, './uploads')
	},
	filename: function(req, file, callback){
		callback(null, file.originalname)
	}
})
var upload = multer({storage: storage});

//router.post('/upload', upload.array('file', 16), workbook.upload);
router.post('/uploadWorkbook', upload.single('file'), workbook.uploadWorkbook);
router.post('/uploadHomework', upload.single('file'), workbook.uploadHomework);
router.post('/getByGrade', workbook.getByGrade);
router.post('/getByID', workbook.getByID);
router.post('/update', workbook.update);
router.post('/remove', workbook.remove);
router.post('/getStatus', workbook.getStatus);
router.post('/getHomeworkByTeacher', workbook.getHomeworkByTeacher);
router.post('/getWorkbookByTeacher', workbook.getWorkbookByTeacher);
router.post('/getWorkbookByPage', workbook.getWorkbookByPage);
router.post('/getWorkbookPDF', workbook.getWorkbookPDF);
router.post('/getHomeworkByPage', workbook.getHomeworkByPage);
router.post('/saveWorkbook', workbook.saveWorkbook);
router.post('/printWorkbook', workbook.printWorkbook);
router.post('/printHomework', workbook.printHomework);
router.post('/saveHomework', workbook.saveHomework);
router.post('/removeHomework', workbook.removeHomework);
router.post('/changeHomeworkStatus', workbook.changeHomeworkStatus);
router.post('/submit', workbook.submit);
router.post('/review', workbook.review);
router.post('/getWorkbookRecords', workbook.getWorkbookRecords);

module.exports = router;