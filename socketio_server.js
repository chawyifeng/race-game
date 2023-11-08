//config file for server, usign

import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { CronJob } from 'cron';

///database

// open the database file
// new Date object
let date_ob = new Date();

// current date
// adjust 0 before single digit date
let date = ("0" + date_ob.getDate()).slice(-2);

// current month
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

// current year
let year = date_ob.getFullYear();

const db = await open({
  filename: "user_" + date + month + year + ".db",
  driver: sqlite3.Database,
});

// create our 'messages' table (you can ignore the 'client_offset' column for now)
await db.exec(`
  CREATE TABLE IF NOT EXISTS tbl_user(
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    contactNo varchar(255) NOT NULL UNIQUE,
    bestTime varchar(255) DEFAULT NULL
  );
`);

/////server config

const __filename = fileURLToPath(import.meta.url); // fix __dirname cant use in es6 issue
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, "/"))); //serve all the file in the project directory

const server = createServer(app);
// const io = new Server(server, {
//   path: "/racing-start-timer/"
// });
const io = new Server(server);

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "." });
});

app.get("ranking/", (req, res) => {
  res.sendFile(__dirname + "./ranking/index.html");
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000/");
});

io.on("connection", async (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("save-best-result", async ({ cookiePhoneNo, finalBestTime }) => {
    let result;
    try {
      // store the message in the database
      result = await db.run(
        "UPDATE tbl_user SET bestTime = ? WHERE contactNo = ?",
        finalBestTime,
        cookiePhoneNo
      );
      console.log("successfully save the best result"); //broadcast the result to everyone
    } catch (e) {
      // TODO handle the failure
      console.log("Something went wrong in the process of save best result");
      return;
    }
  });

  socket.on("save-cust-info", async ({ name, email, contact }) => {
    let result;
    try {
      // store the message in the database
      result = await db.run(
        "INSERT INTO tbl_user (name,email,contactNo) VALUES (?,?,?)",
        name,
        email,
        contact,
      );
       console.log("success insert into db");
    } catch (e) {
      // TODO handle the failure
      console.log(e);
      console.log("Something went wrong in the process of save cust info");
      return;
    }
  });

  socket.on("pull-db-result", async ({ boolean }) => {
    if (boolean == true) {
      const job = new CronJob(
        '* * * * * *', // cronTime
        async function () {
          let UsersArr = [];
          UsersArr = await getUserData();
          // console.log('test: ' + UsersArr);
          socket.emit('retrieve-db-result', UsersArr);
        }, // onTick
        null, // onComplete
        true, // start
        'Asia/Kuala_Lumpur' // timeZone
      );
    }
  });

  // Define your database query or function to run on the cron schedule
  const getUserData = async () => {
    let localUsersArr = [];
    let sql = `SELECT * FROM tbl_user WHERE bestTime != "" ORDER BY bestTime ASC LIMIT 10`;
    try {
      //GET THE DATA FROM DB 
      await db.each(sql, (err, row) => {
        if (err) {
          throw err;
        }

        const user = {id:row.id, name:row.name, bestTime:row.bestTime};
        //console.log(user);
        localUsersArr.push(user);
      });
    } catch (error) {
      console.error('Error executing database query:', error);
    }
    // console.log('localUsersArr:', localUsersArr);
    return localUsersArr;
  };
});
