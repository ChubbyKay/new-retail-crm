class SmsService {
  /**
   * 發送行銷簡訊給客戶群
   * @param {Array} customers - 客戶列表
   * @param {string} template - 簡訊範本 (支援動態變數)
   * @returns {Object} 發送結果統計
   */
  async sendMarketingSMS(customers, template) {
    if (!customers || customers.length === 0) {
      throw new Error("客戶列表不能為空");
    }

    if (!template || template.trim() === "") {
      throw new Error("簡訊範本不能為空");
    }

    const results = {
      totalCount: customers.length,
      successCount: 0,
      failCount: 0,
      details: [],
    };

    for (const customer of customers) {
      try {
        // 替換範本中的動態變數
        const personalizedMessage = this.replaceTemplateVariables(
          template,
          customer
        );

        // 模擬發送簡訊 (實際專案中這裡會串接真實的簡訊服務商 API)
        const sendResult = await this.simulateSMSSend(
          customer.phone,
          personalizedMessage
        );

        results.details.push({
          customerUuid: customer.uuid,
          customerName: customer.name,
          phone: customer.phone,
          message: personalizedMessage,
          status: sendResult.success ? "success" : "failed",
          error: sendResult.error || null,
        });

        if (sendResult.success) {
          results.successCount++;
        } else {
          results.failCount++;
        }
      } catch (error) {
        console.error(`Error sending SMS to customer ${customer.uuid}:`, error);
        results.failCount++;
        results.details.push({
          customerUuid: customer.uuid,
          customerName: customer.name,
          phone: customer.phone,
          status: "failed",
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * 替換範本中的動態變數
   * @param {string} template - 簡訊範本
   * @param {Object} customer - 客戶資料
   * @returns {string} 個人化後的訊息
   */
  replaceTemplateVariables(template, customer) {
    let message = template;

    // 支援的動態變數
    const variables = {
      "{name}": customer.name || "顧客",
      "{totalSpent}": customer.total_spent
        ? `${customer.total_spent}元`
        : "0元",
      "{lastOrderDate}": customer.last_order_date
        ? new Date(customer.last_order_date).toLocaleDateString("zh-TW")
        : "暫無紀錄",
    };

    // 替換所有動態變數
    Object.keys(variables).forEach((key) => {
      message = message.replace(
        new RegExp(key.replace(/[{}]/g, "\\$&"), "g"),
        variables[key]
      );
    });

    return message;
  }

  /**
   * 模擬簡訊發送 (實際專案中會替換成真實的 API 呼叫)
   * @param {string} phone - 手機號碼
   * @param {string} message - 訊息內容
   * @returns {Object} 發送結果
   */
  async simulateSMSSend(phone, message) {
    // 模擬網路延遲
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 簡單的手機號碼格式驗證
    const phoneRegex = /^[\d\-\+\(\)\s]+$/;
    if (!phone || !phoneRegex.test(phone)) {
      return {
        success: false,
        error: "手機號碼格式不正確",
      };
    }

    // 模擬 95% 成功率
    const isSuccess = Math.random() > 0.05;

    if (isSuccess) {
      console.log(`[SMS] 發送成功 - ${phone}: ${message}`);
      return { success: true };
    } else {
      return {
        success: false,
        error: "網路異常，發送失敗",
      };
    }
  }

    /**
     * 驗證簡訊範本格式
     * @param {string} template - 簡訊範本
     * @returns {Object} 驗證結果
     */
    validateTemplate(template) {
      if (!template || typeof template !== "string") {
        return {
          isValid: false,
          error: "範本不能為空且必須為字串格式",
        };
      }

      if (template.trim().length === 0) {
        return {
          isValid: false,
          error: "範本內容不能為空",
        };
      }

      if (template.length > 160) {
        return {
          isValid: false,
          error: "簡訊內容不能超過 160 字元",
        };
      }

      // 檢查是否包含支援的動態變數
      const supportedVariables = ["{name}", "{totalSpent}", "{lastOrderDate}"];
      const foundVariables = [];

      supportedVariables.forEach((variable) => {
        if (template.includes(variable)) {
          foundVariables.push(variable);
        }
      });

      return {
        isValid: true,
        foundVariables,
        message: `範本驗證通過，找到 ${
          foundVariables.length
        } 個動態變數: ${foundVariables.join(", ")}`,
      };
    }
}

module.exports = new SmsService();