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
      await client.query("BEGIN");

      // 使用 SELECT FOR UPDATE 鎖定優惠券資料，避免併發問題
      const couponResult = await client.query(
        "SELECT * FROM coupon WHERE uuid = $1 FOR UPDATE",
        [couponId]
      );

      if (couponResult.rows.length === 0) {
        throw new Error("找不到指定的優惠券");
      }

      const coupon = couponResult.rows[0];

      // 檢查優惠券可用性
      const now = new Date();
      const startDate = new Date(coupon.start_date);
      const endDate = new Date(coupon.end_date);

      if (now < startDate) {
        throw new Error("優惠券尚未開始");
      }

      if (now > endDate) {
        throw new Error("優惠券已過期");
      }

      if (coupon.remaining_count <= 0) {
        throw new Error("優惠券已領完");
      }

      // 檢查用戶是否已經領取過此優惠券
      const existingClaim = await client.query(
        "SELECT uuid FROM customer_coupon WHERE customer_id = $1 AND coupon_id = $2",
        [customerId, couponId]
      );

      if (existingClaim.rows.length > 0) {
        throw new Error("您已經領取過此優惠券");
      }

      // 檢查客戶是否存在
      const customerResult = await client.query(
        "SELECT uuid FROM customer WHERE uuid = $1",
        [customerId]
      );

      if (customerResult.rows.length === 0) {
        throw new Error("找不到指定的客戶");
      }

      // 建立 customer_coupon 記錄
      const customerCouponUuid = uuidv4();
      const assignedAt = new Date();

      await client.query(
        `
        INSERT INTO customer_coupon (
          uuid, customer_id, coupon_id, status, assigned_at
        ) VALUES ($1, $2, $3, $4, $5)
      `,
        [customerCouponUuid, customerId, couponId, "unused", assignedAt]
      );

      // 更新優惠券剩餘數量
      await client.query(
        "UPDATE coupon SET remaining_count = remaining_count - 1, updated_at = $1 WHERE uuid = $2",
        [new Date(), couponId]
      );

      // 提交事務
      await client.query("COMMIT");

      // 回傳完整的領取結果
      const result = await client.query(
        `
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
      `,
        [customerCouponUuid]
      );

      return result.rows[0];
    } catch (error) {
      // 發生錯誤時回滾事務
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 使用優惠券
   * @param {string} customerId - 客戶UUID
   * @param {string} customerCouponId - 客戶優惠券UUID
   * @param {number} orderAmount - 訂單金額 (用於驗證門檻)
   * @returns {Object} 使用結果
   */
  async useCoupon(customerId, customerCouponId, orderAmount = 0) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 查詢客戶優惠券詳情 (使用 FOR UPDATE 鎖定)
      const result = await client.query(
        `
        SELECT 
          cc.*,
          c.name as coupon_name,
          c.type as coupon_type,
          c.threshold_amount,
          c.amount,
          c.discount,
          c.end_date
        FROM customer_coupon cc
        JOIN coupon c ON cc.coupon_id = c.uuid
        WHERE cc.uuid = $1 AND cc.customer_id = $2
        FOR UPDATE
      `,
        [customerCouponId, customerId]
      );

      if (result.rows.length === 0) {
        throw new Error("找不到指定的優惠券或您沒有權限使用");
      }

      const customerCoupon = result.rows[0];

      // 檢查優惠券狀態
      if (customerCoupon.status === "used") {
        throw new Error("優惠券已使用");
      }

      if (customerCoupon.status === "expired") {
        throw new Error("優惠券已過期");
      }

      // 檢查是否過期
      const now = new Date();
      const endDate = new Date(customerCoupon.end_date);

      if (now > endDate) {
        // 自動標記為過期
        await client.query(
          "UPDATE customer_coupon SET status = $1 WHERE uuid = $2",
          ["expired", customerCouponId]
        );
        throw new Error("優惠券已過期");
      }

      // 檢查門檻金額
      if (
        customerCoupon.threshold_amount > 0 &&
        orderAmount < customerCoupon.threshold_amount
      ) {
        throw new Error(
          `訂單金額須達到 ${customerCoupon.threshold_amount} 元才能使用此優惠券`
        );
      }

      // 計算折扣金額
      let discountAmount = 0;
      if (customerCoupon.coupon_type === "fixed_amount") {
        discountAmount = customerCoupon.amount;
      } else if (customerCoupon.coupon_type === "percentage") {
        discountAmount = Math.round(
          orderAmount * (customerCoupon.discount / 100)
        );
      }

      // 更新優惠券狀態為已使用
      const usedAt = new Date();
      await client.query(
        "UPDATE customer_coupon SET status = $1, used_at = $2 WHERE uuid = $3",
        ["used", usedAt, customerCouponId]
      );

      await client.query("COMMIT");

      return {
        customer_coupon_id: customerCouponId,
        coupon_name: customerCoupon.coupon_name,
        coupon_type: customerCoupon.coupon_type,
        discount_amount: discountAmount,
        order_amount: orderAmount,
        final_amount: Math.max(0, orderAmount - discountAmount),
        used_at: usedAt,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 查詢用戶所有優惠券狀態
   * @param {string} customerId - 客戶UUID
   * @param {Object} filters - 篩選條件
   * @returns {Array} 優惠券列表
   */
  async getCustomerCoupons(customerId, filters = {}) {
    let query = `
      SELECT 
        cc.uuid,
        cc.customer_id,
        cc.coupon_id,
        cc.status,
        cc.assigned_at,
        cc.used_at,
        c.name as coupon_name,
        c.type as coupon_type,
        c.description,
        c.threshold_amount,
        c.amount,
        c.discount,
        c.end_date,
        CASE 
          WHEN cc.status = 'used' THEN 'used'
          WHEN cc.status = 'expired' OR NOW() > c.end_date THEN 'expired'
          ELSE 'unused'
        END as computed_status
      FROM customer_coupon cc
      JOIN coupon c ON cc.coupon_id = c.uuid
      WHERE cc.customer_id = $1
    `;

    const values = [customerId];
    let paramCount = 1;

    // 按狀態篩選
    if (filters.status) {
      if (filters.status === "expired") {
        query += ` AND (cc.status = 'expired' OR NOW() > c.end_date)`;
      } else {
        paramCount++;
        query += ` AND cc.status = $${paramCount}`;
        values.push(filters.status);
      }
    }

    // 按優惠券類型篩選
    if (filters.coupon_type) {
      paramCount++;
      query += ` AND c.type = $${paramCount}`;
      values.push(filters.coupon_type);
    }

    // 排序：未使用的在前面，按領取時間倒序
    query += ` ORDER BY 
      CASE cc.status 
        WHEN 'unused' THEN 1 
        WHEN 'used' THEN 2 
        ELSE 3 
      END, 
      cc.assigned_at DESC
    `;

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
      // 首先檢查客戶是否存在
      const customerCheck = await pool.query(
        "SELECT uuid FROM customer WHERE uuid = $1",
        [customerId]
      );

      if (customerCheck.rows.length === 0) {
        throw new Error("找不到指定的客戶");
      }

      const result = await pool.query(query, values);

      // 自動更新過期的優惠券狀態
      await pool.query(
        `
        UPDATE customer_coupon cc
        SET status = 'expired'
        FROM coupon c 
        WHERE cc.coupon_id = c.uuid 
          AND cc.customer_id = $1 
          AND cc.status = 'unused' 
          AND NOW() > c.end_date
      `,
        [customerId]
      );

      return result.rows;
    } catch (error) {
      console.error("Error getting customer coupons:", error);
      throw error;
    }
  }
}

module.exports = new CustomerService();