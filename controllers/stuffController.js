const Stuff = require("../models/stuffModel");
const Type = require("../models/typeModel");
const Shopper = require("../models/shopperModel");
const Grocer = require("../models/grocerModel");

const { body, validationResult } = require("express-validator");
const { throwErrorMessage } = require("../utils/errorHelper");

exports.addStuff = [
  body("type").not().isEmpty().withMessage("Sub Category Feild is required"),
  body("price").not().isEmpty().withMessage("Price is required"),
  body("state").not().isEmpty().withMessage("State is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array(),
      });
    }
    try {
      let { type, groceryTitle, groceryDescription, images, price, state } =
        req.body;

      let typeExists = await Type.findOne({ _id: type });

      if (!typeExists) {
        return res.status(404).json({
          status: false,
          message: "Grocery Type not found!",
        });
      }

      const grocery = await Stuff.create({
        grocer: req.user._id,
        type: type,
        groceryTitle: groceryTitle,
        groceryDescription: groceryDescription,
        images: images,
        price: price,
        state: state,
      });

      res.status(201).json({
        status: true,
        grocery: grocery,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.editStuff = [
  body("stuffId").not().isEmpty().withMessage("Stuff Id is required"),
  body("type").not().isEmpty().withMessage("Type Feild is required"),
  body("groceryTitle").not().isEmpty().withMessage("Title is required"),
  body("groceryDescription")
    .not()
    .isEmpty()
    .withMessage("Description is required"),
  body("price").not().isEmpty().withMessage("Price is required"),
  body("state").not().isEmpty().withMessage("State is required"),

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
        stuffId,
        type,
        groceryTitle,
        groceryDescription,
        images,
        price,
        state,
      } = req.body;

      let stuff = await Stuff.findOne({ _id: stuffId });

      if (!stuff) {
        return res.status(404).json({
          status: false,
          message: "Stuff not found!",
        });
      }

      let typeExists = await Type.findOne({ _id: type });

      if (!typeExists) {
        return res.status(404).json({
          status: false,
          message: "type not found!",
        });
      }

      if (stuff.grocer._id.toString() === req.user._id.toString()) {
        stuff.type = type;
        stuff.groceryTitle = groceryTitle;
        stuff.groceryDescription = groceryDescription;
        stuff.images = images;
        stuff.price = price;
        stuff.state = state;

        await stuff.save();

        res.status(200).json({
          status: true,
          message: "Grocery updated successfully!",
        });
      } else {
        res.status(403).json({
          status: false,
          message: "You are not allowed to edit other's grocery",
        });
      }
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.deleteStuff = [
  body("stuffId").not().isEmpty().withMessage("Stuff Id Feild is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array(),
      });
    }

    let { stuffId } = req.body;
    try {
      const stuff = await Stuff.findOne({ _id: stuffId });
      if (!stuff) {
        return res.status(404).json({
          status: false,
          message: "Grocery not found!",
        });
      }

      if (stuff.grocer._id.toString() === req.user._id.toString()) {
        await Stuff.findByIdAndDelete({ _id: stuff._id });

        res.status(200).json({
          status: true,
          message: "Grocery Deleted!",
        });
      } else {
        res.status(403).json({
          status: false,
          message: "You are not allowed to delete other's grocery",
        });
      }
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.toggleAvailability = [
  body("stuffId").not().isEmpty().withMessage("Stuff Id Feild is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array(),
      });
    }

    let { stuffId } = req.body;
    try {
      const stuff = await Stuff.findOne({ _id: stuffId });
      if (!stuff) {
        return res.status(404).json({
          status: false,
          message: "Grocery not found!",
        });
      }

      if (stuff.grocer._id.toString() === req.user._id.toString()) {
        await Stuff.findById(stuff._id);
        if (stuff.availability === undefined || stuff.availability === false) {
          stuff.availability = true;
          stuff.save();
        } else {
          stuff.availability = false;
          stuff.save();
        }
        res.status(200).json({
          status: true,
          message: "Grocery avaiilability changed!",
        });
      } else {
        res.status(403).json({
          status: false,
          message:
            "You are not allowed to change availability of other's grocery",
        });
      }
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.getStuffById = async (req, res) => {
  try {
    if (!req.query.id) {
      return res.status(400).json({
        status: false,
        message: "Stuff Id required in query parameter!",
      });
    }

    const stuff = await Stuff.findOne({ _id: req.query.id });

    if (!stuff) {
      return res.status(404).json({
        status: false,
        message: "Stuff not found!",
      });
    }

    res.status(200).json({
      status: true,
      stuff: stuff,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getAllMyStuffs = async (req, res) => {
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
    const stuffs = await Stuff.find({ grocer: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skipValue)
      .limit(limit);
    const count = await Stuff.find({ grocer: req.user._id }).countDocuments();

    res.status(200).json({
      status: true,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
      stuffs: stuffs,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getBestDealStuffs = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    const limit = 10;
    let skipValue = (page - 1) * limit;

    const stuffs = await Stuff.find({ isBestDeal: true })
      .skip(skipValue)
      .limit(limit);
    const count = await Stuff.find({ isBestDeal: true }).countDocuments();

    res.status(200).json({
      status: true,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
      bDStuffs: stuffs,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getStuffByGrocer = async (req, res) => {
  try {
    // if (req.query.limit > 100 || req.query.limit < 1) {
    //   return res.status(403).json({
    //     status: false,
    //     message: "Limit must be between 1-100",
    //   });
    // }
    if (!req.query.grocerId) {
      return res.status(403).json({
        status: false,
        message: "Grocer Id required in query",
      });
    }
    // let page = parseInt(req.query.page ? req.query.page : 1);
    // let limit = parseInt(req.query.limit ? req.query.limit : 10);
    // let sort = req.query.sort ? req.query.sort : "new";
    // let skipValue = (page - 1) * limit;
    // let sortBy = -1;
    // if (sort === "old") sortBy = 1;
    let stuffs, count;

    let grocer = await Grocer.findById(req.query.grocerId);
    if (!grocer) {
      return res.status(403).json({
        status: false,
        message: "Grocer Not Found!",
      });
    }

    stuffs = await Stuff.find({ grocer: grocer._id })
    //   .sort({ createdAt: sortBy })
    //   .skip(skipValue)
    //   .limit(limit);
    // count = await Stuff.find({ grocer: grocer._id }).countDocuments();

    res.status(200).json({
      status: true,
      totalData: stuffs.length,
      // totalPage: Math.ceil(count / limit),
      // perPage: limit,
      // currentPage: page,
      stuffs: stuffs,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

// ----------GET ALL STUFFS SORTED AS LATEST FIRST BY DEFAULT
exports.getAllStuffs = async (req, res) => {
  try {
    if (req.query.limit > 100 || req.query.limit < 1) {
      return res.status(403).json({
        status: false,
        message: "Limit must be between 1-100",
      });
    }
    let count = 0;
    let sort = req.query.sort ? req.query.sort : "new";
    let limit = parseInt(req.query.limit ? req.query.limit : 10);
    let search = req.query.search ? req.query.search : "";
    let page = parseInt(req.query.page ? req.query.page : 1);
    let skipValue = (page - 1) * limit;
    let sortBy = -1;
    if (sort === "old") sortBy = 1;

    let stuffs = [];
    if (search && search.length > 0) {
      stuffs = await Stuff.find({
        $or: [
          { groceryTitle: { $regex: new RegExp(search, "i") } },
          { groceryDescription: { $regex: new RegExp(search, "i") } },
        ],
      })
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Stuff.find({
        $or: [
          { groceryTitle: { $regex: new RegExp(search, "i") } },
          { groceryDescription: { $regex: new RegExp(search, "i") } },
        ],
      }).countDocuments();
    }
    if (!search || search.length <= 0) {
      stuffs = await Stuff.find()
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);
      count = await Stuff.find().countDocuments();
    }
    res.status(200).json({
      status: true,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
      stuffs: stuffs,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

// -----------GET STUFF BY TYPE
exports.getStuffByType = async (req, res) => {
  try {
    if (req.query.limit > 100 || req.query.limit < 1) {
      return res.status(403).json({
        status: false,
        message: "Limit must be between 1-100",
      });
    }
    if (!req.query.typeId) {
      return res.status(403).json({
        status: false,
        message: "Type id required in query",
      });
    }
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 10);
    let sort = req.query.sort ? req.query.sort : "new";
    let skipValue = (page - 1) * limit;
    let sortBy = -1;
    if (sort === "old") sortBy = 1;
    let stuffs, count;

    let type = await Type.findById(req.query.typeId);
    if (!type) {
      return res.status(403).json({
        status: false,
        message: "Type Not Found!",
      });
    }

    stuffs = await Stuff.find({ type: type._id })
      .sort({ createdAt: sortBy })
      .skip(skipValue)
      .limit(limit);
    count = await Stuff.find({ type: type._id }).countDocuments();

    res.status(200).json({
      status: true,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
      stuffs: stuffs,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};
