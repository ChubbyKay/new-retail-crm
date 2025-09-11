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

  /**
   * 查詢用戶所有優惠券狀態
   * GET /api/customers/:customerId/coupons
   */
  async getCustomerCoupons(req, res, next) {
    try {
      const { customerId } = req.params;
      const filters = {
        status: req.query.status,
        coupon_type: req.query.coupon_type,
        limit: req.query.limit ? parseInt(req.query.limit) : null,
        offset: req.query.offset ? parseInt(req.query.offset) : null,
      };

      const coupons = await customerService.getCustomerCoupons(
        customerId,
        filters
      );

      // 統計各狀態數量
      const statusCount = {
        unused: 0,
        used: 0,
        expired: 0,
      };

      coupons.forEach((coupon) => {
        statusCount[coupon.computed_status] =
          (statusCount[coupon.computed_status] || 0) + 1;
      });

      res.json({
        success: true,
        message: "查詢成功",
        data: coupons,
        meta: {
          total: coupons.length,
          status_count: statusCount,
          filters: filters,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();