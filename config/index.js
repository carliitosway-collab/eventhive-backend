const express = require("express");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");

/**
 * ORIGIN puede venir como:
 * ORIGIN=http://localhost:5173
 * o múltiples:
 * ORIGIN=http://localhost:5173,https://eventhive-flame.vercel.app
 */
function parseOrigins(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

module.exports = (app) => {
  app.set("trust proxy", 1);

  const envOrigins = parseOrigins(process.env.ORIGIN);

  // Defaults seguros para DEV local + frontend deployado
  const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://eventhive-flame.vercel.app",
  ];

  const allowedOrigins = envOrigins.length ? envOrigins : defaultOrigins;

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );

  app.use(logger("dev"));

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use(cookieParser());
};
