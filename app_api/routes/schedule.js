var express = require('express');
var router = express.Router();

var schedule = require('../controllers/schedule');

router.post('/update', schedule.update);
router.post('/get', schedule.get);

module.exports = router;