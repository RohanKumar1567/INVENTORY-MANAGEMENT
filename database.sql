CREATE DATABASE IF NOT EXISTS inventoryDB;
USE inventoryDB;

CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional sample rows for trying the dashboard and low-stock alert.
-- Run this INSERT only once; remove it if you want to start with an empty table.
INSERT INTO products (name, category, price, quantity) VALUES
  ('Notebook', 'Stationery', 45.00, 20),
  ('Blue Pen', 'Stationery', 10.00, 4),
  ('USB Drive 32GB', 'Electronics', 399.00, 7);
