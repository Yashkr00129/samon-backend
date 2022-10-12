const Type = require("../models/typeModel");
const Stuff = require("../models/stuffModel");
const Grocer = require("../models/grocerModel");

const { body, validationResult } = require("express-validator");
const { throwErrorMessage } = require("../utils/errorHelper");

exports.addType = [
  body("name").not().isEmpty().withMessage("Name is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { name, image, keywords } = req.body;

      const type = await Type.findOne({
        name: name.toLowerCase().trim(),
      });
      if (type) {
        return res.status(409).json({
          status: false,
          message: "Type Name already exists",
        });
      }
      const createdType = await Type.create({
        name: name,
        image: image,
        keywords: keywords,
      });

      res.status(200).json({
        status: true,
        message: "Type created",
        type: createdType,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.getAllType = async (req, res) => {
  try {
    const types = await Type.find({ active: { $ne: false } });

    res.status(200).json({
      status: true,
      types: types,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.updateType = [
  body("id").not().isEmpty().withMessage("Type Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { id, name, image, keywords } = req.body;

      const type = await Type.findOne({
        $and: [{ _id: id }, { active: { $ne: false } }],
      });
      if (!type) {
        return res.status(404).json({
          status: false,
          message: "Type not found",
        });
      }
      type.name = name ? name : type.name;
      type.image = image ? image : type.image;
      type.keywords = keywords ? keywords : type.keywords;

      await type.save();

      res.status(200).json({
        status: true,
        message: "Type Updated",
        type: type,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.deleteType = [
  body("id").not().isEmpty().withMessage("Type Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { id } = req.body;

      const type = await Type.findOne({ _id: id });
      if (!type) {
        return res.status(404).json({
          status: false,
          message: "Type not found",
        });
      }

      type.active = false;
      await type.save();

      res.status(200).json({
        status: true,
        message: "Type deleted",
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.getGrocersByType = [
  body("typeId").not().isEmpty().withMessage("Type Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { typeId } = req.body;
      const type = await Type.findOne({
        $and: [{ _id: typeId }, { active: { $ne: false } }],
      });
      if (!type) {
        return res.status(404).json({
          status: true,
          message: "Type not found!",
        });
      }

      let grocers = [];
      const stuffs = await Stuff.find(
        { type: type._id },
        { grocer: 1 }
      ).populate("grocer");
      for (let stuff of stuffs) {
        if (stuff.grocer) {
          grocers.push(stuff.grocer);
        }
      }

      grocers = grocers.filter(
        (a, i) =>
          grocers.findIndex(
            (s) => a.adhaarCardNumber === s.adhaarCardNumber
          ) === i
      );
      res.status(200).json({
        status: true,
        grocers: grocers,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.getTypeByGrocer = async (req, res) => {
  try {
    if (!req.query.grocerId) {
      return res.status(403).json({
        status: false,
        message: "grocerId required in Params",
      });
    }
    const grocerId = req.query.grocerId;

    const grocer = await Grocer.findOne({ _id: grocerId });

    if (!grocer) {
      return res.status(404).json({
        status: false,
        message: "Grocer not found!",
      });
    }

    const allTypes = await Type.find({});

    const allStuffs = await Stuff.find({ grocer: grocerId });

    let types = [];
    for (let i = 0; i < allTypes.length; i++) {
      for (let j = 0; j < allStuffs.length; j++) {
        if (allStuffs[j].type._id.toString() === allTypes[i]._id.toString()) {
          types.push(allTypes[i]);
          break;
        }
      }
    }

    res.status(200).json({
      status: true,
      types: types,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};
