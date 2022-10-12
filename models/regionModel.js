const mongoose = require("mongoose");

const regionSchema = new mongoose.Schema(
  {
    regionName: String,
    baseDelivery: String,
    description: String,
    packagingCost: String,
  },
  {
    timestamps: true,
  }
);

const Region = mongoose.model("Region", regionSchema);

module.exports = Region;
