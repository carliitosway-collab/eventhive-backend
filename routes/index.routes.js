const express = require("express");
const router = express.Router();

router.use("/comments", require("./comments.routes"));
router.use("/auth", require("./auth.routes"));
router.use("/events", require("./events.routes"));
router.use("/users", require("./users.routes"));

router.get("/", (req, res) => {
  res.json("All good in here");
});

module.exports = router;
