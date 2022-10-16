const logReqBody = (req, res, next) => {
  console.log(req.body);
  next();
}

module.exports = logReqBody;