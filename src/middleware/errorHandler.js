const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error: ${err.message}`);
  console.error(err.stack);

  // 預設錯誤回應
  let error = {
    success: false,
    message: err.message || "Internal Server Error",
  };

  // 根據錯誤類型設定狀態碼
  let statusCode = 500;

  if (err.name === "ValidationError") {
    statusCode = 400;
  } else if (err.name === "UnauthorizedError") {
    statusCode = 401;
  } else if (
    err.message.includes("not found") ||
    err.message.includes("找不到")
  ) {
    statusCode = 404;
  } else if (
    err.message.includes("already exists") ||
    err.message.includes("已存在")
  ) {
    statusCode = 409;
  }

  // PostgreSQL 錯誤處理
  if (err.code) {
    switch (err.code) {
      case "23505": // unique_violation
        statusCode = 409;
        error.message = "資料已存在，違反唯一性約束";
        break;
      case "23503": // foreign_key_violation
        statusCode = 400;
        error.message = "外鍵約束錯誤";
        break;
      case "23502": // not_null_violation
        statusCode = 400;
        error.message = "必填欄位不能為空";
        break;
      default:
        error.message = "資料庫操作失敗";
    }
  }

  res.status(statusCode).json(error);
};

module.exports = errorHandler;
