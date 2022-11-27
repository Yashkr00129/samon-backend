const admin = require("firebase-admin");
const FCM = require("../models/fcmModel");
const serviceAccount = require("./firebase-service-worker.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const notification = async (device, title, body, redirectTo, image) => {
  const message = {
    notification: {
      title,
      body,
      image: image,
      sound: "default",
      android_channel_id: "high_importance_channel",
      priority: "high",
      time_to_live: "86400",
      click_action: "FLUTTER_NOTIFICATION_CLICK",
    },

    data: {
      redirectTo,
    },
  };

  var options = {
    priority: "high",
    timeToLive: 60 * 60 * 24,
  };

  return await admin
    .messaging()
    .sendToDevice(device, message, options)
    .then(function (response) {
      console.log("Successfully sent push notification");
    })
    .catch(async function (error) {
      console.log(error);
      if (
        error.code === "messaging/registration-token-not-registered" ||
        error.code === "messaging/invalid-argument"
      ) {
        await FCM.findOneAndDelete({ fcmToken: device });
      }
    });
};

exports.sendOrderNotification = async (user, userType, orderId, fullName) => {
  const fcm = await FCM.findOne({ user, userType });

  if (fcm) {
    const fcmToken = fcm._doc.fcmToken;
    if (fcmToken) {
      notification(
        fcmToken,
        "You have a new order",
        `${orderId} received from ${fullName}. Please visit the app to view the order`,
        orderId
      );
    } else {
      console.log("FCM token was blank");
    }
  } else {
    console.log("No document find for the FCM token for this user");
  }
};

exports.notification = notification;
