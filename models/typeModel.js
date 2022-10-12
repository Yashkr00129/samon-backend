const mongoose = require("mongoose");

const typeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      lowercase: true,
    },
    image: {
      type: String,
    },
    keywords: {
      type: Array,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Type = mongoose.model("Type", typeSchema);

module.exports = Type;
