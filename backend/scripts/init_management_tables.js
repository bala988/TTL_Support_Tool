import { db } from "../config/db.js";

async function initTables() {
  try {
    console.log("Starting table initialization...");

    // Create Customers table
    await db.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        serial_no VARCHAR(100),
        unique_id VARCHAR(100),
        contact_name VARCHAR(255),
        phone VARCHAR(20),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Customers table ready");

    // Create Assets table
    await db.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        asset_type VARCHAR(100) NOT NULL, -- e.g., Laptop, Mouse, Monitor
        model_no VARCHAR(255),
        serial_no VARCHAR(255),
        given_date DATE,
        return_date DATE,
        status ENUM('assigned', 'returned', 'damaged') DEFAULT 'assigned',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Assets table ready");

    console.log("All tables initialized successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing tables:", error);
    process.exit(1);
  }
}

initTables();
