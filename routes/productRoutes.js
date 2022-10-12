const { Router } = require("express");
const { checkPermission } = require("../middlewares/checkPermission");
const productController = require("../controllers/productController");

const router = Router();
var cors = require('cors')
router.use(cors())
router.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});
// ----------FOR PRODUCTS
router.get("/getProductById", productController.getProductById);
router.get(
  "/getAllMyProducts",
  checkPermission(["vendor"]),
  productController.getAllMyProducts
);

router.post(
  "/addProduct",
  checkPermission(["vendor"]),
  productController.addProduct
);
router.patch(
  "/editProduct",
  checkPermission(["vendor"]),
  productController.editProduct
);
router.delete(
  "/deleteProduct",
  checkPermission(["vendor"]),
  productController.deleteProduct
);

// ------------
router.get("/getProductByVendor", productController.getProductByVendor);

router.get("/getAllProducts", productController.getAllProducts);

router.get("/getAllProductsInState", checkPermission(["shopper"]), productController.getAllProductsInState);

router.get("/getProductByCategory", productController.getProductByCategory);

router.get("/getProductsBySubcategory", productController.getProductsBySubcategory);

router.get(
  "/getProductsBySubcategoryAndVendor",
  checkPermission(["shopper"]),
  productController.getProductsBySubcategoryAndVendor
);

router.get("/getBestDealProducts", productController.getBestDealProducts);
// ----------FOR VARIANT
// router.post(
//   "/variant/addVariant",
//   checkPermission(["vendor"]),
//   productController.addVariant
// );

// router.delete(
//   "/variant/removeVariant",
//   checkPermission(["vendor"]),
//   productController.removeVariant
// );

module.exports = router;
