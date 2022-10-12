const jwt = require("jsonwebtoken");
const Shopper = require("../models/shopperModel");
const Grocer = require("../models/grocerModel");
const Restaurant = require("../models/restaurantModel");
const Rider = require("../models/riderModel");
const Vendor = require("../models/vendorModel");
const Member = require("../models/memberModel");

exports.getUser = async (token, next) => {
  token = token.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, async (err, jwtuser) => {
    if (err) {
      next("INVALID_TOKEN");
    } else {
      const user =
        (await Shopper.findOne({ _id: jwtuser.userId })) ||
        (await Grocer.findOne({ _id: jwtuser.userId })) ||
        (await Vendor.findOne({ _id: jwtuser.userId })) ||
        (await Member.findOne({ _id: jwtuser.userId })) ||
        (await Restaurant.findOne({ _id: jwtuser.userId })) ||
        (await Rider.findOne({ _id: jwtuser.userId }));
      if (user) {
        next(user);
      } else {
        next("INVALID_TOKEN");
      }
    }
  });
};
