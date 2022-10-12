const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const memberSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required."],
    },
    password: {
      type: String,
      select: false,
      required: [true, "Please enter a password"],
      minlength: [8, "Minimum password length is 8 characters"],
    },
    profilePicture: {
      type: String,
      default:
        "https://t4.ftcdn.net/jpg/03/46/93/61/360_F_346936114_RaxE6OQogebgAWTalE1myseY1Hbb5qPM.jpg",
    },
    userType: {
      type: String,
      enum: ["member", "admin"],
      default: "member",
    },
    active: {
      type: Boolean,
      default: true,
    },
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
    },
  },
  {
    timestamps: true,
  }
);

memberSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

memberSchema.pre(/^find/, function (next) {
  this.populate("region");
  next();
});

const Member = mongoose.model("Member", memberSchema);

module.exports = Member;
