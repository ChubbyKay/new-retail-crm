const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");
const pool = require("../config/database");

class CouponService {
  /**
   * 創建優惠券
   * @param {Object} couponData - 優惠券資料
   * @returns {Object} 創建的優惠券
   */
  async createCoupon(couponData) {
    const {
      name,
      type,
      description = null,
      threshold_amount = 0,
      amount = null,
      discount = null,
      total_count,
      start_date,
      end_date,
    } = couponData;

    const uuid = uuidv4();
    const remaining_count = total_count;

    const query = `
      INSERT INTO coupon (
        uuid, name, type, description, threshold_amount, 
        amount, discount, total_count, remaining_count,
        start_date, end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      uuid,
      name,
      type,
      description,
      threshold_amount,
      amount,
      discount,
      total_count,
      remaining_count,
      start_date,
      end_date,
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error creating coupon:", error);
      throw error;
    }
  }

  /**
   * 查詢可領取的優惠券列表
   * @param {Object} filters - 查詢條件
   * @returns {Array} 優惠券列表
   */
  async getAvailableCoupons(filters = {}) {
    let query = `
      SELECT 
        uuid,
        name,
        type,
        description,
        threshold_amount,
        amount,
        discount,
        total_count,
        remaining_count,
        start_date,
        end_date,
        created_at,
        updated_at,
        CASE 
          WHEN NOW() < start_date THEN 'pending'
          WHEN NOW() > end_date THEN 'expired'
          WHEN remaining_count <= 0 THEN 'sold_out'
          ELSE 'active'
        END as status
      FROM coupon
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 0;

    // 只顯示未過期且還有剩餘數量的優惠券
    if (filters.onlyAvailable !== false) {
      query += ` AND end_date >= NOW() AND remaining_count > 0`;
    }

    // 按類型篩選
    if (filters.type) {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      values.push(filters.type);
    }

    // 按狀態篩選
    if (filters.status) {
      switch (filters.status) {
        case "active":
          query += ` AND NOW() BETWEEN start_date AND end_date AND remaining_count > 0`;
          break;
        case "pending":
          query += ` AND NOW() < start_date`;
          break;
        case "expired":
          query += ` AND NOW() > end_date`;
          break;
        case "sold_out":
          query += ` AND remaining_count <= 0`;
          break;
      }
    }

    // 排序
    query += ` ORDER BY created_at DESC`;

    // 分頁
    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    if (filters.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(filters.offset);
    }

    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error("Error getting available coupons:", error);
      throw error;
    }
  }
}

module.exports = new CouponService();
