const mongoose = require("mongoose");

const forderSchema = new mongoose.Schema(
  {
    shopper: {
      type: mongoose.Schema.ObjectId,
      ref: "Shopper",
    },
    restaurant: {
      type: mongoose.Schema.ObjectId,
      ref: "Restaurant",
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
      type: Object,
    },
    orderId: String,
    quantity: Number,
    bill: {
      type: mongoose.Schema.ObjectId,
      ref: "FoodBill",
    },
    dishes: [
      {
        quantity: Number,
        dish: {
          type: mongoose.Schema.ObjectId,
          ref: "Dish",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

forderSchema.pre(/^find/, function (next) {
  this.populate("bill");
  this.populate("dishes.dish");
  this.populate("shopper");
  this.populate("restaurant");
  this.populate("rider")
  next();
});

const Forder = mongoose.model("Forder", forderSchema);

module.exports = Forder;
