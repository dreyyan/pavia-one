const express = require('express');
const router = express.Router();

router.use('/', require('./profile'));
router.use('/sections', require('./sections'));
router.use('/attendance', require('./attendance'));
router.use('/sf1', require('./sf1'));

module.exports = router;