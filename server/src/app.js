/**
 * Smart City Complaint Management System - Backend
 * Main Express Application Setup
 */

const connectDB = require("./config/connectDB");
const { startSlaCheckScheduler } = require("./services/slaService");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const express = require("express");
const cors = require("cors");

// Import routes
const authRoutes = require("./routes/auth");
const requestRoutes = require("./routes/requests");
const allocationRoutes = require("./routes/allocations");
const providerRoutes = require("./routes/providers");
const adminLogsRoutes = require("./routes/adminLogs");
const operatorRoutes = require("./routes/operator");

const app = express();

// ============================================
// SECURITY & CORS MIDDLEWARE
// ============================================
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // Allow cookies if using session-based auth
    optionsSuccessStatus: 200,
  }),
);

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  next();
});

// ============================================
// BODY PARSER MIDDLEWARE
// ============================================
app.use(express.json({ limit: "5mb" })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// ============================================
// REQUEST LOGGING (Optional)
// ============================================
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server running",
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Request & Allocation routes
app.use("/api/requests", requestRoutes);
app.use("/api/allocations", allocationRoutes);
// Provider & Service routes
app.use("/api/providers", providerRoutes);
app.use("/api/admin", adminLogsRoutes);
app.use("/api/operator", operatorRoutes);

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
  });
});

// ============================================
// ERROR HANDLER (Global)
// ============================================
app.use((err, req, res, next) => {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
    code: err.code || "INTERNAL_ERROR",
  });
});

// ============================================
// SERVER INITIALIZATION
// ============================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    console.log("Database connected successfully");
    startSlaCheckScheduler();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
