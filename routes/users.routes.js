const router = require("express").Router();
const mongoose = require("mongoose");

const User = require("../models/User.model");
const Event = require("../models/Event.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

router.get("/me/favorites", isAuthenticated, async (req, res, next) => {
  try {
    const user = await User.findById(req.payload._id).populate("favorites");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      message: "Favorites fetched",
      data: user.favorites,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/me/favorites/:eventId", isAuthenticated, async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (!event.isPublic && String(event.createdBy) !== String(req.payload._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await User.findByIdAndUpdate(
      req.payload._id,
      { $addToSet: { favorites: eventId } },
      { new: true }
    );

    return res.status(200).json({
      message: "Added to favorites",
      data: { eventId },
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/me/favorites/:eventId", isAuthenticated, async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }

    await User.findByIdAndUpdate(
      req.payload._id,
      { $pull: { favorites: eventId } },
      { new: true }
    );

    return res.status(200).json({
      message: "Removed from favorites",
      data: { eventId },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
