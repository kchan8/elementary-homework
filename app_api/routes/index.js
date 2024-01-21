var express = require('express');
var router = express.Router();
var jwt = require('express-jwt')
var multer = require('multer')
var storage = multer.diskStorage({
	destinatin: function(req, file, callback){
		callback(null, './uploads')
	},
	filename: function(req, file, callback){
		callback(null, file.originalname)
	}
})
var user = require('./user')
//var event = require('./event')
var ctrlAuth = require('../controllers/authentication');
var ctrlAdmin = require('../controllers/admin');
var pickup = require('./pickup');
var schedule = require('./schedule');
var logbook = require('./logbook');
var calendar = require('./calendar');
var infoCtrl = require('../controllers/info');
var workbook = require('./workbook');
var video = require('./video');

var auth = jwt({
	secret: process.env.JWT_SECRET,
	userProperty: 'payload',
})

router.post('/checkClient', ctrlAuth.checkClient);
router.post('/login', ctrlAuth.login);
router.post('/signup', ctrlAuth.signup);
router.post('/userRegistration', ctrlAuth.userRegistration);
router.post('/resetPassword', ctrlAuth.resetPassword);
router.post('/setPassword', ctrlAuth.setPassword);
router.use('/user', auth, user);
router.use('/pickup', auth, pickup);
router.use('/logbook', auth, logbook);
router.use('/schedule', auth, schedule);
router.use('/calendar', auth, calendar);
router.use('/workbook', auth, workbook);
router.use('/video', auth, video);
//router.post('/hackin', ctrlAuth.hackin);   // should be auth protected
// will need to expand to router.use if need more insecure access
router.post('/info/pickup', infoCtrl.pickup);
// these 2 will needed to be removed
router.post('/info/senddata', infoCtrl.sendData);
router.post('/info/getsigdata', infoCtrl.getSigData);

router.post('/class/checkin', infoCtrl.checkin);
var upload = multer({storage: storage});

router.post('/email', upload.array('file', process.env.EMAIL_ATTACHMENT_MAX_COUNT), ctrlAdmin.email)
//router.post('/op_email', upload.array('file', process.env.EMAIL_ATTACHMENT_MAX_COUNT), ctrlAdmin.unsecure_email)
//router.post('/sms', ctrlAdmin.sms)
router.post('/upload/:filetype', upload.single('file'), ctrlAdmin.fileUpload);
//router.use('/event', auth, event)

module.exports = router;