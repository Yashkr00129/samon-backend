const { Router } = require("express");
const addressController = require("../controllers/addressController");

const { checkPermission } = require("../middlewares/checkPermission");

const router = Router();

router.get(
  "/getAddress",
  checkPermission(["shopper", "vendor", "grocer", "restaurant", "rider"]),
  addressController.getAddress
);

router.get(
  "/getAllMyAddress",
  checkPermission(["shopper", "vendor", "grocer", "restaurant", "rider"]),
  addressController.getAllMyAddress
);

router.post(
  "/addAddress",
  checkPermission(["shopper", "vendor", "grocer", "restaurant", "rider"]),
  addressController.addAddress
);

router.patch(
  "/updateAddress",
  checkPermission(["shopper", "vendor", "grocer", "restaurant", "rider"]),
  addressController.updateAddress
);

router.delete(
  "/deleteAddress",
  checkPermission(["shopper", "vendor", "grocer", "restaurant", "rider"]),
  addressController.deleteAddress
);

module.exports = router;
