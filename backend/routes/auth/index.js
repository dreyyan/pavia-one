const express = require("express");
const router = express.Router();

router.use("/admin", require("./admin"));
router.use("/adviser", require("./adviser"));
router.use("/password", require("./password"));

module.exports = router;
