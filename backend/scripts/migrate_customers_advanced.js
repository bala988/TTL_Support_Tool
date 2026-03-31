import { db } from "../config/db.js";

async function executeMigration() {
  try {
    console.log("Starting database migration for advanced customer management...");

    // 1. Make customer name unique (if not already)
    try {
      await db.query("ALTER TABLE customers ADD UNIQUE (name)");
      console.log("✅ Customers name is now unique");
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        console.warn("⚠️ Duplicate customer names found, skipping UNIQUE constraint for now. Please clean duplicates manually.");
      } else {
        console.log("ℹ️ Customers name might already be unique or other issue: ", e.message);
      }
    }

    // 2. Create customer_serials table
    await db.query(`
      CREATE TABLE IF NOT EXISTS customer_serials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        serial_no VARCHAR(255) NOT NULL,
        unique_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ customer_serials table ready");

    // 3. Create customer_contacts table
    await db.query(`
      CREATE TABLE IF NOT EXISTS customer_contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        contact_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ customer_contacts table ready");

    // 4. Migrate existing data
    const [existingCustomers] = await db.query("SELECT * FROM customers");
    
    for (const customer of existingCustomers) {
      // Check if data already exists in new tables to avoid duplicates during re-runs
      if (customer.serial_no) {
        const [existingSerials] = await db.query("SELECT * FROM customer_serials WHERE customer_id = ? AND serial_no = ?", [customer.id, customer.serial_no]);
        if (existingSerials.length === 0) {
          await db.query("INSERT INTO customer_serials (customer_id, serial_no, unique_id) VALUES (?, ?, ?)", 
            [customer.id, customer.serial_no, customer.unique_id]);
        }
      }
      
      if (customer.contact_name) {
        const [existingContacts] = await db.query("SELECT * FROM customer_contacts WHERE customer_id = ? AND contact_name = ?", [customer.id, customer.contact_name]);
        if (existingContacts.length === 0) {
          await db.query("INSERT INTO customer_contacts (customer_id, contact_name, phone, email) VALUES (?, ?, ?, ?)", 
            [customer.id, customer.contact_name, customer.phone, customer.email]);
        }
      }
    }
    console.log("✅ Data migration complete");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

executeMigration();
