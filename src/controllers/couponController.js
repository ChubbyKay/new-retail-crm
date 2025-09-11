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

  /**
   * 查詢特定優惠券詳情
   * GET /api/coupons/:id
   */
  async getCouponById(req, res, next) {
    try {
      const { id } = req.params;
      const coupon = await couponService.getCouponById(id);
      // 檢查優惠券可用性
      const availability = couponService.checkCouponAvailability(coupon);

      res.json({
        success: true,
        message: "查詢成功",
        data: {
          ...coupon,
          availability: availability,
        },
      });
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Error getting coupon by id:`,
        error.message
      );
      next(error);
    }
  }
}

  module.exports = new CouponController();