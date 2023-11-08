const socket = io();

// A $( document ).ready() block.
$(document).ready(function () {
  socket.emit("pull-db-result", { boolean: true });

  socket.on("retrieve-db-result", (usersArr) => {
    // console.log(usersArr); //already get the data 

    resetBoard(usersArr);
  });
});

function ascending(a, b) { return a.bestTime > b.bestTime ? 1 : -1; }
function descending(a, b) { return a.bestTime < b.bestTime ? 1 : -1; }
function reposition(usersArr) {
  var height = $("#table-container .divRow").height();
  var y = height;
  for (var i = 0; i < usersArr.length; i++) {
    usersArr[i].user.css("top", y + "px");
    y += height;
  }
}

function updateRanks(usersArr) {
  //update rank of each row 
  for (var i = 0; i < usersArr.length; i++) {
    usersArr[i].user.find(".rank").text(i + 1); // add rank class to html later
  }
}

function resetBoard(usersArr) {
  var htmlTable = $("#table-container");
  htmlTable.find(".divRow").remove(); //clear table

  for (let i = 0; i < usersArr.length; i++) {
    const user = $(
      "<div class='divRow'>" +
        "<div class='divCell rank'><b>" + (i + 1) + "</b></div>" +
        "<div class='divCell'><b>" + usersArr[i].name + "</b></div>" +
        "<div class='divCell'><b>" + usersArr[i].bestTime + "</b></div>" +
      "</div>"
    );
    // usersArr[i].user = user; //dont need?
    htmlTable.append(user); //display out 
  }

  // usersArr.sort(ascending); // dont need will be done ont database
  // updateRanks(usersArr); // dont need will be done ont database
  reposition(usersArr);
}

// var animating = false;
// $("#table-container").on("click", ".moveUp", function () {
//   if (animating) {
//     return;
//   }

//   var clickedDiv = $(this).closest(".divRow"),
//     prevDiv = clickedDiv.prev(".divRow"),
//     distance = clickedDiv.outerHeight();

//   if (prevDiv.length) {
//     animating = true;
//     $.when(
//       clickedDiv.animate(
//         {
//           top: -distance,
//         },
//         600
//       ),
//       prevDiv.animate(
//         {
//           top: distance,
//         },
//         600
//       )
//     ).done(function () {
//       prevDiv.css("top", "0px");
//       clickedDiv.css("top", "0px");
//       clickedDiv.insertBefore(prevDiv);
//       animating = false;
//     });
//   }
// });
