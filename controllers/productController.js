const Product = require("../models/productModel");
// const Variant = require("../models/variantModel");
const Category = require("../models/categoryModel");
const Subcategory = require("../models/subCategoryModel");
const Shopper = require("../models/shopperModel");
const Vendor = require("../models/vendorModel");

const { body, validationResult } = require("express-validator");
const { throwErrorMessage } = require("../utils/errorHelper");

exports.addProduct = [
  body("subCategory")
    .not()
    .isEmpty()
    .withMessage("Sub Category Feild is required"),
  body("price").not().isEmpty().withMessage("Price is required"),
  body("state").not().isEmpty().withMessage("State is required"),
  body("quantity").not().isEmpty().withMessage("Quantity is required"),

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
        subCategory,
        productTitle,
        productDescription,
        images,
        price,
        state,
        quantity,
      } = req.body;

      let subCategoryExists = await Subcategory.findOne({ _id: subCategory });

      if (!subCategoryExists) {
        return res.status(404).json({
          status: false,
          message: "Sub Category not found!",
        });
      }

      const product = await Product.create({
        vendor: req.user._id,
        subCategory: subCategory,
        productTitle: productTitle,
        productDescription: productDescription,
        images: images,
        price: price,
        state: state,
        quantity: quantity,
        category: subCategoryExists.mainCategory
      });

      res.status(201).json({
        status: true,
        product: product,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.editProduct = [
  body("productId").not().isEmpty().withMessage("Product Id is required"),
  body("subCategory")
    .not()
    .isEmpty()
    .withMessage("Sub Category Feild is required"),
  body("price").not().isEmpty().withMessage("Price is required"),
  body("state").not().isEmpty().withMessage("State is required"),
  body("quantity").not().isEmpty().withMessage("Quantity is required"),

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
        productId,
        subCategory,
        productTitle,
        productDescription,
        images,
        price,
        state,
        quantity,
      } = req.body;

      let product = await Product.findOne({ _id: productId });

      if (!product) {
        return res.status(404).json({
          status: false,
          message: "Product not found!",
        });
      }

      let subCategoryExists = await Subcategory.findOne({ _id: subCategory });

      if (!subCategoryExists) {
        return res.status(404).json({
          status: false,
          message: "Sub Category not found!",
        });
      }
      // let variantExists = await Variant.findOne({ _id: variant });

      // if (!variantExists) {
      //   return res.status(404).json({
      //     status: false,
      //     message: "Variant not found!",
      //   });
      // }

      if (product.vendor._id.toString() === req.user._id.toString()) {
        product.subCategory = subCategory;
        product.productTitle = productTitle;
        product.productDescription = productDescription;
        product.images = images;
        product.price = price;
        product.state = state;
        product.quantity = quantity;

        await product.save();

        res.status(200).json({
          status: true,
          message: "Product updated successfully!",
        });
      } else {
        res.status(403).json({
          status: false,
          message: "You are not allowed to edit other's product",
        });
      }
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.deleteProduct = [
  body("productId").not().isEmpty().withMessage("Product Id Feild is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array(),
      });
    }

    let { productId } = req.body;
    try {
      const product = await Product.findOne({ _id: productId });
      if (!product) {
        return res.status(404).json({
          status: false,
          message: "Product not found!",
        });
      }

      if (product.vendor.toString() === req.user._id.toString()) {
        await Product.findByIdAndDelete({ _id: product._id });

        res.status(200).json({
          status: true,
          message: "Product Deleted!",
        });
      } else {
        res.status(403).json({
          status: false,
          message: "You are not allowed to delete other's  Product",
        });
      }
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.getProductById = async (req, res) => {
  try {
    if (!req.query.productId) {
      return res.status(400).json({
        status: false,
        message: "productId query parameter required!",
      });
    }

    const productId = req.query.productId;
    const product = await Product.findOne({ _id: productId });

    if (!product) {
      return res.status(404).json({
        status: false,
        message: "Product not found!",
      });
    }

    res.status(200).json({
      status: true,
      product: product,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getAllMyProducts = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 10);
    let skipValue = (page - 1) * limit;
    if (limit > 100 || limit < 1) {
      return res.status(400).json({
        status: "fail",
        message: "limit must be 1-100",
      });
    }
    const products = await Product.find({ vendor: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skipValue)
      .limit(limit);
    const count = await Product.find({ vendor: req.user._id }).countDocuments();

    res.status(200).json({
      status: true,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
      products: products,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getBestDealProducts = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    const limit = 10;
    let skipValue = (page - 1) * limit;
    const products = await Product.find({ isBestDeal: true })
      .skip(skipValue)
      .limit(limit);
    const count = await Product.find({ isBestDeal: true }).countDocuments();

    res.status(200).json({
      status: true,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
      bDProducts: products,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getProductByVendor = async (req, res) => {
  try {
    // if (req.query.limit > 100 || req.query.limit < 1) {
    //   return res.status(403).json({
    //     status: false,
    //     message: "Limit must be between 1-100",
    //   });
    // }
    if (!req.query.id) {
      return res.status(403).json({
        status: false,
        message: "Vendor Id required in query",
      });
    }
    // let page = parseInt(req.query.page ? req.query.page : 1);
    // let limit = parseInt(req.query.limit ? req.query.limit : 10);
    // let sort = req.query.sort ? req.query.sort : "new";
    // let skipValue = (page - 1) * limit;
    // let sortBy = -1;
    // if (sort === "old") sortBy = 1;
    let products, count;

    let vendor = await Vendor.findById(req.query.id);
    if (!vendor) {
      return res.status(403).json({
        status: false,
        message: "Vendor Not Found!",
      });
    }

    products = await Product.find({ vendor: vendor._id })
      // .sort({ createdAt: sortBy })
      // .skip(skipValue)
      // .limit(limit);
    // count = await Product.find({ vendor: vendor._id }).countDocuments();

    res.status(200).json({
      status: true,
      totalData: products.length,
      // totalPage: Math.ceil(count / limit),
      // perPage: limit,
      // currentPage: page,
      products: products,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

// -----------GET ALL PRODUCTS SORTED AS LATEST FIRST BY DEFAULT
exports.getAllProducts = async (req, res) => {
  try {
    if (req.query.limit > 100 || req.query.limit < 1) {
      return res.status(403).json({
        status: false,
        message: "Limit must be between 1-100",
      });
    }
    let limit = parseInt(req.query.limit ? req.query.limit : 10);
    let search = req.query.search ? req.query.search : "";
    let page = parseInt(req.query.page ? req.query.page : 1);
    let sort = req.query.sort ? req.query.sort : "new";
    let skipValue = (page - 1) * limit;
    let sortBy = -1;
    if (sort === "old") sortBy = 1;

    let products = [],
      count = 0;
    if (search && search.length > 0) {
      products = await Product.find({
        $or: [
          { productTitle: { $regex: new RegExp(search, "i") } },
          { productDescription: { $regex: new RegExp(search, "i") } },
        ],
      })
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Product.find({
        $or: [
          { productTitle: { $regex: new RegExp(search, "i") } },
          { productDescription: { $regex: new RegExp(search, "i") } },
        ],
      }).countDocuments();
    }
    if (!search || search.length <= 0) {
      products = await Product.find()
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);
      count = await Product.find().countDocuments();
    }

    res.status(200).json({
      status: true,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
      products: products,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getAllProductsInState = async (req, res) => {
  try {
    if (req.query.limit > 100 || req.query.limit < 1) {
      return res.status(403).json({
        status: false,
        message: "Limit must be between 1-100",
      });
    }
    let limit = parseInt(req.query.limit ? req.query.limit : 10);
    let search = req.query.search ? req.query.search : "";
    let page = parseInt(req.query.page ? req.query.page : 1);
    let sort = req.query.sort ? req.query.sort : "new";
    let skipValue = (page - 1) * limit;
    let sortBy = -1;
    if (sort === "old") sortBy = 1;

    let products = [],
      count = 0;
    if (search && search.length > 0) {
      products = await Product.find({
        $or: [
          { productTitle: { $regex: new RegExp(search, "i") } },
          { productDescription: { $regex: new RegExp(search, "i") } },
        ],
      })
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Product.find({
        $or: [
          { productTitle: { $regex: new RegExp(search, "i") } },
          { productDescription: { $regex: new RegExp(search, "i") } },
        ],
      }).countDocuments();
    }
    if (!search || search.length <= 0) {
      products = await Product.find()
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);
      count = await Product.find().countDocuments();
    }
    let user = await Shopper.findOne(
      { _id: req.user._id },
      { address: 1 }
    ).populate("address");
    const states = [];
    for (let address of user?.address) {
      states.push(address?.state);
    }
    if (!states || !states.length > 0) {
      return res.status(403).json({
        status: false,
        message: "Please add an address specifying the state!",
      });
    }
    products = products.filter((a) => states.includes(a.state));
    res.status(200).json({
      status: true,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
      products: products,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

// ---------------- GET PRODUCTS BY SUBCATEGORY
exports.getProductByCategory = async (req, res) => {
  try {
    if (req.query.limit > 100 || req.query.limit < 1) {
      return res.status(403).json({
        status: false,
        message: "Limit must be between 1-100",
      });
    }
    if (!req.query.categoryId) {
      return res.status(403).json({
        status: false,
        message: "Category Id required in query",
      });
    }

    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 10);
    let sort = req.query.sort ? req.query.sort : "new";
    let skipValue = (page - 1) * limit;
    let sortBy = -1;
    if (sort === "old") sortBy = 1;
    let products, count;

    let category = await Category.findById(req.query.categoryId);
    if (!category) {
      return res.status(404).json({
        status: false,
        message: "category Not Found!",
      });
    }

    products = await Product.find({ category: req.query.categoryId })
      .sort({ createdAt: sortBy })
      .skip(skipValue)
      .limit(limit);
    count = await Product.find({
      category: req.query.categoryId,
    }).countDocuments();

    res.status(200).json({
      status: true,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
      products: products,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getProductsBySubcategory = async (req, res) => {
  try {
    if (req.query.limit > 100 || req.query.limit < 1) {
      return res.status(403).json({
        status: false,
        message: "Limit must be between 1-100",
      });
    }
    if (!req.query.subcategoryId) {
      return res.status(403).json({
        status: false,
        message: "Subcategory Id required in query",
      });
    }
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 10);
    let sort = req.query.sort ? req.query.sort : "new";
    let skipValue = (page - 1) * limit;
    let sortBy = -1;
    if (sort === "old") sortBy = 1;
    let products, count;

    let subcategory = await Subcategory.findById(req.query.subcategoryId);
    if (!subcategory) {
      return res.status(403).json({
        status: false,
        message: "Subcategory Not Found!",
      });
    }

    products = await Product.find({ subCategory: subcategory._id })
      .sort({ createdAt: sortBy })
      .skip(skipValue)
      .limit(limit);
    count = await Product.find({
      subCategory: subcategory._id,
    }).countDocuments();

    res.status(200).json({
      status: true,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
      products: products,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getProductsBySubcategoryAndVendor = [
  body("vendorId").not().isEmpty().withMessage("Vendor Id Feild is required"),
  body("subcategoryId")
    .not()
    .isEmpty()
    .withMessage("Subcategory Id Feild is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array(),
      });
    }

    let { subcategoryId, vendorId } = req.body;
    try {
      let products, count;

      let subcategory = await Subcategory.findById(subcategoryId);
      if (!subcategory) {
        return res.status(403).json({
          status: false,
          message: "Subcategory Not Found!",
        });
      }
      let vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(403).json({
          status: false,
          message: "vendor Not Found!",
        });
      }
      let user = await Shopper.findOne(
        { _id: req.user._id },
        { address: 1 }
      ).populate("address");
      const states = [];
      for (let address of user.address) {
        states.push(address?.state);
      }
      if (!states || !states.length > 0) {
        return res.status(403).json({
          status: false,
          message: "Please add an address specifying the state!",
        });
      }
      products = await Product.find({
        $and: [{ subCategory: subcategory._id }, { vendor: vendor._id }],
      });
      products = products.filter((a) => states.includes(a.state));
      res.status(200).json({
        status: true,
        totalData: products.length,
        products: products,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

// ----------------FOR VARIANTS

// exports.addVariant = [
//   body("productId").not().isEmpty().withMessage("Product Id Feild is required"),
//   body("quantity").not().isEmpty().withMessage("Quantity Feild is required"),

//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         status: false,
//         errors: errors.array(),
//       });
//     }
//     try {
//       let { productId, color, size, type, quantity } = req.body;

//       const product = await Product.findOne({
//         $and: [{ _id: productId }, { vendor: req.user._id }],
//       });
//       if (!product) {
//         return res.status(404).json({
//           status: false,
//           message: "Product not found!",
//         });
//       }

//       let variant = await Variant.create({
//         vendor: req.user._id,
//         color: color,
//         size: size,
//         type: type,
//         quantity: quantity,
//       });

//       await Product.findOneAndUpdate(
//         { _id: productId },
//         { $push: { variant: variant._id } }
//       );

//       res.status(201).json({
//         status: true,
//         message: "Variant Added",
//         variant: variant,
//       });
//     } catch (err) {
//       throwErrorMessage(err, res);
//     }
//   },
// ];

// exports.removeVariant = [
//   body("productId").not().isEmpty().withMessage("Product Id Feild is required"),
//   body("variantId").not().isEmpty().withMessage("Variant Id Feild is required"),

//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         status: false,
//         errors: errors.array(),
//       });
//     }
//     try {
//       let { productId, variantId } = req.body;

//       const product = await Product.findOne({
//         $and: [{ _id: productId }, { vendor: req.user._id }],
//       });
//       if (!product) {
//         return res.status(404).json({
//           status: false,
//           message: "Product not found!",
//         });
//       }

//       let found;
//       let filtered = [];
//       for await (val of product.variant) {
//         if (val._id.toString() === variantId.toString()) found = true;
//         else filtered.push(val);
//       }
//       if (!found) {
//         return res.status(404).json({
//           status: false,
//           message: "Variant not found int this product",
//         });
//       }

//       product.variant = filtered;
//       await product.save();

//       res.status(201).json({
//         status: true,
//         message: "Variant Removed",
//         variant: filtered,
//       });
//     } catch (err) {
//       throwErrorMessage(err, res);
//     }
//   },
// ];
