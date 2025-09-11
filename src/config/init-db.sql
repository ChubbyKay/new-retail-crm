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

-- 初始化測試資料
INSERT INTO tag (name, description) VALUES 
('VIP', '高價值客戶'),
('新客戶', '新註冊客戶'),
('活躍用戶', '近期活躍用戶'),
('流失風險', '長期未消費客戶');

INSERT INTO customer (name, email, phone, gender, birthday) VALUES 
('張三', 'zhang@example.com', '0912345678', 'male', '1990-05-15'),
('李四', 'li@example.com', '0923456789', 'female', '1985-08-22'),
('王五', 'wang@example.com', '0934567890', 'male', '1992-12-10');

INSERT INTO product (name, category, price, description) VALUES 
('智慧手錶', '電子產品', 5999.00, '多功能智慧手錶'),
('運動鞋', '服飾配件', 2999.00, '舒適運動鞋'),
('咖啡豆', '食品飲料', 599.00, '精品咖啡豆 1kg');

INSERT INTO coupon (name, type, description, threshold_amount, amount, discount, total_count, remaining_count, start_date, end_date) VALUES 
('新客戶歡迎券', 'fixed_amount', '新客戶專屬優惠', 1000.00, 200.00, NULL, 100, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'),
('滿千折百', 'fixed_amount', '滿1000元折100元', 1000.00, 100.00, NULL, 500, 500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days'),
('春季九折券', 'percentage', '全館九折優惠', 500.00, NULL, 10.00, 200, 200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '45 days');