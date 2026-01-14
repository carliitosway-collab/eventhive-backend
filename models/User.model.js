const { Schema, model } = require("mongoose");

// User schema
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required."],
    },

    name: {
      type: String,
      required: [true, "Name is required."],
    },

    // ⭐ Favoritos: eventos guardados por el usuario
    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: "Event",
        default: [],
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = model("User", userSchema);

module.exports = User;
