const Member = require("../models/memberModel");
const Shopper = require("../models/shopperModel");
const Vendor = require("../models/vendorModel");
const Grocer = require("../models/grocerModel");
const Rider = require("../models/riderModel");
const Restaurant = require("../models/restaurantModel");
const Product = require("../models/productModel");
const Porder = require("../models/porderModel");
const Gorder = require("../models/gorderModel");
const Forder = require("../models/forderModel");
const Torder = require("../models/torderModel");
const Stuff = require("../models/stuffModel");
const Menu = require("../models/menuModel");
const Banner = require("../models/bannerModel");

const { body, query, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { throwErrorMessage } = require("../utils/errorHelper");
const { findOne } = require("../models/shopperModel");
const { deleteFile } = require("../utils/s3Functions");

const createToken = (user) => {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.createMember = [
  body("email").not().isEmpty().withMessage("Email is required"),
  body("password").not().isEmpty().withMessage("Password Id Feild is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be atleast 8 Characters"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { phone, password, fullName, email } = req.body;

      const member = await Member.findOne({ email: email });
      if (member) {
        return res.status(409).json({
          status: false,
          message: "Email already exists! Use different",
        });
      }
      const createdMember = await Member.create({
        fullName: fullName,
        phone: phone,
        password: password,
        email: email,
      });

      res.status(201).json({
        status: true,
        message: "Member is created",
        user: createdMember,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.login = [
  body("email").not().isEmpty().withMessage("Email Id Feild is required"),
  body("password").not().isEmpty().withMessage("Password Feild is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be atleast 8 Characters"),

  async (req, res) => {
    try {
      const { email, password } = req.body;
      const member = await Member.findOne({ email: email }).select("+password");
      if (!member) {
        return res.status(404).json({
          status: false,
          message: "Member not found!",
        });
      }
      if (member.active === false) {
        return res.status(403).json({
          status: false,
          message: "Your account is deleted, please contact admin",
        });
      }

      const auth = await bcrypt.compare(password, member.password);
      if (auth) {
        const token = createToken(member);
        return res.status(200).json({
          status: true,
          message: "Logged in successfully!",
          token: token,
          user: member,
        });
      }
      res.status(403).json({
        status: false,
        message: "Incorrect password!",
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

// ---------------STATISTICS---------------------
exports.getDashboardOverview = async (req, res) => {
  try {
    // ----------------DATA-----------------
    const shoppers = await Shopper.find({
      active: { $ne: false },
    });
    const vendors = await Vendor.find({
      active: { $ne: false },
    });
    const grocers = await Grocer.find({
      active: { $ne: false },
    });
    const restaurants = await Restaurant.find({
      active: { $ne: false },
    });
    const riders = await Rider.find({
      active: { $ne: false },
    });

    // ----------------TOTAL----------------
    const totalShoppers = await Shopper.find({
      active: { $ne: false },
    }).countDocuments();
    const totalVendors = await Vendor.find({
      active: { $ne: false },
    }).countDocuments();
    const totalGrocers = await Grocer.find({
      active: { $ne: false },
    }).countDocuments();
    const totalRestaurants = await Restaurant.find({
      active: { $ne: false },
    }).countDocuments();
    const totalRiders = await Rider.find({
      active: { $ne: false },
    }).countDocuments();
    const totalProducts = await Product.find().countDocuments();
    const totalPendingOrders = await Porder.find({
      status: "PENDING",
    }).countDocuments();
    const totalProcessingOrders = await Porder.find({
      status: "PROCESSING",
    }).countDocuments();
    const totalDispatchedOrders = await Porder.find({
      status: "DISPATCHED",
    }).countDocuments();
    const totalDeliveringOrders = await Porder.find({
      status: "DELIVERING",
    }).countDocuments();
    const totalDeliveredOrders = await Porder.find({
      status: "DELIVERED",
    }).countDocuments();
    const totalCancelledOrders = await Porder.find({
      status: "CANCELLED",
    }).countDocuments();

    res.status(200).json({
      status: true,
      data: {
        shoppers,
        vendors,
        grocers,
        restaurants,
        riders,
      },
      total: {
        totalShoppers: totalShoppers,
        totalVendors: totalVendors,
        totalGrocers: totalGrocers,
        totalRestaurants: totalRestaurants,
        totalRiders: totalRiders,
        totalProducts: totalProducts,
        totalPendingOrders: totalPendingOrders,
        totalProcessingOrders: totalProcessingOrders,
        totalDispatchedOrders: totalDispatchedOrders,
        totalDeliveringOrders: totalDeliveringOrders,
        totalDeliveredOrders: totalDeliveredOrders,
        totalCancelledOrders: totalCancelledOrders,
      },
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getThisMonthOverview = async (req, res) => {
  try {
    // ----------------Month wise----------------
    // ----------------THIS MONTH--------------
    let lastMonth = new Date(new Date().setMonth(new Date().getMonth()));
    lastMonth.setDate(1);
    lastMonth.setHours(00);
    lastMonth.setMinutes(00);
    lastMonth.setSeconds(00);
    lastMonth.setMilliseconds(00);

    const shoppers = await Shopper.find({
      $and: [
        { createdAt: { $gt: lastMonth } },
        { createdAt: { $lte: new Date() } },
        { active: { $ne: false } },
      ],
    }).countDocuments();
    const vendors = await Vendor.find({
      $and: [
        { createdAt: { $gt: lastMonth } },
        { createdAt: { $lte: new Date() } },
        { active: { $ne: false } },
      ],
    }).countDocuments();
    const grocers = await Grocer.find({
      $and: [
        { createdAt: { $gt: lastMonth } },
        { createdAt: { $lte: new Date() } },
        { active: { $ne: false } },
      ],
    }).countDocuments();
    const restaurants = await Restaurant.find({
      $and: [
        { createdAt: { $gt: lastMonth } },
        { createdAt: { $lte: new Date() } },
        { active: { $ne: false } },
      ],
    }).countDocuments();
    const riders = await Rider.find({
      $and: [
        { createdAt: { $gt: lastMonth } },
        { createdAt: { $lte: new Date() } },
        { active: { $ne: false } },
      ],
    }).countDocuments();
    const products = await Product.find({
      $and: [
        { createdAt: { $gt: lastMonth } },
        { createdAt: { $lte: new Date() } },
      ],
    }).countDocuments();
    const pendingOrders = await Porder.find({
      $and: [
        { createdAt: { $gt: lastMonth } },
        { updatedAt: { $lte: new Date() } },
        { status: "PENDING" },
      ],
    }).countDocuments();
    const processingOrders = await Porder.find({
      $and: [
        { createdAt: { $gt: lastMonth } },
        { updatedAt: { $lte: new Date() } },
        { status: "PROCESSING" },
      ],
    }).countDocuments();
    const dispatchedOrders = await Porder.find({
      $and: [
        { createdAt: { $gt: lastMonth } },
        { updatedAt: { $lte: new Date() } },
        { status: "DISPATCHED" },
      ],
    }).countDocuments();
    const deliveringOrders = await Porder.find({
      $and: [
        { createdAt: { $gt: lastMonth } },
        { updatedAt: { $lte: new Date() } },
        { status: "DELIVERING" },
      ],
    }).countDocuments();
    const deliveredOrders = await Porder.find({
      $and: [
        { createdAt: { $gt: lastMonth } },
        { updatedAt: { $lte: new Date() } },
        { status: "DELIVERED" },
      ],
    }).countDocuments();
    const cancelledOrders = await Porder.find({
      $and: [
        { createdAt: { $gt: lastMonth } },
        { updatedAt: { $lte: new Date() } },
        { status: "CANCELLED" },
      ],
    }).countDocuments();

    res.status(200).json({
      status: true,
      total: {
        shoppers: shoppers,
        vendors: vendors,
        grocers: grocers,
        restaurants: restaurants,
        riders: riders,
        products: products,
        pendingOrders: pendingOrders,
        processingOrders: processingOrders,
        dispatchedOrders: dispatchedOrders,
        deliveringOrders: deliveringOrders,
        deliveredOrders: deliveredOrders,
        cancelledOrders: cancelledOrders,
      },
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getWeekOverview = async (req, res) => {
  try {
    // ----------------Week wise----------------
    // ----------------THIS Week--------------
    let lastWeek = new Date(new Date().setDate(new Date().getDate() - 7));
    lastWeek.setHours(00);
    lastWeek.setMinutes(00);
    lastWeek.setSeconds(00);
    lastWeek.setMilliseconds(00);

    let tillWeek = new Date();
    tillWeek.setHours(00);
    tillWeek.setMinutes(00);
    tillWeek.setSeconds(00);
    tillWeek.setMilliseconds(00);

    const shoppers = await Shopper.find({
      $and: [
        { createdAt: { $gt: lastWeek } },
        { createdAt: { $lte: tillWeek } },
        { active: { $ne: false } },
      ],
    }).countDocuments();
    const vendors = await Vendor.find({
      $and: [
        { createdAt: { $gt: lastWeek } },
        { createdAt: { $lte: tillWeek } },
        { active: { $ne: false } },
      ],
    }).countDocuments();
    const grocers = await Grocer.find({
      $and: [
        { createdAt: { $gt: lastWeek } },
        { createdAt: { $lte: tillWeek } },
        { active: { $ne: false } },
      ],
    }).countDocuments();
    const restaurants = await Restaurant.find({
      $and: [
        { createdAt: { $gt: lastWeek } },
        { createdAt: { $lte: tillWeek } },
        { active: { $ne: false } },
      ],
    }).countDocuments();
    const riders = await Rider.find({
      $and: [
        { createdAt: { $gt: lastWeek } },
        { createdAt: { $lte: tillWeek } },
        { active: { $ne: false } },
      ],
    }).countDocuments();
    const products = await Product.find({
      $and: [
        { createdAt: { $gt: lastWeek } },
        { createdAt: { $lte: tillWeek } },
      ],
    }).countDocuments();
    const pendingOrders = await Porder.find({
      $and: [
        { updatedAt: { $gt: lastWeek } },
        { updatedAt: { $lte: tillWeek } },
        { status: "PENDING" },
      ],
    }).countDocuments();
    const processingOrders = await Porder.find({
      $and: [
        { updatedAt: { $gt: lastWeek } },
        { updatedAt: { $lte: tillWeek } },
        { status: "PROCESSING" },
      ],
    }).countDocuments();
    const dispatchedOrders = await Porder.find({
      $and: [
        { updatedAt: { $gt: lastWeek } },
        { updatedAt: { $lte: tillWeek } },
        { status: "DISPATCHED" },
      ],
    }).countDocuments();
    const deliveringOrders = await Porder.find({
      $and: [
        { updatedAt: { $gt: lastWeek } },
        { updatedAt: { $lte: tillWeek } },
        { status: "DELIVERING" },
      ],
    }).countDocuments();
    const deliveredOrders = await Porder.find({
      $and: [
        { updatedAt: { $gt: lastWeek } },
        { updatedAt: { $lte: tillWeek } },
        { status: "DELIVERED" },
      ],
    }).countDocuments();
    const cancelledOrders = await Porder.find({
      $and: [
        { updatedAt: { $gt: lastWeek } },
        { updatedAt: { $lte: tillWeek } },
        { status: "CANCELLED" },
      ],
    }).countDocuments();

    res.status(200).json({
      status: true,
      total: {
        shoppers: shoppers,
        vendors: vendors,
        grocers: grocers,
        restaurants: restaurants,
        riders: riders,
        products: products,
        pendingOrders: pendingOrders,
        processingOrders: processingOrders,
        dispatchedOrders: dispatchedOrders,
        deliveringOrders: deliveringOrders,
        deliveredOrders: deliveredOrders,
        cancelledOrders: cancelledOrders,
      },
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getTodaysOverview = async (req, res) => {
  try {
    // ----------------Week wise----------------
    // ----------------THIS Week--------------
    let date = new Date();
    date.setHours(00);
    date.setMinutes(00);
    date.setSeconds(00);
    date.setMilliseconds(00);

    const shoppers = await Shopper.find({
      $and: [{ createdAt: { $gt: date } }, { active: { $ne: false } }],
    }).countDocuments();
    const vendors = await Vendor.find({
      $and: [{ createdAt: { $gt: date } }, { active: { $ne: false } }],
    }).countDocuments();
    const grocers = await Grocer.find({
      $and: [{ createdAt: { $gt: date } }, { active: { $ne: false } }],
    }).countDocuments();
    const restaurants = await Restaurant.find({
      $and: [{ createdAt: { $gt: date } }, { active: { $ne: false } }],
    }).countDocuments();
    const riders = await Rider.find({
      $and: [{ createdAt: { $gt: date } }, { active: { $ne: false } }],
    }).countDocuments();
    const products = await Product.find({
      createdAt: { $gt: date },
    }).countDocuments();
    const pendingOrders = await Porder.find({
      $and: [{ updatedAt: { $gt: date } }, { status: "PENDING" }],
    }).countDocuments();
    const processingOrders = await Porder.find({
      $and: [{ updatedAt: { $gt: date } }, { status: "PROCESSING" }],
    }).countDocuments();
    const dispatchedOrders = await Porder.find({
      $and: [{ updatedAt: { $gt: date } }, { status: "DISPATCHED" }],
    }).countDocuments();
    const deliveringOrders = await Porder.find({
      $and: [{ updatedAt: { $gt: date } }, { status: "DELIVERING" }],
    }).countDocuments();
    const deliveredOrders = await Porder.find({
      $and: [{ updatedAt: { $gt: date } }, { status: "DELIVERED" }],
    }).countDocuments();
    const cancelledOrders = await Porder.find({
      $and: [{ updatedAt: { $gt: date } }, { status: "CANCELLED" }],
    }).countDocuments();

    res.status(200).json({
      status: true,
      total: {
        shoppers: shoppers,
        vendors: vendors,
        grocers: grocers,
        restaurants: restaurants,
        riders: riders,
        products: products,
        pendingOrders: pendingOrders,
        processingOrders: processingOrders,
        dispatchedOrders: dispatchedOrders,
        deliveringOrders: deliveringOrders,
        deliveredOrders: deliveredOrders,
        cancelledOrders: cancelledOrders,
      },
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

// ---------------FOR MEMBERS---------------------
exports.deleteMember = [
  body("memberId").not().isEmpty().withMessage("Member Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { memberId } = req.body;

      const member = await Member.findOne({
        $and: [{ _id: memberId }, { userType: "member" }],
      });
      if (!member) {
        return res.status(404).json({
          status: false,
          message: "Member not Found!",
        });
      }
      await Member.findByIdAndDelete(memberId);

      res.status(200).json({
        status: true,
        message: "Member Deleted!",
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.getAllMembers = async (req, res) => {
  try {
    const members = await Member.find({ userType: "member" });

    res.status(200).json({
      status: true,
      members: members,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

// ---------------FOR SHOPPERS---------------------
exports.deleteShopper = [
  body("shopperId").not().isEmpty().withMessage("Shopper Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { shopperId } = req.body;

      const shopper = await Shopper.findOne({ _id: shopperId });
      if (!shopper) {
        return res.status(404).json({
          status: false,
          message: "Shopper not Found!",
        });
      }
      await Shopper.findByIdAndDelete(shopperId);

      res.status(200).json({
        status: true,
        message: "Shopper Deleted!",
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.getAllShoppers = async (req, res) => {
  try {
    if (req.query.limit > 100 || req.query.limit < 1) {
      return res.status(403).json({
        status: true,
        message: "Limit must be between 1-100",
      });
    }
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 1000);
    let search = req.query.search ? req.query.search : "";
    let sort = req.query.sort ? req.query.sort : "new";
    let skipValue = (page - 1) * limit;
    let sortBy = -1;
    if (sort === "old") sortBy = 1;

    let shoppers = [],
      count = 0;
    if (search && search.length > 0) {
      shoppers = await Shopper.find({
        $or: [
          { fullName: { $regex: new RegExp(search, "i") } },
          { phone: { $regex: new RegExp(search, "i") } },
        ],
      })
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Shopper.find({
        $or: [
          { fullName: { $regex: new RegExp(search, "i") } },
          { phone: { $regex: new RegExp(search, "i") } },
        ],
      }).countDocuments();
    }
    if (!search || search.length <= 0) {
      shoppers = await Shopper.find()
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Shopper.find().countDocuments();
    }

    const users = [];
    for (let shopper of shoppers) {
      const res = JSON.parse(JSON.stringify(shopper));
      res.porders = await Porder.find({ shopper: shopper._id }).populate(
        "products"
      );
      res.gorders = await Gorder.find({ shopper: shopper._id }).populate(
        "stuffs"
      );
      res.forders = await Forder.find({ shopper: shopper._id }).populate(
        "dishes"
      );

      users.push(res);
    }

    res.status(200).json({
      status: true,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
      shoppers: users,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

// ---------------FOR SELLERS---------------------

exports.getAllVendors = async (req, res) => {
  try {
    if (req.query.limit > 100 || req.query.limit < 1) {
      return res.status(403).json({
        status: true,
        message: "Limit must be between 1-100",
      });
    }
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 10);
    let search = req.query.search ? req.query.search : "";
    let sort = req.query.sort ? req.query.sort : "new";
    let skipValue = (page - 1) * limit;
    let sortBy = -1;
    if (sort === "old") sortBy = 1;

    let vendors = [],
      count = 0;
    if (search && search.length > 0) {
      vendors = await Vendor.find({
        $or: [
          { fullName: { $regex: new RegExp(search, "i") } },
          { email: { $regex: new RegExp(search, "i") } },
          { phone: { $regex: new RegExp(search, "i") } },
          { storeName: { $regex: new RegExp(search, "i") } },
        ],
      })
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Vendor.find({
        $or: [
          { fullName: { $regex: new RegExp(search, "i") } },
          { email: { $regex: new RegExp(search, "i") } },
          { phone: { $regex: new RegExp(search, "i") } },
        ],
      }).countDocuments();
    }
    if (!search || search.length <= 0) {
      vendors = await Vendor.find()
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Vendor.find().countDocuments();
    }
    const users = [];
    for (let vendor of vendors) {
      const res = JSON.parse(JSON.stringify(vendor));
      res.porders = await Porder.find({ vendor: vendor._id }).populate("bill");
      let totalEarnings = 0;
      for (let porder of res.porders) {
        totalEarnings = totalEarnings + porder.bill.paidPrice;
      }
      res.totalEarnings = totalEarnings;
      users.push(res);
    }

    // all vendors have an address, inside the address they have a field called city
    // now i want to check who is sending the request
    // from that i want the city of the address field
    // then i want to send all the vendors for that city
    // plz write code for that

    res.status(200).json({
      status: true,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
      vendors: users,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.approveOrRejectVendor = [
  body("vendorId").not().isEmpty().withMessage("Vendor Id is required"),
  body("status").not().isEmpty().withMessage("Status required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { vendorId, status } = req.body;

      if (
        status.toLowerCase() !== "approved" &&
        status.toLowerCase() !== "rejected"
      ) {
        return res.status(404).json({
          status: false,
          message: "Not a valid status!",
        });
      }

      const vendor = await Vendor.findOne({ _id: vendorId });
      if (!vendor) {
        return res.status(404).json({
          status: false,
          message: "Vendor not Found!",
        });
      }
      await Vendor.findByIdAndUpdate(vendorId, {
        status: status.toLowerCase(),
      });

      res.status(200).json({
        status: true,
        message: `Vendor ${status.toUpperCase()}!`,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.bannVendor = [
  body("vendorId").not().isEmpty().withMessage("Vendor Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { vendorId } = req.body;

      const vendor = await Vendor.findOne({ _id: vendorId });
      if (!vendor) {
        return res.status(404).json({
          status: false,
          message: "Vendor not Found!",
        });
      }
      await Vendor.findByIdAndUpdate(vendorId, { active: false });

      res.status(200).json({
        status: true,
        message: "Vendor banned!",
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

// ---------------PRODUCTS
exports.getAllProductsByVendor = async (req, res) => {
  try {
    if (!req.query.id) {
      return res.status(400).json({
        status: false,
        message: "Vendor Id required in params",
      });
    }
    const vendor = await Vendor.findOne({ _id: req.query.id });
    if (!vendor) {
      return res.status(404).json({
        status: false,
        message: "Vendor not Found!",
      });
    }
    if (req.query.limit > 100 || req.query.limit < 1) {
      return res.status(403).json({
        status: true,
        message: "Limit must be between 1-100",
      });
    }
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 10);
    let sort = req.query.sort ? req.query.sort : "new";
    let skipValue = (page - 1) * limit;
    let sortBy = -1;
    if (sort === "old") sortBy = 1;

    const products = await Product.find({ vendor: vendor._id })
      .sort({ createdAt: sortBy })
      .skip(skipValue)
      .limit(limit);

    const count = await Product.find({ vendor: vendor._id }).countDocuments();

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

// --------------MARKING BEST DEALS
exports.toggleBestDeal = [
  body("itemId").not().isEmpty().withMessage("Item Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array(),
      });
    }

    try {
      let { itemId } = req.body;

      let item =
        (await Product.findOne({ _id: itemId })) ||
        (await Stuff.findOne({ _id: itemId }));

      if (!item) {
        return res.status(404).json({
          status: false,
          message: "Item not found!",
        });
      }

      item.isBestDeal = !item.isBestDeal;

      await item.save();

      res.status(200).json({
        status: true,
        message: "Item's best-deal status successfully updated!",
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

// ---------------MARKING FEATURED SELLERS--------------
exports.toggleFeatured = [
  body("sellerId").not().isEmpty().withMessage("Seller Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array(),
      });
    }

    try {
      const { sellerId } = req.body;

      let seller =
        (await Grocer.findOne({ _id: sellerId })) ||
        (await Restaurant.findOne({ _id: sellerId })) ||
        (await Vendor.findOne({ _id: sellerId }));

      if (!seller) {
        return res.status(404).json({
          status: false,
          message: "Seller not found!",
        });
      }

      seller.isFeatured = !seller.isFeatured;

      await seller.save();

      res.status(200).json({
        status: true,
        message: "Seller's featured status successfully updated!",
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

// ---------------FOR GROCERS---------------------
exports.getAllGrocers = async (req, res) => {
  try {
    if (req.query.limit > 100 || req.query.limit < 1) {
      return res.status(403).json({
        status: true,
        message: "Limit must be between 1-100",
      });
    }
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 10);
    let search = req.query.search ? req.query.search : "";
    let sort = req.query.sort ? req.query.sort : "new";
    let skipValue = (page - 1) * limit;
    let sortBy = -1;
    if (sort === "old") sortBy = 1;

    let grocers = [],
      count = 0;
    if (search && search.length > 0) {
      grocers = await Grocer.find({
        $or: [
          { fullName: { $regex: new RegExp(search, "i") } },
          { email: { $regex: new RegExp(search, "i") } },
          { phone: { $regex: new RegExp(search, "i") } },
          { storeName: { $regex: new RegExp(search, "i") } },
        ],
      })
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Grocer.find({
        $or: [
          { fullName: { $regex: new RegExp(search, "i") } },
          { email: { $regex: new RegExp(search, "i") } },
          { phone: { $regex: new RegExp(search, "i") } },
        ],
      }).countDocuments();
    }
    if (!search || search.length <= 0) {
      grocers = await Grocer.find()
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Grocer.find().countDocuments();
    }

    res.status(200).json({
      status: true,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
      grocers: grocers,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.approveOrRejectGrocer = [
  body("grocerId").not().isEmpty().withMessage("Vendor Id is required"),
  body("status").not().isEmpty().withMessage("Status required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { grocerId, status } = req.body;

      if (
        status.toLowerCase() !== "approved" &&
        status.toLowerCase() !== "rejected"
      ) {
        return res.status(404).json({
          status: false,
          message: "Not a valid status!",
        });
      }

      const grocer = await Grocer.findOne({ _id: grocerId });
      if (!grocer) {
        return res.status(404).json({
          status: false,
          message: "Grocer not Found!",
        });
      }
      await Grocer.findByIdAndUpdate(grocerId, {
        status: status.toLowerCase(),
      });

      res.status(200).json({
        status: true,
        message: `Grocer ${status.toUpperCase()}!`,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.approveOrRejectRestraunt = [
  body("restaurantId").not().isEmpty().withMessage("Restraunt Id is required"),
  body("status").not().isEmpty().withMessage("Status required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { restaurantId, status } = req.body;

      if (
        status.toLowerCase() !== "approved" &&
        status.toLowerCase() !== "rejected"
      ) {
        return res.status(404).json({
          status: false,
          message: "Not a valid status!",
        });
      }

      const restraunt = await Restaurant.findOne({ _id: restaurantId });
      if (!restaurantId) {
        return res.status(404).json({
          status: false,
          message: "Restraunt not Found!",
        });
      }
      await Restaurant.findByIdAndUpdate(restaurantId, {
        status: status.toLowerCase(),
      });

      res.status(200).json({
        status: true,
        message: `Restraunt ${status.toUpperCase()}!`,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.approveOrRejectRider = [
  body("riderId").not().isEmpty().withMessage("Vendor Id is required"),
  body("status").not().isEmpty().withMessage("Status required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { riderId, status } = req.body;

      if (
        status.toLowerCase() !== "approved" &&
        status.toLowerCase() !== "rejected"
      ) {
        return res.status(404).json({
          status: false,
          message: "Not a valid status!",
        });
      }

      const rider = await Rider.findOne({ _id: riderId });
      if (!rider) {
        return res.status(404).json({
          status: false,
          message: "Rider not Found!",
        });
      }
      await Rider.findByIdAndUpdate(riderId, {
        status: status.toLowerCase(),
      });

      res.status(200).json({
        status: true,
        message: `Rider ${status.toUpperCase()}!`,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.bannGrocer = [
  body("grocerId").not().isEmpty().withMessage("Grocer Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { grocerId } = req.body;

      const grocer = await Grocer.findOne({ _id: grocerId });
      if (!grocer) {
        return res.status(404).json({
          status: false,
          message: "Grocer not Found!",
        });
      }
      await Grocer.findByIdAndUpdate(grocerId, { active: false });

      res.status(200).json({
        status: true,
        message: "Grocer banned!",
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

// ---------------FOR RESTAURANTS---------------------
exports.getAllRestaurants = async (req, res) => {
  try {
    if (req.query.limit > 100 || req.query.limit < 1) {
      return res.status(403).json({
        status: true,
        message: "Limit must be between 1-100",
      });
    }
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 10);
    let search = req.query.search ? req.query.search : "";
    let sort = req.query.sort ? req.query.sort : "new";
    let skipValue = (page - 1) * limit;
    let sortBy = -1;
    if (sort === "old") sortBy = 1;

    let restaurants = [],
      count = 0;
    if (search && search.length > 0) {
      restaurants = await Restaurant.find({
        $or: [
          { fullName: { $regex: new RegExp(search, "i") } },
          { email: { $regex: new RegExp(search, "i") } },
          { phone: { $regex: new RegExp(search, "i") } },
          { storeName: { $regex: new RegExp(search, "i") } },
        ],
      })
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Restaurant.find({
        $or: [
          { fullName: { $regex: new RegExp(search, "i") } },
          { email: { $regex: new RegExp(search, "i") } },
          { phone: { $regex: new RegExp(search, "i") } },
        ],
      }).countDocuments();
    }
    if (!search || search.length <= 0) {
      restaurants = await Restaurant.find()
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Restaurant.find().countDocuments();
    }
    const rests = [];
    for (let restaurant of restaurants) {
      const res = JSON.parse(JSON.stringify(restaurant));
      res.menus = await Menu.find({ restaurant: restaurant._id }).populate(
        "dishes"
      );
      rests.push(res);
    }
    // console.log(rests);
    res.status(200).json({
      status: true,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
      restaurants: rests,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.bannRestaurant = [
  body("restaurantId").not().isEmpty().withMessage("Restaurant Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { restaurantId } = req.body;

      const restaurant = await Restaurant.findOne({ _id: restaurantId });
      if (!restaurant) {
        return res.status(404).json({
          status: false,
          message: "Restaurant not Found!",
        });
      }
      await Restaurant.findByIdAndUpdate(restaurantId, { active: false });

      res.status(200).json({
        status: true,
        message: "Restaurant banned!",
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

// ---------------FOR RIDERS---------------------
exports.getAllRiders = async (req, res) => {
  try {
    if (req.query.limit > 100 || req.query.limit < 1) {
      return res.status(403).json({
        status: true,
        message: "Limit must be between 1-100",
      });
    }
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 10);
    let search = req.query.search ? req.query.search : "";
    let sort = req.query.sort ? req.query.sort : "new";
    let skipValue = (page - 1) * limit;
    let sortBy = -1;
    if (sort === "old") sortBy = 1;

    let riders = [],
      count = 0;
    if (search && search.length > 0) {
      riders = await Rider.find({
        $or: [
          { fullName: { $regex: new RegExp(search, "i") } },
          { email: { $regex: new RegExp(search, "i") } },
          { phone: { $regex: new RegExp(search, "i") } },
        ],
      })
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Rider.find({
        $or: [
          { fullName: { $regex: new RegExp(search, "i") } },
          { email: { $regex: new RegExp(search, "i") } },
          { phone: { $regex: new RegExp(search, "i") } },
        ],
      }).countDocuments();
    }
    if (!search || search.length <= 0) {
      riders = await Rider.find()
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Rider.find().countDocuments();
    }

    res.status(200).json({
      status: true,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
      riders: riders,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.bannRider = [
  body("riderId").not().isEmpty().withMessage("Rider Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { riderId } = req.body;

      const rider = await Rider.findOne({ _id: riderId });
      if (!rider) {
        return res.status(404).json({
          status: false,
          message: "Rider not Found!",
        });
      }
      await Rider.findByIdAndUpdate(riderId, { active: false });

      res.status(200).json({
        status: true,
        message: "Rider banned!",
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.changeRiderRole = [
  body("riderId").not().isEmpty().withMessage("Rider Id is required"),
  body("riderRole").not().isEmpty().withMessage("Rider role is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { riderId, riderRole } = req.body;

      const rider = await Rider.findOne({ _id: riderId });
      if (!rider) {
        return res.status(404).json({
          status: false,
          message: "Rider not Found!",
        });
      }
      if (rider.currentOrder) {
        return res.status(404).json({
          status: false,
          message: "Cannot change role while an order is assigned!",
        });
      }
      rider.role = riderRole;
      if (riderRole === "productdelivery") rider.orderModel = "Porder";
      else if (riderRole === "grocerydelivery") rider.orderModel = "Gorder";
      else if (riderRole === "fooddelivery") rider.orderModel = "Forder";
      await rider.save();

      res.status(200).json({
        status: true,
        message: "Rider role updated!",
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

// ---------------ORDERS
exports.getAllPorders = async (req, res) => {
  try {
    let orders, count;
    orders = await Porder.find();
    count = await Porder.find().countDocuments();
    res.status(200).json({
      status: true,
      totalData: count,
      orders: orders,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getAllGorders = async (req, res) => {
  try {
    let orders, count;
    orders = await Gorder.find();
    count = await Gorder.find().countDocuments();
    res.status(200).json({
      status: true,
      totalData: count,
      orders: orders,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getAllOrdersByVendor = async (req, res) => {
  try {
    if (!req.query.id) {
      return res.status(400).json({
        status: false,
        message: "Vendor Id required in params",
      });
    }
    const vendor = await Vendor.findOne({ _id: req.query.id });
    if (!vendor) {
      return res.status(404).json({
        status: false,
        message: "Vendor not Found!",
      });
    }
    if (req.query.limit > 100 || req.query.limit < 1) {
      return res.status(403).json({
        status: true,
        message: "Limit must be between 1-100",
      });
    }
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 10);
    let sort = req.query.sort ? req.query.sort : "new";
    let status = req.query.status;
    let skipValue = (page - 1) * limit;
    let sortBy = -1;
    if (sort === "old") sortBy = 1;

    let orders, count;
    if (status && status.length > 0) {
      orders = await Porder.find({
        $and: [{ vendor: vendor._id }, { status: status.toUpperCase() }],
      })
        .populate("bill")
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Porder.find({
        $and: [{ vendor: vendor._id }, { status: status.toUpperCase() }],
      }).countDocuments();
    } else {
      orders = await Porder.find({ vendor: vendor._id })
        .populate("bill")
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Porder.find({ vendor: vendor._id }).countDocuments();
    }

    res.status(200).json({
      status: true,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
      orders: orders,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getAllOrdersByGrocer = async (req, res) => {
  try {
    if (!req.query.id) {
      return res.status(400).json({
        status: false,
        message: "Grocer Id required in params",
      });
    }
    const grocer = await Grocer.findOne({ _id: req.query.id });
    if (!grocer) {
      return res.status(404).json({
        status: false,
        message: "Grocer not Found!",
      });
    }
    if (req.query.limit > 100 || req.query.limit < 1) {
      return res.status(403).json({
        status: true,
        message: "Limit must be between 1-100",
      });
    }
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 10);
    let sort = req.query.sort ? req.query.sort : "new";
    let status = req.query.status;
    let skipValue = (page - 1) * limit;
    let sortBy = -1;
    if (sort === "old") sortBy = 1;

    let orders, count;
    if (status && status.length > 0) {
      orders = await Gorder.find({
        $and: [{ grocer: grocer._id }, { status: status.toUpperCase() }],
      })
        .populate("groceryBill")
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Gorder.find({
        $and: [{ grocer: grocer._id }, { status: status.toUpperCase() }],
      }).countDocuments();
    } else {
      orders = await Gorder.find({ grocer: grocer._id })
        .populate("groceryBill")
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Gorder.find({ grocer: grocer._id }).countDocuments();
    }

    res.status(200).json({
      status: true,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
      orders: orders,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getTransportRequests = async (req, res) => {
  try {
    if (req.query.limit > 100 || req.query.limit < 1) {
      return res.status(403).json({
        status: true,
        message: "Limit must be between 1-100",
      });
    }
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 10);
    let sort = req.query.sort ? req.query.sort : "new";
    let status = req.query.status;
    let skipValue = (page - 1) * limit;
    let sortBy = -1;
    if (sort === "old") sortBy = 1;

    let requests, count;
    if (status && status.length > 0) {
      requests = await Torder.find({ status: status.toUpperCase() })
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Torder.find({
        status: status.toUpperCase(),
      }).countDocuments();
    } else {
      requests = await Torder.find()
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Torder.find().countDocuments();
    }

    res.status(200).json({
      status: true,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
      requests: requests,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.deleteTransportRequests = async (req, res) => {
  try {
    let tId = req.body.transportId;
    if (!tId) {
      return res.status(403).json({
        status: false,
        message: "Transport Id is required",
      });
    }
    const transport = await Torder.findOne({ _id: tId });

    if (!transport) {
      return res.status(404).json({
        status: false,
        message: "Transport Request not Found!",
      });
    }

    await Torder.findOneAndDelete({ _id: transport._id });

    res.status(200).json({
      status: true,
      message: "Transport Request deleted successfully",
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.asignOrderToRider = [
  body("riderId").not().isEmpty().withMessage("Rider Id is required"),
  body("orderId").not().isEmpty().withMessage("Order Id is required"),
  body("orderModel")
    .not()
    .isEmpty()
    .withMessage("Order Model is required (Porder, Gorder, Forder)"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "fail",
        errors: errors.array(),
      });
    }

    try {
      const { riderId, orderId, orderModel } = req.body;

      if (
        orderModel !== "Porder" &&
        orderModel !== "Gorder" &&
        orderModel !== "Forder"
      ) {
        return res.status(404).json({
          status: false,
          message: "Order Model does not exists! (Porder, Gorder, Forder)",
        });
      }

      const riderExists = await Rider.findOne({ _id: riderId });
      if (!riderExists) {
        return res.status(404).json({
          status: false,
          message: "Rider not Found!",
        });
      }
      let Model = Porder;
      if (orderModel === "Gorder") Model = Gorder;
      if (orderModel === "Forder") Model = Forder;

      const orderExists = await Model.findOne({ _id: orderId });
      if (!orderExists) {
        return res.status(404).json({
          status: false,
          message: "Order not Found!",
        });
      }

      orderExists.rider = riderId;
      await orderExists.save();
      riderExists.currentOrder = orderId;
      riderExists.orderModel = orderModel;
      await riderExists.save();

      res.status(200).json({
        status: true,
        message: "Order assigned",
        orderExists,
        riderExists,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.getAllForders = async (req, res) => {
  try {
    const fOrders = await Forder.find();
    res.send({
      status: true,
      forders: fOrders,
    });
  } catch (err) {
    console.log(err.message);
  }
};

exports.createBanner = [
  body("mediaLink").not().isEmpty().withMessage("Media Link is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { mediaLink, no, link } = req.body;
      const banner = await Banner.create({ mediaLink, no, link });
      res.status(200).json({ status: true, message: "Banner Created", banner });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.deleteBanner = [
  query("id").not().isEmpty().withMessage("id Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { id } = req.query;
      const banner = await Banner.findByIdAndDelete(id);
      await deleteFile(banner._doc.mediaLink);
      res
        .status(200)
        .json({ status: true, message: "Banner deleted successfully" });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];
