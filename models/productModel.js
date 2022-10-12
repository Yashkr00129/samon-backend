const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
    },
    productTitle: {
      type: String,
    },
    productDescription: {
      type: String,
    },
    images: [String],
    price: {
      type: Number,
      required: [true, "A Product must have a price"],
    },
    state: {
      type: String,
      required: [true, "Please provide State"],
    },
    isBestDeal: {
      type: Boolean,
      default: false,
    },
    quantity: {
      type: Number,
    },
    averageRating: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

productSchema.pre(/^find/, function (next) {
  this.populate("vendor");
  this.populate("category");
  this.populate("subCategory");
  next();
});
// this.populate("variant");

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
