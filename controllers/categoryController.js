const Category = require("../models/categoryModel");
const Subcategory = require("../models/subCategoryModel");
const Product = require("../models/productModel");

const { body, validationResult } = require("express-validator");
const { throwErrorMessage } = require("../utils/errorHelper");

exports.addCategory = [
  body("name").not().isEmpty().withMessage("Name is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { name, image, keywords } = req.body;

      const category = await Category.findOne({
        name: name.toLowerCase().trim(),
      });
      if (category) {
        return res.status(409).json({
          status: false,
          message: "Category Name already exists",
        });
      }
      const createdCategory = await Category.create({
        name: name,
        image: image,
        keywords: keywords,
      });

      res.status(200).json({
        status: true,
        message: "Category created",
        category: createdCategory,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.getAllCategory = async (req, res) => {
  try {
    const categories = await Category.find({ active: { $ne: false } });

    res.status(200).json({
      status: true,
      categories: categories,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.updateCategory = [
  body("id").not().isEmpty().withMessage("Category Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { id, name, image, keywords } = req.body;

      const category = await Category.findOne({
        $and: [{ _id: id }, { active: { $ne: false } }],
      });
      if (!category) {
        return res.status(404).json({
          status: false,
          message: "Category not found",
        });
      }
      category.name = name ? name : category.name;
      category.image = image ? image : category.image;
      category.keywords = keywords ? keywords : category.keywords;

      await category.save();

      res.status(200).json({
        status: true,
        message: "Category Updated",
        category: category,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.deleteCategory = [
  async (req, res) => {
    try {
      const { id } = req.params;

      const category = await Category.findOne({ _id: id });
      if (!category) {
        return res.status(404).json({
          status: false,
          message: "Category not found",
        });
      }

      category.active = false;
      await category.save();

      res.status(200).json({
        status: true,
        message: "Category deleted",
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

      vendors = vendors.filter(
        (vendor) => vendor.address[0].city === req.user.selectedAddress.city
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
