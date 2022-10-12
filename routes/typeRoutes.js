const { Router } = require("express");
const { checkPermission } = require("../middlewares/checkPermission");
const typeController = require("../controllers/typeController");
// const subTypeController = require("../controllers/subTypeController");

const router = Router();

router.get("/getAllType", typeController.getAllType);

router.post("/addType", checkPermission(["admin"]), typeController.addType);
router.patch(
  "/updateType",
  checkPermission(["admin"]),
  typeController.updateType
);
router.delete(
  "/deleteType",
  checkPermission(["admin"]),
  typeController.deleteType
);

router.get("/getGrocersByType", typeController.getGrocersByType);

router.get("/getTypeByGrocer", typeController.getTypeByGrocer);

module.exports = router;
