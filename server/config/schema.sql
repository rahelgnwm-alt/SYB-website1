-- ============================================================
-- SYB OFFICIAL STORE - FULL RELATIONAL DATABASE SCHEMA
-- PT Sheva Jordan Bersama
-- Compatible with MySQL 8.x / MariaDB 10.x & SQLite 3
-- ============================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'customer',
  `avatar` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. USER ADDRESSES
CREATE TABLE IF NOT EXISTS `user_addresses` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `label` VARCHAR(50) DEFAULT 'Rumah',
  `recipient_name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `street` TEXT NOT NULL,
  `subdistrict` VARCHAR(100) DEFAULT NULL,
  `city` VARCHAR(100) NOT NULL,
  `province` VARCHAR(100) NOT NULL,
  `postal_code` VARCHAR(20) NOT NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `note` VARCHAR(255) DEFAULT NULL,
  `category_label` VARCHAR(50) NOT NULL,
  `image` TEXT DEFAULT NULL,
  `display_order` INT NOT NULL DEFAULT 0
);

-- 4. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `subtitle` TEXT DEFAULT NULL,
  `handle` VARCHAR(255) NOT NULL UNIQUE,
  `category` VARCHAR(100) NOT NULL,
  `category_label` VARCHAR(50) NOT NULL,
  `product_type` VARCHAR(50) NOT NULL,
  `price` DECIMAL(12, 2) NOT NULL,
  `original_price` DECIMAL(12, 2) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'Active',
  `inventory` INT NOT NULL DEFAULT 100,
  `badge` VARCHAR(50) DEFAULT NULL,
  `image` TEXT NOT NULL,
  `gallery` LONGTEXT DEFAULT NULL,
  `description` LONGTEXT DEFAULT NULL,
  `key_benefits` LONGTEXT DEFAULT NULL,
  `key_ingredients` LONGTEXT DEFAULT NULL,
  `how_to_use` LONGTEXT DEFAULT NULL,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `is_flash_sale` TINYINT(1) NOT NULL DEFAULT 0,
  `flash_sale_price` DECIMAL(12, 2) DEFAULT NULL,
  `flash_sale_discount` INT DEFAULT NULL,
  `flash_sale_quota` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS `product_variants` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `product_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `price` DECIMAL(12, 2) NOT NULL,
  `sku` VARCHAR(100) DEFAULT NULL,
  `stock` INT NOT NULL DEFAULT 50
);

-- 6. PRODUCT REVIEWS
CREATE TABLE IF NOT EXISTS `product_reviews` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `product_id` VARCHAR(64) NOT NULL,
  `author` VARCHAR(100) NOT NULL,
  `avatar` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `rating` INT NOT NULL DEFAULT 5,
  `comment` TEXT NOT NULL,
  `verified` TINYINT(1) NOT NULL DEFAULT 1,
  `skin_type` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. FLASH SALE SETTINGS
