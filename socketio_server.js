//config file for server, usign

import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { CronJob } from 'cron';

import excelJS from 'exceljs'
// import { excelJS } from 'exceljs';

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

// current hours
let hours = date_ob.getHours();

// current minutes
let minutes = date_ob.getMinutes();

// current seconds
let seconds = date_ob.getSeconds();

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
    contactNo varchar(255) NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS tbl_ranking(
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    contactNo varchar(255) NOT NULL UNIQUE,
    name varchar(255) NOT NULL,
    bestTime varchar(255) NOT NULL
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

//download excel function
app.post("/downloadExcel", async (req, res) => { //change from get to post
   // WRITE DOWNLOAD EXCEL LOGIC
   const workbook = new excelJS.Workbook();  // Create a new workbook
   const worksheet = workbook.addWorksheet("Final Result"); // New Worksheet
   const downloadPath = "./excel";  // Path to download excel
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
    UsersArr = await getUserData();
 
    //  Looping through User data
    let counter = 1;
    UsersArr.forEach((user) => {
      worksheet.addRow({ rank: counter, name: user.name, bestTime: user.bestTime });
      counter++;
    });
 
   // Making first line in excel bold
   worksheet.getRow(1).eachCell((cell) => {
     cell.font = { bold: true };
   });

   try {
     const data = await workbook.xlsx.writeFile(fullFileName)
       .then(() => {
        //  res.send({
        //    status: "success",
        //    message: "file successfully downloaded",
        //    path: `${downloadPath}/users.xlsx`,
        //  });
        res.sendFile(filename, { root: 'excel' });
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

server.listen(3000, () => {
  console.log("server running at http://localhost:3000/");
});

io.on("connection", async (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("save-best-result", async ({ cookiePhoneNo, cookieName, finalBestTime }) => {
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
  });

  // socket.on("save-cust-info", async ({ name, email, contact }) => {
  //   let result;
  //   try {
  //     // store the message in the database
  //     result = await db.run(
  //       "INSERT INTO tbl_user (name,email,contactNo) VALUES (?,?,?)",
  //       name,
  //       email,
  //       contact,
  //     );
  //     console.log("success insert into db");
  //   } catch (e) {
  //     // TODO handle the failure
  //     console.log(e);
  //     console.log("Something went wrong in the process of save cust info");
  //     return;
  //   }
  // });

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

});


// Define your database query or function to run on the cron schedule
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
    console.error('Error executing database query:', error);
  }
  // console.log('localUsersArr:', localUsersArr);
  return localUsersArr;
};


