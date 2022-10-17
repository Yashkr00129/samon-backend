const express = require("express");
const cors = require("cors");

const adminRouter = require("./routes/adminRoutes");
const categoryRouter = require("./routes/categoryRoutes");
const typeRouter = require("./routes/typeRoutes");
const shopperRouter = require("./routes/shopperRoutes");
const vendorRouter = require("./routes/vendorRoutes");
const grocerRouter = require("./routes/grocerRoutes");
const stuffRouter = require("./routes/stuffRoutes");
const restaurantRouter = require("./routes/restaurantRoutes");
const dishRouter = require("./routes/dishRoutes");
const riderRouter = require("./routes/riderRoutes");
const addressRouter = require("./routes/addressRoutes");
const productRouter = require("./routes/productRoutes");
const regionRouter = require("./routes/regionRoutes");
const otherRouter = require("./routes/otherRoutes");

// Start express app
const app = express();

// Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
if (process.env.NODE_ENV !== "production") {
  app.use(cors());
}

// Routes
app.get("/", (req, res) => {
  res.send("<h1>HELLO WORLD!</h1>");
});

// --------------ADMIN ROUTES
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/type", typeRouter);
app.use("/api/v1/region", regionRouter);

// --------------SHOPPER ROUTES
app.use("/api/v1/user/shopper", shopperRouter);
// --------------VENDOR ROUTES
app.use("/api/v1/user/vendor", vendorRouter);
app.use("/api/v1/user/product", productRouter);
// --------------GROCER ROUTES
app.use("/api/v1/user/grocer", grocerRouter);
app.use("/api/v1/user/grocery", stuffRouter);
// --------------RESTAURANT ROUTES
app.use("/api/v1/user/restaurant", restaurantRouter);
app.use("/api/v1/user/dish", dishRouter);
// --------------RIDER ROUTES
app.use("/api/v1/user/rider", riderRouter);
// --------------ADDRESS ROUTES
app.use("/api/v1/user/address", addressRouter);
// --------------OTHER ROUTES
app.use("/api/v1", otherRouter);

app.all("*", (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

module.exports = app;
