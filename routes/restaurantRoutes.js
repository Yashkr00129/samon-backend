const { Router } = require("express");
const { checkPermission } = require("../middlewares/checkPermission");
const restaurantAuthController = require("../controllers/restaurantAuthController");
const menuController = require("../controllers/menuController");
const restaurantController = require("../controllers/restaurantController");

const router = Router();

var cors = require("cors");
router.use(cors());
router.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

router.post("/register", restaurantAuthController.register);
router.post("/login", restaurantAuthController.login);
router.post("/forgetPassword", restaurantAuthController.sendVerificationCode);
router.post("/resetPassword", restaurantAuthController.resetPassword);

router.post(
  "/isExistsAndVerified",
  restaurantAuthController.isExistsAndVerified
);

// --------------menuCard----------------
router.get("/getMenu", menuController.getMenu);

router.get("/getMenusByRestaurant", menuController.getMenusByRestaurant);

router.post(
  "/addMenu",
  checkPermission(["restaurant"]),
  menuController.addMenu
);

router.post(
  "/addDishToMenu",
  checkPermission(["restaurant"]),
  menuController.addDishToMenu
);

router.post(
  "/removeDishFromMenu",
  checkPermission(["restaurant"]),
  menuController.removeDishFromMenu
);

router.get(
  "/getAllMyMenus",
  checkPermission(["restaurant"]),
  menuController.getAllMyMenus
);

router.patch(
  "/updateMenu",
  checkPermission(["restaurant"]),
  menuController.updateMenu
);

router.delete(
  "/deleteMenu",
  checkPermission(["restaurant"]),
  menuController.deleteMenu
);

// ---------------ORDERS----------------
router.get(
  "/getFoodOrdersByStatus",
  checkPermission(["restaurant"]),
  restaurantController.getFoodOrdersByStatus
);



router.patch(
  "/changeOrderStatus",
  checkPermission(["restaurant"]),
  restaurantController.changeOrderStatus
);

// ----------------------------------------
router.get(
  "/requestWithdrawal",
  checkPermission(["restaurant"]),
  restaurantController.requestWithdrawal
);

module.exports = router;
