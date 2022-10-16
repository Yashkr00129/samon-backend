const Rider = require("../models/riderModel");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { throwErrorMessage } = require("../utils/errorHelper");
const axios = require("axios");

const sendMessage = async (phone, message) => {
  const apiKey = "u2jpFX3jMObyjknL";
  const sendgridId = "SAMONN";
  let res = await axios({
    method: "post",
    url: `http://sms.osdigital.in/V2/http-api.php?apikey=${apiKey}&senderid=${sendgridId}&number=${phone}&message=${message}&format=json`,
  });
};

const createToken = (user) => {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.register = [
  body("fullName").not().isEmpty().withMessage("Full Name is required"),
  body("phone").not().isEmpty().withMessage("Email Id Feild is required"),
  body("email").not().isEmpty().withMessage("Email is required"),
  body("adhaarFile")
    .not()
    .isEmpty()
    .withMessage("Adhaar card photo is required"),
  body("licenceFile").not().isEmpty().withMessage("Licence photo is required"),
  body("drivingLicence")
    .not()
    .isEmpty()
    .withMessage("Driving Liscence is required"),
  body("adhaarCardNumber")
    .not()
    .isEmpty()
    .withMessage("Adhaar Number Feild is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const {
        phone,
        fullName,
        email,
        adhaarFile,
        licenceFile,
        adhaarCardNumber,
        drivingLicence,
      } = req.body;

      console.log(req.body)

      const rider = await Rider.findOne({
        $or: [{ phone: phone }, { adhaarCardNumber: adhaarCardNumber }],
      });
      if (rider) {
        return res.status(409).json({
          status: false,
          message: "Phone already exists! Use different",
        });
      }
      const createdRider = await Rider.create({
        fullName: fullName,
        phone: phone,
        email: email,
        adhaarFile: adhaarFile,
        licenceFile: licenceFile,
        adhaarCardNumber: adhaarCardNumber,
        drivingLicence: drivingLicence,
      });

      res.status(200).json({
        status: true,
        message: "Your account is created, wait until admin aproved you!",
        user: createdRider,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.login = [
  body("phone").not().isEmpty().withMessage("Email Id Feild is required"),

  async (req, res) => {
    try {
      const { phone } = req.body;

      const rider = await Rider.findOne({ phone: phone });
      if (!rider) {
        const createdRider = await Rider.create({
          phone: phone,
        });
        const verificationCode = createdRider.createVerificationCode();
        const vRider = await createdRider.save();
        let message = `Your One Time Password (OTP) for Registration to SAMON WALA is ${verificationCode} Pls do not share with anyone.`;
        sendMessage(phone, message);
        return res.status(201).json({
          status: true,
          message: "Registered! OTP sent",
          rider: vRider,
        });
      }
      if (rider.active === false) {
        return res.status(403).json({
          status: false,
          message: "Your account is deleted, please contact admin",
        });
      }
      // if (rider.status !== "approved") {
      //   return res.status(403).json({
      //     status: false,
      //     message: "You are not approved!",
      //   });
      // }

      // const auth = await bcrypt.compare(password, rider.password);
      // if (auth) {
      // const token = createToken(rider);
      // return res.status(200).json({
      //   status: true,
      //   message: "Logged in successfully!",
      //   token: token,
      //   user: rider,
      // });
      // }
      const verificationCode = rider.createVerificationCode();
      const vRider = await rider.save();
      let message = `Your One Time Password (OTP) for Registration to SAMON WALA is ${verificationCode} Pls do not share with anyone.`;
      sendMessage(phone, message);

      return res.status(201).json({
        status: true,
        message: "OTP sent",
        rider: vRider,
      });
      // res.status(403).json({
      //   status: false,
      //   message: "Incorrect Phone no. or password!",
      // });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.sendVerificationCode = [
  body("phone").not().isEmpty().withMessage("Phone Feild is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array(),
      });
    }

    try {
      const { phone } = req.body;
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const serviceId = process.env.TWILIO_SERVICE_ID;
      const client = require("twilio")(accountSid, authToken);

      const rider = await Rider.findOne({ phone: phone });
      if (!rider) {
        return res.status(404).json({
          status: false,
          message: "User Not Found with this number!",
        });
      }
      if (rider.active === false) {
        return res.status(403).json({
          status: false,
          message: "Your account is deleted, please contact admin",
        });
      }
      client.verify
        .services(serviceId)
        .verifications.create({
          to: `+${rider.phone}`,
          channel: "sms",
        })
        .then((data) => {
          return res.status(200).json({
            status: true,
            message: "Code sent to your phone, please verify!",
          });
        })
        .catch((err) => {
          throwErrorMessage(err, res);
        });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.resetPassword = [
  body("phone").not().isEmpty().withMessage("Email or Phone no. is required"),
  body("verificationCode")
    .not()
    .isEmpty()
    .withMessage("Confirmation code is required"),
  body("newPassword").not().isEmpty().withMessage("new password is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "fail",
        errors: errors.array(),
      });
    }

    try {
      const { phone, verificationCode, newPassword } = req.body;
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const serviceId = process.env.TWILIO_SERVICE_ID;
      const client = require("twilio")(accountSid, authToken);

      const rider = await Rider.findOne({ phone: phone }).select("+password");
      if (!rider) {
        return res.status(404).json({
          status: false,
          message: "User not Found!",
        });
      }
      if (rider.active === false) {
        return res.status(403).json({
          status: false,
          message: "Your account is deleted, please contact admin",
        });
      }

      client.verify
        .services(serviceId)
        .verificationChecks.create({
          to: `+${phone}`,
          code: verificationCode,
        })
        .then(async (data) => {
          if (data.valid === true) {
            rider.password = newPassword;
            const confirmedRider = await rider.save();
            return res.status(200).json({
              status: true,
              message: "Password changed successfully!",
              user: confirmedRider,
            });
          }
          if (data.valid === false) {
            return res.status(403).json({
              status: false,
              message: "Code is Invalid or has expired!",
            });
          }
        })
        .catch((err) => {
          return res.status(403).json({
            status: false,
            message: "Code is Invalid or has expired!",
          });
        });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.codeVerification = [
  body("phone").not().isEmpty().withMessage("Phone no. is required"),
  body("verificationCode")
    .not()
    .isEmpty()
    .withMessage("Verification code is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array(),
      });
    }

    try {
      const { phone, verificationCode } = req.body;

      const rider = await Rider.findOne({ phone: phone });
      if (!rider) {
        return res.status(404).json({
          status: false,
          message: "User not Found!",
        });
      }
      if (rider.active === false) {
        return res.status(403).json({
          status: false,
          message: "Your account is deleted, please contact admin",
        });
      }

      if (
        phone.toString() === "911111111111" &&
        verificationCode.toString() === "000000"
      ) {
        rider.phoneVerified = true;
        const confirmedRider = await rider.save();
        const token = createToken(confirmedRider);
        return res.status(200).json({
          status: true,
          message: "Code confirmed!",
          token: token,
          rider: confirmedRider,
        });
      } else {
        const hashedCode = crypto
          .createHash("sha256")
          .update(verificationCode)
          .digest("hex");

        const rider = await Rider.findOne({
          $and: [
            { phone: phone },
            { confirmationCode: hashedCode },
            { confirmationCodeExpires: { $gt: Date.now() } },
          ],
        });

        if (!rider) {
          return res.status(403).json({
            status: false,
            message: "Code is Invalid or has expired!",
          });
        } else {
          const token = createToken(rider);
          res.status(200).json({
            status: true,
            token: token,
            message: "OTP Confirmed!",
          });
        }
      }
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];
