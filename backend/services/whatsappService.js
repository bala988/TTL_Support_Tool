import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Sends a WhatsApp acknowledgement message to the customer via Meta Cloud API.
 * 
 * @param {string} customerName - The name of the customer company (e.g., GROWW).
 * @param {string} contactPerson - The name of the contact person.
 * @param {string} ticketNumber - The generated ticket ID (e.g., TTL-NGFW-GROWW-001).
 * @param {string} contactPhone - The phone number to send the message to (in international format, e.g., 919876543210).
 */
export const sendTicketAcknowledgement = async (customerName, contactPerson, ticketNumber, contactPhone) => {
  try {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
      console.warn("⚠️ WhatsApp credentials missing (WHATSAPP_TOKEN or WHATSAPP_PHONE_ID). Skipping notification.");
      return false;
    }

    // Sanitize and format the phone number
    // Remove all non-numeric characters
    let formattedPhone = contactPhone.replace(/\D/g, '');

    // If number is 10 digits (common in India), prepend '91'
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    // If number starts with '0', remove it (sometimes users add leading 0)
    else if (formattedPhone.length === 11 && formattedPhone.startsWith('0')) {
      formattedPhone = '91' + formattedPhone.substring(1);
    }
    // If empty or invalid, try using as is (or log warning)
    if (formattedPhone.length < 10) {
      console.warn(`⚠️ Phone number ${contactPhone} seems invalid, sending as is.`);
      formattedPhone = contactPhone;
    }

    const messageBody = `Hi ${customerName}, ${contactPerson} with our Tutelar team got your concern with Ticket ID ${ticketNumber} and our engineers are working to solve it ASAP.`;

    const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;

    // Note: For business-initiated messages to users who haven't messaged you recently, 
    // a TEMPLATE is nominally required. We use 'text' here for simplicity/dev mode testing.
    const payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "text",
      text: {
        body: messageBody
      }
    };

    console.log(`📤 Sending WhatsApp to ${formattedPhone} (Original: ${contactPhone})...`);

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("✅ WhatsApp Notification Sent:", response.data);
    return true;

  } catch (error) {
    console.error("❌ Error sending WhatsApp notification:");
    if (error.response) {
      console.error("Data:", error.response.data);
      console.error("Status:", error.response.status);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Message:", error.message);
    }
    return false;
  }
};
