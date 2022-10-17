const Rider = require("../models/riderModel");
const Porder = require("../models/porderModel");
const Forder = require("../models/forderModel");
const Gorder = require("../models/gorderModel");

const { throwErrorMessage } = require("../utils/errorHelper");

exports.toggleAvailability = async (req, res) => {
  try {
    const available = req.body.available;
    const rider = await Rider.findById(req.user._id);

    if (!rider) {
      return res.status(404).json({
        status: false,
        message: "Rider not found!",
      });
    }
    if (rider.currentOrder && rider.available === false) {
      return res.status(404).json({
        status: false,
        message: "Cannot mark availability as true when an order is assigned!",
      });
    }
    rider.available = available;

    await rider.save();

    res.status(200).json({
      status: true,
      message: "Availability status updated successfully!",
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getMyCurrentOrder = async (req, res) => {
  try {
    const rider = await Rider.findById(req.user._id).populate("currentOrder");

    res.status(200).json({
      status: true,
      currentOrder: rider.currentOrder,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.getMyPastOrders = async (req, res) => {
  try {
    const rider = await Rider.findById(req.user._id).populate("pastOrders");

    res.status(200).json({
      status: true,
      pastOrders: rider.pastOrders,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.deliverCurrentOrder = async (req, res) => {
  try {
    const rider = await Rider.findById(req.user._id);

    if (!rider.currentOrder) {
      return res.status(403).json({
        status: false,
        message: "You don't have any current order",
      });
    }
    let { currentOrder } = rider;
    const order =
      (await Porder.findOne({ _id: currentOrder })) ||
      (await Forder.findOne({ _id: currentOrder })) ||
      (await Gorder.findOne({ _id: currentOrder }));
    order.status = "DELIVERED";
    await order.save();

    let pastOrders = [];
    pastOrders = rider.pastOrders;
    pastOrders.push(currentOrder);
    rider.currentOrder = undefined;
    rider.pastOrders = pastOrders;
    await rider.save();

    res.status(200).json({
      status: true,
      message: "Order marked as delivered!",
      rider,
    });
  } catch (err) {
    console.log(err);
  }
};
