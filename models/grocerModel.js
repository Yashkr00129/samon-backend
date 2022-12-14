const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const grocerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
    },
    password: {
      type: String,
      select: false,
      required: [true, "Please enter a password"],
      minlength: [8, "Minimum password length is 8 characters"],
    },
    panCardNumber: {
      type: String,
    },
    address: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
      },
    ],
    gst: {
      type: String,
    },
    adhaarFile: {
      type: String,
    },
    adhaarCardNumber: {
      type: String,
      required: [true, "Adhaar card number is required"],
    },
    bankAccountNumber: {
      type: String,
      required: [true, "Bank Account Number is required"],
    },
    ifscCode: {
      type: String,
      required: [true, "IFSC code is required"],
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
    userType: {
      type: String,
      enum: ["grocer"],
      default: "grocer",
    },
    active: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
    },
    wallet: {
      type: Number,
      default: 0,
    },
    storeName: String,
    storeRegistration: String,
    storeAddress: String,
    pincode: String,
    fssaiCode: String,
    storeImage: String,
    latitude: String,
    longitude: String,
    confirmationCode: String,
    confirmationCodeExpires: Date,
  },
  {
    timestamps: true,
  }
);

grocerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

grocerSchema.methods.createVerificationCode = function () {
  const verificationCode = Math.floor(100000 + Math.random() * 900000);

  this.confirmationCode = crypto
    .createHash("sha256")
    .update(verificationCode.toString())
    .digest("hex");

  this.confirmationCodeExpires = Date.now() + 10 * 60 * 1000;

  return verificationCode;
};

grocerSchema.pre(/^find/, function (next) {
  this.populate("region");
  next();
});

const Grocer = mongoose.model("Grocer", grocerSchema);

module.exports = Grocer;
