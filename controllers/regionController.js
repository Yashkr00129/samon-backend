const Region = require("../models/regionModel");

const { body, validationResult } = require("express-validator");
const { throwErrorMessage } = require("../utils/errorHelper");
const Member = require("../models/memberModel");
const Vendor = require("../models/vendorModel");
const Grocer = require("../models/grocerModel");
const Restaurant = require("../models/restaurantModel");
const Rider = require("../models/riderModel");

exports.addRegion = [
  body("regionName").not().isEmpty().withMessage("Region is required"),
  body("packagingCost")
    .not()
    .isEmpty()
    .withMessage("Packaging Cost is required"),
  body("baseDelivery").not().isEmpty().withMessage("Base delivery is required"),
  body("description").not().isEmpty().withMessage("Description is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { regionName, packagingCost, baseDelivery, description } = req.body;

      const region = await Region.findOne({
        regionName: regionName.toLowerCase().trim(),
      });
      if (region) {
        return res.status(409).json({
          status: false,
          message: "Region Name already exists!",
        });
      }
      const createdRegion = await Region.create({
        regionName: regionName,
        baseDelivery: baseDelivery,
        description: description,
        packagingCost: packagingCost,
      });

      res.status(200).json({
        status: true,
        message: "Region created",
        region: createdRegion,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.getAllRegions = async (req, res) => {
  try {
    const regions = await Region.find();
    res.status(200).json({
      status: true,
      regions: regions,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.updateRegion = [
  body("regionId").not().isEmpty().withMessage("Region Id is required"),
  body("regionName").not().isEmpty().withMessage("Region is required"),
  body("baseDelivery").not().isEmpty().withMessage("Region is required"),
  body("packagingCost")
    .not()
    .isEmpty()
    .withMessage("Packaging Cost is required"),
  body("description").not().isEmpty().withMessage("Description is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { regionId, packagingCost, regionName, baseDelivery, description } =
        req.body;

      const region = await Region.findOne({ _id: regionId });
      if (!region) {
        return res.status(404).json({
          status: false,
          message: "Region not found",
        });
      }
      region.regionName = regionName;
      region.baseDelivery = baseDelivery;
      region.description = description;
      region.packagingCost = packagingCost;

      await region.save();

      res.status(200).json({
        status: true,
        message: "Region Updated",
        region: region,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.deleteRegion = [
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {

      const region = await Region.findOne({ _id: req.params.regionId });
      if (!region) {
        return res.status(404).json({
          status: false,
          message: "Region not found",
        });
      }

      region.delete();

      res.status(200).json({
        status: true,
        message: "Region deleted",
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.getVendorsByCategory = [
  body("categoryId").not().isEmpty().withMessage("Category Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { categoryId } = req.body;
      const category = await Category.findOne({
        $and: [{ _id: categoryId }, { active: { $ne: false } }],
      });
      if (!category) {
        return res.status(404).json({
          status: true,
          message: "Category not found!",
        });
      }

      const subCategories = await Subcategory.find({
        $and: [{ mainCategory: category }, { active: { $ne: false } }],
      }).populate("mainCategory");

      let products;

      let vendors = [];
      for (let subcategory of subCategories) {
        products = await Product.find(
          { subCategory: subcategory._id },
          { vendor: 1 }
        ).populate("vendor");
        for (let product of products) {
          vendors.push(product.vendor);
        }
      }
      vendors = vendors.filter(
        (a, i) =>
          vendors.findIndex(
            (s) => a.adhaarCardNumber === s.adhaarCardNumber
          ) === i
      );
      res.status(200).json({
        status: true,
        vendors: vendors,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.assignMemberRegion = [
  body("memberId").not().isEmpty().withMessage("Member Id is required"),
  body("regionId").not().isEmpty().withMessage("Region Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { memberId, regionId } = req.body;
      const member = await Member.findOne({ _id: memberId });
      if (!member) {
        return res.status(404).json({
          status: true,
          message: "Member not found!",
        });
      }

      const region = await Region.findOne({ _id: regionId });
      if (!region) {
        return res.status(404).json({
          status: true,
          message: "Region not found!",
        });
      }

      member.region = regionId;
      await member.save();

      res.status(200).json({
        status: true,
        message: "region assigned to member",
        member: member,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.assignVendorRegion = [
  body("vendorId").not().isEmpty().withMessage("Vendor Id is required"),
  body("regionId").not().isEmpty().withMessage("Region Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { vendorId, regionId } = req.body;
      const vendor = await Vendor.findOne({ _id: vendorId });
      if (!vendor) {
        return res.status(404).json({
          status: true,
          message: "Vendor not found!",
        });
      }

      const region = await Region.findOne({ _id: regionId });
      if (!region) {
        return res.status(404).json({
          status: true,
          message: "Region not found!",
        });
      }

      vendor.region = regionId;
      await vendor.save();

      res.status(200).json({
        status: true,
        message: "region assigned to vendor",
        vendor: vendor,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.assignGrocerRegion = [
  body("grocerId").not().isEmpty().withMessage("Grocer Id is required"),
  body("regionId").not().isEmpty().withMessage("Region Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { grocerId, regionId } = req.body;
      const grocer = await Grocer.findOne({ _id: grocerId });
      if (!grocer) {
        return res.status(404).json({
          status: true,
          message: "Grocer not found!",
        });
      }

      const region = await Region.findOne({ _id: regionId });
      if (!region) {
        return res.status(404).json({
          status: true,
          message: "Region not found!",
        });
      }

      grocer.region = regionId;
      await grocer.save();

      res.status(200).json({
        status: true,
        message: "region assigned to grocer",
        grocer: grocer,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.assignRestaurantRegion = [
  body("restaurantId").not().isEmpty().withMessage("Restaurant Id is required"),
  body("regionId").not().isEmpty().withMessage("Region Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { restaurantId, regionId } = req.body;
      const restaurant = await Restaurant.findOne({ _id: restaurantId });
      if (!restaurant) {
        return res.status(404).json({
          status: true,
          message: "Restaurant not found!",
        });
      }

      const region = await Region.findOne({ _id: regionId });
      if (!region) {
        return res.status(404).json({
          status: true,
          message: "Region not found!",
        });
      }

      restaurant.region = regionId;
      await restaurant.save();

      res.status(200).json({
        status: true,
        message: "region assigned to restaurant",
        restaurant: restaurant,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.assignRiderRegion = [
  body("riderId").not().isEmpty().withMessage("Rider Id is required"),
  body("regionId").not().isEmpty().withMessage("Region Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { riderId, regionId } = req.body;
      const rider = await Rider.findOne({ _id: riderId });
      if (!rider) {
        return res.status(404).json({
          status: true,
          message: "Restaurant not found!",
        });
      }

      const region = await Region.findOne({ _id: regionId });
      if (!region) {
        return res.status(404).json({
          status: true,
          message: "Region not found!",
        });
      }

      rider.region = regionId;
      await rider.save();

      res.status(200).json({
        status: true,
        message: "region assigned to rider",
        rider: rider,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];
