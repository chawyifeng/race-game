// document.addEventListener('DOMContentLoaded', () => {

//   // Check if the user is authenticated
//   const baseUrlWithPort3000 = `${window.location.protocol}//${window.location.hostname}:3000`;
//   const baseUrlWithDefaultPort = `${window.location.protocol}//${window.location.hostname}`;

//   fetch(`${baseUrlWithPort3000}/checkAuthentication`) // A new route to check authentication status
//     .then(response => response.json()) //convert into json
//     .then(data => {

//       console.log(data.authenticated);

//       if (data.authenticated) {
//         // User is authenticated, show the content
//         document.getElementById('main-container').style.display = 'block';
//       } else {
//         // User is not authenticated, redirect to login
//        // window.location.href = `${baseUrlWithDefaultPort}/racing-start-timer/login`;
//       }
//     })
//     .catch(error => {
//       console.log('Error checking authentication status:', error);
//     });
// });

const socket = io.connect();

// A $( document ).ready() block.
$(document).ready(function () {
  // socket.emit("pull-db-result", { boolean: true });

  socket.on("retrieve-db-result", (usersArr) => {
    // console.log(usersArr); //already get the data

    resetBoard(usersArr);
  });
});

function resetBoard(usersArr) {
  var tbody = $("#leaderboard #tbody");
  tbody.find("tr").remove(); //clear table

  for (let i = 0; i < usersArr.length; i++) {
    const user = $(
      "<tr>" +
        "<td class='rank'><b>" +
        (i + 1) +
        "</b></td>" +
        "<td class=''><b>" +
        usersArr[i].name +
        "</b></td>" +
        "<td class=''><b>" +
        usersArr[i].bestTime +
        "</b></td>" +
        "</tr>"
    );
    tbody.append(user); //display out
  }

  // usersArr.sort(ascending); // dont need will be done ont database
  // updateRanks(usersArr); // dont need will be done ont database
  // reposition(usersArr);
}
