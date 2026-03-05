const express = require('express');
const router = express.Router();


router.use('/admin', require('./admin'));
router.use('/advisers', require('./advisers'));
router.use('/password', require('./password'));

module.exports = router;