const Address = require("../models/addressModel");
const Shopper = require("../models/shopperModel");
const Vendor = require("../models/vendorModel");
const { body, validationResult } = require("express-validator");
const { throwErrorMessage } = require("../utils/errorHelper");
const Region = require("../models/regionModel");

exports.getAddress = async (req, res) => {
  try {
    if (!req.query.id) {
      return res.status(400).json({
        status: false,
        message: "id is required in query",
      });
    }
    const addressId = req.query.id;
    let userAddress = await Address.findOne({
      $and: [{ _id: addressId }, { active: { $ne: false } }],
    });

    if (!userAddress) {
      return res.status(404).json({
        status: false,
        message: "address not found!",
      });
    }

    return res.status(200).json({
      status: true,
      address: userAddress,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getAllMyAddress = async (req, res) => {
  try {
    let addresses = await Address.find({ _id: { $in: req.user.address } });

    res.status(200).json({
      status: true,
      address: addresses,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.addAddress = [
  body("userName").not().isEmpty().withMessage("UserName is required"),
  body("regionId").not().isEmpty().withMessage("Region Id is required"),
  body("phoneNumber").not().isEmpty().withMessage("Phone number is required"),
  body("addressLine1").not().isEmpty().withMessage("Address is required"),
  body("landmark").not().isEmpty().withMessage("landmark is required"),
  body("city").not().isEmpty().withMessage("City is required"),
  body("zipCode").not().isEmpty().withMessage("Zipcode is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      let {
        userName,
        phoneNumber,
        addressLine1,
        addressLine2,
        landmark,
        city,
        state,
        zipCode,
        country,
        regionId,
      } = req.body;
      if (req.user.userType === "vendor") {
        if (req.user.address.length > 0) {
          return res.status(403).json({
            status: false,
            message: "You can not add more address",
          });
        }
      }

      const regionExists = await Region.findOne({ _id: regionId });
      if (!regionExists) {
        return res.status(404).json({
          status: false,
          message: "Region does not exists!",
        });
      }

      const userAddress = await Address.create({
        userName: userName,
        phoneNumber: phoneNumber,
        addressLine1: addressLine1,
        addressLine2: addressLine2,
        landmark: landmark,
        city: city,
        state: state,
        zipCode: zipCode,
        country: country,
        region: regionId,
      });

      let Model = req.user.userType === "shopper" ? Shopper : Vendor;
      let user = await Model.findOneAndUpdate(
        { _id: req.user._id },
        { $push: { address: userAddress._id } },
        { new: true }
      );

      if (req.user.userType === "shopper") {
        if (user.address.length === 1) {
          user.selectedAddress = userAddress._id;
          await user.save();
        }
      }

      res.status(201).json({
        status: true,
        message: "Address added!",
        address: userAddress,
      });
    } catch (err) {
      if (err.message.startsWith("Address validation failed")) {
        let message = err.message.split(":")[2].split(",")[0];
        return res.status(400).json({
          status: false,
          message: message,
        });
      }
      console.log(err);
      throwErrorMessage(err, res);
    }
  },
];

exports.updateAddress = [
  body("addressId").not().isEmpty().withMessage("Address Id Feild is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array(),
      });
    }
    try {
      let {
        addressId,
        userName,
        phoneNumber,
        addressLine1,
        addressLine2,
        landmark,
        city,
        state,
        zipCode,
        country,
        regionId,
      } = req.body;

      let userAddress = await Address.findOne({ _id: addressId });

      if (!userAddress) {
        return res.status(404).json({
          status: false,
          message: "address not found!",
        });
      }

      const regionExists = await Region.findOne({ _id: regionId });
      if (!regionExists) {
        return res.status(404).json({
          status: false,
          message: "Region does not exists!",
        });
      }

      if (!req.user.address.includes(addressId.toString())) {
        return res.status(403).json({
          status: false,
          message: "you are not allowed to update other's address",
        });
      }

      userAddress.userName = userName ? userName : userAddress.userName;
      userAddress.phoneNumber = phoneNumber
        ? phoneNumber
        : userAddress.phoneNumber;
      userAddress.addressLine1 = addressLine1
        ? addressLine1
        : userAddress.addressLine1;
      userAddress.addressLine2 = addressLine2
        ? addressLine2
        : userAddress.addressLine2;
      userAddress.landmark = landmark ? landmark : userAddress.landmark;
      userAddress.city = city ? city : userAddress.city;
      userAddress.state = state ? state : userAddress.state;
      userAddress.zipCode = zipCode ? zipCode : userAddress.zipCode;
      userAddress.country = country ? country : userAddress.country;
      userAddress.region = regionId;

      userAddress
        .save()
        .then(() => {
          return res.status(200).json({
            status: true,
            message: "Address updated!",
            address: userAddress,
          });
        })
        .catch((err) => {
          if (err.message.startsWith("Address validation failed")) {
            let message = err.message.split(":")[2].split(",")[0];
            return res.status(400).json({
              status: false,
              message: message,
            });
          }
        });
    } catch (err) {
      if (err.message.startsWith("Address validation failed")) {
        let message = err.message.split(":")[2].split(",")[0];
        return res.status(400).json({
          status: false,
          message: message,
        });
      }
      throwErrorMessage(err, res);
    }
  },
];

exports.deleteAddress = [
  body("addressId").not().isEmpty().withMessage("Address Id Feild is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array(),
      });
    }
    try {
      const { addressId } = req.body;
      let userAddress = await Address.findOne({ _id: addressId });

      if (!userAddress) {
        return res.status(404).json({
          status: false,
          message: "address not found!",
        });
      }

      if (!req.user.address.includes(addressId.toString())) {
        return res.status(403).json({
          status: false,
          message: "you are not allowed to delete other's address",
        });
      }

      let Model = req.user.userType === "shopper" ? Shopper : Vendor;

      const add = await Model.findOneAndUpdate(
        { _id: req.user._id },
        { $pull: { address: addressId } },
        { new: true }
      );

      userAddress.active = false;

      userAddress
        .save()
        .then(() => {
          return res.status(200).json({
            status: true,
            message: "Address deleted!",
          });
        })
        .catch((err) => {
          throwErrorMessage(err, res);
        });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];
