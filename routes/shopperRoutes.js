const { Router } = require("express");
const shopperAuthController = require("../controllers/shopperAuthController");
const shopperController = require("../controllers/shopperController");
const reviewController = require("../controllers/reviewController");

const { checkPermission } = require("../middlewares/checkPermission");

const router = Router();

// router.post("/sendCode", shopperAuthController.sendCode);
// router.post("/verifyCode", shopperAuthController.verifyCode);
// router.post("/register", shopperAuthController.register);
router.post("/login", shopperAuthController.login);
// router.post(
//   "/sendVerificationCode",
//   shopperAuthController.sendVerificationCode
// );
router.post("/codeVerification", shopperAuthController.codeVerification);
// router.post("/forgetPassword", shopperAuthController.sendVerificationCode);
// router.post("/resetPassword", shopperAuthController.resetPassword);

// ------cart
router.post(
  "/addToCart",
  checkPermission(["shopper"]),
  shopperController.addToCart
);

router.post(
  "/incQuantity",
  checkPermission(["shopper"]),
  shopperController.incQuantity
);

router.post(
  "/decQuantity",
  checkPermission(["shopper"]),
  shopperController.decQuantity
);

router.post(
  "/removeFromCart",
  checkPermission(["shopper"]),
  shopperController.removeFromCart
);

router.get(
  "/getMyCart",
  checkPermission(["shopper"]),
  shopperController.getMyCart
);

// --------grocery cart
router.post(
  "/addToGroceryCart",
  checkPermission(["shopper"]),
  shopperController.addToGroceryCart
);

router.post(
  "/incQuantityGrocery",
  checkPermission(["shopper"]),
  shopperController.incQuantityGrocery
);

router.post(
  "/decQuantityGrocery",
  checkPermission(["shopper"]),
  shopperController.decQuantityGrocery
);

router.post(
  "/removeFromGroceryCart",
  checkPermission(["shopper"]),
  shopperController.removeFromGroceryCart
);

router.get(
  "/getMyGroceryCart",
  checkPermission(["shopper"]),
  shopperController.getMyGroceryCart
);

// --------dish cart
router.post(
  "/addToFoodCart",
  checkPermission(["shopper"]),
  shopperController.addToFoodCart
);

router.post(
  "/incFoodQuantity",
  checkPermission(["shopper"]),
  shopperController.incFoodQuantity
);

router.post(
  "/decFoodQuantity",
  checkPermission(["shopper"]),
  shopperController.decFoodQuantity
);

router.post(
  "/removeFromFoodCart",
  checkPermission(["shopper"]),
  shopperController.removeFromFoodCart
);

router.get(
  "/getMyFoodCart",
  checkPermission(["shopper"]),
  shopperController.getMyFoodCart
);

// ---------wishlist

router.post(
  "/addToWishlist",
  checkPermission(["shopper"]),
  shopperController.addToWishlist
);

router.post(
  "/removeFromWishlist",
  checkPermission(["shopper"]),
  shopperController.removeFromWishlist
);

router.get(
  "/getMyWishlist",
  checkPermission(["shopper"]),
  shopperController.getMyWishlist
);

// -------others
router.post(
  "/placeOrder",
  checkPermission(["shopper"]),
  shopperController.placeOrder
);

router.get(
  "/getMyOrders",
  checkPermission(["shopper"]),
  shopperController.getMyOrders
);

router.post(
  "/placeGroceryOrder",
  checkPermission(["shopper"]),
  shopperController.placeGroceryOrder
);

router.get(
  "/getMyGroceryOrders",
  checkPermission(["shopper"]),
  shopperController.getMyGroceryOrders
);

router.post(
  "/placeFoodOrder",
  checkPermission(["shopper"]),
  shopperController.placeFoodOrder
);

router.get(
  "/getMyFoodOrders",
  checkPermission(["shopper"]),
  shopperController.getMyFoodOrders
);

router.post(
  "/placeTransportRequest",
  checkPermission(["shopper"]),
  shopperController.placeTransportRequest
);

router.get(
  "/getGrocersInState",
  checkPermission(["shopper"]),
  shopperController.getGrocersInState
);

router.get(
  "/getGroceriesInState",
  checkPermission(["shopper"]),
  shopperController.getGroceriesInState
);

router.get(
  "/getRestaurantsInState",
  checkPermission(["shopper"]),
  shopperController.getRestaurantsInState
);

router.get(
  "/getDishesInState",
  checkPermission(["shopper"]),
  shopperController.getDishesInState
);

router.get("/getFeaturedSellers", shopperController.getFeaturedSellers);

// REVIEW ROUTES
router.post(
  "/addProductReview",
  checkPermission(["shopper"]),
  reviewController.addProductReview
);

router.post("/getProductsAllReviews", reviewController.getProductsAllReviews);

module.exports = router;
