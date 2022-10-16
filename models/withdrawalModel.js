const mongoose = require("mongoose")

const withdrawSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.ObjectId,
    ref: "Vendor",
  },
  grocer: {
    type: mongoose.Schema.ObjectId,
    ref: "Grocer",
  },
  restraunt: {
    type: mongoose.Schema.ObjectId,
    ref: "Restraunt",
  },
  amount: {
    type: Number,
    required: [true, "Withdrawal must have an amount"],
  },
  status: {
    type: String,
    enum: ["pending", "approved", "declined"],
    default: "pending",
  },
})

const Withdrawal = mongoose.model("Withdrawal", withdrawSchema)

module.exports = Withdrawal