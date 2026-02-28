const express = require('express');
const router = express.Router();

router.use('/', require('./profile'));
router.use('/sections', require('./sections'));
router.use('/attendance', require('./attendance'));

module.exports = router;