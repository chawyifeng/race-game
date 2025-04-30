// createTables.cjs
const bcrypt = require("bcrypt");
const saltRounds = 10;

const createTables = async (db) => {
  // **Create 'events' table**
  const [rows] = await db.query(`SHOW TABLES LIKE 'events'`);
  if (rows.length === 0) {
    await db.query(`
      CREATE TABLE events (
        event_id INT AUTO_INCREMENT PRIMARY KEY,
        event_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Events table created");

    const [insertResult] = await db.query(
      `INSERT INTO events (event_name) VALUES (?)`,
      ["Motor Event"]
    );
    console.log("Sample event inserted with ID:", insertResult.insertId);
  } else {
    console.log("Events table already exists — skipping creation & insert");
  }

  // **Create 'event_days' table**
  await db.query(`
    CREATE TABLE IF NOT EXISTS event_days (
      event_day_id INT AUTO_INCREMENT PRIMARY KEY,
      event_id INT NOT NULL,
      event_date DATE NOT NULL,
      FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
    );
  `);
  console.log("Event_days table created or already exists");

  // **Create 'customers' table**
  await db.query(`
    CREATE TABLE IF NOT EXISTS customers (
      customer_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      contactNo VARCHAR(255) NOT NULL UNIQUE,
      event_day_id INT NOT NULL,
      game_result VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_day_id) REFERENCES event_days(event_day_id) ON DELETE CASCADE
    );
  `);
  console.log("Customers table created or already exists");

  // **Create 'admins' table**
  const [adminTableRows] = await db.query(`SHOW TABLES LIKE 'admins'`);
  if (adminTableRows.length === 0) {
    const password = "admin";
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await db.query(`
      CREATE TABLE admins (
        admin_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Admins table created");

    await db.query(
      `INSERT INTO admins (username, password_hash)
       VALUES ('admin', ?)
       ON DUPLICATE KEY UPDATE username = 'admin';`,
      [hashedPassword]
    );
    console.log("Hardcoded admin row inserted or already exists");
  }
};

module.exports = createTables;
