module.exports = (app) => {
  // 404
  app.use((req, res) => {
    res.status(404).json({ message: "This route does not exist" });
  });

  // global error handler
  app.use((err, req, res, next) => {
    console.error("ERROR", req.method, req.path, err);

    if (res.headersSent) return;

    // JWT errors
    if (err.name === "UnauthorizedError") {
      if (err.code === "credentials_required") {
        return res.status(401).json({ message: "Missing authorization token" });
      }
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // CastError (ObjectId mal)
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid id format" });
    }

    // Validation
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        details: err.errors,
      });
    }

    // Duplicate key
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Duplicate field value",
        details: err.keyValue,
      });
    }

    return res.status(500).json({
      message: "Internal server error. Check the server console",
    });
  });
};
