const { Router } = require("express");
const riderAuthController = require("../controllers/riderAuthController");
const riderController = require("../controllers/riderController");
const { checkPermission } = require("../middlewares/checkPermission");

const router = Router();

// router.post("/register", riderAuthController.register);
router.post("/login", riderAuthController.login);
router.post("/forgetPassword", riderAuthController.sendVerificationCode);
// router.post("/resetPassword", riderAuthController.resetPassword);
router.post("/codeVerification", riderAuthController.codeVerification);

router.post(
  "/toggleAvailability",
  checkPermission(["rider"]),
  riderController.toggleAvailability
);

router.get(
  "/getMyCurrentOrder",
  checkPermission(["rider"]),
  riderController.getMyCurrentOrder
);

router.get(
  "/getMyPastOrders",
  checkPermission(["rider"]),
  riderController.getMyPastOrders
);

router.get(
  "/deliverCurrentOrder",
  checkPermission(["rider"]),
  riderController.deliverCurrentOrder
);

module.exports = router;
