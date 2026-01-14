const router = require("express").Router();
const mongoose = require("mongoose");

const Comment = require("../models/Comment.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

// ✅ POST /api/comments -> crear comentario (requiere login)
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

// ✅ GET /api/comments/event/:eventId -> listar comentarios de un evento (público)
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

// ✅ DELETE /api/comments/:commentId -> borrar comentario (solo autor)
router.delete("/:commentId", isAuthenticated, async (req, res, next) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: "Invalid commentId" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // ✅ Solo el autor puede borrar
    if (String(comment.author) !== String(req.payload._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await Comment.findByIdAndDelete(commentId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
