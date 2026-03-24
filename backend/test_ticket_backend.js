import fs from "fs";

async function runTests() {
  const API_URL = "http://localhost:5000";
  console.log("Starting Verification Tests...\n");

  try {
    // 1. Fetch available engineers/users
    const usersRes = await fetch(`${API_URL}/api/auth/users`);
    const users = await usersRes.json();
    const adminUser = users.find(u => u.name === "Ram Balaji" || u.role === "admin") || users[0];
    const engineerUser = users.find(u => u.name === "Srijan Kr Singh" || (u.role && u.role.toLowerCase() === "engineer")) || users[1];

    if (!adminUser || !engineerUser) {
      console.log("Could not find sufficient users to test.");
      return;
    }

    console.log(`[Users context loaded] Admin: ${adminUser.name}, Target Engineer: ${engineerUser.name}\n`);

    // 2. Create Ticket
    console.log("--- 🧪 Testing Ticket Creation (Timeline should use Creator's Name) ---");
    const createReq = {
      severity: "High",
      ticket_type: "Incident",
      technology_domain: "Network",
      customer_name: "Test Corp",
      issue_subject: "Backend Fix Test",
      issue_description: "Testing transfer stability",
      created_by: adminUser.id
    };

    const createRes = await fetch(`${API_URL}/api/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createReq)
    });

    if (!createRes.ok) {
      console.log("Failed to create ticket:", await createRes.text());
      return;
    }

    const { ticketId } = await createRes.json();
    console.log(`✅ Ticket Created with ID: ${ticketId}`);

    // fetch it to check initial timeline
    const getRes1 = await fetch(`${API_URL}/api/tickets/${ticketId}`);
    const data1 = await getRes1.json();
    let initialTimeline = typeof data1.ticket.timeline === 'string' ? JSON.parse(data1.ticket.timeline) : data1.ticket.timeline;
    console.log("Initial Timeline:", initialTimeline);
    
    if (initialTimeline[0] && initialTimeline[0].user === adminUser.name) {
      console.log("✅ Timeline correctly logged the specific user name instead of 'System'");
    } else {
      console.log(`❌ Timeline bug: expected ${adminUser.name}, got ${initialTimeline[0]?.user || "System"}`);
    }

    // 3. Transfer Ticket
    console.log("\n--- 🧪 Testing Ticket Transfer (Timeline should persist, phone should update) ---");
    const transferReq = {
      assigned_engineer: engineerUser.name,
      userName: adminUser.name
    };

    const transferRes = await fetch(`${API_URL}/api/tickets/${ticketId}/transfer`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transferReq)
    });

    if (!transferRes.ok) {
      console.log("Failed to transfer ticket:", await transferRes.text());
      return; 
    }
    console.log("✅ Transfer API executed successfully");

    // fetch again to check updated fields
    const getRes2 = await fetch(`${API_URL}/api/tickets/${ticketId}`);
    const data2 = await getRes2.json();
    
    // Check if phone and email match the user
    console.log("\n--- 🧪 Verifying Database Persistence ---");
    console.log("Joined Assigned Engineer Email/Phone:", {
      email: data2.ticket.assigned_engineer_email,
      phone: data2.ticket.assigned_engineer_phone
    });
    console.log("Ticket's Stored Engineer Email/Phone:", {
      email: data2.ticket.engineer_email,
      phone: data2.ticket.engineer_phone
    });

    let updatedTimeline = typeof data2.ticket.timeline === 'string' ? JSON.parse(data2.ticket.timeline) : data2.ticket.timeline;
    console.log("Updated Timeline Entries:", updatedTimeline.length);
    if (updatedTimeline.length === 2 && updatedTimeline[1].user === adminUser.name) {
       console.log("✅ Timeline properly retained history and added the new assignment event.");
    } else {
       console.log("❌ Timeline failed to persist or store correctly.");
    }
    
  } catch (err) {
    console.error("Test execution failed:", err);
  }
}

runTests();
