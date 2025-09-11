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

/**
 * @route GET /api/coupons
 * @desc 查詢可領取的優惠券列表
 * @query {string} [type] - 優惠券類型 (percentage/fixed_amount)
 * @query {string} [status] - 優惠券狀態 (active/pending/expired/sold_out)
 * @query {boolean} [onlyAvailable=true] - 是否只顯示可用的優惠券
 * @query {number} [limit] - 每頁數量
 * @query {number} [offset] - 偏移量
 * @example
 * GET /api/coupons?type=fixed_amount&limit=10&offset=0
 */
router.get('/', couponController.getCoupons);

/**
 * @route GET /api/coupons/:id
 * @desc 查詢特定優惠券詳情
 * @param {string} id - 優惠券UUID
 * @example
 * GET /api/coupons/123e4567-e89b-12d3-a456-426614174000
 */
router.get('/:id', validateUUID, couponController.getCouponById);

module.exports = router;