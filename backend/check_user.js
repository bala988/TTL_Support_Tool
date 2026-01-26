
import { createConnection } from 'mysql2/promise';

async function checkUser() {
  try {
    const connection = await createConnection({
      host: "localhost",
      port: 3307,
      user: "root",
      password: "root",
      database: "ttl"
    });

    const [rows] = await connection.execute('SELECT id, name, email, role FROM users');
    console.log('All Users:', rows);
    await connection.end();
  } catch (err) {
    console.error("Error:", err);
  }
}

checkUser();
