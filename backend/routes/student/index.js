const express = require('express');
const router = express.Router();

router.use('/', require('./profile'));
router.use('/', require('./academicInfo'));

module.exports = router;