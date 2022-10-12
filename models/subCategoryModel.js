const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
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
    mainCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Subcategory = mongoose.model("Subcategory", subCategorySchema);

module.exports = Subcategory;
