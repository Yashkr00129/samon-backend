const Dish = require("../models/dishModel");

const { throwErrorMessage } = require("../utils/errorHelper");
const { body, validationResult } = require("express-validator");

exports.getAllDishes = async (req, res) => {
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

    let dishes = [], count = 0;
    if (search && search.length > 0) {
      dishes = await Dish.find({
        $or: [
          { dishName: { $regex: new RegExp(search, "i") } },
          { description: { $regex: new RegExp(search, "i") } },
        ],
      })
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Dish.find({
        $or: [
          { dishName: { $regex: new RegExp(search, "i") } },
          { description: { $regex: new RegExp(search, "i") } },
        ],
      }).countDocuments();
    }
    if (!search || search.length <= 0) {
      dishes = await Dish.find()
        .sort({ createdAt: sortBy })
        .skip(skipValue)
        .limit(limit);

      count = await Dish.find().countDocuments();
    }

    res.status(200).json({
      status: true,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
      dishes: dishes,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.toggleDishAvailability = [
  body("dishId").not().isEmpty().withMessage("Dish Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { dishId } = req.body;
      const dish = await Dish.findOne({ _id: dishId });
      if (!dish) {
        return res.status(404).json({
          status: false,
          message: "Dish not Found!",
        });
      }
      if (dish.restaurant.toString() === req.user._id.toString()) {
      dish.available = !dish.available;
      } else {
        res.status(403).json({
          status: false,
          message: "You are not allowed to edit others' dishes.",
        });
      }
      await dish.save();

      res.status(200).json({
        status: true,
        message: "Dish's availability status successfully updated!",
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];