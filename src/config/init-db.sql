-- 使用 UUID 擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 客戶表
CREATE TABLE customer (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    birthday DATE,
    total_spent DECIMAL(12, 2) DEFAULT 0,
    last_order_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立索引
CREATE INDEX idx_customer_email ON customer(email);
CREATE INDEX idx_customer_total_spent ON customer(total_spent);
CREATE INDEX idx_customer_last_order_date ON customer(last_order_date);

-- 標籤表
CREATE TABLE tag (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 客戶標籤關聯表 
CREATE TABLE customer_tag (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customer(uuid) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tag(uuid) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, tag_id)
);

-- 建立索引
CREATE INDEX idx_customer_tag_customer ON customer_tag(customer_id);
CREATE INDEX idx_customer_tag_tag ON customer_tag(tag_id);

-- 商品表
CREATE TABLE product (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立索引
CREATE INDEX idx_product_category ON product(category);
CREATE INDEX idx_product_price ON product(price);

-- 訂單表
CREATE TABLE "order" (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customer(uuid),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立索引
CREATE INDEX idx_order_customer ON "order"(customer_id);
CREATE INDEX idx_order_status ON "order"(status);
CREATE INDEX idx_order_created_at ON "order"(created_at);

-- 訂單項目表
CREATE TABLE order_item (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES "order"(uuid) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES product(uuid),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立索引
CREATE INDEX idx_order_item_order ON order_item(order_id);
CREATE INDEX idx_order_item_product ON order_item(product_id);

-- 優惠券表
CREATE TABLE coupon (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed_amount')),
    description TEXT,
    threshold_amount DECIMAL(10, 2) DEFAULT 0, -- 最低消費門檻
    amount DECIMAL(10, 2), -- 折扣金額
    discount DECIMAL(5, 2), -- 百分比折扣 (0-100)
    total_count INTEGER NOT NULL CHECK (total_count >= 0), -- 總發行數量
    remaining_count INTEGER NOT NULL CHECK (remaining_count >= 0), -- 剩餘數量
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_dates CHECK (end_date > start_date),
    CONSTRAINT chk_remaining_count CHECK (remaining_count <= total_count)
);

-- 建立索引
CREATE INDEX idx_coupon_type ON coupon(type);
CREATE INDEX idx_coupon_dates ON coupon(start_date, end_date);
CREATE INDEX idx_coupon_remaining_count ON coupon(remaining_count);

-- 客戶優惠券關聯表
CREATE TABLE customer_coupon (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customer(uuid) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES coupon(uuid) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'unused' CHECK (status IN ('unused', 'used', 'expired')),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    UNIQUE(customer_id, coupon_id) -- 防止同一客戶重複領取同一優惠券
);

-- 建立索引
CREATE INDEX idx_customer_coupon_customer ON customer_coupon(customer_id);
CREATE INDEX idx_customer_coupon_coupon ON customer_coupon(coupon_id);
CREATE INDEX idx_customer_coupon_status ON customer_coupon(status);

-- 觸發器函數：更新 updated_at 時間戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為各表建立觸發器
CREATE TRIGGER update_customer_updated_at BEFORE UPDATE ON customer FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tag_updated_at BEFORE UPDATE ON tag FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_tag_updated_at BEFORE UPDATE ON customer_tag FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_updated_at BEFORE UPDATE ON product FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_updated_at BEFORE UPDATE ON "order" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_item_updated_at BEFORE UPDATE ON order_item FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupon_updated_at BEFORE UPDATE ON coupon FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 初始化測試資料
INSERT INTO tag (name, description) VALUES 
('VIP', '高價值客戶'),
('新客戶', '新註冊客戶'),
('活躍用戶', '近期活躍用戶'),
('流失風險', '長期未消費客戶'),
('高消費', '單次消費超過2000元客戶'),
('忠實客戶', '持續回購客戶');

-- 插入產品資料
INSERT INTO product (name, category, price, description) VALUES 
('智慧手錶', '電子產品', 5999.00, '多功能智慧手錶'),
('運動鞋', '服飾配件', 2999.00, '舒適運動鞋'),
('咖啡豆', '食品飲料', 599.00, '精品咖啡豆 1kg'),
('筆記型電腦', '電子產品', 25999.00, '高效能筆記型電腦'),
('保溫杯', '生活用品', 899.00, '316不鏽鋼保溫杯'),
('藍牙耳機', '電子產品', 1899.00, '降噪藍牙耳機');

-- 插入客戶資料 (含不同消費等級和時間分佈)
INSERT INTO customer (name, email, phone, gender, birthday, total_spent, last_order_date) VALUES 
-- 高消費近期活躍客戶
('張三', 'zhang@example.com', '0912345678', 'male', '1990-05-15', 15680.00, CURRENT_TIMESTAMP - INTERVAL '5 days'),
('李四', 'li@example.com', '0923456789', 'female', '1985-08-22', 8750.00, CURRENT_TIMESTAMP - INTERVAL '12 days'),
('王五', 'wang@example.com', '0934567890', 'male', '1992-12-10', 12300.00, CURRENT_TIMESTAMP - INTERVAL '18 days'),

-- 中等消費近期活躍客戶
('陳小明', 'chen@example.com', '0945678901', 'male', '1988-03-20', 3200.00, CURRENT_TIMESTAMP - INTERVAL '8 days'),
('林美麗', 'lin@example.com', '0956789012', 'female', '1993-07-14', 2800.00, CURRENT_TIMESTAMP - INTERVAL '15 days'),
('黃大華', 'huang@example.com', '0967890123', 'male', '1987-11-08', 4500.00, CURRENT_TIMESTAMP - INTERVAL '22 days'),

-- 低消費近期活躍客戶
('吳小芬', 'wu@example.com', '0978901234', 'female', '1995-01-25', 750.00, CURRENT_TIMESTAMP - INTERVAL '7 days'),
('劉志強', 'liu@example.com', '0989012345', 'male', '1991-09-12', 1200.00, CURRENT_TIMESTAMP - INTERVAL '20 days'),

-- 高消費但較久未消費客戶 (35-60天前)
('趙雅雯', 'zhao@example.com', '0990123456', 'female', '1986-04-18', 18900.00, CURRENT_TIMESTAMP - INTERVAL '45 days'),
('錢志豪', 'qian@example.com', '0901234567', 'male', '1983-12-05', 22100.00, CURRENT_TIMESTAMP - INTERVAL '52 days'),

-- 中等消費但較久未消費客戶 (35-90天前)
('孫美惠', 'sun@example.com', '0912345679', 'female', '1989-06-30', 3800.00, CURRENT_TIMESTAMP - INTERVAL '68 days'),
('周建成', 'zhou@example.com', '0923456780', 'male', '1994-02-14', 2650.00, CURRENT_TIMESTAMP - INTERVAL '75 days'),

-- 新客戶 (消費金額較低，但最近有消費)
('吳新客', 'wu_new@example.com', '0934567891', 'female', '1996-08-07', 300.00, CURRENT_TIMESTAMP - INTERVAL '3 days'),
('李新手', 'li_new@example.com', '0945678902', 'male', '1997-10-22', 850.00, CURRENT_TIMESTAMP - INTERVAL '9 days'),

-- 流失風險客戶 (很久沒消費，超過90天)
('古老客', 'gu@example.com', '0956789013', 'male', '1980-01-15', 5200.00, CURRENT_TIMESTAMP - INTERVAL '120 days'),
('舊客戶', 'old@example.com', '0967890124', 'female', '1982-05-28', 8900.00, CURRENT_TIMESTAMP - INTERVAL '150 days');

-- 取得插入的客戶 UUID (用於後續關聯資料)
-- 注意：以下語句需要根據實際產生的 UUID 進行調整，這裡用變數示例

-- 插入訂單資料 (模擬不同時間點的消費記錄)
-- 為了簡化，我們先用子查詢方式插入幾筆訂單

INSERT INTO "order" (customer_id, status, total_amount, created_at) 
SELECT c.uuid, 'delivered', 5999.00, CURRENT_TIMESTAMP - INTERVAL '5 days'
FROM customer c WHERE c.email = 'zhang@example.com'
UNION ALL
SELECT c.uuid, 'delivered', 2999.00, CURRENT_TIMESTAMP - INTERVAL '12 days'
FROM customer c WHERE c.email = 'li@example.com'
UNION ALL
SELECT c.uuid, 'delivered', 1200.00, CURRENT_TIMESTAMP - INTERVAL '8 days'
FROM customer c WHERE c.email = 'chen@example.com'
UNION ALL
SELECT c.uuid, 'delivered', 850.00, CURRENT_TIMESTAMP - INTERVAL '9 days'
FROM customer c WHERE c.email = 'li_new@example.com';

-- 插入客戶標籤關聯 (用於測試標籤篩選功能)
INSERT INTO customer_tag (customer_id, tag_id)
SELECT c.uuid, t.uuid 
FROM customer c, tag t 
WHERE c.email = 'zhang@example.com' AND t.name = 'VIP'
UNION ALL
SELECT c.uuid, t.uuid 
FROM customer c, tag t 
WHERE c.email = 'li@example.com' AND t.name = 'VIP'
UNION ALL
SELECT c.uuid, t.uuid 
FROM customer c, tag t 
WHERE c.email = 'wang@example.com' AND t.name = 'VIP'
UNION ALL
SELECT c.uuid, t.uuid 
FROM customer c, tag t 
WHERE c.email = 'zhao@example.com' AND t.name = 'VIP'
UNION ALL
SELECT c.uuid, t.uuid 
FROM customer c, tag t 
WHERE c.email = 'qian@example.com' AND t.name = 'VIP'
UNION ALL
SELECT c.uuid, t.uuid 
FROM customer c, tag t 
WHERE c.email = 'wu_new@example.com' AND t.name = '新客戶'
UNION ALL
SELECT c.uuid, t.uuid 
FROM customer c, tag t 
WHERE c.email = 'li_new@example.com' AND t.name = '新客戶'
UNION ALL
SELECT c.uuid, t.uuid 
FROM customer c, tag t 
WHERE c.email = 'chen@example.com' AND t.name = '活躍用戶'
UNION ALL
SELECT c.uuid, t.uuid 
FROM customer c, tag t 
WHERE c.email = 'lin@example.com' AND t.name = '活躍用戶'
UNION ALL
SELECT c.uuid, t.uuid 
FROM customer c, tag t 
WHERE c.email = 'gu@example.com' AND t.name = '流失風險'
UNION ALL
SELECT c.uuid, t.uuid 
FROM customer c, tag t 
WHERE c.email = 'old@example.com' AND t.name = '流失風險'
UNION ALL
SELECT c.uuid, t.uuid 
FROM customer c, tag t 
WHERE c.email = 'zhang@example.com' AND t.name = '高消費'
UNION ALL
SELECT c.uuid, t.uuid 
FROM customer c, tag t 
WHERE c.email = 'wang@example.com' AND t.name = '高消費'
UNION ALL
SELECT c.uuid, t.uuid 
FROM customer c, tag t 
WHERE c.email = 'zhao@example.com' AND t.name = '高消費';

-- 插入優惠券資料
INSERT INTO coupon (name, type, description, threshold_amount, amount, discount, total_count, remaining_count, start_date, end_date) VALUES 
('新客戶歡迎券', 'fixed_amount', '新客戶專屬優惠', 1000.00, 200.00, NULL, 100, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'),
('滿千折百', 'fixed_amount', '滿1000元折100元', 1000.00, 100.00, NULL, 500, 500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days'),
('春季九折券', 'percentage', '全館九折優惠', 500.00, NULL, 10.00, 200, 200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '45 days');
