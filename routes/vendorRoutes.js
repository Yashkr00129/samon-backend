const { Router } = require("express");
const vendorAuthController = require("../controllers/vendorAuthController");
const vendorController = require("../controllers/vendorController");
const { checkPermission } = require("../middlewares/checkPermission");

const router = Router();

router.post("/register", vendorAuthController.register);
router.post("/login", vendorAuthController.login);
router.post("/forgetPassword", vendorAuthController.sendVerificationCode);
router.post("/resetPassword", vendorAuthController.resetPassword);

router.post("/isExistsAndVerified", vendorAuthController.isExistsAndVerified);

// ---------------ORDERS----------------
router.get(
  "/getOrdersByStatus",
  checkPermission(["vendor"]),
  vendorController.getOrdersByStatus
);

router.patch(
  "/changeOrderStatus",
  checkPermission(["vendor"]),
  vendorController.changeOrderStatus
);

// ----------------------------------------
router.post(
  "/requestWithdrawal",
  checkPermission(["vendor"]),
  vendorController.requestWithdrawal
);

router.get(
  "/getAllWithdrawals",
  checkPermission(["vendor", "admin"]),
  vendorController.getWithdrawalRequests
)

router.post("/approveWithdrawal",
  checkPermission(["admin"]),
  vendorController.approveWithdrawalRequest
);

router.post('/rejectWithdrawal', checkPermission(["admin"]), vendorController.rejectWithdrawalRequest)

module.exports = router;
