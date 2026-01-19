const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },

    // Legacy (no lo rompemos)
    location: { type: String, required: true, trim: true },

    // NEW (pro)
    venueName: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },

    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    // NEW: fotos reales (guardamos URLs)
    // NEW: imagen principal del evento (una sola)
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },

    isPublic: { type: Boolean, default: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
  },
  { timestamps: true },
);

// Recommended index for common queries (sorting & filtering)
eventSchema.index({ isPublic: 1, date: 1, title: 1, location: 1 });
eventSchema.index({ city: 1, date: 1 });

module.exports = mongoose.model("Event", eventSchema);
