const mongoose = require("mongoose");

const torderSchema = new mongoose.Schema(
  {
    shopper: {
      type: mongoose.Schema.ObjectId,
      ref: "Shopper",
    },
    fullName: String,
    phoneNumber: String,
    pickupAddress: String,
    dropAddress: String,
    transportType: String,
    region: {
      type: mongoose.Schema.ObjectId,
      ref: "Region",
    },
    rider: {
      type: mongoose.Schema.ObjectId,
      ref: "Rider",
    },
    requestedAt: {
      type: Date,
      default: Date.now(),
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "PROCESSING",
        "INTRANSIT",
        "COMPLETED",
        "CANCELLED",
        "REJECTED",
      ],
      default: "PENDING",
    },
    requestId: String,
  },
  {
    timestamps: true,
  }
);

torderSchema.pre(/^find/, function (next) {
  this.populate("region");
  next();
});

const Torder = mongoose.model("Torder", torderSchema);

module.exports = Torder;
