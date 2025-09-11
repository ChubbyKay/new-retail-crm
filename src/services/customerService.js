const { v4: uuidv4 } = require("uuid");
const pool = require("../config/database");
class CustomerService {
  
  /**
   * 領取優惠券 (使用悲觀鎖避免併發問題)
   * @param {string} customerId - 客戶UUID
   * @param {string} couponId - 優惠券UUID
   * @returns {Object} 領取結果
   */
  async claimCoupon(customerId, couponId) {
    const client = await pool.connect();
    
    try {
      // 開始事務
      await client.query('BEGIN');
      
      // 使用 SELECT FOR UPDATE 鎖定優惠券資料，避免併發問題
      const couponResult = await client.query(
        'SELECT * FROM coupon WHERE uuid = $1 FOR UPDATE',
        [couponId]
      );
      
      if (couponResult.rows.length === 0) {
        throw new Error('找不到指定的優惠券');
      }
      
      const coupon = couponResult.rows[0];
      
      // 檢查優惠券可用性
      const now = new Date();
      const startDate = new Date(coupon.start_date);
      const endDate = new Date(coupon.end_date);
      
      if (now < startDate) {
        throw new Error('優惠券尚未開始');
      }
      
      if (now > endDate) {
        throw new Error('優惠券已過期');
      }
      
      if (coupon.remaining_count <= 0) {
        throw new Error('優惠券已領完');
      }
      
      // 檢查用戶是否已經領取過此優惠券
      const existingClaim = await client.query(
        'SELECT uuid FROM customer_coupon WHERE customer_id = $1 AND coupon_id = $2',
        [customerId, couponId]
      );
      
      if (existingClaim.rows.length > 0) {
        throw new Error('您已經領取過此優惠券');
      }
      
      // 檢查客戶是否存在
      const customerResult = await client.query(
        'SELECT uuid FROM customer WHERE uuid = $1',
        [customerId]
      );
      
      if (customerResult.rows.length === 0) {
        throw new Error('找不到指定的客戶');
      }
      
      // 建立 customer_coupon 記錄
      const customerCouponUuid = uuidv4();
      const assignedAt = new Date();
      
      await client.query(`
        INSERT INTO customer_coupon (
          uuid, customer_id, coupon_id, status, assigned_at
        ) VALUES ($1, $2, $3, $4, $5)
      `, [customerCouponUuid, customerId, couponId, 'unused', assignedAt]);
      
      // 更新優惠券剩餘數量
      await client.query(
        'UPDATE coupon SET remaining_count = remaining_count - 1, updated_at = $1 WHERE uuid = $2',
        [new Date(), couponId]
      );
      
      // 提交事務
      await client.query('COMMIT');
      
      // 回傳完整的領取結果
      const result = await client.query(`
        SELECT 
          cc.uuid,
          cc.customer_id,
          cc.coupon_id,
          cc.status,
          cc.assigned_at,
          c.name as coupon_name,
          c.type as coupon_type,
          c.description,
          c.threshold_amount,
          c.amount,
          c.discount,
          c.end_date
        FROM customer_coupon cc
        JOIN coupon c ON cc.coupon_id = c.uuid
        WHERE cc.uuid = $1
      `, [customerCouponUuid]);
      
      return result.rows[0];
      
    } catch (error) {
      // 發生錯誤時回滾事務
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new CustomerService();