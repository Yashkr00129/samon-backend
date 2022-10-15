const { Router } = require("express");
const { checkPermission } = require("../middlewares/checkPermission");
const categoryController = require("../controllers/categoryController");
const subCategoryController = require("../controllers/subCategoryController");

const router = Router();

router.get("/getAllCategory", categoryController.getAllCategory);

router.post(
  "/addCategory",
  checkPermission(["admin"]),
  categoryController.addCategory
);
router.patch(
  "/updateCategory",
  checkPermission(["admin"]),
  categoryController.updateCategory
);
router.delete(
  "/deleteCategory/:id",
  checkPermission(["admin"]),
  categoryController.deleteCategory
);

// ---------------SUB-CATEGORY
router.get("/getAllSubCategory", subCategoryController.getAllSubCategory);
router.get("/getSubCategories", subCategoryController.getSubCategories);

router.post(
  "/addSubCategory",
  checkPermission(["admin"]),
  subCategoryController.addSubCategory
);
router.patch(
  "/updateSubCategory",
  checkPermission(["admin"]),
  subCategoryController.updateSubCategory
);
router.delete(
  "/deleteSubCategory/:id",
  checkPermission(["admin"]),
  subCategoryController.deleteSubCategory
);

router.get(
  "/getVendorsByCategory",
  categoryController.getVendorsByCategory
);

router.get(
  "/getSubCategoriesByVendor",
  subCategoryController.getSubCategoriesByVendor
);

module.exports = router;
