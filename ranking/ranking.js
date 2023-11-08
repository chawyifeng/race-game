const socket = io();

// A $( document ).ready() block.
$(document).ready(function () {
  socket.emit("pull-db-result", { boolean: true });

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
        "<td class='rank'><b>" + (i + 1) + "</b></td>" +
        "<td class=''><b>" + usersArr[i].name + "</b></td>" +
        "<td class=''><b>" + usersArr[i].bestTime + "</b></td>" +
      "</tr>"
    );
    tbody.append(user); //display out 
  }

  // usersArr.sort(ascending); // dont need will be done ont database
  // updateRanks(usersArr); // dont need will be done ont database
  // reposition(usersArr);
}

