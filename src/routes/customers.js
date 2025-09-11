const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const {
  validateCustomerCouponParams,
  validateUseCoupon,
  validateCustomerId,
} = require("../middleware/validation");

/**
 * @route POST /api/customers/:customerId/coupons/:couponId/claim
 * @desc  領取優惠券
 * @param {string} customerId - 客戶UUID
 * @param {string} couponId - 優惠券UUID
 * @example
 * POST /api/customers/75badad8-1cfb-487d-96b4-6620274e91ae/coupons/5f459f26-1f09-4982-a1f0-3379c31d8032/claim
 */
router.post(
  "/:customerId/coupons/:couponId/claim",
  validateCustomerCouponParams,
  customerController.claimCoupon
);

/**
 * @route POST /api/customers/:customerId/coupons/:customerCouponId/use
 * @desc  使用優惠券
 * @param {string} customerId - 客戶UUID
 * @param {string} customerCouponId - 客戶持有的優惠券記錄UUID
 * @body {object}
 * @body {number} order_amount - 本次訂單的總金額，用於驗證消費門檻
 * @example
 * POST /api/customers/75badad8-1cfb-487d-96b4-6620274e91ae/coupons/efd79d0a-dd0a-438c-a73c-357cf7b076fb/use
 * {
 *    "order_amount": 1500
 * }
 */

router.post(
  '/:customerId/coupons/:customerCouponId/use', 
  validateUseCoupon, 
  customerController.useCoupon
);

/**
 * @route GET /api/customers/:customerId/coupons
 * @desc  查詢指定客戶的所有優惠券狀態
 * @param {string} customerId - 客戶的UUID
 * @query {string} [status] - 篩選優惠券狀態 (unused, used, expired)
 * @query {string} [coupon_type] - 篩選優惠券類型 (percentage, fixed_amount)
 * @query {number} [limit=null] - 回傳的資料筆數上限
 * @query {number} [offset=null] - 資料偏移量，用於分頁
 * @example
 * // 查詢某客戶所有未使用的百分比折扣券
 * GET /api/customers/75badad8-1cfb-487d-96b4-6620274e91ae/coupons?status=unused&coupon_type=percentage
 * 
 * // 查詢某客戶所有優惠券，並進行分頁
 * GET /api/customers/75badad8-1cfb-487d-96b4-6620274e91ae/coupons?limit=10&offset=20
 */
router.get(
  '/:customerId/coupons', 
  validateCustomerId, 
  customerController.getCustomerCoupons
);

module.exports = router;