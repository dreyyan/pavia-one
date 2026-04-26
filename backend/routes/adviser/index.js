const express = require("express");
const router = express.Router();

router.use("/", require("./profile"));
router.use("/sections", require("./sections"));
router.use("/grades", require("./grades"));
router.use("/sf1", require("./sf1"));
router.use("/sf2", require("./sf2"));
router.use("/forms", require("./forms"));
router.use("/announcements", require("./announcements"));
router.use("/events", require("./events"));

module.exports = router;
