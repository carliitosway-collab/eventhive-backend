const router = require("express").Router();
const mongoose = require("mongoose");

const Comment = require("../models/Comment.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { isCommentAuthor } = require("../middleware/permissions.middleware");

router.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const { text, eventId } = req.body;

    if (!text || !eventId) {
      return res.status(400).json({ message: "text and eventId are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }

    const created = await Comment.create({
      text,
      event: eventId,
      author: req.payload._id,
    });

    res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
});

router.get("/event/:eventId", async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }

    const comments = await Comment.find({ event: eventId })
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.json({ data: comments });
  } catch (err) {
    next(err);
  }
});

router.delete("/:commentId", isAuthenticated, isCommentAuthor, async (req, res, next) => {
  try {
    const { commentId } = req.params;
    await Comment.findByIdAndDelete(commentId);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
