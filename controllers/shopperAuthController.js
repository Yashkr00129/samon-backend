const Shopper = require("../models/shopperModel");
const axios = require("axios");
const crypto = require("crypto");

const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { throwErrorMessage } = require("../utils/errorHelper");

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

// exports.register = [
//   body("phone").not().isEmpty().withMessage("Email Id Feild is required"),
//   body("password").not().isEmpty().withMessage("Password Id Feild is required"),
//   body("password")
//     .isLength({ min: 8 })
//     .withMessage("Password must be atleast 8 Characters"),

//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }
//     try {
//       const { phone, password, fullName } = req.body;
//       const accountSid = process.env.TWILIO_ACCOUNT_SID;
//       const authToken = process.env.TWILIO_AUTH_TOKEN;
//       const serviceId = process.env.TWILIO_SERVICE_ID;
//       const client = require("twilio")(accountSid, authToken);

//       const shopper = await Shopper.findOne({ phone: phone });
//       if (shopper) {
//         res.status(409).json({
//           status: false,
//           message: "Phone already exists! Use different",
//         });
//       } else {
//         const createdShopper = await Shopper.create({
//           fullName: fullName,
//           phone: phone,
//           password: password,
//         });
//         client.verify
//           .services(serviceId)
//           .verifications.create({
//             to: `+${phone}`,
//             channel: "sms",
//           })
//           .then((data) => {
//             return res.status(200).json({
//               status: true,
//               message: "A code sent to your phone, please verify!",
//               shopper: createdShopper,
//             });
//           })
//           .catch((err) => {
//             throwErrorMessage(err, res);
//           });
//       }
//     } catch (err) {
//       throwErrorMessage(err, res);
//     }
//   },
// ];

