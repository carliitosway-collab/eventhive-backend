const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },

    // Legacy (no lo rompemos)
    location: { type: String, required: true, trim: true },

    // Pro fields (opcionales)
    venueName: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },

    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    // Single main image URL
    imageUrl: { type: String, trim: true, default: "" },

    category: {
      type: String,
      trim: true,
      default: "Other",
      enum: [
        "Tech",
        "Music",
        "Sports",
        "Food",
        "Networking",
        "Art",
        "Gaming",
        "Education",
        "Business",
        "Other",
      ],
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

// Indexes (mantén los útiles, sin redundancia)
eventSchema.index({ isPublic: 1, date: 1, category: 1, title: 1 });
eventSchema.index({ city: 1, date: 1 });

module.exports = mongoose.model("Event", eventSchema);
