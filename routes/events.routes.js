const router = require("express").Router();
const mongoose = require("mongoose");

const Event = require("../models/Event.model");
const Comment = require("../models/Comment.model");
const {
  isAuthenticated,
  isAuthenticatedOptional,
} = require("../middleware/jwt.middleware");

function toNullableNumber(value) {
  if (value === "" || value === undefined || value === null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

router.get("/test", (req, res) => {
  res.json({ message: "Events routes working", data: null });
});

// GET /api/events
// Public list (no token): only isPublic=true
// With token + ?mine=true / ?attending=true: filters by owner/attendee
// Supports q/search, from/to, category, pagination, sort
router.get("/", isAuthenticatedOptional, async (req, res, next) => {
  try {
    const {
      // backward compatible
      search,
      // new standard param (optional)
      q,
      from,
      to,
      mine,
      attending,

      // category filter (optional)
      category,

      // pagination/sort (optional)
      page = 1,
      limit = 20,
      sort = "date",
    } = req.query;

    const filter = {};

    // mine / attending require token
    if (mine === "true" || attending === "true") {
      if (!req.payload?._id) {
        return res.status(401).json({ message: "Missing authorization token" });
      }

      if (mine === "true" && attending === "true") {
        filter.$or = [
          { createdBy: req.payload._id },
          { attendees: req.payload._id },
        ];
      } else if (mine === "true") {
        filter.createdBy = req.payload._id;
      } else {
        filter.attendees = req.payload._id;
      }
    } else {
      filter.isPublic = true;
    }

    // category filter (works for public + mine/attending)
    if (typeof category === "string" && category.trim()) {
      filter.category = category.trim();
    }

    // search (supports both ?search= and ?q=)
    const term = (q ?? search ?? "").trim();
    if (term) {
      const regex = new RegExp(term, "i");
      const searchClause = [
        { title: regex },
        { location: regex },
        { description: regex },
        { venueName: regex },
        { address: regex },
        { city: regex },
        { country: regex },
        { category: regex },
      ];

      // If we already had $or (mine+attending), combine with $and
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchClause }];
        delete filter.$or;
      } else {
        filter.$or = searchClause;
      }
    }

    // date range
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    // pagination (safe)
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
    const skip = (pageNum - 1) * limitNum;

    // sort (supports "date" or "-date")
    const sortObj = {};
    const sortStr = typeof sort === "string" ? sort : "date";
    if (sortStr.startsWith("-")) {
      sortObj[sortStr.slice(1)] = -1;
    } else {
      sortObj[sortStr] = 1;
    }

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate("createdBy", "name email")
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
      Event.countDocuments(filter),
    ]);

    const pages = Math.max(Math.ceil(total / limitNum), 1);

    return res.status(200).json({
      message: "Events fetched",
      data: events,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        pages,
        sort: sortStr,
        q: term || "",
        category: typeof category === "string" ? category.trim() : "",
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:eventId -> event detail + comments
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

    // private => only creator
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

// POST /api/events -> create (owner)
router.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const {
      title,
      description,
      date,
      location,
      isPublic,

      venueName,
      address,
      city,
      country,
      coordinates,
      imageUrl,

      category,
    } = req.body;

    if (!title || !description || !date || !location) {
      return res.status(400).json({
        message:
          "Missing fields: title, description, date, location are required",
      });
    }

    const safeCoords = {
      lat: toNullableNumber(coordinates?.lat),
      lng: toNullableNumber(coordinates?.lng),
    };

    const createdEvent = await Event.create({
      title,
      description,
      date,
      location,
      isPublic: isPublic ?? true,

      venueName: (venueName ?? "").trim(),
      address: (address ?? "").trim(),
      city: (city ?? "").trim(),
      country: (country ?? "").trim(),
      coordinates: safeCoords,
      imageUrl: typeof imageUrl === "string" ? imageUrl.trim() : "",

      category:
        typeof category === "string" && category.trim()
          ? category.trim()
          : "Other",

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

// POST /api/events/:eventId/join -> join (authenticated)
router.post("/:eventId/join", isAuthenticated, async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (
      !event.isPublic &&
      String(event.createdBy) !== String(req.payload._id)
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const updated = await Event.findByIdAndUpdate(
      eventId,
      { $addToSet: { attendees: req.payload._id } },
      { new: true },
    ).populate("attendees", "name email");

    return res.status(200).json({
      message: "Joined event",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:eventId/join -> leave (authenticated)
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
      { new: true },
    ).populate("attendees", "name email");

    return res.status(200).json({
      message: "Left event",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/events/:eventId -> update (owner)
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

    const {
      title,
      description,
      date,
      location,
      isPublic,

      venueName,
      address,
      city,
      country,
      coordinates,
      imageUrl,

      category,
    } = req.body;

    const updateDoc = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(date !== undefined && { date }),
      ...(location !== undefined && { location }),
      ...(isPublic !== undefined && { isPublic }),

      ...(venueName !== undefined && { venueName: (venueName ?? "").trim() }),
      ...(address !== undefined && { address: (address ?? "").trim() }),
      ...(city !== undefined && { city: (city ?? "").trim() }),
      ...(country !== undefined && { country: (country ?? "").trim() }),

      ...(imageUrl !== undefined && {
        imageUrl: typeof imageUrl === "string" ? imageUrl.trim() : "",
      }),

      ...(category !== undefined && {
        category:
          typeof category === "string" && category.trim()
            ? category.trim()
            : "Other",
      }),
    };

    if (coordinates !== undefined) {
      updateDoc.coordinates = {
        lat: toNullableNumber(coordinates?.lat),
        lng: toNullableNumber(coordinates?.lng),
      };
    }

    const updated = await Event.findByIdAndUpdate(eventId, updateDoc, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      message: "Event updated",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:eventId -> delete (owner) + cascade comments
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
