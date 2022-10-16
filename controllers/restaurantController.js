const Forder = require("../models/forderModel");
const Restaurant = require("../models/restaurantModel");
const Withdrawal = require("../models/withdrawalModel");


const { throwErrorMessage } = require("../utils/errorHelper");

exports.getFoodOrdersByStatus = [
  async (req, res) => {
    try {
      if (req.query.limit > 100 || req.query.limit < 1) {
        return res.status(403).json({
          status: "success",
          message: "Limit must be between 1-100",
        });
      }
      let page = parseInt(req.query.page ? req.query.page : 1);
      let limit = parseInt(req.query.limit ? req.query.limit : 10);
      let status = req.query.status;
      let sort = req.query.sort ? req.query.sort : "new";
      let skipValue = (page - 1) * limit;

      let sortBy = -1;
      if (sort === "old") sortBy = 1;

      let orders, count;
      if (status && status.length > 0) {
        orders = await Forder.find({
          $and: [{ restaurant: req.user._id }, { status: status }],
        })
          .sort({ createdAt: sortBy })
          .skip(skipValue)
          .limit(limit);
        count = await Forder.find({
          $and: [{ restaurant: req.user._id }, { status: status }],
        }).countDocuments();
      }
      if (!status || status.length <= 0) {
        orders = await Forder.find({ restaurant: req.user._id })
          .sort({ createdAt: sortBy })
          .skip(skipValue)
          .limit(limit);
        count = await Forder.find({
          restaurant: req.user._id,
        }).countDocuments();
      }

      res.status(201).json({
        status: "success",
        totalData: count,
        totalPage: Math.ceil(count / limit),
        perPage: limit,
        currentPage: page,
        orders: orders,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.changeOrderStatus = [
  async (req, res) => {
    try {
      let { orderId, changeTo } = req.body;

      const order = await Forder.findOne({ orderId: orderId });

      if (!order) {
        return res.status(404).json({
          status: false,
          message: "Order Not Found!",
        });
      }

      if (
        changeTo !== "PENDING" &&
        changeTo !== "PROCESSING" &&
        changeTo !== "DISPATCHED" &&
        changeTo !== "DELIVERING" &&
        changeTo !== "DELIVERED" &&
        changeTo !== "CANCELLED"
      ) {
        return res.status(400).json({
          status: false,
          message: "not a valid status",
        });
      }

      if (changeTo === "DELIVERED") {
        const seller = await Restaurant.findOne({ _id: order.restaurant._id });
        seller.wallet = seller.wallet + order.bill.totalPrice;
        await seller.save();
      }

      order.status = changeTo;
      order.save();

      res.status(200).json({
        status: true,
        message: "Order status changed successfully!",
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.requestWithdrawal = [
  async (req, res) => {
    try {
      const seller = await Restaurant.findOne({ _id: req.user._id });

      if (parseInt(seller.wallet) < 5000) {
        return res.status(403).json({
          status: false,
          message: "You can't withdraw amount (less than 5k)",
        });
      }
      const newWithdrawal = new Withdrawal({
        restraunt: req.user._id,
        amount: parseInt(seller.wallet)
      })


      await newWithdrawal.save();
      res.status(200).json({
        status: true,
        message: "Withdraw requested successfully!",
      });

    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.approveWithdrawalRequest = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findOne({ _id: req.body.withdrawalId });
    if (!withdrawal) {
      return res.status(404).json({
        status: false,
        message: "Withdrawal request not found!",
      });
    }
    const seller = await Restraunt.findOne({ _id: withdrawal.restraunt });
    console.log(seller)
    if (parseInt(seller.wallet) < withdrawal.amount) {
      return res.status(403).json({
        status: false,
        message: "You can't withdraw amount (less than 5k)",
      });
    }
    seller.wallet = seller.wallet - withdrawal.amount;
    await seller.save();
    withdrawal.status = "approved";
    await withdrawal.save();
    res.status(200).json({
      status: true,
      message: "Withdrawal request approved successfully!",
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
}



exports.rejectWithdrawalRequest = async (req, res) => {
  try {
    // First find the withdrawal
    const withdrawal = await Withdrawal.findOne({ _id: req.body.withdrawalId });
    if (!withdrawal) {
      return res.status(404).json({
        status: false,
        message: "Withdrawal request not found!",
      });
    }
    withdrawal.status = "declined";
    await withdrawal.save();
    res.status(200).json({
      status: true,
      message: "Withdrawal request declined successfully!",
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
}