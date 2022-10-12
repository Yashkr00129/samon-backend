const mongoose = require("mongoose");

const foodBillSchema = new mongoose.Schema(
  {
    shopper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shopper",
    },
    totalPrice: Number,
    paidPrice: Number,
    foodOrdered: Number,
    orderNumber: Number,
    transactionId: {
      type: String,
      default: null,
    },
    dishes: [
      {
        quantity: Number,
        dish: {
          type: mongoose.Schema.ObjectId,
          ref: "Dish",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const FoodBill = mongoose.model("FoodBill", foodBillSchema);

module.exports = FoodBill;
