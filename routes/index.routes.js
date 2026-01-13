const express = require("express");
const router = express.Router();


router.get("/", (req, res) => {
  res.json("All good in here");
});


router.use("/auth", require("./auth.routes"));
router.use("/events", require("./events.routes"));

module.exports = router;
