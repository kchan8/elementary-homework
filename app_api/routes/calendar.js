var express = require('express');
var router = express.Router();

var calendar = require('../controllers/calendar');

router.post('/get', calendar.get);
router.post('/update', calendar.update);

module.exports = router;