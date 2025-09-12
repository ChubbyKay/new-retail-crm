const express = require("express");
const router = express.Router();
const marketingController = require("../controllers/marketingController");
const {
  validateMarketingSegments,
  validateSMSRequest,
} = require("../middleware/validation");

/**
 * @route GET /api/marketing/segments
 * @desc 客戶分群查詢
 * @query {number} minAmount - 最小消費金額 (可選，預設 0)
 * @query {number} days - 近幾天內的消費 (可選，預設 30)
 * @query {string|Array} tags - 客戶標籤 (可選)
 * @example
 * GET /api/marketing/segments?minAmount=500&days=30
 * GET /api/marketing/segments?minAmount=1000&days=90&tags=VIP
 * GET /api/marketing/segments?tags=新客戶&tags=高消費
 */
router.get(
  "/segments",
  validateMarketingSegments,
  marketingController.getCustomerSegments
);

/**
 * @route POST /api/marketing/sms/send
 * @desc 發送行銷簡訊
 * @body {Object} 簡訊發送資料
 * @example
 * POST /api/marketing/sms/send
 * {
 *   "template": "親愛的 {name}，您的累積消費已達 {totalSpent}，感謝您的支持！",
 *   "customerUuids": ["uuid1", "uuid2", "uuid3"]
 * }
 * 
 * 或者使用動態篩選：
 * {
 *   "template": "親愛的 {name}，您的累積消費已達 {totalSpent}，感謝您的支持！",
 *   "criteria": {
 *     "minAmount": 500,
 *     "days": 30,
 *     "tags": ["VIP"]
 *   }
 * }
 */
router.post("/sms/send", validateSMSRequest, marketingController.sendMarketingSMS);

module.exports = router;