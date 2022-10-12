const Menu = require("../models/menuModel");

const { body, validationResult } = require("express-validator");
const { throwErrorMessage } = require("../utils/errorHelper");
const Dish = require("../models/dishModel");
const Restaurant = require("../models/restaurantModel");

exports.addMenu = [
  body("menuTitle").not().isEmpty().withMessage("menu Title is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { menuTitle, description } = req.body;

      const createdMenu = await Menu.create({
        restaurant: req.user._id,
        menuTitle: menuTitle,
        description: description,
      });

      res.status(200).json({
        status: true,
        message: "Menu created",
        menu: createdMenu,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.addDishToMenu = [
  body("menuId").not().isEmpty().withMessage("Dish name is required"),
  body("dishName").not().isEmpty().withMessage("Dish name is required"),
  body("price").not().isEmpty().withMessage("Dish price is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { menuId, dishName, images, price, description, veg } = req.body;

      const menu = await Menu.findOne({
        $and: [{ restaurant: req.user._id }, { _id: menuId }],
      });
      if (!menu) {
        return res.status(404).json({
          status: false,
          message: "Menu not Found!",
        });
      }

      const createdDish = await Dish.create({
        restaurant: req.user._id,
        dishName: dishName,
        images: images,
        price: price,
        description: description,
        veg: veg ? true : false,
      });

      const menuCard = await Menu.findOneAndUpdate(
        { _id: menu._id },
        { $push: { dishes: createdDish._id } },
        { new: true }
      );

      res.status(200).json({
        status: true,
        message: "Dish added",
        menu: menuCard,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.removeDishFromMenu = [
  body("menuId").not().isEmpty().withMessage("Dish name is required"),
  body("dishId").not().isEmpty().withMessage("Dish name is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { menuId, dishId } = req.body;

      const menu = await Menu.findOne({
        $and: [{ restaurant: req.user._id }, { _id: menuId }],
      });
      if (!menu) {
        return res.status(404).json({
          status: false,
          message: "Menu not Found!",
        });
      }
      let found = false;
      let dishes = [];
      for (let i = 0; i < menu.dishes.length; i++) {
        if (menu.dishes[i].toString() === dishId.toString()) found = true;
        else dishes.push(menu.dishes[i]);
      }

      if (!found) {
        return res.status(404).json({
          status: false,
          message: "Dish not found in that menu",
        });
      }

      menu.dishes = dishes;
      await menu.save();

      res.status(200).json({
        status: true,
        message: "Dish removed",
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.getMenu = async (req, res) => {
  try {
    const id = req.query.id;
    if (!req.query.id) {
      return res.status(400).json({
        status: false,
        message: "Menu Id required in query",
      });
    }
    const menu = await Menu.findOne({ _id: id }).populate("dishes");
    if (!menu) {
      return res.status(404).json({
        status: false,
        message: "Menu not Found!",
      });
    }

    res.status(200).json({
      status: true,
      menu: menu,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getAllMyMenus = async (req, res) => {
  try {
    const menus = await Menu.find({ restaurant: req.user._id }).populate(
      "dishes"
    );

    res.status(200).json({
      status: true,
      menus: menus,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getMenusByRestaurant = 
  async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      let restaurant = await Restaurant.findById(req.query.restaurantId);
      if (!restaurant) {
        return res.status(403).json({
          status: false,
          message: "Restaurant Not Found!",
        });
      }

      const menus = await Menu.find({ restaurant: restaurant._id }).populate("dishes");
      let count = menus.length;
  
      res.status(200).json({
        status: true,
        totalData: count,
        menus: menus,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  };

exports.updateMenu = [
  body("menuId").not().isEmpty().withMessage("Menu Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { menuId, menuTitle, description } = req.body;

      const menu = await Menu.findOne({
        $and: [{ restaurant: req.user._id }, { _id: menuId }],
      });
      if (!menu) {
        return res.status(404).json({
          status: false,
          message: "Menu not found",
        });
      }
      menu.menuTitle = menuTitle;
      menu.description = description;

      await menu.save();

      res.status(200).json({
        status: true,
        message: "Menu Updated",
        menu: menu,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.deleteMenu = [
  body("menuId").not().isEmpty().withMessage("Category Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { menuId } = req.body;

      const menu = await Menu.findOne({
        $and: [{ restaurant: req.user._id }, { _id: menuId }],
      });

      if (!menu) {
        return res.status(404).json({
          status: false,
          message: "Menu not found",
        });
      }

      await Menu.findByIdAndDelete(menuId);

      res.status(200).json({
        status: true,
        message: "Menu deleted",
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];
