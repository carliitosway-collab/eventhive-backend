const router = require("express").Router();
const mongoose = require("mongoose");

const Comment = require("../models/Comment.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { isCommentAuthor } = require("../middleware/permissions.middleware");

router.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const { text, eventId, parentComment = null } = req.body;

    if (!text || !eventId) {
      return res.status(400).json({ message: "text and eventId are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }

    if (parentComment && !mongoose.Types.ObjectId.isValid(parentComment)) {
      return res.status(400).json({ message: "Invalid parentComment" });
    }

    const created = await Comment.create({
      text,
      event: eventId,
      parentComment: parentComment || null,
      author: req.payload._id,
    });

    const populated = await Comment.findById(created._id)
      .populate("author", "name email")
      .populate({
        path: "parentComment",
        populate: { path: "author", select: "name email" },
      });

    res.status(201).json({ data: populated });
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
      .populate({
        path: "parentComment",
        populate: { path: "author", select: "name email" },
      })
      .sort({ createdAt: -1 });

    res.json({ data: comments });
  } catch (err) {
    next(err);
  }
});

// ✅ NEW: GET /api/comments/:commentId -> { data: comment }
// ✅ GET /api/comments/:commentId -> comment details
router.get("/:commentId", isAuthenticated, async (req, res, next) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: "Invalid commentId" });
    }

    const comment = await Comment.findById(commentId)
      .populate("author", "name email")
      .populate({
        path: "parentComment",
        populate: { path: "author", select: "name email" },
      });

    if (!comment) return res.status(404).json({ message: "Comment not found" });

    return res.status(200).json({ data: comment });
  } catch (err) {
    next(err);
  }
});

router.post("/:commentId/like", isAuthenticated, async (req, res, next) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: "Invalid commentId" });
    }

    const updated = await Comment.findByIdAndUpdate(
      commentId,
      { $addToSet: { likes: req.payload._id } },
      { new: true },
    )
      .populate("author", "name email")
      .populate({
        path: "parentComment",
        populate: { path: "author", select: "name email" },
      });

    if (!updated) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

router.delete("/:commentId/like", isAuthenticated, async (req, res, next) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: "Invalid commentId" });
    }

    const updated = await Comment.findByIdAndUpdate(
      commentId,
      { $pull: { likes: req.payload._id } },
      { new: true },
    )
      .populate("author", "name email")
      .populate({
        path: "parentComment",
        populate: { path: "author", select: "name email" },
      });

    if (!updated) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

router.delete(
  "/:commentId",
  isAuthenticated,
  isCommentAuthor,
  async (req, res, next) => {
    try {
      const { commentId } = req.params;
      await Comment.findByIdAndDelete(commentId);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
