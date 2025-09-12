const customerService = require("../services/customerService");
const smsService = require("../services/smsService");

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

  /**
   * 發送行銷簡訊
   * POST /api/marketing/sms/send
   */
  async sendMarketingSMS(req, res, next) {
    try {
      const { customerUuids, template, criteria } = req.body;

      // 驗證簡訊範本格式
      const templateValidation = smsService.validateTemplate(template);
      if (!templateValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: templateValidation.error,
        });
      }

      let customers = [];

      // 方式1: 直接指定客戶UUID列表
      if (
        customerUuids &&
        Array.isArray(customerUuids) &&
        customerUuids.length > 0
      ) {
        customers = await customerService.getCustomersByUuids(customerUuids);
      }
      // 方式2: 透過篩選條件動態查詢客戶
      else if (criteria) {
        const searchCriteria = {
          minAmount: criteria.minAmount ? parseFloat(criteria.minAmount) : 0,
          days: criteria.days ? parseInt(criteria.days) : 30,
          tags: criteria.tags
            ? Array.isArray(criteria.tags)
              ? criteria.tags
              : [criteria.tags]
            : [],
        };
        customers = await customerService.getCustomerSegments(searchCriteria);
      } else {
        return res.status(400).json({
          success: false,
          message: "請提供客戶UUID列表或篩選條件",
        });
      }

      if (customers.length === 0) {
        return res.status(400).json({
          success: false,
          message: "找不到符合條件的客戶",
        });
      }

      // 發送簡訊
      const sendResult = await smsService.sendMarketingSMS(customers, template);

      res.json({
        success: true,
        message: "簡訊發送完成",
        data: {
          template,
          templateValidation: templateValidation.message,
          sendResult,
        },
      });
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] Error sending marketing SMS:`,
        error.message
      );
      next(error);
    }
  }
}

module.exports = new MarketingController();