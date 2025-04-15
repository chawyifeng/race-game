//***** current problem -- SERVE ALL THE FILE so no choice frontnend there have tp check again */
// IMPORTANT : IF THIS VERSION NOT WORKING REVERT BACK TO THE PREVIOUS GIT

import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { CronJob } from "cron";
import session from "express-session";
import excelJS from "exceljs";

let date_ob = new Date();
// current date
let date = ("0" + date_ob.getDate()).slice(-2); // make it have 0 before the digit if only have single digit
// current month
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2); // make it have 0 before the digit if only have single digit
// current year
let year = date_ob.getFullYear();
// current hours
let hours = date_ob.getHours();
// current minutes
let minutes = date_ob.getMinutes();
// current seconds
let seconds = date_ob.getSeconds();

/**
 * init the db
 */
const db = await open({
  filename: "user_" + date + month + year + ".db",
  driver: sqlite3.Database,
});

await db.exec(`
  CREATE TABLE IF NOT EXISTS tbl_user(
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    contactNo varchar(255) NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS tbl_ranking(
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    contactNo varchar(255) NOT NULL UNIQUE,
    name varchar(255) NOT NULL,
    bestTime varchar(255) NOT NULL
  );
`);

/**
 * server config (Required for __dirname and __filename to work in ES modules)
 */
const __filename = fileURLToPath(import.meta.url); // Convert import.meta.url to a file path
const __dirname = path.dirname(__filename); // Get the directory name of the current module
const app = express();

/**
 * Use CORS middleware
 */
app.use(cors());
app.use(express.json()); /// must have this thing to so that req.body can work //recognize the incoming Request Object as strings or arrays
app.use(express.static(path.join(__dirname, "public"))); // Serve only the "public" folder

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost",
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
 * Serve the /ranking page only if the user is authenticated
 */
app.get("/ranking", authenticateUser, (req, res) => {
  res.sendFile("index.html", { root: path.join(__dirname, "public/ranking") });
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

  //get userdata function
  let UsersArr = [];
  UsersArr = await getUserData(); //get user data from db

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
    const data = await workbook.xlsx.writeFile(fullFileName).then(() => {
      //  res.send({
      //    status: "success",
      //    message: "file successfully downloaded",
      //    path: `${downloadPath}/users.xlsx`,
      //  });
      res.sendFile(filename, { root: "excel" });
    });
  } catch (err) {
    console.log(err);
    res.send({
      status: "error",
      message: "Something went wrong",
    });
  }

  ///////////////////////////////////////////////////////////////////////
  //                            CLEAR DATA IN DB
  ///////////////////////////////////////////////////////////////////////
  let result;
  try {
    //remove the data in database
    result = await db.run("DELETE FROM tbl_ranking");
    console.log("successfully delete the ranking from the table"); //broadcast the result to everyone
  } catch (e) {
    // TODO handle the failure
    console.log(e);
    console.log("Something went wrong in the process of delete the ranking");
    return;
  }
});

/**
 * POST LOGIN ROUTE
 */
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Your authentication logic
  db_login.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, row) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ success: false, message: "Server error." });
      }

      // Check if the user was found in the database
      if (row) {
        // Store user information in the session
        req.session.user = row;
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

server.listen(3000, () => {
  console.log("server running at http://localhost:3000/");
});

io.on("connection", async (socket) => {
  console.log("a user connected");

  /**
   * save best result
   */
  socket.on(
    "save-best-result",
    async ({ cookiePhoneNo, cookieName, finalBestTime }) => {
      let result;
      try {
        // store the message in the database
        result = await db.run(
          "INSERT INTO tbl_ranking (contactNo,name,bestTime) VALUES (?,?,?)",
          cookiePhoneNo,
          cookieName,
          finalBestTime
        );

        console.log("successfully save the best result"); //broadcast the result to everyone
      } catch (e) {
        // TODO handle the failure
        console.log("Something went wrong in the process of save best result");
        return;
      }
    }
  );

  /**
   * save-cust-info
   */
  socket.on("save-cust-info", async ({ name, email, contact }) => {
    let result;
    try {
      // store the message in the database
      result = await db.run(
        "INSERT INTO tbl_user (name,email,contactNo) VALUES (?,?,?)",
        name,
        email,
        contact
      );
      console.log("success insert into db");
    } catch (e) {
      // TODO handle the failure
      console.log(e);
      console.log("Something went wrong in the process of save cust info");
      return;
    }
  });

  /**
   * retreieve db result
   */
  const job = new CronJob(
    "* * * * * *", // cronTime
    async function () {
      let UsersArr = [];
      UsersArr = await getUserData();
      // console.log('test: ' + UsersArr);
      socket.emit("retrieve-db-result", UsersArr);
    }, // onTick
    null, // onComplete
    true, // start
    "Asia/Kuala_Lumpur" // timeZone
  );
});

/**
 * get user data from db
 * @returns
 */
const getUserData = async () => {
  let localUsersArr = [];
  let sql = `SELECT * FROM tbl_ranking WHERE bestTime != "" ORDER BY bestTime ASC LIMIT 10`;
  try {
    //GET THE DATA FROM DB
    await db.each(sql, (err, row) => {
      if (err) {
        throw err;
      }

      const user = { id: row.id, name: row.name, bestTime: row.bestTime };
      //console.log(user);
      localUsersArr.push(user);
    });
  } catch (error) {
    console.error("Error executing database query:", error);
  }
  // console.log('localUsersArr:', localUsersArr);
  return localUsersArr;
};

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
 * Close the database connection when the server is stopped
 */
process.on("SIGINT", () => {
  db_login.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Closed the database connection.");
    process.exit();
  });
});
