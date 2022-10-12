const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const shopperSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
    },
    phone: {
      type: String,
      unique: true,
      required: [true, "Phone number is required."],
    },
    profilePicture: {
      type: String,
      default:
        "https://t4.ftcdn.net/jpg/03/46/93/61/360_F_346936114_RaxE6OQogebgAWTalE1myseY1Hbb5qPM.jpg",
    },
    selectedAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
    },
    address: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
      },
    ],
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    userType: {
      type: String,
      enum: ["shopper"],
      default: "shopper",
    },
    active: {
      type: Boolean,
      default: true,
    },
    confirmationCode: String,
    confirmationCodeExpires: Date,
  },
  {
    timestamps: true,
  }
);

shopperSchema.methods.createVerificationCode = function () {
  const verificationCode = Math.floor(100000 + Math.random() * 900000);

  this.confirmationCode = crypto
    .createHash("sha256")
    .update(verificationCode.toString())
    .digest("hex");

  this.confirmationCodeExpires = Date.now() + 10 * 60 * 1000;

  return verificationCode;
};

shopperSchema.pre(/^find/, function (next) {
  this.populate("selectedAddress");
  next();
});

const Shopper = mongoose.model("Shopper", shopperSchema);

module.exports = Shopper;
