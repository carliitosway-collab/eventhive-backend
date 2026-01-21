require("dotenv").config();

const { connectDB } = require("./db");

const express = require("express");

const app = express();
require("./config")(app);

// Each time a request is made, ensure DB is connected
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (e) {
    next(e);
  }
});

const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

require("./error-handling")(app);

module.exports = app;
