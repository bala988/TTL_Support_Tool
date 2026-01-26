
import { db } from "./config/db.js";

const createSalesTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS sales_opportunities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        
        -- Header Section
        opportunity_name VARCHAR(255) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_address TEXT,
        customer_contact_person VARCHAR(255),
        customer_email VARCHAR(255),
        
        ttl_sales_name VARCHAR(255),
        ttl_contact_number VARCHAR(50),
        ttl_email VARCHAR(255),
        
        technical_owner VARCHAR(255),
        product VARCHAR(100),
        oem VARCHAR(100),
        
        distributor_name VARCHAR(255),
        distributor_contact VARCHAR(255),
        distributor_email VARCHAR(255),
        
        -- Process Tracking
        current_stage INT DEFAULT 1,
        stage_status VARCHAR(50) DEFAULT 'In Progress', -- 'In Progress', 'Completed', 'Approved'
        
        -- Detailed Stage Data (JSON)
        -- Stores all the fields for Stage 1-7 (checklists, dates, file paths, etc.)
        stage_data JSON,
        
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log("sales_opportunities table created successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error creating sales_opportunities table:", error);
    process.exit(1);
  }
};

createSalesTable();
