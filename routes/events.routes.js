const router = require("express").Router();
const mongoose = require("mongoose");

const Event = require("../models/Event.model");
const Comment = require("../models/Comment.model");
const { isAuthenticated, isAuthenticatedOptional } = require("../middleware/jwt.middleware");

// ✅ GET /api/events/test
router.get("/test", (req, res) => {
  res.json({ message: "Events routes working 🚀", data: null });
});

// ✅ GET /api/events
// Query params:
// - search=texto (title/location/description)
// - from=YYYY-MM-DD
// - to=YYYY-MM-DD
// - mine=true  (requiere token, trae mis eventos incluso privados)
router.get("/", isAuthenticatedOptional, async (req, res, next) => {
  try {
    const { search, from, to, mine } = req.query;

    const filter = {};

    // mine=true => solo eventos creados por mí (incluye privados)
    if (mine === "true") {
      if (!req.payload?._id) {
        return res.status(401).json({ message: "Missing authorization token" });
      }
      filter.createdBy = req.payload._id;
    } else {
      // listado público normal
      filter.isPublic = true;
    }

    // search
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ title: regex }, { location: regex }, { description: regex }];
    }

    // date range
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const events = await Event.find(filter)
      .populate("createdBy", "name email")
      .sort({ date: 1 });

    return res.status(200).json({
      message: "Events fetched",
      data: events,
    });
  } catch (err) {
    next(err);
  }
});

// ✅ GET /api/events/:eventId -> detalle + comments
// público: cualquiera
// privado: SOLO creador (requiere token)
router.get("/:eventId", isAuthenticatedOptional, async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }

    const event = await Event.findById(eventId)
      .populate("createdBy", "name email")
      .populate("attendees", "name email");

    if (!event) return res.status(404).json({ message: "Event not found" });

    // privado => solo creador
    if (!event.isPublic) {
      if (!req.payload?._id) {
        return res.status(401).json({ message: "Missing authorization token" });
      }
      if (String(event.createdBy._id) !== String(req.payload._id)) {
        return res.status(403).json({ message: "This event is private" });
      }
    }

    const comments = await Comment.find({ event: eventId })
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Event fetched",
      data: { event, comments },
    });
  } catch (err) {
    next(err);
  }
});

// ✅ POST /api/events -> crear evento (requiere login)
router.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const { title, description, date, location, isPublic } = req.body;

    if (!title || !description || !date || !location) {
      return res.status(400).json({
        message: "Missing fields: title, description, date, location are required",
      });
    }

    const createdEvent = await Event.create({
      title,
      description,
      date,
      location,
      isPublic: isPublic ?? true,
      createdBy: req.payload._id,
      attendees: [],
    });

    return res.status(201).json({
      message: "Event created",
      data: createdEvent,
    });
  } catch (err) {
    next(err);
  }
});

// ✅ POST /api/events/:eventId/join -> apuntarse (requiere login)
router.post("/:eventId/join", isAuthenticated, async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // privado => solo creador puede "join" (coherente)
    if (!event.isPublic && String(event.createdBy) !== String(req.payload._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const updated = await Event.findByIdAndUpdate(
      eventId,
      { $addToSet: { attendees: req.payload._id } },
      { new: true }
    ).populate("attendees", "name email");

    return res.status(200).json({
      message: "Joined event",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

// ✅ DELETE /api/events/:eventId/join -> desapuntarse (requiere login)
router.delete("/:eventId/join", isAuthenticated, async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const updated = await Event.findByIdAndUpdate(
      eventId,
      { $pull: { attendees: req.payload._id } },
      { new: true }
    ).populate("attendees", "name email");

    return res.status(200).json({
      message: "Left event",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

// ✅ PUT /api/events/:eventId -> editar (solo dueño)
router.put("/:eventId", isAuthenticated, async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (String(event.createdBy) !== String(req.payload._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { title, description, date, location, isPublic } = req.body;

    const updated = await Event.findByIdAndUpdate(
      eventId,
      {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date }),
        ...(location !== undefined && { location }),
        ...(isPublic !== undefined && { isPublic }),
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Event updated",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

// ✅ DELETE /api/events/:eventId -> borrar (solo dueño) + borrar comments
router.delete("/:eventId", isAuthenticated, async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (String(event.createdBy) !== String(req.payload._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await Comment.deleteMany({ event: eventId });
    await Event.findByIdAndDelete(eventId);

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
