var express = require('express');
var router = express.Router();

var event = require('../controllers/event');

router.post('/create', event.create);
router.post('/update', event.update);
router.post('/getallevents', event.getAllEvents);
router.post('/getdetails', event.getDetails);
router.post('/remove', event.remove);
router.post('/removeall', event.removeAll);
router.post('/signup', event.signup);
router.post('/inviteall', event.inviteAll);
router.post('/getsignup', event.getsignup);
router.post('/getrsvp/:status', event.getrsvp);

module.exports = router