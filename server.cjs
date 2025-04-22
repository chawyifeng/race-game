//***** current problem -- SERVE ALL THE FILE so no choice frontnend there have tp check again */
// IMPORTANT : IF THIS VERSION NOT WORKING REVERT BACK TO THE PREVIOUS GIT

require("dotenv").config(); // This will load environment variables from the .env file

const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");
const { fileURLToPath } = require("url");
const mysql = require("mysql2");
const { CronJob } = require("cron");
const session = require("express-session");
const excelJS = require("exceljs");

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

  const createTables = () => {
    // **Create 'events' table**
    db.query(
      `
      CREATE TABLE IF NOT EXISTS events (
        event_id INT AUTO_INCREMENT PRIMARY KEY,
        event_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
      (err, result) => {
        if (err) {
          console.error("Error creating events table:", err);
        } else {
          console.log("Events table created or already exists");
        }
      }
    );

    // **Create 'event_days' table**
    db.query(
      `
      CREATE TABLE IF NOT EXISTS event_days (
        event_day_id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        event_date DATE NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
      );
    `,
      (err, result) => {
        if (err) {
          console.error("Error creating event_days table:", err);
        } else {
          console.log("Event_days table created or already exists");
        }
      }
    );

    // **Create 'customers' table**
    db.query(
      `
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
    `,
      (err, result) => {
        if (err) {
          console.error("Error creating customers table:", err);
        } else {
          console.log("Customers table created or already exists");
        }
      }
    );

    // **Create 'admins' table**
    db.query(
      `
      CREATE TABLE IF NOT EXISTS admins (
        admin_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
      (err, result) => {
        if (err) {
          console.error("Error creating admins table:", err);
        } else {
          console.log("Admins table created or already exists");
        }
      }
    );
  };

  // Execute the function to create tables
  createTables();

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
  app.use(cors());
  app.use(express.json()); /// must have this thing to so that req.body can work //recognize the incoming Request Object as strings or arrays
  app.use(express.static(path.join(__dirname, "public"))); // Serve only the "public" folder

  const server = createServer(app); // Create the http server

  const io = new Server(server, {
    cors: {
      origin: "http://localhost/",
    },
  });

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

    let UsersArr = await getUserData(db); // get user data from MySQL

    //  Looping through User data
    let counter = 1;
    UsersArr.forEach((user) => {
      worksheet.addRow({
        rank: counter,
        name: user.name,
        bestTime: user.bestTime,
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

  // POST Login route
  app.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.query(
      "SELECT * FROM admins WHERE username = ? AND password = ?",
      [username, password],
      (err, rows) => {
        if (err) {
          console.error(err);
          return res
            .status(500)
            .json({ success: false, message: "Server error." });
        }

        if (rows.length > 0) {
          req.session.user = rows[0];
          return res.json({
            success: true,
            redirect: "../ranking", // Go one folder above before redirecting to /ranking
          });
        } else {
          return res.json({
            success: false,
            message: "Invalid username or password.",
          });
        }
      }
    );
  });

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
  });

  io.on("connection", async (socket) => {
    console.log("A user connected");

    socket.on(
      "save-best-result",
      async ({ cookiePhoneNo, cookieName, finalBestTime }) => {
        try {
          await db
            .promise() /// convert to async/ await style
            .query(
              "INSERT INTO tbl_ranking (contactNo, name, bestTime) VALUES (?, ?, ?)",
              [cookiePhoneNo, cookieName, finalBestTime]
            );
          console.log("Successfully saved the best result");
        } catch (e) {
          console.log("Error saving the best result:", e);
        }
      }
    );

    socket.on("save-cust-info", async ({ name, email, contact }) => {
      try {
        await db
          .promise()
          .query(
            "INSERT INTO tbl_user (name, email, contactNo) VALUES (?, ?, ?)",
            [name, email, contact]
          );
        console.log("Successfully inserted into DB");
      } catch (e) {
        console.log("Error saving customer info:", e);
      }
    });

    // // Periodically retrieve DB result
    // const job = new CronJob(
    //   "* * * * * *", // cronTime
    //   async function () {
    //     let UsersArr = await getUserData(db);
    //     socket.emit("retrieve-db-result", UsersArr);
    //   },
    //   null, // onComplete
    //   true, // start
    //   "Asia/Kuala_Lumpur" // timeZone
    // );
  });

  // Get user data from DB
  const getUserData = async (db) => {
    let localUsersArr = [];
    const sql =
      "SELECT * FROM tbl_ranking WHERE bestTime != '' ORDER BY bestTime ASC LIMIT 10";
    try {
      const [rows] = await db.promise().query(sql);
      rows.forEach((row) => {
        localUsersArr.push({
          id: row.id,
          name: row.name,
          bestTime: row.bestTime,
        });
      });
    } catch (error) {
      console.error("Error executing database query:", error);
    }
    return localUsersArr;
  };

  // Close the MySQL connection when the server is stopped
  process.on("SIGINT", () => {
    db.end((err) => {
      if (err) {
        console.error("Error closing MySQL connection:", err.stack);
      } else {
        console.log("MySQL connection closed.");
      }
      process.exit();
    });
  });
};

startServer();
