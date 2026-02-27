const express = require('express');
const router = express.Router();

router.use('/', require('./profile'));
router.use('/sections', require('./sections'));

module.exports = router;