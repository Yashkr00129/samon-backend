const Subcategory = require("../models/subCategoryModel");
const Category = require("../models/categoryModel");
const Vendor = require("../models/vendorModel");
const Product = require("../models/productModel");

const { body, validationResult } = require("express-validator");
const { throwErrorMessage } = require("../utils/errorHelper");

exports.addSubCategory = [
  body("name").not().isEmpty().withMessage("Name is required"),
  body("mainCategory")
    .not()
    .isEmpty()
    .withMessage("Main Category Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { name, image, keywords, mainCategory } = req.body;

      const category = await Category.findOne({
        $and: [{ _id: mainCategory }, { active: { $ne: false } }],
      });
      if (!category) {
        return res.status(404).json({
          status: true,
          message: "Main Category not found!",
        });
      }

      const subCategory = await Subcategory.findOne({
        $and: [
          { name: name.toLowerCase().trim() },
          { mainCategory: mainCategory },
        ],
      });
      if (subCategory) {
        return res.status(409).json({
          status: false,
          message: "Sub Category Name already exists",
        });
      }
      const createdSubCategory = await Subcategory.create({
        name: name,
        image: image,
        keywords: keywords,
        mainCategory: mainCategory,
      });

      res.status(200).json({
        status: true,
        message: "Sub Category created",
        subCategory: createdSubCategory,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.getAllSubCategory = async (req, res) => {
  try {
    if (req.query.limit > 100 || req.query.limit < 1) {
      return res.status(403).json({
        status: false,
        message: "Limit must be between 1-100",
      });
    }
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 10);
    let sort = req.query.sort ? req.query.sort : "new";
    let skipValue = (page - 1) * limit;
    let sortBy = -1;
    if (sort === "old") sortBy = 1;

    const subCategories = await Subcategory.find({ active: { $ne: false } })
      .sort({ createdAt: sortBy })
      .skip(skipValue)
      .limit(limit)
      .populate("mainCategory");

    const count = await Subcategory.find({
      active: { $ne: false },
    }).countDocuments();

    res.status(200).json({
      status: true,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
      subCategories: subCategories,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getSubCategories = async (req, res) => {
  try {
    if (!req.query.ctgId) {
      return res.status(403).json({
        status: false,
        message: "Main Category id required",
      });
    }
    const category = await Category.findOne({
      $and: [{ _id: req.query.ctgId }, { active: { $ne: false } }],
    });
    if (!category) {
      return res.status(404).json({
        status: true,
        message: "Main Category not found!",
      });
    }

    const subCategories = await Subcategory.find({
      active: { $ne: false },
    }).populate("mainCategory");

    const count = await Subcategory.find({
      active: { $ne: false },
    }).countDocuments();

    res.status(200).json({
      status: true,
      totalData: count,
      subCategories: subCategories,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getSubCategoriesByVendor = [
  body("vendorId").not().isEmpty().withMessage("Vendor Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { vendorId } = req.body;
      let products, subcategories;

      let vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(403).json({
          status: false,
          message: "Vendor Not Found!",
        });
      }

      products = await Product.find({ vendor: vendor._id }, { subCategory: 1, _id: 0 }).populate("subCategory");
      subcategories = products.map(a => a.subCategory);
      subcategories = subcategories.filter((a, i) => subcategories.findIndex((s) => a.name === s.name) === i);
      res.status(200).json({
        status: true,
        subcategories: subcategories,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.updateSubCategory = [
  body("id").not().isEmpty().withMessage("Sub Category Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { id, name, image, keywords, mainCategory } = req.body;

      if (mainCategory) {
        const category = await Category.findOne({
          $and: [{ _id: mainCategory }, { active: { $ne: false } }],
        });
        if (!category) {
          return res.status(404).json({
            status: true,
            message: "Main Category not found!",
          });
        }
      }

      const subCategory = await Subcategory.findOne({
        $and: [{ _id: id }, { active: { $ne: false } }],
      });
      if (!subCategory) {
        return res.status(404).json({
          status: false,
          message: "Sub Category not found",
        });
      }
      subCategory.name = name ? name : subCategory.name;
      subCategory.image = image ? image : subCategory.image;
      subCategory.keywords = keywords ? keywords : subCategory.keywords;
      subCategory.mainCategory = mainCategory
        ? mainCategory
        : subCategory.mainCategory;

      await subCategory.save();

      res.status(200).json({
        status: true,
        message: "Sub Category Updated",
        subCategory: subCategory,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.deleteSubCategory = [
  async (req, res) => {
    try {
      const { id } = req.params;

      const subCategory = await Subcategory.findOne({ _id: id });
      if (!subCategory) {
        return res.status(404).json({
          status: false,
          message: "Sub Category not found",
        });
      }

      subCategory.active = false;
      await subCategory.save();

      res.status(200).json({
        status: true,
        message: "Sub Category deleted",
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];
