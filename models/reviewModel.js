const mongoose = require("mongoose");
// const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema(
  {
    shopper: {
      type: mongoose.Schema.ObjectId,
      ref: "Shopper",
    },
    vendor: {
      type: mongoose.Schema.ObjectId,
      ref: "Vendor",
    },
    review: {
      type: String,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
    },
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
