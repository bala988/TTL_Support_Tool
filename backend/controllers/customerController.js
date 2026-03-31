import { db } from "../config/db.js";

// @desc    Get all customers with their serials and contacts
// @route   GET /api/customers
// @access  Private/Admin
export const getCustomers = async (req, res) => {
  try {
    const [customers] = await db.query("SELECT * FROM customers ORDER BY name ASC");
    const [serials] = await db.query("SELECT * FROM customer_serials");
    const [contacts] = await db.query("SELECT * FROM customer_contacts");

    const fullData = customers.map(customer => ({
      ...customer,
      serials: serials.filter(s => s.customer_id === customer.id),
      contacts: contacts.filter(c => c.customer_id === customer.id)
    }));

    res.json(fullData);
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({ message: "Server error fetching customers" });
  }
};

// @desc    Create new customer with multiple serials and contacts
// @route   POST /api/customers
// @access  Private/Admin
export const createCustomer = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { name, serials, contacts } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Customer name is required" });
    }

    await connection.beginTransaction();

    // 1. Insert customer
    const [customerResult] = await connection.query(
      "INSERT INTO customers (name) VALUES (?)",
      [name]
    );
    const customerId = customerResult.insertId;

    // 2. Insert serials
    if (serials && Array.isArray(serials) && serials.length > 0) {
      const serialValues = serials
        .filter(s => s.serial_no)
        .map(s => [customerId, s.serial_no, s.unique_id]);
      
      if (serialValues.length > 0) {
        await connection.query(
          "INSERT INTO customer_serials (customer_id, serial_no, unique_id) VALUES ?",
          [serialValues]
        );
      }
    }

    // 3. Insert contacts
    if (contacts && Array.isArray(contacts) && contacts.length > 0) {
      const contactValues = contacts
        .filter(c => c.contact_name)
        .map(c => {
          const phone = c.phone ? String(c.phone).replace(/\D/g, '') : null;
          return [customerId, c.contact_name, phone, c.email];
        });
      
      if (contactValues.length > 0) {
        await connection.query(
          "INSERT INTO customer_contacts (customer_id, contact_name, phone, email) VALUES ?",
          [contactValues]
        );
      }
    }

    await connection.commit();
    res.status(201).json({
      status: "success",
      message: "Customer created successfully",
      customerId
    });
  } catch (error) {
    await connection.rollback();
    console.error("Create customer error:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "A customer with this name already exists." });
    }
    res.status(500).json({ message: "Server error creating customer" });
  } finally {
    connection.release();
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private/Admin
export const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    const { name, serials, contacts } = req.body;

    await connection.beginTransaction();

    // 1. Update customer basic info
    await connection.query(
      "UPDATE customers SET name = ? WHERE id = ?",
      [name, id]
    );

    // 2. Sync Serials (Delete and Re-insert is simplest for dynamic lists)
    await connection.query("DELETE FROM customer_serials WHERE customer_id = ?", [id]);
    if (serials && Array.isArray(serials) && serials.length > 0) {
      const serialValues = serials
        .filter(s => s.serial_no)
        .map(s => [id, s.serial_no, s.unique_id]);
      
      if (serialValues.length > 0) {
        await connection.query(
          "INSERT INTO customer_serials (customer_id, serial_no, unique_id) VALUES ?",
          [serialValues]
        );
      }
    }

    // 3. Sync Contacts
    await connection.query("DELETE FROM customer_contacts WHERE customer_id = ?", [id]);
    if (contacts && Array.isArray(contacts) && contacts.length > 0) {
      const contactValues = contacts
        .filter(c => c.contact_name)
        .map(c => {
          const phone = c.phone ? String(c.phone).replace(/\D/g, '') : null;
          return [id, c.contact_name, phone, c.email];
        });
      
      if (contactValues.length > 0) {
        await connection.query(
          "INSERT INTO customer_contacts (customer_id, contact_name, phone, email) VALUES ?",
          [contactValues]
        );
      }
    }

    await connection.commit();
    res.json({ status: "success", message: "Customer updated successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Update customer error:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "A customer with this name already exists." });
    }
    res.status(500).json({ message: "Server error updating customer" });
  } finally {
    connection.release();
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    // Foreign keys with ON DELETE CASCADE will handle serials and contacts
    const [result] = await db.query("DELETE FROM customers WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ status: "success", message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Delete customer error:", error);
    res.status(500).json({ message: "Server error deleting customer" });
  }
};

