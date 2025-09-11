const express = require("express");
const errorHandler = require("./middleware/errorHandler");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 基本路由
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to NEW RETAIL CRM",
    status: "success",
    timestamp: new Date().toISOString(),
  });
});

// 健康檢查端點
app.get("/health", async (req, res) => {
  try {
    const pool = require("./config/database");
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "healthy",
      database: "connected",
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
    });
  }
});

// 引入路由模組
const couponRoutes = require("./routes/coupons");
const customerRoutes = require("./routes/customers");

// 使用路由
app.use("/api/coupons", couponRoutes);
app.use("/api/customers", customerRoutes);

// 404 處理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// 全域錯誤處理中介軟體
app.use(errorHandler);

module.exports = app;
