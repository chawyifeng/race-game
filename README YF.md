# RACING START TIMER

This is a simple Markdown file.

## READ ME
- cookie problem -- done 
- dont need set end time / start time of the game -- done 
- same person is restricted to play on the same day, enother day is ok -- done 
- dont need display live ranking button to user -- done 
- add export result fucntion and reset the table  -- done? 
- validate phone num  -- DONE? 
-- separate the result page out and create 1 ADMIN login page --- DONE?

## PROJECT STRUCTURE
http://localhost/racing-start-timer/login/ -- admin module
http://localhost/racing-start-timer/ -- user module
test_server.js --- to test server is runnign 
main.js ---  front end core game function
server.js --- backend server main script
ranking page --- redirect to login page when not authenticated -- still got problem 

*** need install:
npm install cors
npm install express-session
npm install exceljs

## DEPLOYMENT 
1. RUN NPM INSTALL
2. CHANGE ORIGIN FOR SOCKET IO
3. RUN SERVER.JS
<pre> node server.js </pre>

## PENDING TASK / TO DO
### YEAR 2025
1. change to mysql or redis or firebase (SEARCH HOW TO ADD MYSQL INTO NODE.JS)
2. put those static file into public folder
3. CHECK ALL URL/ENDPOINT
4. BECAUSE MAKE EVERYTHIGN ACCESSIBLE --- SO DONT NEED RUN SERVER.JS ALREADY HAVE SOMETHING CAN WORK -- SHOULD PUT IN PUBLIC

### YEAR 2023
1. host the app online , (in cfmoto)
2. test phone can start game?
3. check css

## important thing to warn choong :
1. got some dalay after clear data -- BECAUSE ASYNC?
2. 1day can only play 1 match 


