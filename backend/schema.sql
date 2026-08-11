-- Run this file in pgAdmin or psql to set up the database

CREATE DATABASE dia_zdr;
\c dia_zdr;

-- Table to store user/customer information
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store the extracted template schema for each customer
CREATE TABLE IF NOT EXISTS schemas (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    sheet_name VARCHAR(255) NOT NULL,
    columns_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, sheet_name)
);

-- Insert a test customer
INSERT INTO customers (name) VALUES ('Test Manager');
