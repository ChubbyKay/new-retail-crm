const { body, param, query, validationResult } = require("express-validator");

// 驗證結果處理中介軟體
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// 創建優惠券驗證規則
const validateCreateCoupon = [
  body("name")
    .notEmpty()
    .withMessage("優惠券名稱不能為空")
    .isLength({ min: 1, max: 100 })
    .withMessage("優惠券名稱長度應在1-100字之間"),

  body("type")
    .isIn(["percentage", "fixed_amount"])
    .withMessage("優惠券類型只能是 percentage 或 fixed_amount"),

  body("description").optional(),

  body("threshold_amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("門檻金額必須大於等於0"),

  body("amount")
    .if(body("type").equals("fixed_amount"))
    .notEmpty()
    .withMessage("固定金額優惠券必須填寫 amount 欄位")
    .isFloat({ min: 0.01 })
    .withMessage("折扣金額必須大於0"),

  body("discount")
    .if(body("type").equals("percentage"))
    .notEmpty()
    .withMessage("百分比優惠券必須填寫 discount 欄位")
    .isFloat({ min: 0.01, max: 100 })
    .withMessage("折扣比例必須在0.01-100之間"),

  body("amount")
    .if(body("type").equals("percentage"))
    .isEmpty()
    .withMessage("百分比優惠券不應填寫 amount 欄位"),

  body("discount")
    .if(body("type").equals("fixed_amount"))
    .isEmpty()
    .withMessage("固定金額優惠券不應填寫 discount 欄位"),

  body("total_count").isInt({ min: 1 }).withMessage("總數量必須大於0"),

  body("start_date").isISO8601().withMessage("開始日期格式錯誤"),

  body("end_date")
    .isISO8601()
    .withMessage("結束日期格式錯誤")
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.start_date)) {
        throw new Error("結束日期必須晚於開始日期");
      }
      return true;
    }),

  handleValidationErrors,
];

// UUID 參數驗證
const validateUUID = [
  param("id").isUUID().withMessage("無效的優惠券ID格式"),
  handleValidationErrors,
];

// 客戶ID和優惠券ID驗證
const validateCustomerCouponParams = [
  param('customerId')
    .isUUID()
    .withMessage('無效的客戶ID格式'),
  param('couponId')
    .isUUID()
    .withMessage('無效的優惠券ID格式'),
  handleValidationErrors
];

// 使用優惠券驗證規則
const validateUseCoupon = [
  param('customerId')
    .isUUID()
    .withMessage('無效的客戶ID格式'),
  param('customerCouponId')
    .isUUID()
    .withMessage('無效的客戶優惠券ID格式'),
  body('order_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('訂單金額必須是個大於等於0的數字'),
  handleValidationErrors
];

// 客戶ID驗證
const validateCustomerId = [
  param('customerId')
    .isUUID()
    .withMessage('無效的客戶ID格式'),
  handleValidationErrors
];

// 客戶分群查詢參數驗證
const validateMarketingSegments = [
  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('最小消費金額必須為非負數字'),
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('天數必須為 1-365 之間的整數'),
  query('tags')
    .optional()
    .custom((value) => {
      // tags 可以是字串或字串陣列
      if (Array.isArray(value)) {
        for (const tag of value) {
          if (typeof tag !== 'string' || tag.trim().length === 0) {
            throw new Error('標籤必須為非空字串');
          }
        }
      } else if (typeof value === 'string') {
        if (value.trim().length === 0) {
          throw new Error('標籤不能為空字串');
        }
      } else {
        throw new Error('標籤格式不正確');
      }
      return true;
    }),
  handleValidationErrors
];

// 簡訊發送請求驗證
const validateSMSRequest = [
  body('template')
    .notEmpty()
    .withMessage('簡訊範本不能為空')
    .isLength({ max: 160 })
    .withMessage('簡訊內容不能超過 160 字元'),
  body('customerUuids')
    .optional()
    .isArray()
    .withMessage('客戶UUID列表必須為陣列格式')
    .custom((value) => {
      if (value && value.length === 0) {
        throw new Error('客戶UUID列表不能為空');
      }
      if (value) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        for (const uuid of value) {
          if (!uuidRegex.test(uuid)) {
            throw new Error(`無效的客戶UUID格式: ${uuid}`);
          }
        }
      }
      return true;
    }),
  body('criteria')
    .optional()
    .isObject()
    .withMessage('篩選條件必須為物件格式'),
  body('criteria.minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('篩選條件中的最小消費金額必須為非負數字'),
  body('criteria.days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('篩選條件中的天數必須為 1-365 之間的整數'),
  body('criteria.tags')
    .optional()
    .isArray()
    .withMessage('篩選條件中的標籤必須為陣列格式')
    .custom((value) => {
      if (value) {
        for (const tag of value) {
          if (typeof tag !== 'string' || tag.trim().length === 0) {
            throw new Error('篩選條件中的標籤必須為非空字串');
          }
        }
      }
      return true;
    }),
  // 自訂驗證：必須提供 customerUuids 或 criteria 其中之一
  body()
    .custom((value) => {
      if (!value.customerUuids && !value.criteria) {
        throw new Error('請提供客戶UUID列表或篩選條件');
      }
      return true;
    }),
  handleValidationErrors
];

module.exports = {
  validateCreateCoupon,
  validateUUID,
  validateCustomerCouponParams,
  validateUseCoupon,
  validateCustomerId,
  validateMarketingSegments,
  validateSMSRequest,
};