const Grocer = require("../models/grocerModel");
const crypto = require("crypto");

const { body, validationResult } = require("express-validator");
const sgMail = require("@sendgrid/mail");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { throwErrorMessage } = require("../utils/errorHelper");

const createToken = (user) => {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.register = [
  body("phone").not().isEmpty().withMessage("Email Id Feild is required"),
  body("password").not().isEmpty().withMessage("Password Id Feild is required"),
  body("email").not().isEmpty().withMessage("Email is required"),
  body("latitude").not().isEmpty().withMessage("Latitude is required"),
  body("longitude").not().isEmpty().withMessage("Longitude is required"),
  body("storeName").not().isEmpty().withMessage("Store Name is required"),
  body("storeRegistration")
    .not()
    .isEmpty()
    .withMessage("Registration is required"),
  body("storeAddress").not().isEmpty().withMessage("Store Address is required"),
  body("pincode").not().isEmpty().withMessage("Pincode is required"),
  body("storeImage").not().isEmpty().withMessage("store Image is required"),
  body("adhaarFile")
    .not()
    .isEmpty()
    .withMessage("Adhaar card photo is required"),
  body("bankAccountNumber")
    .not()
    .isEmpty()
    .withMessage("Bank Account Number is required"),
  body("ifscCode").not().isEmpty().withMessage("IFSC code is required"),
  body("adhaarCardNumber")
    .not()
    .isEmpty()
    .withMessage("Adhaar Number Feild is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be atleast 8 Characters"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const {
        phone,
        password,
        fullName,
        email,
        latitude,
        longitude,
        adhaarFile,
        panCardNumber,
        gst,
        adhaarCardNumber,
        bankAccountNumber,
        ifscCode,
        storeName,
        storeRegistration,
        storeAddress,
        pincode,
        fssaiCode,
        storeImage,
      } = req.body;

      const grocer = await Grocer.findOne({
        $or: [{ email: email }, { adhaarCardNumber: adhaarCardNumber }],
      });
      if (grocer) {
        return res.status(409).json({
          status: false,
          message: "Email or Adhaar number already exists! Use different",
        });
      }
      const createdGrocer = await Grocer.create({
        fullName: fullName,
        phone: phone,
        password: password,
        email: email,
        latitude: latitude,
        longitude: longitude,
        storeName: storeName,
        storeRegistration: storeRegistration,
        storeAddress: storeAddress,
        pincode: pincode,
        fssaiCode: fssaiCode,
        storeImage: storeImage,
        adhaarFile: adhaarFile,
        panCardNumber: panCardNumber,
        gst: gst,
        bankAccountNumber: bankAccountNumber,
        ifscCode: ifscCode,
        adhaarCardNumber: adhaarCardNumber,
      });

      const token = createToken(createdGrocer);
      res.status(200).json({
        status: true,
        message: "Your account is created, wait until admin aproved you!",
        token: token,
        user: createdGrocer,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.login = [
  body("email").not().isEmpty().withMessage("Email Id Feild is required"),
  body("password").not().isEmpty().withMessage("Password Feild is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be atleast 8 Characters"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { email, password } = req.body;

      const grocer = await Grocer.findOne({ email: email }).select("+password");
      if (!grocer) {
        return res.status(403).json({
          status: false,
          message: "Incorrect email or password!",
        });
      }
      if (grocer.active === false) {
        return res.status(403).json({
          status: false,
          message: "Your account is deleted, please contact admin",
        });
      }
      if (grocer.status !== "approved") {
        return res.status(403).json({
          status: false,
          message: "You are not approved!",
        });
      }

      const auth = await bcrypt.compare(password, grocer.password);
      if (auth) {
        const token = createToken(grocer);
        return res.status(200).json({
          status: true,
          message: "Logged in successfully!",
          token: token,
          user: grocer,
        });
      }
      res.status(403).json({
        status: false,
        message: "Incorrect Phone no. or password!",
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.sendVerificationCode = [
  body("email").not().isEmpty().withMessage("email Feild is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array(),
      });
    }

    try {
      const { email } = req.body;
      // const accountSid = process.env.TWILIO_ACCOUNT_SID;
      // const authToken = process.env.TWILIO_AUTH_TOKEN;
      // const serviceId = process.env.TWILIO_SERVICE_ID;
      // const client = require("twilio")(accountSid, authToken);

      const grocer = await Grocer.findOne({ email: email });
      if (!grocer) {
        return res.status(404).json({
          status: false,
          message: "User Not Found with this email!",
        });
      }
      if (grocer.active === false) {
        return res.status(403).json({
          status: false,
          message: "Your account is deleted, please contact admin",
        });
      }

      const verificationCode = grocer.createVerificationCode();
      const vGrocer = await grocer.save();
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const msg = {
        to: email, // Change to your recipient
        from: "milanrawat927@gmail.com", // Change to your verified sender
        subject: "OTP for Samonn",
        text: `Your code to reset password is ${verificationCode}, Valid for 10 minute!`,
      };
      sgMail
        .send(msg)
        .then(() => {
          return res.status(200).json({
            status: true,
            message: "Code sent to your email to reset password!",
          });
        })
        .catch((err) => {
          throwErrorMessage(err, res);
        });

      // client.verify
      //   .services(serviceId)
      //   .verifications.create({
      //     to: `+${grocer.phone}`,
      //     channel: "sms",
      //   })
      //   .then((data) => {
      //     return res.status(200).json({
      //       status: true,
      //       message: "Code sent to your phone, please verify!",
      //     });
      //   })
      //   .catch((err) => {
      //     throwErrorMessage(err, res);
      //   });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.resetPassword = [
  body("email").not().isEmpty().withMessage("Email is required"),
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
      const { email, verificationCode, newPassword } = req.body;
      // const accountSid = process.env.TWILIO_ACCOUNT_SID;
      // const authToken = process.env.TWILIO_AUTH_TOKEN;
      // const serviceId = process.env.TWILIO_SERVICE_ID;
      // const client = require("twilio")(accountSid, authToken);

      // const grocer = await Grocer.findOne({ email: email }).select("+password");
      // if (!grocer) {
      //   return res.status(404).json({
      //     status: false,
      //     message: "User not Found!",
      //   });
      // }
      // if (grocer.active === false) {
      //   return res.status(403).json({
      //     status: false,
      //     message: "Your account is deleted, please contact admin",
      //   });
      // }

      const hashedCode = crypto
        .createHash("sha256")
        .update(verificationCode)
        .digest("hex");

      const grocer = await Grocer.findOne({
        $and: [
          { email: email },
          { confirmationCode: hashedCode },
          { confirmationCodeExpires: { $gt: Date.now() } },
        ],
      }).select("+password");

      if (!grocer) {
        return res.status(400).json({
          status: false,
          message: "Code is Invalid or has expired!",
        });
      }

      const token = createToken(grocer);
      grocer.confirmationCode = undefined;
      grocer.confirmationCodeExpires = undefined;
      grocer.password = newPassword;

      const nGrocer = await grocer.save();

      res.status(200).json({
        status: true,
        token: token,
        message: "Password successfully updated!",
        user: nGrocer,
      });

      // client.verify
      //   .services(serviceId)
      //   .verificationChecks.create({
      //     to: `+${phone}`,
      //     code: verificationCode,
      //   })
      //   .then(async (data) => {
      //     if (data.valid === true) {
      //       grocer.password = newPassword;
      //       const confirmedGrocer = await grocer.save();
      //       return res.status(200).json({
      //         status: true,
      //         message: "Password changed successfully!",
      //         user: confirmedGrocer,
      //       });
      //     }
      //     if (data.valid === false) {
      //       return res.status(403).json({
      //         status: false,
      //         message: "Code is Invalid or has expired!",
      //       });
      //     }
      //   })
      //   .catch((err) => {
      //     return res.status(403).json({
      //       status: false,
      //       message: "Code is Invalid or has expired!",
      //     });
      //   });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];

exports.isExistsAndVerified = [
  body("email").not().isEmpty().withMessage("Email is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "fail",
        errors: errors.array(),
      });
    }

    try {
      const email = req.body.email.toLowerCase();

      let isExists = false;
      let isVerified = false;

      const grocer = await Grocer.findOne({ email: email });

      if (grocer) isExists = true;
      if (grocer && grocer.status === "approved") isVerified = true;

      res.status(200).json({
        status: true,
        isExists,
        isVerified,
      });
    } catch (err) {
      throwErrorMessage(err, res);
    }
  },
];
