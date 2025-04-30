# RACING START TIMER (this project is all complete except do checking and complete to do below)

This is a simple Markdown file.

## DONE

- cookie problem -- done
- dont need set end time / start time of the game -- done
- same person is restricted to play on the same day, enother day is ok -- done
- dont need display live ranking button to user -- done
- add export result fucntion and reset the table -- done?
- validate phone num -- DONE?
- separate the result page out and create 1 ADMIN login page --- DONE?
- not working yet for protected route /ranking --- DONE? -- need checking
- create a endpoint to serve excel file, excel file dont put in public folder -- DONE
- http://localhost:3000/ -- dont expose port 3000 --- when in live server will not expose -- DONE

## PROJECT STRUCTURE

http://localhost/racing-start-timer/login/ -- admin module
http://localhost/racing-start-timer/ -- player module
main.js --- front end core game function
server.cjs --- backend server main script
ranking page --- redirect to login page when not authenticated -- still got problem

## DEPLOYMENT

1. RUN NPM INSTALL
2. CREATE DB RACE-GAME
3. RUN SERVER.CJS
<pre> node server.CJS </pre>
4. when deploy in shared hosting with node.js module -- need change fixed port 3000
5. need to have .env file when deploy
6. remove node modules folder and reinstall dependency
7. reupload the whole project to hosting to test

## PENDING TASK / TO DO

30/4/2025
1. ranking logic

const rankings = [];

  socket.on("submitItem", (data) => {
    rankings.push(data);
    rankings.sort((a, b) => b.score - a.score);
    io.emit("updateRanking", rankings);
  });


2. CHANGE TO UPDATE customers SET game_result = ? WHERE contactNo = ? AND email = ? AND name = ?

3. DONT NEED SAVE EVERYTHING IN COOKIE

4. CHECK ALL COOKIE VARIABLE 

5. save 1 copy into db , 1 copy into socketio 


23/4/2025

1. change related code to db / query --- PARTIAL DONE?
3. dont delete data when generate excel file
4. insert record to the db, saving permanently
5. check if the program serving all css/js (is there anything cant load out in 404)
6. CHECK ALL URL/ENDPOINT
7. animation for ranking page
8. test phone can start game?
9. check css

### YEAR 2025

2. change to mysql or redis or firebase (SEARCH HOW TO ADD MYSQL INTO NODE.JS) -- using mysql skip first for firebase

### YEAR 2023

1. host the app online

## important thing to warn choong :

1. got some dalay after clear data -- BECAUSE ASYNC?
2. 1day can only play 1 match
