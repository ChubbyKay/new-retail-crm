const customerService = require("../services/customerService");

class MarketingController {
  /**
   * 客戶分群查詢
   * GET /api/marketing/segments
   */
  async getCustomerSegments(req, res, next) {
    try {
      const { minAmount, days, tags } = req.query;

      // 參數轉換和預設值
      const criteria = {
        minAmount: minAmount ? parseFloat(minAmount) : 0,
        days: days ? parseInt(days) : 30,
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      };

      const customers = await customerService.getCustomerSegments(criteria);

      res.json({
        success: true,
        message: "客戶分群查詢成功",
        data: {
          criteria,
          customers,
          totalCount: customers.length,
        },
      });
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Error getting customer segments:`,
        error.message
      );
      next(error);
    }
  }
}

module.exports = new MarketingController();