const mongoose = require("mongoose");

const porderSchema = new mongoose.Schema(
  {
    shopper: {
      type: mongoose.Schema.ObjectId,
      ref: "Shopper",
    },
    vendor: {
      type: mongoose.Schema.ObjectId,
      ref: "Vendor",
    },
    rider: {
      type: mongoose.Schema.ObjectId,
      ref: "Rider",
    },
    orderedAt: {
      type: Date,
      default: Date.now(),
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "PROCESSING",
        "DISPATCHED",
        "DELIVERING",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PENDING",
    },
    address: {
      type: mongoose.Schema.ObjectId,
      ref: "Address",
    },
    orderId: String,
    bill: {
      type: mongoose.Schema.ObjectId,
      ref: "Bill",
    },
    products: [
      {
        quantity: Number,
        product: {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

porderSchema.pre(/^find/, function (next) {
  this.populate("bill");
  this.populate("products.product");
  this.populate("shopper");
  this.populate("vendor");
  this.populate("rider");
  this.populate("address");
  next();
});

const Porder = mongoose.model("Porder", porderSchema);

module.exports = Porder;
