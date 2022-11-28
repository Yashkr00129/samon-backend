const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  mediaLink: String,
  no: Number,
  link: String,
});

const Banner = mongoose.model("Banner", schema);

module.exports = Banner;
