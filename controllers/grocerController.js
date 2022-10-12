const Gorder = require("../models/gorderModel");
const Grocer = require("../models/grocerModel");
const Rider = require("../models/riderModel");
const { throwErrorMessage } = require("../utils/errorHelper");

exports.getGroceryOrdersByStatus = [
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
        orders = await Gorder.find({
          $and: [{ grocer: req.user._id }, { status: status }],
        })
          .sort({ createdAt: sortBy })
          .skip(skipValue)
          .limit(limit);
        count = await Gorder.find({
          $and: [{ grocer: req.user._id }, { status: status }],
        }).countDocuments();
      }
      if (!status || status.length <= 0) {
        orders = await Gorder.find({ grocer: req.user._id })
          .sort({ createdAt: sortBy })
          .skip(skipValue)
          .limit(limit);
        count = await Gorder.find({ grocer: req.user._id }).countDocuments();
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

      const order = await Gorder.findOne({ orderId: orderId });

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
        const seller = await Grocer.findOne({ _id: order.grocer._id });
        seller.wallet = seller.wallet + order.bill.totalPrice;
        await seller.save();
      }

      // if(changeTo==="PROCESSING")
      // {
      //   let riders = await Rider.find({
      //     $and: [{ active: true }, { available: true }, { status: "approved" }, { role: "grocerydelivery" }],
      //   });

      //   if (!riders || riders.length<=0) {
      //     return res.status(400).json({
      //       status: false,
      //       message: "no riders are available",
      //     });
      //   }

      //   order.rider = riders[0];
      //   order.rider.currentOrder = order;
      //   order.rider.available = false;
      //   order.rider.save();
      // }
      // else if(changeTo==="DELIVERED")
      // {
      //   let rider = await Rider.findOne({ currentOrder: order._id });

      //   if (!rider) {
      //     return res.status(400).json({
      //       status: false,
      //       message: "rider not found",
      //     });
      //   }
      //   rider.pastOrders.push(rider.currentOrder);
      //   rider.currentOrder = undefined;
      //   rider.available = true;
      //   rider.save();
      // }
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
      const seller = await Grocer.findOne({ _id: req.user._id });

      if (parseInt(seller.wallet) < 5000) {
        return res.status(403).json({
          status: false,
          message: "You can't withdraw amount (less than 5k)",
        });
      }

      res.status(200).json({
        status: true,
        message: "Withdraw requested successfully!",
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];
