const AWS = require("aws-sdk");
const { throwErrorMessage } = require("./errorHelper");

const AWSCredentials = {
  accessKey: process.env.AWS_ID,
  secret: process.env.AWS_SECRET,
  bucketName: process.env.AWS_BUCKET_NAME,
};

const s3 = new AWS.S3({
  accessKeyId: AWSCredentials.accessKey,
  secretAccessKey: AWSCredentials.secret,
});

exports.deleteFile = async (fileName) => {
  const key = fileName.replace(process.env.S3FileBaseUrl, "");
  console.log(key);
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  return new Promise((resolve, reject) => {
    s3.deleteObject(params, function (err, data) {
      if (err) {
        console.log(err);
      } else resolve();
    });
  });
};
