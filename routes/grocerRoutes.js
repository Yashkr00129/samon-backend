const { Router } = require("express");
const grocerAuthController = require("../controllers/grocerAuthController");
const grocerController = require("../controllers/grocerController");
const { checkPermission } = require("../middlewares/checkPermission");

const router = Router();

router.post("/register", grocerAuthController.register);
router.post("/login", grocerAuthController.login);
router.post("/forgetPassword", grocerAuthController.sendVerificationCode);
router.post("/resetPassword", grocerAuthController.resetPassword);

router.post("/isExistsAndVerified", grocerAuthController.isExistsAndVerified);

// ---------------ORDERS----------------
router.get(
  "/getGroceryOrdersByStatus",
  checkPermission(["grocer"]),
  grocerController.getGroceryOrdersByStatus
);

router.patch(
  "/changeOrderStatus",
  checkPermission(["grocer"]),
  grocerController.changeOrderStatus
);

// ----------------------------------------
router.get(
  "/requestWithdrawal",
  checkPermission(["restaurant"]),
  grocerController.requestWithdrawal
);

module.exports = router;
