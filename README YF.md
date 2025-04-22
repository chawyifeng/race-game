# RACING START TIMER (this project is all complete except do checking and complete to do below)

This is a simple Markdown file.

## READ ME

- cookie problem -- done
- dont need set end time / start time of the game -- done
- same person is restricted to play on the same day, enother day is ok -- done
- dont need display live ranking button to user -- done
- add export result fucntion and reset the table -- done?
- validate phone num -- DONE?
  -- separate the result page out and create 1 ADMIN login page --- DONE?

## PROJECT STRUCTURE

http://localhost/racing-start-timer/login/ -- admin module
http://localhost/racing-start-timer/ -- user module
test_server.js --- to test server is runnign
main.js --- front end core game function
server.js --- backend server main script
ranking page --- redirect to login page when not authenticated -- still got problem

## DEPLOYMENT

1. RUN NPM INSTALL
2. CHANGE ORIGIN FOR SOCKET IO
3. RUN SERVER.JS
<pre> node server.js </pre>
4. when deploy in shared hosting with node.js module -- need change fixed port 3000
5. need to have .env file when deploy

## PENDING TASK / TO DO

### YEAR 2025

\*\*\* done change to use public folder -- need checking

2. change to mysql or redis or firebase (SEARCH HOW TO ADD MYSQL INTO NODE.JS) \*\*\* IMPORTANT
3. not working yet for protected route /ranking --- related to session/db \*\*\* IMPORTANT
4. create a endpoint to serve excel file, excel file dont put in public folder \*\*\* done?
5. put those static file into public folder \*\*\* done?
6. CHECK ALL URL/ENDPOINT \*\*\* need checking?
7. BECAUSE MAKE EVERYTHIGN ACCESSIBLE --- SO DONT NEED RUN SERVER.JS ALREADY HAVE SOMETHING CAN WORK -- SHOULD PUT IN PUBLIC \*\*\* done?
8. ReferenceError: db_login is not defined -- line 174 \*\*\* IMPORTANT
9. http://localhost:3000/ -- dont expose port 3000
10. animation for ranking page

### YEAR 2023

1. host the app online
2. test phone can start game?
3. check css

## important thing to warn choong :

1. got some dalay after clear data -- BECAUSE ASYNC?
2. 1day can only play 1 match
