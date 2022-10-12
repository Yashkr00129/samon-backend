const Review = require("../models/reviewModel");
const Vendor = require("../models/vendorModel");
const Product = require("../models/productModel");
const { body, validationResult } = require("express-validator");
const { throwErrorMessage } = require("../utils/errorHelper");

const calculateProductAverageRating = async (productId) => {
  const allReviews = await Review.find({ product: productId });
  let average = null,
    sum = 0;
  for (let i = 0; i < allReviews.length; i++) {
    let n = parseInt(allReviews[i].rating);
    sum = parseInt(sum) + n;
  }
  console.log("len", allReviews.length);
  average = parseInt(sum) / allReviews.length;

  await Product.findOneAndUpdate(
    { _id: productId },
    { averageRating: average }
  );
};

const calculateSellerAverageRating = async (vendorId) => {
  const allReviews = await Review.find({ vendor: vendorId });
  let average = null,
    sum = 0;
  for (let i = 0; i < allReviews.length; i++) {
    let n = parseInt(allReviews[i].rating);
    sum = parseInt(sum) + n;
  }
  average = parseInt(sum) / allReviews.length;

  await Vendor.findOneAndUpdate({ _id: vendorId }, { averageRating: average });
};

exports.addProductReview = [
  body("productId").not().isEmpty().withMessage("Product Id is required"),
  body("rating").not().isEmpty().withMessage("Rating is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array(),
      });
    }
    try {
      const { productId, review, rating } = req.body;
      if (rating > 5 || rating < 1) {
        return res.status(403).json({
          status: false,
          message: "Rating must be 1-5",
        });
      }
      let product = await Product.findOne({ _id: productId });

      if (!product) {
        return res.status(404).json({
          status: false,
          message: "Product not found!",
        });
      }

      const createdReview = await Review.create({
        shopper: req.user._id,
        vendor: product.vendor,
        review: review,
        rating: rating,
        product: productId,
      });

      await calculateProductAverageRating(productId);
      await calculateSellerAverageRating(product.vendor);

      return res.status(200).json({
        status: true,
        message: "Review created!",
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.getProductsAllReviews = [
  body("productId").not().isEmpty().withMessage("Product Id is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array(),
      });
    }
    try {
      const { productId } = req.body;
      let product = await Product.findOne({ _id: productId });

      if (!product) {
        return res.status(404).json({
          status: false,
          message: "Product not found!",
        });
      }

      const reviews = await Review.find({ product: productId });

      return res.status(200).json({
        status: true,
        allReviews: reviews,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];