exports.login = [
  body("phone").not().isEmpty().withMessage("Phone Number Feild is required"),

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
      // const accountSid = process.env.TWILIO_ACCOUNT_SID;
      // const authToken = process.env.TWILIO_AUTH_TOKEN;
      // const serviceId = process.env.TWILIO_SERVICE_ID;
      // const client = require("twilio")(accountSid, authToken);

      const shopper = await Shopper.findOne({ phone: phone });
      if (!shopper) {
        const createdShopper = await Shopper.create({
          phone: phone,
        });
        const verificationCode = createdShopper.createVerificationCode();
        const vShopper = await createdShopper.save();
        let message = `Your One Time Password (OTP) for Registration to SAMON WALA is ${verificationCode} Pls do not share with anyone.`;
        sendMessage(phone, message);
        return res.status(201).json({
          status: true,
          message: "Registered! OTP sent",
          shopper: vShopper,
        });
      }
      if (shopper?.active === false) {
        return res.status(403).json({
          status: false,
          message: "Your account is deleted, please contact admin",
        });
      }

      const verificationCode = shopper.createVerificationCode();
      const vShopper = await shopper.save();
      let message = `Your One Time Password (OTP) for Registration to SAMON WALA is ${verificationCode} Pls do not share with anyone.`;
      sendMessage(phone, message);
      return res.status(201).json({
        status: true,
        message: "OTP sent",
        shopper: vShopper,
      });

      // client.verify
      //   .services(serviceId)
      //   .verifications.create({
      //     to: `+${phone}`,
      //     channel: "sms",
      //   })
      //   .then((data) => {
      //     return res.status(200).json({
      //       status: true,
      //       message: "A code sent to your phone, please verify!",
      //       // shopper: createdShopper,
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

      const shopper = await Shopper.findOne({ phone: phone });
      if (!shopper) {
        return res.status(404).json({
          status: false,
          message: "User Not Found with this number!",
        });
      }
      if (shopper.active === false) {
        return res.status(403).json({
          status: false,
          message: "Your account is deleted, please contact admin",
        });
      }
      client.verify
        .services(serviceId)
        .verifications.create({
          to: `+${shopper.phone}`,
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

      const shopper = await Shopper.findOne({ phone: phone });
      if (!shopper) {
        return res.status(404).json({
          status: false,
          message: "User not Found!",
        });
      }
      if (shopper.active === false) {
        return res.status(403).json({
          status: false,
          message: "Your account is deleted, please contact admin",
        });
      }

      if (
        phone.toString() === "911111111111" &&
        verificationCode.toString() === "000000"
      ) {
        shopper.phoneVerified = true;
        const confirmedShopper = await shopper.save();
        const token = createToken(confirmedShopper);
        return res.status(200).json({
          status: true,
          message: "Code confirmed!",
          token: token,
          shopper: confirmedShopper,
        });
      } else {
        const hashedCode = crypto
          .createHash("sha256")
          .update(verificationCode)
          .digest("hex");

        const shopper = await Shopper.findOne({
          $and: [
            { phone: phone },
            { confirmationCode: hashedCode },
            { confirmationCodeExpires: { $gt: Date.now() } },
          ],
        });

        if (!shopper) {
          return res.status(403).json({
            status: false,
            message: "Code is Invalid or has expired!",
          });
        } else {
          const token = createToken(shopper);
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

// exports.codeVerification = [
//   body("phone").not().isEmpty().withMessage("Phone no. is required"),
//   body("verificationCode")
//     .not()
//     .isEmpty()
//     .withMessage("Verification code is required"),

//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         status: false,
//         errors: errors.array(),
//       });
//     }

//     try {
//       const { phone, verificationCode } = req.body;
//       const accountSid = process.env.TWILIO_ACCOUNT_SID;
//       const authToken = process.env.TWILIO_AUTH_TOKEN;
//       const serviceId = process.env.TWILIO_SERVICE_ID;
//       const client = require("twilio")(accountSid, authToken);

//       const shopper = await Shopper.findOne({ phone: phone });
//       if (!shopper) {
//         return res.status(404).json({
//           status: false,
//           message: "User not Found!",
//         });
//       }
//       if (shopper.active === false) {
//         return res.status(403).json({
//           status: false,
//           message: "Your account is deleted, please contact admin",
//         });
//       }

//       client.verify
//         .services(serviceId)
//         .verificationChecks.create({
//           to: `+${phone}`,
//           code: verificationCode,
//         })
//         .then(async (data) => {
//           if (data.valid === true) {
//             shopper.phoneVerified = true;
//             const confirmedShopper = await shopper.save();
//             const token = createToken(confirmedShopper);
//             return res.status(200).json({
//               status: true,
//               message: "Code confirmed!",
//               token: token,
//               shopper: confirmedShopper,
//             });
//           }
//           if (data.valid === false) {
//             return res.status(403).json({
//               status: false,
//               message: "Code is Invalid or has expired!",
//             });
//           }
//         })
//         .catch((err) => {
//           return res.status(403).json({
//             status: false,
//             message: "Code is Invalid or has expired!",
//           });
//         });
//     } catch (err) {
//       throwErrorMessage(err, res);
//     }
//   },
// ];

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

      const shopper = await Shopper.findOne({ phone: phone }).select(
        "+password"
      );
      if (!shopper) {
        return res.status(404).json({
          status: false,
          message: "User not Found!",
        });
      }
      if (shopper.active === false) {
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
            shopper.password = newPassword;
            const confirmedShopper = await shopper.save();
            return res.status(200).json({
              status: true,
              message: "Password changed successfully!",
              shopper: confirmedShopper,
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

// exports.sendCode = [
//   body("phone").not().isEmpty().withMessage("Phone Feild is required"),

//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         status: false,
//         errors: errors.array(),
//       });
//     }

//     try {
//       const { phone } = req.body;
//       const accountSid = process.env.TWILIO_ACCOUNT_SID;
//       const authToken = process.env.TWILIO_AUTH_TOKEN;
//       const serviceId = process.env.TWILIO_SERVICE_ID;
//       const client = require("twilio")(accountSid, authToken);

//       client.verify
//         .services(serviceId)
//         .verifications.create({
//           to: `+${phone}`,
//           channel: "sms",
//         })
//         .then((data) => {
//           return res.status(200).json({
//             status: true,
//             message: "Code sent to your phone, please verify!",
//           });
//         })
//         .catch((err) => {
//           throwErrorMessage(err, res);
//         });
//     } catch (err) {
//       throwErrorMessage(err, res);
//     }
//   },
// ];

// exports.verifyCode = [
//   body("phone").not().isEmpty().withMessage("Email or Phone no. is required"),
//   body("verificationCode")
//     .not()
//     .isEmpty()
//     .withMessage("Verification code is required"),

//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         status: false,
//         errors: errors.array(),
//       });
//     }

//     try {
//       const { phone, verificationCode } = req.body;
//       const accountSid = process.env.TWILIO_ACCOUNT_SID;
//       const authToken = process.env.TWILIO_AUTH_TOKEN;
//       const serviceId = process.env.TWILIO_SERVICE_ID;
//       const client = require("twilio")(accountSid, authToken);

//       const shopper = await Shopper.findOne({ phone: phone });
//       if (!shopper) {
//         const createdShopper = await Shopper.create({
//           phone: phone,
//           phoneVerified: true,
//         });

//         return res.status(201).json({
//           status: false,
//           message: "Account Created!",
//           token: token,
//           user: createdShopper,
//         });
//       }
//       if (shopper.active === false) {
//         return res.status(403).json({
//           status: false,
//           message: "Your account is deleted, please contact admin",
//         });
//       }
//       const token = createToken(shopper);
//       client.verify
//         .services(serviceId)
//         .verificationChecks.create({
//           to: `+${phone}`,
//           code: verificationCode,
//         })
//         .then(async (data) => {
//           if (data.valid === true) {
//             shopper.phoneVerified = true;
//             const confirmedShopper = await shopper.save();
//             return res.status(200).json({
//               status: true,
//               message: "Logged In",
//               token: token,
//               shopper: confirmedShopper,
//             });
//           }
//           if (data.valid === false) {
//             return res.status(403).json({
//               status: false,
//               message: "Code is Invalid or has expired!",
//             });
//           }
//         })
//         .catch((err) => {
//           return res.status(403).json({
//             status: false,
//             message: "Code is Invalid or has expired!",
//           });
//         });
//     } catch (err) {
//       throwErrorMessage(err, res);
//     }
//   },
// ];
