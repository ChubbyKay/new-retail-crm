const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function setupDatabase() {
  try {
    console.log("開始初始化資料庫...");

    // 讀取 SQL 檔案
    const sqlFilePath = path.join(__dirname, "../src/config/init-db.sql");
    const sql = fs.readFileSync(sqlFilePath, "utf8");

    // 執行 SQL
    await pool.query(sql);

    console.log("資料庫初始化成功！");
    console.log("已建立的資料表：");

    // 查詢已建立的資料表
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    tablesResult.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    // 驗證測試資料
    console.log("\n 測試資料統計：");

    const stats = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM customer"),
      pool.query("SELECT COUNT(*) as count FROM product"),
      pool.query("SELECT COUNT(*) as count FROM coupon"),
      pool.query("SELECT COUNT(*) as count FROM tag"),
    ]);

    console.log(`   - 客戶數量: ${stats[0].rows[0].count}`);
    console.log(`   - 商品數量: ${stats[1].rows[0].count}`);
    console.log(`   - 優惠券數量: ${stats[2].rows[0].count}`);
    console.log(`   - 標籤數量: ${stats[3].rows[0].count}`);

    console.log("\n 資料庫準備完成，可以開始開發了！");
  } catch (error) {
    console.error("資料庫初始化失敗：");
    console.error("錯誤詳情：", error.message);

    if (error.code) {
      console.error("錯誤代碼：", error.code);
    }

    // 常見錯誤提示
    if (
      error.message.includes("database") &&
      error.message.includes("does not exist")
    ) {
      console.error("\n 解決方法：請先手動建立資料庫");
      console.error(`   CREATE DATABASE ${process.env.DB_NAME};`);
    } else if (error.message.includes("authentication failed")) {
      console.error("\n 解決方法：請檢查 .env 檔案中的資料庫帳號密碼");
    } else if (error.message.includes("connection refused")) {
      console.error("\n 解決方法：請確認 PostgreSQL 服務是否啟動");
    }

    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 如果直接執行此檔案
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
