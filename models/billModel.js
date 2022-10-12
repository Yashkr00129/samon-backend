const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    shopper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shopper",
    },
    totalPrice: Number,
    paidPrice: Number,
    productOrdered: Number,
    orderNumber: Number,
    transactionId: {
      type: String,
      default: null,
    },
    products: [
      {
        quantity: Number,
        product: {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Bill = mongoose.model("Bill", billSchema);

module.exports = Bill;