CREATE TABLE IF NOT EXISTS `flash_sale_settings` (
  `id` INT NOT NULL PRIMARY KEY DEFAULT 1,
  `is_master_active` TINYINT(1) NOT NULL DEFAULT 1,
  `end_hour` INT NOT NULL DEFAULT 24,
  `end_minute` INT NOT NULL DEFAULT 0,
  `title` VARCHAR(255) NOT NULL DEFAULT 'Flash Sale Glowing Spesial',
  `subtitle` VARCHAR(255) NOT NULL DEFAULT 'Penawaran Terbatas Hari Ini',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. FLASH SALE SESSIONS
CREATE TABLE IF NOT EXISTS `flash_sale_sessions` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `subtitle` VARCHAR(255) DEFAULT NULL,
  `start_date` VARCHAR(20) NOT NULL,
  `start_time` VARCHAR(10) NOT NULL,
  `end_date` VARCHAR(20) NOT NULL,
  `end_time` VARCHAR(10) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. FLASH SALE SESSION ITEMS
CREATE TABLE IF NOT EXISTS `flash_sale_items` (
  `id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `session_id` VARCHAR(64) NOT NULL,
  `product_id` VARCHAR(64) NOT NULL,
  `discount_percent` INT NOT NULL DEFAULT 50,
  `flash_sale_price` DECIMAL(12, 2) NOT NULL,
  `quota` INT NOT NULL DEFAULT 50,
  `sold` INT NOT NULL DEFAULT 0
);

-- 10. RESELLER PRODUCTS & WHOLESALE PACKAGES
CREATE TABLE IF NOT EXISTS `reseller_products` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `badge` VARCHAR(50) DEFAULT NULL,
  `image` TEXT NOT NULL,
  `min_order_qty` INT NOT NULL DEFAULT 12,
  `wholesale_price` DECIMAL(12, 2) NOT NULL,
  `retail_price` DECIMAL(12, 2) NOT NULL,
  `profit_margin` INT NOT NULL DEFAULT 35,
  `description` TEXT DEFAULT NULL,
  `features` LONGTEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. RESELLER APPLICATIONS
CREATE TABLE IF NOT EXISTS `reseller_applications` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `province` VARCHAR(100) NOT NULL,
  `business_type` VARCHAR(100) NOT NULL,
  `experience` VARCHAR(100) DEFAULT NULL,
  `social_media` VARCHAR(150) DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. DISCOUNT COUPONS & VOUCHERS
CREATE TABLE IF NOT EXISTS `discounts` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) DEFAULT NULL,
  `discount_type` VARCHAR(20) NOT NULL DEFAULT 'percentage',
  `discount_value` DECIMAL(12, 2) NOT NULL,
  `min_spend` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `max_discount` DECIMAL(12, 2) DEFAULT NULL,
  `usage_limit` INT NOT NULL DEFAULT 100,
  `used_count` INT NOT NULL DEFAULT 0,
  `start_date` VARCHAR(20) DEFAULT NULL,
  `end_date` VARCHAR(20) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13. ORDERS TABLE
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` VARCHAR(64) DEFAULT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `customer_email` VARCHAR(150) NOT NULL,
  `customer_phone` VARCHAR(50) NOT NULL,
  `shipping_address` LONGTEXT NOT NULL,
  `shipping_courier` VARCHAR(50) NOT NULL DEFAULT 'JNE',
  `shipping_service` VARCHAR(50) NOT NULL DEFAULT 'REG',
  `shipping_cost` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `shipping_etd` VARCHAR(50) DEFAULT '2-3 Hari',
  `subtotal` DECIMAL(12, 2) NOT NULL,
  `discount_code` VARCHAR(50) DEFAULT NULL,
  `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `grand_total` DECIMAL(12, 2) NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'BCA Virtual Account',
  `payment_status` VARCHAR(20) NOT NULL DEFAULT 'unpaid',
  `order_status` VARCHAR(20) NOT NULL DEFAULT 'pending',
  `awb_number` VARCHAR(100) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 14. ORDER ITEMS
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `order_id` VARCHAR(64) NOT NULL,
  `product_id` VARCHAR(64) NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `variant_name` VARCHAR(100) DEFAULT NULL,
  `image` TEXT DEFAULT NULL,
  `price` DECIMAL(12, 2) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `total` DECIMAL(12, 2) NOT NULL
);

-- 15. AI SKIN ANALYSIS RESULTS
CREATE TABLE IF NOT EXISTS `skin_analyses` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) DEFAULT NULL,
  `guest_id` VARCHAR(64) DEFAULT NULL,
  `quiz_answers` LONGTEXT NOT NULL,
  `skin_type` VARCHAR(50) NOT NULL,
  `primary_concerns` LONGTEXT NOT NULL,
  `routine_am` LONGTEXT NOT NULL,
  `routine_pm` LONGTEXT NOT NULL,
  `recommended_product_ids` LONGTEXT NOT NULL,
  `whatsapp_text` LONGTEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);
