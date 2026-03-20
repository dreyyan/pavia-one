const express = require('express');
const router = express.Router();

router.use('/users', require('./users'));
router.use('/students', require('./students'));
router.use('/advisers', require('./advisers'));
router.use('/sections', require('./sections'));
router.use('/school', require('./school'));
router.use('/learning-area', require('./learningArea'));

module.exports = router;