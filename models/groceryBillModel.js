const mongoose = require("mongoose");

const groceryBillSchema = new mongoose.Schema(
  {
    shopper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shopper",
    },
    totalPrice: Number,
    paidPrice: Number,
    stuffOrdered: Number,
    orderNumber: Number,
    transactionId: {
      type: String,
      default: null,
    },
    stuffs: [
      {
        quantity: Number,
        stuff: {
          type: mongoose.Schema.ObjectId,
          ref: "Stuff",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const GroceryBill = mongoose.model("GroceryBill", groceryBillSchema);

module.exports = GroceryBill;
