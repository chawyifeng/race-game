// IMPORTANT : IF THIS VERSION NOT WORKING REVERT BACK TO THE PREVIOUS GIT

require("dotenv").config(); // This will load environment variables from the .env file

const express = require("express");
//const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");
const { fileURLToPath } = require("url");
const mysql = require("mysql2/promise");
const { CronJob } = require("cron");
const session = require("express-session");
const excelJS = require("exceljs");
const bcrypt = require("bcrypt");
const saltRounds = 10; // can adjust the number of salt rounds for more security

let date_ob = new Date();
let date = ("0" + date_ob.getDate()).slice(-2);
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
let year = date_ob.getFullYear();
let hours = date_ob.getHours();
let minutes = date_ob.getMinutes();
let seconds = date_ob.getSeconds();

const startServer = async () => {
  // **Set up MySQL connection**
  const db = mysql.createPool({
    host: process.env.DB_HOST, // Using environment variable for host
    user: process.env.DB_USER, // Using environment variable for user
    password: process.env.DB_PASSWORD, // Using environment variable for password
    database: process.env.DB_NAME, // Using environment variable for database
    waitForConnections: true, // If the pool runs out of connections, it will wait for one to be released
    connectionLimit: 10, // Max number of connections allowed in the pool
    queueLimit: 0, // No limit for waiting queries in the queue
  });

  const createTables = async () => {
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

      // Insert only once after creation
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
      const password = "admin"; // The password you want to hash
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create the table and insert the hardcoded row
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
        `
        INSERT INTO admins (username, password_hash)
        VALUES ('admin', ?)
        ON DUPLICATE KEY UPDATE username = 'admin';
      `,
        [hashedPassword]
      );

      console.log("Hardcoded admin row inserted or already exists");
    }
  };

  // Execute the function to create tables
  await createTables();

  /**
   * server config (Required for __dirname and __filename to work in ES modules)
   */

  const __dirname = path.dirname(__filename); // Get the directory name of the current module
  const app = express(); // express instance
  const PORT = process.env.PORT || 3000; // Use the environment variable PORT (SO THAT CAN BE USED ON SHARED HOSTING), default to 3000 if not set

  /**
   * INIT SESSION
   */
  app.use(
    session({
      secret: "your_secret_key", // Secret for signing session cookies
      resave: false, // Don't resave session if it wasn't modified (For most applications, there is no need to resave the session unless the session data has been changed)
      saveUninitialized: true, // Save uninitialized sessions
    })
  );

  /**
   * Use CORS middleware
   */
  //app.use(cors());
  app.use(express.json()); /// must have this thing to so that req.body can work //recognize the incoming Request Object as strings or arrays
  app.use(express.static(path.join(__dirname, "public"))); // Serve only the "public" folder

  const server = createServer(app); // Create the http server

  // const io = new Server(server, {
  //   cors: {
  //     origin: process.env.CLIENT_ORIGIN || "http://localhost/", // fallback to localhost
  //   },
  // });

  const io = new Server(server);

  /**
   * SERVE ALL THE FILE
   */

  // seems like dont need this one
  // app.get("/", (req, res) => {
  //   res.sendFile("index.html", { root: path.join(__dirname, "public/") });
  // });

  // app.get("/login", (req, res) => {
  //   res.sendFile("index.html", { root: path.join(__dirname, "public/login") });
  // });

  /**
   * HELPER FUNCTION TO CHECK IF A USER IS AUTHENTICATED IN RANKING MODULE/ADMIN MODULE
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  function authenticateUser(req, res, next) {
    if (req.session.user) {
      next();
    } else {
      res.redirect("/login");
    }
  }

  /**
   * HELPER FUNCTION TO CHECK IF today event day id is exist, else create it
   * @returns
   */
  async function getOrCreateTodayEventDayId() {
    const today = new Date().toISOString().split("T")[0];

    try {
      const [eventRows] = await db.query(
        `SELECT event_id FROM events ORDER BY created_at DESC LIMIT 1`
      );

      if (eventRows.length === 0) {
        throw new Error("No events found in the database.");
      }

      const eventId = eventRows[0].event_id;

      const [eventDayRows] = await db.query(
        `SELECT event_day_id FROM event_days WHERE event_date = ? AND event_id = ?`,
        [today, eventId]
      );

      if (eventDayRows.length > 0) {
        return eventDayRows[0].event_day_id;
      }

      const [insertResult] = await db.query(
        `INSERT INTO event_days (event_id, event_date) VALUES (?, ?)`,
        [eventId, today]
      );

      return insertResult.insertId;
    } catch (error) {
      console.error("Error in getOrCreateTodayEventDayId:", error);
      throw error;
    }
  }

  /**
   * HELPER FUNCTION TO GET TOP 10 CUSTOMER WITH BEST RESULT
   * @returns
   */
  async function getTop10PlayerData(db) {
    const sql = "SELECT * FROM customers ORDER BY game_result ASC LIMIT 10";

    try {
      const [rows] = await db.query(sql);

      // Map rows to desired format directly
      return rows.map((row) => ({
        name: row.name,
        game_result: row.game_result,
      }));
    } catch (error) {
      console.error("Error executing database query:", error);
      return []; // Return an empty array in case of an error
    }
  }

  /**
   * Serve the /ranking page only if the user is authenticated
   */
  app.get("/ranking", authenticateUser, (req, res) => {
    res.sendFile("index.html", {
      root: path.join(__dirname, "public/ranking"),
    });
  });

  /**
   * download excel function
   */
  app.post("/downloadExcel", async (req, res) => {
    //change from get to post
    // WRITE DOWNLOAD EXCEL LOGIC
    const workbook = new excelJS.Workbook(); // Create a new workbook
    const worksheet = workbook.addWorksheet("Final Result"); // New Worksheet
    const downloadPath = "./excel"; // Path to download excel
    const filename = `ranking_${date}${month}${year}_${hours}${minutes}${seconds}.xlsx`;
    const fullFileName = path.join(downloadPath, filename);

    // //set header of the workbook , the key column must match with add row function
    worksheet.columns = [
      { header: "Rank", key: "rank", width: 10 },
      { header: "Name", key: "name", width: 10 },
      { header: "Best Time", key: "bestTime", width: 10 },
    ];

    let top10PlayerArr = await getTop10PlayerData(db); // get user data from MySQL

    //  Looping through User data
    let counter = 1;
    top10PlayerArr.forEach((player) => {
      worksheet.addRow({
        rank: counter,
        name: player.name,
        bestTime: player.bestTime,
      });
      counter++;
    });

    // Making first line in excel bold
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    try {
      await workbook.xlsx.writeFile(fullFileName);
      res.sendFile(filename, { root: "excel" });
    } catch (err) {
      console.log(err);
      res.send({ status: "error", message: "Something went wrong" });
    }
  });

  // POST Login route using async/await and mysql2/promise
  app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
      // Query the admin by username
      const [rows] = await db.query("SELECT * FROM admins WHERE username = ?", [
        username,
      ]);

      if (rows.length === 0) {
        return res.json({
          success: false,
          message: "Invalid username or password.",
        });
      }

      const admin = rows[0];

      // Compare the hashed password
      const passwordMatch = await bcrypt.compare(password, admin.password_hash);

      if (!passwordMatch) {
        return res.json({
          success: false,
          message: "Invalid username or password.",
        });
      }

      // Save admin to session // dont need save password here
      req.session.user = {
        id: admin.admin_id,
        username: admin.username,
      };

      res.json({
        success: true,
        redirect: "../ranking",
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({
        success: false,
        message: "Server error.",
      });
    }
  });

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
  });

  io.on("connection", (socket) => {
    console.log("A user connected");

    // Save best result — assume game_result field is used
    socket.on(
      "save-best-result",
      async ({ cookiePhoneNo, cookieName, finalBestTime }) => {
        // this is parameter
        try {
          await db.query(
            `UPDATE customers SET game_result = ? WHERE contactNo = ? AND name = ?`,
            [finalBestTime, cookiePhoneNo, cookieName]
          );
          console.log("Successfully saved the best result");
        } catch (e) {
          console.log("Error saving the best result:", e);
        }
      }
    );

    // Save new customer info
    socket.on("save-cust-info", async ({ name, email, contact }) => {
      try {
        const event_day_id = await getOrCreateTodayEventDayId();

        await db.query(
          `INSERT INTO customers (name, email, contactNo, event_day_id) VALUES (?, ?, ?, ?)`,
          [name, email, contact, event_day_id]
        );

        console.log("Customer saved with event_day_id:", event_day_id);
      } catch (e) {
        console.log("Error saving customer info:", e);
      }
    });
  });

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    try {
      console.log("Closing MySQL connection...");
      await db.end(); // Await pool shutdown properly
      console.log("MySQL connection closed.");
    } catch (err) {
      console.error("Error closing MySQL connection:", err);
    } finally {
      process.exit();
    }
  });
};

startServer();
