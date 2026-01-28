
/**
 * Sends a WhatsApp acknowledgement message to the customer.
 * 
 * @param {string} customerName - The name of the customer company (e.g., GROWW).
 * @param {string} contactPerson - The name of the contact person.
 * @param {string} ticketNumber - The generated ticket ID (e.g., TTL-NGFW-GROWW-001).
 * @param {string} contactPhone - The phone number to send the message to.
 */
export const sendTicketAcknowledgement = async (customerName, contactPerson, ticketNumber, contactPhone) => {
  try {
    // Construct the message
    // User requested format: "hi customer name , contact person name with ou tutelar team got your concern withtikcet id and our engineer are working to solve it asap"
    // We will clean it up slightly for readability while keeping the requested structure.
    
    const message = `Hi ${customerName}, ${contactPerson} with our Tutelar team got your concern with Ticket ID ${ticketNumber} and our engineers are working to solve it ASAP.`;

    console.log("---------------------------------------------------");
    console.log("🚀 MOCK WHATSAPP NOTIFICATION SENT");
    console.log(`To: ${contactPhone}`);
    console.log(`Message: ${message}`);
    console.log("---------------------------------------------------");

    // TODO: Integrate with a real WhatsApp Provider (e.g., Twilio, Meta Cloud API)
    // Example Twilio implementation:
    // const client = require('twilio')(accountSid, authToken);
    // await client.messages.create({
    //    body: message,
    //    from: 'whatsapp:+14155238886',
    //    to: `whatsapp:${contactPhone}`
    // });

    return true;
  } catch (error) {
    console.error("Error sending WhatsApp notification:", error);
    return false;
  }
};