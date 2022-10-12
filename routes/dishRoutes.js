const { Router } = require("express");
const dishController = require("../controllers/dishController");
const { checkPermission } = require("../middlewares/checkPermission");

const router = Router();

router.get(
    "/getAllDishes",
    dishController.getAllDishes
);

router.patch(
    "/toggleDishAvailability",
    checkPermission(["restaurant"]),
    dishController.toggleDishAvailability
);

module.exports = router;
