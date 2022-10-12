const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: [true, "User name is required"],
    },
    phoneNumber: {
      type: Number,
      required: [true, "Provide you phone number"],
    },
    addressLine1: {
      type: String,
      required: [true, "Provide your address"],
    },
    addressLine2: {
      type: String,
    },
    landmark: {
      type: String,
      required: [true, "Landmark is required"],
    },
    city: {
      type: String,
      required: [true, "Provide your city"],
    },
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
    },
    state: {
      type: String,
    },
    zipCode: {
      type: String,
      required: [true, "Provide your Zipcode"],
    },
    country: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

addressSchema.pre(/^find/, function (next) {
  this.populate("region");
  next();
});

const Address = mongoose.model("Address", addressSchema);

module.exports = Address;
