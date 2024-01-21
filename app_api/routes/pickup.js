var express = require('express');
var router = express.Router();

var pickup = require('../controllers/pickup');

router.post('/update', pickup.update);
router.post('/get', pickup.get);
router.post('/getbystudents', pickup.getByStudents);
router.post('/get_all', pickup.getAll);
router.post('/remove', pickup.remove);
router.post('/remove_one', pickup.removeOne);
router.post('/send', pickup.send);
router.post('/get_time', pickup.getTime);

module.exports = router;