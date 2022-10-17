const Shopper = require("../models/shopperModel");
const Vendor = require("../models/vendorModel");
const Restaurant = require("../models/restaurantModel");
const Rider = require("../models/riderModel");
const Grocer = require("../models/grocerModel");
const Address = require("../models/addressModel")

const { throwErrorMessage } = require("../utils/errorHelper");

const multer = require("multer");
const AWS = require("aws-sdk");
require("dotenv/config");

const AWSCredentials = {
  accessKey: process.env.AWS_ID,
  secret: process.env.AWS_SECRET,
  bucketName: process.env.AWS_BUCKET_NAME,
};

const s3 = new AWS.S3({
  accessKeyId: AWSCredentials.accessKey,
  secretAccessKey: AWSCredentials.secret,
});

const storage = multer.memoryStorage({
  destination: function (req, file, cb) {
    cb(null, "");
  },
});

const upload = multer({ storage });

exports.uploadFile = [
  upload.array("files"),
  async (req, res) => {
    let files = req.files;
    let responseData = [];
    files.map((file) => {
      let fileType = file.originalname.split(".")[1];
      let fullDate = new Date();
      let year = fullDate.getFullYear();
      let month = fullDate.getMonth() + 1;
      let day = fullDate.getDate();
      let time = fullDate.getHours();
      let minute = fullDate.getMinutes();
      let second = fullDate.getSeconds();
      let milliSecond = fullDate.getMilliseconds();

      let name = `File_${year}${month}${day}_${time}${minute}${second}${milliSecond}_${Math.random().toString().split(".")[1]
        }.${fileType}`;

      const params = {
        Bucket: AWSCredentials.bucketName,
        Key: name,
        Body: file.buffer,
      };

      s3.upload(params, (err, data) => {
        if (err) {
          return throwErrorMessage(err, res);
        }
        responseData.push(data);
        if (responseData.length === files.length) {
          return res.status(200).json({
            status: true,
            message: "files uploaded successfully",
            data: responseData,
          });
        }
      });
    });
  },
];

exports.getMe = async (req, res) => {
  try {
    let user =
      (await Shopper.findById(req.user._id).populate("address")) ||
      (await Rider.findById(req.user._id).populate("address")) ||
      (await Restaurant.findById(req.user._id).populate("address")) ||
      (await Grocer.findById(req.user._id).populate("address")) ||
      (await Vendor.findById(req.user._id).populate("address"));

    res.status(200).json({
      status: true,
      me: user,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { fullName, phone, profilePicture, selectedAddress } = req.body;

    const user =
      (await Restaurant.findById(req.user._id)) ||
      (await Grocer.findById(req.user._id)) ||
      (await Shopper.findOne({ _id: req.user._id })) ||
      (await Vendor.findOne({ _id: req.user._id }));

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found!",
      });
    }

    if (user.userType === "rider") {
      return res.status(403).json({
        status: false,
        message: "Not for rider",
      });
    }

    if (user.userType === "shopper") {
      user.selectedAddress = selectedAddress;
      user.fullName = fullName ? fullName : user.fullName;
      user.profilePicture = profilePicture
        ? profilePicture
        : user.profilePicture;
    } else {
      user.fullName = fullName ? fullName : user.fullName;
      user.profilePicture = profilePicture
        ? profilePicture
        : user.profilePicture;
      user.phone = phone ? phone : user.phone;
    }

    await user.save();

    res.status(200).json({
      status: true,
      message: "Profile updated successfully!",
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.updateStore = async (req, res) => {
  try {
    const {
      storeName,
      storeRegistration,
      storeAddress,
      pincode,
      fssaiCode,
      storeImage,
      latitude,
      longitude,
    } = req.body;

    const user =
      (await Restaurant.findById(req.user._id)) ||
      (await Grocer.findById(req.user._id)) ||
      (await Vendor.findOne({ _id: req.user._id }));

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found!",
      });
    }

    if (user.userType === "grocer" || user.userType === "restaurant")
      user.fssaiCode = fssaiCode ? fssaiCode : user.fssaiCode;

    user.storeName = storeName ? storeName : user.storeName;
    user.storeRegistration = storeRegistration
      ? storeRegistration
      : user.storeRegistration;
    user.storeAddress = storeAddress ? storeAddress : user.storeAddress;
    user.pincode = pincode ? pincode : user.pincode;
    user.storeImage = storeImage ? storeImage : user.storeImage;
    user.latitude = latitude ? latitude : user.latitude;
    user.longitude = longitude ? longitude : user.longitude;

    await user.save();

    res.status(200).json({
      status: true,
      message: "Profile updated successfully!",
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};

exports.updateMeForRider = async (req, res) => {
  try {
    const {
      fullName,
      profilePicture,
      selectedAddress,
      adhaarFile,
      adhaarCardNumber,
      vechileRegistrationPhoto,
      vechileRegistrationNumber,
      vechileNumber,
    } = req.body;

    const user = await Rider.findById(req.user._id);

    console.log(req.body)

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found!",
      });
    }

    user.selectedAddress = selectedAddress;
    user.fullName = fullName ? fullName : user.fullName;
    user.profilePicture = profilePicture ? profilePicture : user.profilePicture;
    user.adhaarFile = adhaarFile ? adhaarFile : user.adhaarFile;
    user.vechileNumber = vechileNumber ? vechileNumber : user.vechileNumber;
    user.adhaarCardNumber = adhaarCardNumber
      ? adhaarCardNumber
      : user.adhaarCardNumber;
    user.vechileRegistrationPhoto = vechileRegistrationPhoto
      ? vechileRegistrationPhoto
      : user.vechileRegistrationPhoto;
    user.vechileRegistrationNumber = vechileRegistrationNumber
      ? vechileRegistrationNumber
      : user.vechileRegistrationNumber;

    await user.save();

    res.status(200).json({
      status: true,
      message: "Profile updated successfully!",
      user,
    });
  } catch (err) {
    throwErrorMessage(err, res);
  }
};
