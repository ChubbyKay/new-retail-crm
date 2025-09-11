const express = require("express");
const router = express.Router();
const couponController = require("../controllers/couponController");
const {
  validateCreateCoupon,
  validateUUID,
} = require("../middleware/validation");

/**
 * @route POST /api/coupons
 * @desc 創建新優惠券
 * @body {Object} 優惠券資料
 * @example
 * POST /api/coupons
 * {
 *   "name": "新年優惠券",
 *   "type": "fixed",
 *   "description": "滿1000減100",
 *   "threshold_amount": 1000,
 *   "amount": 100,
 *   "total_count": 1000,
 *   "start_date": "2024-01-01T00:00:00Z",
 *   "end_date": "2024-01-31T23:59:59Z"
 * }
 */
router.post("/", validateCreateCoupon, couponController.createCoupon);

module.exports = router;