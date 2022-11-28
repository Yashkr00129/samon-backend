const { Router } = require("express");
const { checkPermission } = require("../middlewares/checkPermission");
const otherController = require("../controllers/otherController");

const router = Router();

router.post("/upload", otherController.uploadFile);

router.get(
  "/getMe",
  checkPermission(["shopper", "vendor", "rider", "restaurant", "grocer"]),
  otherController.getMe
);

router.put(
  "/updateMe",
  checkPermission(["restaurant", "grocer", "shopper", "vendor"]),
  otherController.updateMe
);

router.put(
  "/updateStore",
  checkPermission(["restaurant", "grocer", "vendor"]),
  otherController.updateStore
);

router.put(
  "/updateMeForRider",
  checkPermission(["rider"]),
  otherController.updateMeForRider
);

router.get(
  "/banner",
  checkPermission([
    "admin",
    "member",
    "restaurant",
    "grocer",
    "vendor",
    "shopper",
    "rider",
  ]),
  otherController.getBanners
);

router
  .route("/fcm")
  .post(
    checkPermission(["restaurant", "grocer", "vendor"]),
    otherController.updateFCM
  )
  .delete(
    checkPermission(["grocer", "restaurant", "vendor"]),
    otherController.deleteFCM
  );
module.exports = router;
