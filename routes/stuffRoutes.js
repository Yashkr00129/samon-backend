const { Router } = require("express");
const { checkPermission } = require("../middlewares/checkPermission");
const stuffController = require("../controllers/stuffController");

const router = Router();
var cors = require("cors");
router.use(cors());
router.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});
// ----------FOR GROCERY
router.get("/getStuffById", stuffController.getStuffById);
router.get(
  "/getAllMyStuffs",
  checkPermission(["grocer"]),
  stuffController.getAllMyStuffs
);

router.post("/addStuff", checkPermission(["grocer"]), stuffController.addStuff);
router.patch(
  "/editStuff",
  checkPermission(["grocer"]),
  stuffController.editStuff
);
router.delete(
  "/deleteStuff",
  checkPermission(["grocer"]),
  stuffController.deleteStuff
);

router.post(
  "/toggleAvailability",
  checkPermission(["grocer"]),
  stuffController.toggleAvailability
);

// ------------
router.get("/getStuffByGrocer", stuffController.getStuffByGrocer);

router.get("/getBestDealStuffs", stuffController.getBestDealStuffs);

router.get("/getAllStuffs", stuffController.getAllStuffs);

router.get("/getStuffByType", stuffController.getStuffByType);

module.exports = router;
