const mongoose = require("mongoose");

const stuffSchema = new mongoose.Schema(
  {
    grocer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grocer",
      required: true,
    },
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Type",
    },
    groceryTitle: {
      type: String,
    },
    groceryDescription: {
      type: String,
    },
    images: [String],
    price: {
      type: Number,
      required: [true, "A Product must have a price"],
    },
    isBestDeal: {
      type: Boolean,
      default: false,
    },
    state: {
      type: String,
      required: [true, "Please provide State"],
    },
    availability: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

stuffSchema.pre(/^find/, function (next) {
  this.populate("grocer");
  this.populate("type");
  next();
});

const Stuff = mongoose.model("Stuff", stuffSchema);
module.exports = Stuff;
