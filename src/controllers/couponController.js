const couponService = require('../services/couponService');

class CouponController {
  /**
   * 創建優惠券
   * POST /api/coupons
   */
  async createCoupon(req, res, next) {
    try {
      const couponData = req.body;
      const newCoupon = await couponService.createCoupon(couponData);

      res.status(201).json({
        success: true,
        message: "優惠券創建成功",
        data: newCoupon,
      });
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Error creating coupon:`,
        error.message
      );
      next(error);
    }
  }

  /**
   * 查詢可領取的優惠券列表
   * GET /api/coupons
   */
  async getCoupons(req, res, next) {
    try {
      const filters = {
        type: req.query.type,
        status: req.query.status,
        onlyAvailable: req.query.onlyAvailable !== "false", // 預設只顯示可用的
        limit: req.query.limit ? parseInt(req.query.limit) : null,
        offset: req.query.offset ? parseInt(req.query.offset) : null,
      };
      const coupons = await couponService.getAvailableCoupons(filters);

      res.json({
        success: true,
        message: "查詢成功",
        data: coupons,
        meta: {
          total: coupons.length,
          filters: filters,
        },
      });
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Error getting coupons:`,
        error.message
      );
      next(error);
    }
  }
}

  module.exports = new CouponController();