const customerService = require('../services/customerService');

class CustomerController {
  /**
   * 領取優惠券
   * POST /api/customers/:customerId/coupons/:couponId/claim
   */
  async claimCoupon(req, res, next) {
    try {
      const { customerId, couponId } = req.params;

      const result = await customerService.claimCoupon(customerId, couponId);

      res.status(201).json({
        success: true,
        message: "優惠券領取成功",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 使用優惠券
   * POST /api/customers/:customerId/coupons/:customerCouponId/use
   */
  async useCoupon(req, res, next) {
    try {
      const { customerId, customerCouponId } = req.params;
      const { order_amount = 0 } = req.body;

      const result = await customerService.useCoupon(
        customerId,
        customerCouponId,
        order_amount
      );

      res.json({
        success: true,
        message: "優惠券使用成功",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();