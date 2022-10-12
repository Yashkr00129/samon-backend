const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },
    color: {
      type: String,
      default: null,
    },
    size: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      default: null,
    },
    quantity: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

const Variant = mongoose.model("Variant", variantSchema);
module.exports = Variant;
