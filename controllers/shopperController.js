const Shopper = require("../models/shopperModel");
const Cart = require("../models/cartModel");
const Vendor = require("../models/vendorModel");
const Grocer = require("../models/grocerModel");
const Restaurant = require("../models/restaurantModel");
const GroceryCart = require("../models/groceryCartModel");
const FoodCart = require("../models/foodCartModel");
const Wishlist = require("../models/wishlistModel");
const Product = require("../models/productModel");
const Stuff = require("../models/stuffModel");
const Dish = require("../models/dishModel");
const Address = require("../models/addressModel");
const Bill = require("../models/billModel");
const GroceryBill = require("../models/groceryBillModel");
const FoodBill = require("../models/foodBillModel");
const Porder = require("../models/porderModel");
const Gorder = require("../models/gorderModel");
const Forder = require("../models/forderModel");
const Torder = require("../models/torderModel");
const Region = require("../models/regionModel");
const crypto = require("crypto");

const { throwErrorMessage } = require("../utils/errorHelper");
const { body, validationResult } = require("express-validator");
const Order = require("../models/orderModel");
const { sendOrderNotification } = require("../utils/pushNotification");

exports.addToCart = [
  body("productId").not().isEmpty().withMessage("Product Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { productId, quantity } = req.body;

      const product = await Product.findOne({ _id: productId });
      if (!product) {
        return res.status(404).json({
          status: false,
          message: "Product not Found!",
        });
      }
      const cart = await Cart.findOne({ shopper: req.user._id }).populate(
        "products.product"
      );
      if (cart) {
        let cartArr = cart.products;
        let notFound = true;
        for (let i = 0; i < cartArr.length; i++) {
          if (
            cartArr[i].product.vendor?.toString() !== product.vendor?.toString()
          ) {
            return res.status(404).json({
              status: false,
              message:
                "You have products from another seller in your cart! Please clear your cart to add this product.",
            });
          }
        }
        for (let i = 0; i < cartArr.length; i++) {
          if (cartArr[i].product._id.toString() === productId.toString()) {
            cartArr[i].quantity =
              cartArr[i].quantity +
              (quantity ? parseInt(quantity) : parseInt(1));
            notFound = false;
            break;
          }
        }
        if (notFound) {
          cartArr.push({ product: productId, quantity: quantity || 1 });
        }
        cart.products = cartArr;
        cart.save();
        if (!notFound) {
          return res.status(200).json({
            status: true,
            message: "Product Quantity increased in Cart",
            cart: cart.products,
          });
        }
        return res.status(200).json({
          status: true,
          message: "Added to Cart",
          cart: cart.products,
        });
      }

      const newCart = await Cart.create({
        shopper: req.user._id,
        products: [{ product: productId, quantity: quantity || 1 }],
      });

      res.status(200).json({
        status: true,
        message: "Added to Cart",
        cart: newCart.products,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.incQuantity = [
  body("productId").not().isEmpty().withMessage("Product Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { productId } = req.body;

      const cart = await Cart.findOne({ shopper: req.user._id });
      if (!cart || (cart && cart.products.length === 0)) {
        return res.status(404).json({
          status: false,
          message: "Product not Found in Your Cart!",
        });
      }

      let notFound = true;
      for (let i = 0; i < cart.products.length; i++) {
        if (cart.products[i].product._id.toString() === productId.toString()) {
          cart.products[i].quantity = cart.products[i].quantity + 1;
          notFound = false;
        }
      }
      if (notFound) {
        return res.status(404).json({
          status: false,
          message: "Product not Found in Your Cart!",
        });
      }
      await cart.save();

      res.status(200).json({
        status: true,
        message: "Quantity Increased!",
        cart: cart,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.decQuantity = [
  body("productId").not().isEmpty().withMessage("Product Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { productId } = req.body;

      const cart = await Cart.findOne({ shopper: req.user._id });
      if (!cart || (cart && cart.products.length === 0)) {
        return res.status(404).json({
          status: false,
          message: "Product not Found in You Cart!",
        });
      }

      let notFound = true;
      for (let i = 0; i < cart.products.length; i++) {
        if (cart.products[i].product._id.toString() === productId.toString()) {
          if (cart.products[i].quantity === 1) {
            cart.products.splice(i, 1);
            ``;
            await cart.save();
            return res.status(200).json({
              status: true,
              message: "Removed from Cart!",
              cart: cart,
            });
          }
          cart.products[i].quantity = cart.products[i].quantity - 1;
          notFound = false;
        }
      }
      if (notFound) {
        return res.status(404).json({
          status: false,
          message: "Product not Found in You Cart!",
        });
      }
      await cart.save();

      res.status(200).json({
        status: true,
        message: "Quantity Decreased!",
        cart: cart,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.removeFromCart = [
  body("productId").not().isEmpty().withMessage("Product Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { productId } = req.body;

      const product = await Product.findOne({ _id: productId });
      if (!product) {
        return res.status(404).json({
          status: false,
          message: "Product not Found!",
        });
      }
      const cart = await Cart.findOne({ shopper: req.user._id });
      if (!cart) {
        return res.status(200).json({
          status: true,
          message: "This product is not present in the cart!",
        });
      }

      // IF NOT IN CART, CAN'T ADD IN CART ELSE ADD
      if (
        cart.products !== null &&
        cart.products !== undefined &&
        cart.products.length > 0
      ) {
        let present = false;
        cart.products.forEach((prd) => {
          if (prd.product.toString() === productId.toString()) {
            present = true;
          }
        });
        if (present) {
          var filtered = cart.products.filter(function (prd) {
            return prd.product.toString() !== productId.toString();
          });
          cart.products = filtered;

          await cart.save();
          return res.status(200).json({
            status: true,
            message: "Removed from cart",
          });
        }
        if (!present) {
          return res.status(403).json({
            status: false,
            message: "This product is not present in the cart!",
          });
        }
      } else {
        return res.status(200).json({
          status: false,
          message: "This product is not present in the cart!",
        });
      }
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.getMyCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ shopper: req.user._id }).populate([
      { path: "products.product" },
      { path: "shopper" },
    ]);
    if (!cart) {
      return res.status(200).json({
        status: true,
        cart: [],
      });
    }

    res.status(200).json({
      status: true,
      cart: cart,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.addToGroceryCart = [
  body("stuffId").not().isEmpty().withMessage("Stuff Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { stuffId, quantity } = req.body;
      const stuff = await Stuff.findOne({ _id: stuffId });
      if (!stuff) {
        return res.status(404).json({
          status: false,
          message: "Item not Found!",
        });
      }
      const groceryCart = await GroceryCart.findOne({
        shopper: req.user._id,
      }).populate("stuffs.stuff");
      if (groceryCart) {
        let groceryCartArr = groceryCart.stuffs;
        let notFound = true;
        for (let i = 0; i < groceryCartArr.length; i++) {
          if (
            groceryCartArr[i].stuff.grocer?.toString() !==
            stuff.grocer?.toString()
          ) {
            return res.status(404).json({
              status: false,
              message:
                "You have items from other sellers in your cart! Please clear your cart first to add this item.",
            });
          }
        }
        for (let i = 0; i < groceryCartArr.length; i++) {
          if (groceryCartArr[i].stuff._id.toString() === stuffId.toString()) {
            groceryCartArr[i].quantity =
              groceryCartArr[i].quantity +
              (quantity ? parseInt(quantity) : parseInt(1));
            notFound = false;
            break;
          }
        }
        if (notFound) {
          groceryCartArr.push({ stuff: stuffId, quantity: quantity || 1 });
        }
        groceryCart.stuffs = groceryCartArr;
        groceryCart.save();
        if (!notFound) {
          return res.status(200).json({
            status: true,
            message: "Item Quantity increased in Grocery Cart",
            groceryCart: groceryCart.stuffs,
          });
        }
        return res.status(200).json({
          status: true,
          message: "Added to Cart",
          groceryCart: groceryCart.stuffs,
        });
      }

      const newGroceryCart = await GroceryCart.create({
        shopper: req.user._id,
        stuffs: [{ stuff: stuffId, quantity: quantity || 1 }],
      });

      res.status(200).json({
        status: true,
        message: "Added to Cart",
        groceryCart: newGroceryCart.stuffs,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.incQuantityGrocery = [
  body("stuffId").not().isEmpty().withMessage("Stuff Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { stuffId } = req.body;

      const groceryCart = await GroceryCart.findOne({ shopper: req.user._id });
      if (!groceryCart || (groceryCart && groceryCart.stuffs.length === 0)) {
        return res.status(404).json({
          status: false,
          message: "Item not Found in Your Cart!",
        });
      }

      let notFound = true;
      for (let i = 0; i < groceryCart.stuffs.length; i++) {
        if (groceryCart.stuffs[i].stuff._id.toString() === stuffId.toString()) {
          groceryCart.stuffs[i].quantity = groceryCart.stuffs[i].quantity + 1;
          notFound = false;
        }
      }
      if (notFound) {
        return res.status(404).json({
          status: false,
          message: "Item not Found in Your Cart!",
        });
      }
      await groceryCart.save();

      res.status(200).json({
        status: true,
        message: "Quantity Increased!",
        groceryCart: groceryCart,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.decQuantityGrocery = [
  body("stuffId").not().isEmpty().withMessage("Stuff Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { stuffId } = req.body;

      const groceryCart = await GroceryCart.findOne({ shopper: req.user._id });
      if (!groceryCart || (groceryCart && groceryCart.stuffs.length === 0)) {
        return res.status(404).json({
          status: false,
          message: "Item not Found in Your Cart!",
        });
      }

      let notFound = true;
      for (let i = 0; i < groceryCart.stuffs.length; i++) {
        if (groceryCart.stuffs[i].stuff._id.toString() === stuffId.toString()) {
          if (groceryCart.stuffs[i].quantity === 1) {
            groceryCart.stuffs.splice(i, 1);
            await groceryCart.save();
            return res.status(200).json({
              status: true,
              message: "Removed from Cart!",
              groceryCart: groceryCart,
            });
          }
          groceryCart.stuffs[i].quantity = groceryCart.stuffs[i].quantity - 1;
          notFound = false;
        }
      }
      if (notFound) {
        return res.status(404).json({
          status: false,
          message: "Item not Found in Your Cart!",
        });
      }
      await groceryCart.save();

      res.status(200).json({
        status: true,
        message: "Quantity Decreased!",
        groceryCart: groceryCart,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.removeFromGroceryCart = [
  body("stuffId").not().isEmpty().withMessage("Stuff Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { stuffId } = req.body;

      const stuff = await Stuff.findOne({ _id: stuffId });
      if (!stuff) {
        return res.status(404).json({
          status: false,
          message: "Item not Found!",
        });
      }
      const groceryCart = await GroceryCart.findOne({ shopper: req.user._id });
      if (!groceryCart) {
        return res.status(200).json({
          status: true,
          message: "This item is not present in the cart!",
        });
      }

      // IF NOT IN CART, CAN'T ADD IN CART ELSE ADD
      if (
        groceryCart.stuffs !== null &&
        groceryCart.stuffs !== undefined &&
        groceryCart.stuffs.length > 0
      ) {
        let present = false;
        groceryCart.stuffs.forEach((stf) => {
          if (stf.stuff.toString() === stuffId.toString()) {
            present = true;
          }
        });
        if (present) {
          var filtered = groceryCart.stuffs.filter(function (stf) {
            return stf.stuff.toString() !== stuffId.toString();
          });
          groceryCart.stuffs = filtered;

          await groceryCart.save();
          return res.status(200).json({
            status: true,
            message: "Removed from grocery cart",
          });
        }
        if (!present) {
          return res.status(403).json({
            status: false,
            message: "This item is not present in the grocery cart!",
          });
        }
      } else {
        return res.status(200).json({
          status: false,
          message: "This item is not present in the grocery cart!",
        });
      }
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.getMyGroceryCart = async (req, res) => {
  try {
    const groceryCart = await GroceryCart.findOne({
      shopper: req.user._id,
    }).populate([
      { path: "stuffs.stuff" },
      { path: "stuffs.stuff.type" },
      { path: "shopper" },
    ]);
    if (!groceryCart) {
      return res.status(200).json({
        status: true,
        groceryCart: [],
      });
    }

    res.status(200).json({
      status: true,
      groceryCart: groceryCart,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.addToWishlist = [
  body("productId").not().isEmpty().withMessage("Product Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { productId } = req.body;

      const product = await Product.findOne({ _id: productId });
      if (!product) {
        return res.status(404).json({
          status: false,
          message: "Product not Found!",
        });
      }
      const wishlist = await Wishlist.findOne({ shopper: req.user._id });
      if (wishlist) {
        let wishlistArr = wishlist.products;
        wishlistArr.push(productId);
        wishlist.products = wishlistArr;
        wishlist.save();
        return res.status(200).json({
          status: true,
          message: "Added successfully",
          wishlist: wishlist.products,
        });
      }

      const newWishlist = await Wishlist.create({
        shopper: req.user._id,
        products: [productId],
      });

      res.status(200).json({
        status: true,
        message: "Added successfully",
        wishlist: newWishlist.products,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.removeFromWishlist = [
  body("productId").not().isEmpty().withMessage("Product Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { productId } = req.body;

      const product = await Product.findOne({ _id: productId });
      if (!product) {
        return res.status(404).json({
          status: false,
          message: "Product not Found!",
        });
      }
      const wishlist = await Wishlist.findOne({ shopper: req.user._id });
      if (!wishlist) {
        return res.status(200).json({
          status: true,
          message: "This product is not present in the Wishlist!",
        });
      }

      // IF NOT IN WISHLIST, CAN'T ADD IN WISHLIST ELSE ADD
      if (
        wishlist.products !== null &&
        wishlist.products !== undefined &&
        wishlist.products.length > 0
      ) {
        let present = false;
        wishlist.products.forEach((prd) => {
          if (prd.toString() === productId.toString()) {
            present = true;
          }
        });
        if (present) {
          var filtered = wishlist.products.filter(function (prd) {
            return prd.toString() !== productId.toString();
          });
          wishlist.products = filtered;

          await wishlist.save();
          return res.status(200).json({
            status: true,
            message: "Removed from Wishlist",
          });
        }
        if (!present) {
          return res.status(403).json({
            status: false,
            message: "This product is not present in the Wishlist!",
          });
        }
      } else {
        return res.status(200).json({
          status: false,
          message: "This product is not present in the Wishlist!",
        });
      }
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.getMyWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ shopper: req.user._id }).populate(
      "products"
    );
    if (!wishlist) {
      return res.status(200).json({
        status: true,
        wishlist: [],
      });
    }

    res.status(200).json({
      status: true,
      wishlist: wishlist.products,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.addToFoodCart = [
  body("dishId").not().isEmpty().withMessage("Dish Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { dishId, quantity } = req.body;
      const dish = await Dish.findOne({ _id: dishId });
      if (!dish) {
        return res.status(404).json({
          status: false,
          message: "Dish not Found!",
        });
      }
      const foodCart = await FoodCart.findOne({
        shopper: req.user._id,
      }).populate("dishes.dish");
      if (foodCart) {
        let foodCartArr = foodCart.dishes;
        let notFound = true;
        for (let i = 0; i < foodCartArr.length; i++) {
          if (
            foodCartArr[i].dish.restaurant?.toString() !==
            dish.restaurant?.toString()
          ) {
            return res.status(404).json({
              status: false,
              message:
                "You have food from other sellers in your cart! Please clear your cart first to add this item.",
            });
          }
        }
        for (let i = 0; i < foodCartArr.length; i++) {
          if (foodCartArr[i].dish._id.toString() === dishId.toString()) {
            foodCartArr[i].quantity =
              foodCartArr[i].quantity +
              (quantity ? parseInt(quantity) : parseInt(1));
            notFound = false;
            break;
          }
        }
        if (notFound) {
          foodCartArr.push({ dish: dishId, quantity: quantity || 1 });
        }
        foodCart.dishes = foodCartArr;
        foodCart.save();
        if (!notFound) {
          return res.status(200).json({
            status: true,
            message: "Item Quantity increased in Grocery Cart",
            foodCart: foodCart.dishes,
          });
        }
        return res.status(200).json({
          status: true,
          message: "Added to Cart",
          foodCart: foodCart.dishes,
        });
      }

      const newFoodCart = await FoodCart.create({
        shopper: req.user._id,
        dishes: [{ dish: dishId, quantity: quantity || 1 }],
      });

      res.status(200).json({
        status: true,
        message: "Added to Cart!",
        foodCart: newFoodCart.dishes,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.incFoodQuantity = [
  body("dishId").not().isEmpty().withMessage("Food Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { dishId } = req.body;

      const foodCart = await FoodCart.findOne({ shopper: req.user._id });
      if (!foodCart || (foodCart && foodCart.dishes.length === 0)) {
        return res.status(404).json({
          status: false,
          message: "Dish not Found in Your Cart!",
        });
      }

      let notFound = true;
      for (let i = 0; i < foodCart.dishes.length; i++) {
        if (foodCart.dishes[i].dish._id.toString() === dishId.toString()) {
          foodCart.dishes[i].quantity = foodCart.dishes[i].quantity + 1;
          notFound = false;
        }
      }
      if (notFound) {
        return res.status(404).json({
          status: false,
          message: "Product not Found in Your Cart!",
        });
      }
      await foodCart.save();

      res.status(200).json({
        status: true,
        message: "Quantity Increased!",
        cart: foodCart,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.decFoodQuantity = [
  body("dishId").not().isEmpty().withMessage("Dish Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { dishId } = req.body;

      const foodCart = await FoodCart.findOne({ shopper: req.user._id });
      if (!foodCart || (foodCart && foodCart.dishes.length === 0)) {
        return res.status(404).json({
          status: false,
          message: "Product not Found in You Cart!",
        });
      }

      let notFound = true;
      for (let i = 0; i < foodCart.dishes.length; i++) {
        if (foodCart.dishes[i].dish._id.toString() === dishId.toString()) {
          if (foodCart.dishes[i].quantity === 1) {
            foodCart.dishes.splice(i, 1);
            await foodCart.save();
            return res.status(200).json({
              status: true,
              message: "Removed from Cart!",
              cart: foodCart,
            });
          }
          foodCart.dishes[i].quantity = foodCart.dishes[i].quantity - 1;
          notFound = false;
        }
      }
      if (notFound) {
        return res.status(404).json({
          status: false,
          message: "Product not Found in You Cart!",
        });
      }
      await foodCart.save();

      res.status(200).json({
        status: true,
        message: "Quantity Decreased!",
        cart: foodCart,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.removeFromFoodCart = [
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
      const foodCart = await FoodCart.findOne({ shopper: req.user._id });
      if (!foodCart) {
        return res.status(200).json({
          status: true,
          message: "This dish is not present in the cart!",
        });
      }

      // IF NOT IN CART, CAN'T ADD IN CART ELSE ADD
      if (
        foodCart.dishes !== null &&
        foodCart.dishes !== undefined &&
        foodCart.dishes.length > 0
      ) {
        let present = false;
        foodCart.dishes.forEach((dsh) => {
          if (dsh.dish.toString() === dishId.toString()) {
            present = true;
          }
        });
        if (present) {
          var filtered = foodCart.dishes.filter(function (dsh) {
            return dsh.dish.toString() !== dishId.toString();
          });
          foodCart.dishes = filtered;

          await foodCart.save();
          return res.status(200).json({
            status: true,
            message: "Removed from cart",
          });
        }
        if (!present) {
          return res.status(403).json({
            status: false,
            message: "This dish is not present in the cart!",
          });
        }
      } else {
        return res.status(200).json({
          status: false,
          message: "This dish is not present in the cart!",
        });
      }
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.getMyFoodCart = async (req, res) => {
  try {
    const foodCart = await FoodCart.findOne({ shopper: req.user._id }).populate(
      [{ path: "dishes.dish" }, { path: "shopper" }]
    );
    if (!foodCart) {
      return res.status(200).json({
        status: true,
        cart: [],
      });
    }

    res.status(200).json({
      status: true,
      cart: foodCart,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

// -------PRODUCT ORDERS
exports.placeOrder = async (req, res) => {
  try {
    const addressId = req.user.selectedAddress;
    const transactionId = req.user.transactionId;

    const address = await Address.findOne({ _id: addressId }).populate(
      "region"
    );
    if (!address) {
      return res.status(404).json({
        status: true,
        message: "Select a default address first!",
      });
    }
    const cart = await Cart.findOne({ shopper: req.user._id }).populate(
      "products.product"
    );
    if (
      !cart ||
      !cart.products ||
      (cart.products && cart.products.length === 0)
    ) {
      return res.status(400).json({
        status: false,
        message: "Cart is Empty!",
      });
    }

    const bill = await Bill.create({
      shopper: req.user._id,
    });

    // let orders = [];
    let products = [];
    let totalPrice = 0;
    let orderId = crypto.randomBytes(16).toString("hex");
    for (let i = 0; i < cart.products.length; i++) {
      products.push({
        product: cart.products[i].product._id,
        quantity: cart.products[i].quantity,
      });
      totalPrice =
        totalPrice + cart.products[i].product.price * cart.products[i].quantity;
      // let order = await Porder.create({
      //   shopper: req.user._id,
      //   vendor: cart.products[i].product.vendor,
      //   address: address,
      //   orderId: orderId,
      //   quantity: cart.products[i].quantity,
      //   product: cart.products[i].product._id,
      //   bill: bill._id,
      // });
      // orders.push(order);
    }

    let order = await Porder.create({
      shopper: req.user._id,
      vendor: cart.products[0].product.vendor,
      address: address,
      orderId: orderId,
      bill: bill._id,
      products: products,
    });

    await Order.create({
      shopper: req.user._id,
      seller: cart.products[0].product.vendor,
      sellerModel: "Vendor",
      order: order._id,
      orderModel: "Porder",
    });

    const count = await Bill.find({
      shopper: req.user._id,
    }).countDocuments();

    const deliveryCharges =
      parseInt(address.region.baseDelivery) +
      parseInt(address.region.packagingCost);

    bill.totalPrice = totalPrice + deliveryCharges;
    bill.paidPrice = totalPrice;
    bill.products = products;
    bill.productOrdered = products.length;
    bill.orderNumber = count;
    bill.transactionId = transactionId;

    await bill.save();
    cart.delete();

    sendOrderNotification(
      cart.products[0].product.vendor,
      "vendor",
      orderId,
      req.user.fullName
    );

    res.status(201).json({
      status: true,
      message: "Order Placed",
      order: order,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

// exports.getMyOrders = async (req, res) => {
//   try {
//     let orders, gOrders, fOrders;
//     if (req.query.status) {
//       let sts = req.query.status.toUpperCase();
//       orders = await Porder.find({
//         $and: [{ shopper: req.user._id }, { status: sts }],
//       });
//       gOrders = await Gorder.find({
//         $and: [{ shopper: req.user._id }, { status: sts }],
//       });
//       fOrders = await Forder.find({
//         $and: [{ shopper: req.user._id }, { status: sts }],
//       });
//     } else {
//       orders = await Porder.find({ shopper: req.user._id });
//       gOrders = await Gorder.find({ shopper: req.user._id });
//       fOrders = await Forder.find({ shopper: req.user._id });
//     }

//     res.status(201).json({
//       status: true,
//       message: "Order",
//       orders: {
//         productsOrders: orders,
//         groceryOrders: gOrders,
//         foodOrders: fOrders,
//       },
//     });
//   } catch (err) {
//     throwErrorMessage(err, res);
//   }
// };

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ shopper: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      status: true,
      orders: orders,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

// -------GROCERY ORDERS
exports.placeGroceryOrder = async (req, res) => {
  try {
    const addressId = req.user.selectedAddress;
    const transactionId = req.user.transactionId;
    const address = await Address.findOne({ _id: addressId }).populate(
      "region"
    );
    if (!address) {
      return res.status(404).json({
        status: true,
        message: "Select a ddefault Address first!",
      });
    }
    const groceryCart = await GroceryCart.findOne({
      shopper: req.user._id,
    }).populate("stuffs.stuff");
    if (
      !groceryCart ||
      !groceryCart.stuffs ||
      (groceryCart.stuffs && groceryCart.stuffs.length === 0)
    ) {
      return res.status(400).json({
        status: false,
        message: "Grocery Cart is Empty!",
      });
    }

    const groceryBill = await GroceryBill.create({
      shopper: req.user._id,
    });

    // let orders = [];
    let stuffs = [];
    let totalPrice = 0;
    let orderId = crypto.randomBytes(16).toString("hex");
    for (let i = 0; i < groceryCart.stuffs.length; i++) {
      stuffs.push({
        stuff: groceryCart.stuffs[i].stuff._id,
        quantity: groceryCart.stuffs[i].quantity,
      });
      totalPrice =
        totalPrice +
        groceryCart.stuffs[i].stuff.price * groceryCart.stuffs[i].quantity;
      // let order = await Gorder.create({
      //   shopper: req.user._id,
      //   grocer: groceryCart.stuffs[i].stuff.grocer,
      //   address: address,
      //   orderId: orderId,
      //   quantity: groceryCart.stuffs[i].quantity,
      //   stuff: groceryCart.stuffs[i].stuff._id,
      //   groceryBill: groceryBill._id,
      // });
      // orders.push(order);
    }

    let order = await Gorder.create({
      shopper: req.user._id,
      grocer: groceryCart.stuffs[0].stuff.grocer,
      address: address,
      orderId: orderId,
      bill: groceryBill._id,
      stuffs: stuffs,
    });

    await Order.create({
      shopper: req.user._id,
      seller: groceryCart.stuffs[0].stuff.grocer,
      sellerModel: "Grocer",
      order: order._id,
      orderModel: "Gorder",
    });

    const count = await GroceryBill.find({
      shopper: req.user._id,
    }).countDocuments();

    const deliveryCharges =
      parseInt(address.region.baseDelivery) +
      parseInt(address.region.packagingCost);

    groceryBill.totalPrice = totalPrice + deliveryCharges;
    groceryBill.paidPrice = totalPrice;
    groceryBill.stuffs = stuffs;
    groceryBill.stuffOrdered = stuffs.length;
    groceryBill.orderNumber = count;
    groceryBill.transactionId = transactionId;

    await groceryBill.save();
    groceryCart.delete();

    sendOrderNotification(
      groceryCart.stuffs[0].stuff.grocer,
      "grocer",
      orderId,
      req.user.fullName
    );

    res.status(201).json({
      status: true,
      message: "Order Placed",
      order: order,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getMyGroceryOrders = async (req, res) => {
  try {
    let orders;
    if (req.query.status) {
      let sts = req.query.status.toUpperCase();
      orders = await Gorder.find({
        $and: [{ shopper: req.user._id }, { status: sts }],
      });
    } else orders = await Gorder.find({ shopper: req.user._id });

    res.status(201).json({
      status: true,
      message: "Orders",
      orders: orders,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

// --------FOOD ORDERS
exports.placeFoodOrder = async (req, res) => {
  try {
    const addressId = req.user.selectedAddress;
    const transactionId = req.user.transactionId;
    const address = await Address.findOne({ _id: addressId }).populate(
      "region"
    );
    if (!address) {
      return res.status(404).json({
        status: true,
        message: "Select a default address first!",
      });
    }
    const foodCart = await FoodCart.findOne({
      shopper: req.user._id,
    }).populate("dishes.dish");
    if (
      !foodCart ||
      !foodCart.dishes ||
      (foodCart.dishes && foodCart.dishes.length === 0)
    ) {
      return res.status(400).json({
        status: false,
        message: "Grocery Cart is Empty!",
      });
    }

    const foodBill = await FoodBill.create({
      shopper: req.user._id,
    });

    // let orders = [];
    let dishes = [];
    let totalPrice = 0;
    let orderId = crypto.randomBytes(16).toString("hex");
    for (let i = 0; i < foodCart.dishes.length; i++) {
      dishes.push({
        dish: foodCart.dishes[i].dish._id,
        quantity: foodCart.dishes[i].quantity,
      });
      totalPrice =
        totalPrice +
        foodCart.dishes[i].dish.price * foodCart.dishes[i].quantity;
    }

    let order = await Forder.create({
      shopper: req.user._id,
      restaurant: foodCart.dishes[0].dish.restaurant,
      address: address,
      orderId: orderId,
      bill: foodBill._id,
      dishes: dishes,
    });

    await Order.create({
      shopper: req.user._id,
      seller: foodCart.dishes[0].dish.restaurant,
      sellerModel: "Restaurant",
      order: order._id,
      orderModel: "Forder",
    });

    const count = await FoodBill.find({
      shopper: req.user._id,
    }).countDocuments();

    const deliveryCharges =
      parseInt(address.region.baseDelivery) +
      parseInt(address.region.packagingCost);

    foodBill.totalPrice = totalPrice + deliveryCharges;
    foodBill.paidPrice = totalPrice;
    foodBill.dishes = dishes;
    foodBill.foodOrdered = dishes.length;
    foodBill.orderNumber = count;
    foodBill.transactionId = transactionId;

    await foodBill.save();
    // foodCart.delete();

    sendOrderNotification(
      foodCart.dishes[0].dish.restaurant,
      "restaurant",
      orderId,
      req.user.fullName
    );

    res.status(201).json({
      status: true,
      message: "Order Placed",
      order: order,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getMyFoodOrders = async (req, res) => {
  try {
    let orders;
    if (req.query.status) {
      let sts = req.query.status.toUpperCase();
      orders = await Forder.find({
        $and: [{ shopper: req.user._id }, { status: sts }],
      });
    } else orders = await Forder.find({ shopper: req.user._id });

    res.status(201).json({
      status: true,
      message: "Orders Placed",
      orders: orders,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

// ---------TRANSPORT
exports.placeTransportRequest = [
  body("fullName").not().isEmpty().withMessage("Full Name is required"),
  body("phoneNumber").not().isEmpty().withMessage("Phone Number is required"),
  body("pickupAddress")
    .not()
    .isEmpty()
    .withMessage("Pickup Address is required"),
  body("dropAddress").not().isEmpty().withMessage("Drop Address is required"),
  body("region").not().isEmpty().withMessage("Region Id is required"),
  body("transportType")
    .not()
    .isEmpty()
    .withMessage("Transport type is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const {
        fullName,
        phoneNumber,
        pickupAddress,
        dropAddress,
        region,
        transportType,
      } = req.body;

      const regionExists = await Region.findOne({ _id: region });
      if (!regionExists) {
        return res.status(404).json({
          status: false,
          message: "Region not found",
        });
      }
      let orderId = crypto.randomBytes(16).toString("hex");
      let order = await Torder.create({
        shopper: req.user._id,
        fullName,
        phoneNumber,
        pickupAddress,
        dropAddress,
        region,
        transportType,
        requestId: orderId,
      });

      res.status(201).json({
        status: true,
        message: "Request Placed",
        order: order,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

// -----------GROCERS------------
exports.getGrocersInState = [
  // body("search").not().isEmpty().withMessage("Search keyword is required"),

  async (req, res) => {
    try {
      const search = req.body.search;
      let grocers,
        count = 0;

      if (search) {
        grocers = await Grocer.find({
          $or: [
            { fullName: { $regex: new RegExp(search, "i") } },
            { email: { $regex: new RegExp(search, "i") } },
            { phone: { $regex: new RegExp(search, "i") } },
            { storeName: { $regex: new RegExp(search, "i") } },
          ],
        }).populate("address");
      }
      if (!search) {
        grocers = await Grocer.find().populate("address");

        // Sort by user's city
        grocers = grocers.filter((grocer) => {
          const grocerPinCode = grocer.pincode;
          const grocerFirstThree = grocerPinCode.substring(0, 3);

          const userZipcode = req.user?.selectedAddress?.zipCode;
          if (!userZipcode) return true;

          const userFirstThree = userZipcode.substring(0, 3);

          if (grocerFirstThree === userFirstThree) {
            return true;
          }
        });
      }

      res.status(200).json({
        status: true,
        totalData: grocers.length,
        grocers: grocers,
      });
    } catch (err) {
      console.log(err);
    }
  },
];

exports.getGroceriesInState = [
  // body("search").not().isEmpty().withMessage("Search keyword is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const search = req.body?.search ? req.body.search : "";
      let stuffs = [];
      stuffs = await Stuff.find({
        $or: [
          { groceryTitle: { $regex: new RegExp(search, "i") } },
          { groceryDescription: { $regex: new RegExp(search, "i") } },
        ],
      });

      const user = await Shopper.findOne(
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
      stuffs = stuffs.filter((a) => states.includes(a.state));

      res.status(200).json({
        status: true,
        totalData: stuffs.length,
        stuffs: stuffs,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

// -----------RESTAURANTS------------
exports.getRestaurantsInState = [
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const search = req.body?.search ? req.body.search : "";
      let restaurants;
      if (search) {
        restaurants = await Restaurant.find({
          $or: [
            { fullName: { $regex: new RegExp(search, "i") } },
            { email: { $regex: new RegExp(search, "i") } },
            { phone: { $regex: new RegExp(search, "i") } },
            { storeName: { $regex: new RegExp(search, "i") } },
          ],
        }).populate("address");
      }

      if (!search) {
        restaurants = await Restaurant.find();
        restaurants = restaurants.filter((restaurant) => {
          const restaurantPinCode = restaurant.pincode;
          const restaurantFirstThree = restaurantPinCode.substring(0, 3);

          const userZipcode = req.user?.selectedAddress?.zipCode;
          if (!userZipcode) return true;

          const userFirstThree = userZipcode.substring(0, 3);

          if (restaurantFirstThree === userFirstThree) {
            return true;
          }
        });
      }

      res.status(200).json({
        status: true,
        totalData: restaurants.length,
        restaurants: restaurants,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.getDishesInState = [
  // body("search").not().isEmpty().withMessage("Search keyword is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const search = req.body?.search ? req.body.search : "";
      let dishes = [];
      dishes = await Dish.find({
        $or: [
          { dishName: { $regex: new RegExp(search, "i") } },
          { description: { $regex: new RegExp(search, "i") } },
        ],
      }).populate({
        path: "restaurant",
        populate: {
          path: "address",
          model: "Address",
        },
      });
      console.log(dishes);

      const user = await Shopper.findOne(
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

      dishes = dishes.filter((a) => {
        let flag = 0;
        for (let add of a.restaurant?.address) {
          if (states.includes(add.state)) {
            flag = 1;
            break;
          }
        }
        return flag == 1;
      });

      res.status(200).json({
        status: true,
        totalData: dishes.length,
        dishes: dishes,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

// -------------FEATURED SELLERS-------------
exports.getFeaturedSellers = [
  body("sellerType").not().isEmpty().withMessage("Seller Type is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { sellerType } = req.body;

      let sellers = [];
      if (sellerType === "grocer") {
        sellers = await Grocer.find({ isFeatured: true });
      } else if (sellerType === "restaurant") {
        sellers = await Restaurant.find({ isFeatured: true });
      } else if (sellerType === "vendor") {
        sellers = await Vendor.find({ isFeatured: true });
      } else {
        return res.status(400).json({
          status: false,
          message: "not a valid seller type",
        });
      }

      res.status(200).json({
        status: true,
        sellers: sellers,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];
