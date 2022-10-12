const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    shopper: {
      type: mongoose.Schema.ObjectId,
      ref: "Shopper",
    },
    seller: {
      type: mongoose.Schema.ObjectId,
      refPath: 'sellerModel',
    },
    sellerModel: {
      type: String,
      enum: ["Vendor", "Grocer", "Restaurant"],
    },
    order: {
      type: mongoose.Schema.ObjectId,
      refPath: 'orderModel',
    },
    orderModel: {
      type: String,
      enum: ["Porder", "Gorder", "Forder"],
    },
    rider: {
      type: mongoose.Schema.ObjectId,
      ref: "Rider",
    },
    orderedAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre(/^find/, function (next) {
  this.populate("shopper");
  this.populate("seller");
  this.populate("order");
  this.populate("rider");
  next();
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
