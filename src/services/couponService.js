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
}

module.exports = new CouponService();
