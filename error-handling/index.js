module.exports = (app) => {
  // 404 handler
  app.use((req, res, next) => {
    res.status(404).json({ message: "This route does not exist" });
  });

  // error handler
  app.use((err, req, res, next) => {
    console.error("ERROR", req.method, req.path, err);

    if (res.headersSent) return;

    // ✅ JWT errors from express-jwt
    if (err.name === "UnauthorizedError") {
      // credentials_required = no token
      if (err.code === "credentials_required") {
        return res.status(401).json({ message: "Missing authorization token" });
      }
      // invalid_token, revoked_token, etc.
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // ✅ Mongoose bad ObjectId, CastError
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid id format" });
    }

    // ✅ Mongoose validation
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        details: err.errors,
      });
    }

    // ✅ Duplicate key (unique)
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Duplicate field value",
        details: err.keyValue,
      });
    }

    // default 500
    return res.status(500).json({
      message: "Internal server error. Check the server console",
    });
  });
};
