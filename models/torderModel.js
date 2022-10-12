const mongoose = require("mongoose");

const torderSchema = new mongoose.Schema(
  {
    shopper: {
      type: mongoose.Schema.ObjectId,
      ref: "Shopper",
    },
    source: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    destination: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    transportType: {
      type: String,
      enum: [
        "Person",
        "Package",
      ],
      default:"Package",
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

const Torder = mongoose.model("Torder", torderSchema);

module.exports = Torder;
