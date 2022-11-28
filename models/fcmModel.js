const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId },
  userType: String,
  fcmToken: String,
  deviceId: String,
});

const FCM = mongoose.model("FCM", schema);
module.exports = FCM;
