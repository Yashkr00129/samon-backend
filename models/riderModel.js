const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const riderSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
    },
    phone: {
      type: String,
      unique: true,
    },
    address: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
      },
    ],
    adhaarFile: {
      type: String,
    },
    vechileRegistrationPhoto: {
      type: String,
    },
    adhaarCardNumber: {
      type: String,
    },
    vechileNumber: {
      type: String,
    },
    vechileRegistrationNumber: {
      type: String,
    },
    selectedAddress: {
      type: String,
    },
    profilePicture: {
      type: String,
      default:
        "https://t4.ftcdn.net/jpg/03/46/93/61/360_F_346936114_RaxE6OQogebgAWTalE1myseY1Hbb5qPM.jpg",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    role: {
      type: String,
      enum: ["productdelivery", "grocerydelivery", "fooddelivery"],
      default: "productdelivery",
    },
    available: {
      type: Boolean,
      default: true,
    },
    userType: {
      type: String,
      enum: ["rider"],
      default: "rider",
    },
    active: {
      type: Boolean,
      default: true,
    },
    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "orderModel",
      default: null,
    },
    pastOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "orderModel",
      },
    ],
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
    },
    orderModel: {
      type: String,
      required: true,
      enum: ["Porder", "Gorder", "Forder"],
      default: "Porder",
    },
    confirmationCode: String,
    confirmationCodeExpires: Date,
  },
  {
    timestamps: true,
  }
);

riderSchema.methods.createVerificationCode = function () {
  const verificationCode = Math.floor(100000 + Math.random() * 900000);

  this.confirmationCode = crypto
    .createHash("sha256")
    .update(verificationCode.toString())
    .digest("hex");

  this.confirmationCodeExpires = Date.now() + 10 * 60 * 1000;

  return verificationCode;
};

// riderSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   const salt = await bcrypt.genSalt();
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });
// riderSchema.pre(/^find/, function (next) {
//   this.populate("pastOrders");
//   this.populate("currentOrder");
//   next();
// });
const Rider = mongoose.model("Rider", riderSchema);

module.exports = Rider;
