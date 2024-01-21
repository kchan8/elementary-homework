var express = require('express');
var router = express.Router();

var user = require('../controllers/user');

router.post('/all', user.getAllUsers);
router.post('/allByGrades', user.getAllUsersByGrades);
router.post('/students', user.getAllStudents);
router.post('/pickupstudents', user.getAllPickupStudents);
router.post('/studentsID', user.getStudentsByID);
router.post('/drivers', user.getDrivers);
router.post('/teachers', user.getTeachers);
router.post('/byGrades', user.getStudentsByGrades);
router.post('/myStudents', user.getMyStudentsByGrades);
router.post('/bySchools', user.getStudentsBySchools);
router.post('/byDistricts', user.getStudentsByDistricts);
router.post('/registered', user.getRegisteredUsers);
router.post('/districts', user.getAllDistricts);
router.post('/details', user.getDetails);
router.post('/create', user.create);
router.post('/update', user.update);
router.post('/remove', user.remove);
router.post('/updateteacher', user.updateTeacher);
//router.post('/fixphone', user.fixPhone);

module.exports = router;