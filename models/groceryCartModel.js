const mongoose = require("mongoose");

const groceryCartSchema = new mongoose.Schema(
  {
    shopper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shopper",
    },
    stuffs: [
      {
        stuff: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Stuff",
        },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const GroceryCart = mongoose.model("GroceryCart", groceryCartSchema);

module.exports = GroceryCart;
