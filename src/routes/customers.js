const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const {
  validateCustomerCouponParams,
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

module.exports = router;