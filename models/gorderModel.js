const mongoose = require("mongoose");

const gorderSchema = new mongoose.Schema(
  {
    shopper: {
      type: mongoose.Schema.ObjectId,
      ref: "Shopper",
    },
    grocer: {
      type: mongoose.Schema.ObjectId,
      ref: "Grocer",
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
    quantity: Number,
    bill: {
      type: mongoose.Schema.ObjectId,
      ref: "GroceryBill",
    },
    stuffs: [
      {
        quantity: Number,
        stuff: {
          type: mongoose.Schema.ObjectId,
          ref: "Stuff",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

gorderSchema.pre(/^find/, function (next) {
  this.populate("bill");
  this.populate("stuffs.stuff");
  this.populate("shopper");
  this.populate("grocer");
  this.populate("address");
  next();
});

const Gorder = mongoose.model("Gorder", gorderSchema);

module.exports = Gorder;
