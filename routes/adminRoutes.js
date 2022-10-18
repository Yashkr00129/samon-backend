const { Router } = require("express");
const { checkPermission } = require("../middlewares/checkPermission");
const adminController = require("../controllers/adminController");

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

router.post("/login", adminController.login);

// ---------DASHBOARD-----------
router.get(
  "/getDashboardOverview",
  checkPermission(["admin", "member"]),
  adminController.getDashboardOverview
);

router.get(
  "/getThisMonthOverview",
  checkPermission(["admin", "member"]),
  adminController.getThisMonthOverview
);

router.get(
  "/getWeekOverview",
  checkPermission(["admin", "member"]),
  adminController.getWeekOverview
);

router.get(
  "/getTodaysOverview",
  checkPermission(["admin", "member"]),
  adminController.getTodaysOverview
);

// ---------MEMBER--------------
router.post(
  "/createMember",
  checkPermission(["admin"]),
  adminController.createMember
);

router.delete(
  "/deleteMember",
  checkPermission(["admin"]),
  adminController.deleteMember
);

router.get(
  "/getAllMembers",
  checkPermission(["admin"]),
  adminController.getAllMembers
);

// -----------SHOPPERS
router.post(
  "/deleteShopper",
  checkPermission(["admin"]),
  adminController.deleteShopper
);

router.get(
  "/getAllShoppers",
  checkPermission(["admin", "member"]),
  adminController.getAllShoppers
);

// -----------VENDORS
router.get("/getAllVendors", adminController.getAllVendors);

router.post(
  "/approveOrRejectVendor",
  checkPermission(["admin"]),
  adminController.approveOrRejectVendor
);

router.post(
  "/bannVendor",
  checkPermission(["admin"]),
  adminController.bannVendor
);

// -----------GROCERS
router.get(
  "/getAllGrocers",
  checkPermission(["admin", "member"]),
  adminController.getAllGrocers
);

router.post(
  "/approveOrRejectGrocer",
  checkPermission(["admin"]),
  adminController.approveOrRejectGrocer
);

router.post(
  "/bannGrocer",
  checkPermission(["admin"]),
  adminController.bannGrocer
);

// -----------RESTAURANTS
router.get("/getAllRestaurants", adminController.getAllRestaurants);

router.post(
  "/approveOrRejectRestaurant",
  checkPermission(["admin"]),
  adminController.approveOrRejectRestraunt
);

router.post(
  "/bannRestaurant",
  checkPermission(["admin"]),
  adminController.bannRestaurant
);

// -----------FORDERS
router.get('/getAllForders', adminController.getAllForders);

// -----------RIDERS
router.post(
  "/approveOrRejectRider",
  checkPermission(["admin"]),
  adminController.approveOrRejectRider
);

router.get(
  "/getAllRiders",
  checkPermission(["admin", "member"]),
  adminController.getAllRiders
);

router.post(
  "/bannRider",
  checkPermission(["admin"]),
  adminController.bannRider
);

router.post(
  "/changeRiderRole",
  checkPermission(["admin"]),
  adminController.changeRiderRole
);

// -----------PRODUCT
router.get(
  "/getAllProductsByVendor",
  checkPermission(["admin", "member"]),
  adminController.getAllProductsByVendor
);

// -----------BEST DEALS
router.patch(
  "/toggleBestDeal",
  checkPermission(["admin"]),
  adminController.toggleBestDeal
);

// -----------FEATURED
router.patch(
  "/toggleFeatured",
  checkPermission(["admin"]),
  adminController.toggleFeatured
);

// -----------ORDERS
router.get(
  "/getAllPorders",
  checkPermission(["admin", "member"]),
  adminController.getAllPorders
);

router.get(
  "/getAllGorders",
  checkPermission(["admin", "member"]),
  adminController.getAllGorders
);

router.get(
  "/getAllOrdersByVendor",
  checkPermission(["admin", "member"]),
  adminController.getAllOrdersByVendor
);

router.get(
  "/getAllOrdersByGrocer",
  checkPermission(["admin", "member"]),
  adminController.getAllOrdersByGrocer
);

router.get(
  "/getTransportRequests",
  checkPermission(["admin", "member"]),
  adminController.getTransportRequests
);

router.delete(
  "/deleteTransportRequests",
  checkPermission(["admin", "member"]),
  adminController.deleteTransportRequests
);

router.post(
  "/asignOrderToRider",
  checkPermission(["admin", "member"]),
  adminController.asignOrderToRider
);

module.exports = router;
