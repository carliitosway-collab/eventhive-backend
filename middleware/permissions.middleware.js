const mongoose = require("mongoose");
const Comment = require("../models/Comment.model");

// ✅ Solo el autor del comentario puede borrarlo
const isCommentAuthor = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: "Invalid commentId" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (String(comment.author) !== String(req.payload._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { isCommentAuthor };
