const { Router } = require("express");
const { checkPermission } = require("../middlewares/checkPermission");
const regionController = require("../controllers/regionController");

const router = Router();

router.get("/getAllRegions", regionController.getAllRegions);

router.post(
  "/addRegion",
  checkPermission(["admin"]),
  regionController.addRegion
);
router.patch(
  "/updateRegion",
  checkPermission(["admin"]),
  regionController.updateRegion
);
router.delete(
  "/deleteRegion/:regionId",
  checkPermission(["admin"]),
  regionController.deleteRegion
);

router.post(
  "/assignMemberRegion",
  checkPermission(["admin"]),
  regionController.assignMemberRegion
);

router.post(
  "/assignVendorRegion",
  checkPermission(["admin", "member"]),
  regionController.assignVendorRegion
);

router.post(
  "/assignGrocerRegion",
  checkPermission(["admin", "member"]),
  regionController.assignGrocerRegion
);

router.post(
  "/assignRestaurantRegion",
  checkPermission(["admin", "member"]),
  regionController.assignRestaurantRegion
);

router.post(
  "/assignRiderRegion",
  checkPermission(["admin", "member"]),
  regionController.assignRiderRegion
);

module.exports = router;
