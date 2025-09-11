const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const {
  validateCustomerCouponParams,
  validateUseCoupon,
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


module.exports = router;