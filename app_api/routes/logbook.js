var express = require('express');
var router = express.Router();

var logbook = require('../controllers/logbook');

router.post('/getmessages', logbook.getMessages);
router.post('/getmymessages', logbook.getMyMessages);
router.post('/updatemessages', logbook.updateMessages);
router.post('/getcheckin', logbook.getCheckIns);

module.exports = router;