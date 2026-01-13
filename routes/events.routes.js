const router = require("express").Router();
const Event = require("../models/Event.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

// ✅ GET /api/events -> lista eventos públicos
router.get("/", async (req, res, next) => {
  try {
    const events = await Event.find({ isPublic: true }).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    next(err);
  }
});

// ✅ GET /api/events/test -> prueba rápida
router.get("/test", (req, res) => {
  res.json({ message: "Events routes working 🚀" });
});

// GET /api/events/:eventId -> detalle evento (público si isPublic = true)
router.get("/:eventId", async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Validación ObjectId (para no morir en Postman)
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Si algún día tienes eventos privados, aquí filtras:
    if (!event.isPublic) {
      return res.status(403).json({ message: "This event is private" });
    }

    res.json(event);
  } catch (err) {
    next(err);
  }
});

// PUT /api/events/:eventId -> editar evento (solo dueño)
router.put("/:eventId", isAuthenticated, async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // ✅ Owner check
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

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:eventId -> borrar evento (solo dueño)
router.delete("/:eventId", isAuthenticated, async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // ✅ Owner check
    if (String(event.createdBy) !== String(req.payload._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await Event.findByIdAndDelete(eventId);

    res.status(204).send(); // No Content
  } catch (err) {
    next(err);
  }
});




// ✅ POST /api/events -> crear evento (PRIVADO)
router.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const { title, description, date, location, isPublic } = req.body;

    // Validación mínima para no morir en Postman
    if (!title || !description || !date || !location) {
      return res.status(400).json({
        message: "Missing fields: title, description, date, location are required",
      });
    }

    const createdEvent = await Event.create({
      title,
      description,
      date, // ISO string recomendado: "2026-01-20T18:00:00.000Z"
      location,
      isPublic: isPublic ?? true,
      createdBy: req.payload._id, // viene del JWT middleware
    });

    res.status(201).json(createdEvent);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
