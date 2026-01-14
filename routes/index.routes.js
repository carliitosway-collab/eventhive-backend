const express = require("express");
const router = express.Router();

// ✅ Comments
router.use("/comments", require("./comments.routes"));

// ✅ Auth
router.use("/auth", require("./auth.routes"));

// ✅ Events
router.use("/events", require("./events.routes"));

// ⭐ Users (favoritos)
router.use("/users", require("./users.routes"));

router.get("/", (req, res) => {
  res.json("All good in here");
});

module.exports = router;
