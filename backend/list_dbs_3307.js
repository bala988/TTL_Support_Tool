import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  port: 3307
});

async function listDbs() {
  try {
    const [rows] = await db.query("SHOW DATABASES");
    console.log(rows);
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
listDbs();
