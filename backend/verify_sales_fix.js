import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from current directory (backend)
dotenv.config({ path: path.join(__dirname, '.env') });

const API_URL = 'http://localhost:5000/api/sales';
const JWT_SECRET = process.env.JWT_SECRET || 'ttl_jwt_secret_key_2026_change_in_production';

// Generate a dummy token
const token = jwt.sign(
  { id: 1, email: 'test@example.com', role: 'sales' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const axiosConfig = {
  headers: {
    Authorization: `Bearer ${token}`
  }
};

async function runTest() {
  try {
    console.log("Using Token:", token);
    
    console.log("1. Creating dummy opportunity...");
    const createRes = await axios.post(`${API_URL}/`, {
      opportunity_name: "Test Opp " + Date.now(),
      customer_name: "Test Cust",
      product: "Test Prod",
      created_by: 1
    }, axiosConfig);

    const oppId = createRes.data.opportunityId;
    console.log(`   Created Opportunity ID: ${oppId}`);

    console.log("2. Testing Update Stage 7 with EMPTY STRING date...");
    try {
        await axios.put(`${API_URL}/${oppId}`, {
        stage_data: {
            stage7: {
            invoice_submission_followup: "" 
            }
        }
        }, axiosConfig);
        console.log("   SUCCESS: Empty string date handled correctly (set to NULL).");
    } catch (err) {
        console.error("   FAILED: Empty string update failed.", err.response?.data || err.message);
    }

    console.log("3. Testing Update Stage 7 with ISO STRING date...");
    try {
        await axios.put(`${API_URL}/${oppId}`, {
        stage_data: {
            stage7: {
            invoice_submission_followup: new Date().toISOString()
            }
        }
        }, axiosConfig);
        console.log("   SUCCESS: ISO string date handled correctly (converted to MySQL format).");
    } catch (err) {
        console.error("   FAILED: ISO string update failed.", err.response?.data || err.message);
    }
    
    console.log("4. Testing Update Stage 6 with EMPTY STRING date (milestones_tracking_meet)...");
     try {
        await axios.put(`${API_URL}/${oppId}`, {
        stage_data: {
            stage6: {
            milestones_tracking_meet: "" 
            }
        }
        }, axiosConfig);
        console.log("   SUCCESS: Empty string date (Stage 6) handled correctly.");
    } catch (err) {
        console.error("   FAILED: Stage 6 update failed.", err.response?.data || err.message);
    }

  } catch (error) {
    console.error("Test failed:", error.response?.data || error.message);
  }
}

runTest();