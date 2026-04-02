const express = require("express");
const router = express.Router();

router.use("/", require("./profile"));
router.use("/sections", require("./sections"));
router.use("/grades", require("./grades"));
router.use("/sf1", require("./sf1"));
router.use("/forms", require("./forms"));

module.exports = router;
