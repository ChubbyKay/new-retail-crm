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
}

  module.exports = new CouponController();