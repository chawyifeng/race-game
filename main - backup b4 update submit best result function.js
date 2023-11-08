const lights = Array.prototype.slice.call(
  document.querySelectorAll(".light-strip")
);
const time = document.querySelector(".time");
const best = document.querySelector(".best span");
let bestTime = Number(localStorage.getItem("best")) || Infinity;
let started = false;
let lightsOutTime = 0;
let raf;
let timeout;
let timeStamp;

function formatTime(time) {
  time = Math.round(time);
  let outputTime = time / 1000;
  if (time < 10000) {
    outputTime = "0" + outputTime;
  }
  while (outputTime.length < 6) {
    outputTime += "0";
  }
  return outputTime;
}

if (bestTime != Infinity) {
  best.textContent = formatTime(bestTime);

  //insert best time into database here
}

function start() {
  for (const light of lights) {
    light.classList.remove("on");
  }

  time.textContent = "00.000";
  time.classList.remove("anim");

  lightsOutTime = 0;
  let lightsOn = 0;
  const lightsStart = performance.now(); //returns a high resolution timestamp in milliseconds

  function frame(now) {
    const toLight = Math.floor((now - lightsStart) / 1000) + 1;

    if (toLight > lightsOn) {
      for (const light of lights.slice(0, toLight)) {
        light.classList.add("on");
      }
    }

    if (toLight < 5) {
      raf = requestAnimationFrame(frame);
    } else {
      const delay = Math.random() * 4000 + 1000;
      timeout = setTimeout(() => {
        for (const light of lights) {
          light.classList.remove("on");
        }
        lightsOutTime = performance.now();
      }, delay);
    }
  }

  raf = requestAnimationFrame(frame);
}

function end(timeStamp) {
  cancelAnimationFrame(raf);
  clearTimeout(timeout);

  if (!lightsOutTime) {
    time.textContent = "Jump start!";
    time.classList.add("anim");
    return;
  } else {
    const thisTime = timeStamp - lightsOutTime; //start time - light out time

    time.textContent = formatTime(thisTime);

    if (thisTime < bestTime) {
      bestTime = thisTime;
      console.log(bestTime);
      best.textContent = time.textContent;
      localStorage.setItem("best", thisTime);
    }

    time.classList.add("anim");
  }
}

function tap(event) {
  if (
    !started &&
    event.target &&
    event.target.closest &&
    event.target.closest("a")
  )
    return;
  event.preventDefault();

  if (started) {
    //end game
    end(performance.now());
    started = false;
  } else {
    //start game
    startGame();
  }
}

//tap on light only
const clickableArea = document.querySelector(".clickable-area");

clickableArea.addEventListener("touchstart", tap, {
  passive: false,
}); //for mobile

clickableArea.addEventListener(
  "mousedown",
  (event) => {
    if (event.button === 0) tap(event); //left click
  },
  {
    passive: false,
  }
);

clickableArea.addEventListener(
  "keydown",
  (event) => {
    if (event.key == " ") tap(event); //space?
  },
  {
    passive: false,
  }
);

// addEventListener('touchstart', tap, {
//     passive: false
// }); //for mobile

// addEventListener('mousedown', event => {
//     if (event.button === 0) tap(event); //left click
// }, {
//     passive: false
// });

// addEventListener('keydown', event => {
//     if (event.key == ' ') tap(event); //space?
// }, {
//     passive: false
// });

if (navigator.serviceWorker) {
  // check if support service worker
  navigator.serviceWorker.register("sw.js");
}
//=======================================================================
// core game function
//=======================================================================
//show popup modal
function startGame() {
  var CustPopupModal = Cookies.get("racing_start_timer_popup_modal");
  if (CustPopupModal != "true") {
    // user have to fill in the info to start game
    Cookies.set("racing_start_timer_popup_modal", true, { expires: 1 });
    $("#popupCust").modal("show");
  } else {
    //direct start game
    start();
    started = true;
  }
}

function submitFormPopUpCust() {
  // on submit

  var paramPhoneNo = $("#txtContact").val(); //get param phone no
  var cookiePhoneNo = Cookies.get("racing_start_timer_phoneNo");
  if (cookiePhoneNo == null) {
    // user have to fill in the info to start game
    Cookies.set("racing_start_timer_phoneNo", paramPhoneNo, { expires: 1 });
  }

  var formData = {
    insertCustInfo: true,
    txtName: $("#txtName").val(),
    txtEmail: $("#txtEmail").val(),
    txtContact: $("#txtContact").val(),
  };

  $.ajax({
    type: "POST",
    url: "database/insertCustInfo.php",
    data: formData,
    dataType: "JSON",
    beforeSend: function () {
      $("#submitBtn").attr("disabled", "disabled");
      $("#submitBtn .spinner").css("display", "inline-block");
    },
    error: function (jqXHR, textStatus, errorThrown) {
      $("#submitBtn").removeAttr("disabled");
      $("#submitBtn .spinner").css("display", "none");
      $("#popupCust .alert")
        .removeClass("alert-success")
        .addClass("alert-danger");
      $("#popupCust .alert").html(
        "Status Code: " +
          jqXHR.status +
          "\n" +
          "errorThrown: " +
          errorThrown +
          "\n" +
          "jqXHR.responseText: " +
          jqXHR.responseText +
          "\n"
      );
    },
    success: function (data) {
      $("#submitBtn .spinner").css("display", "none");
      $("#submitBtn").removeAttr("disabled");
      if (data.response == "ok") {
        $("#popupCust .alert")
          .removeClass("alert-danger")
          .addClass("alert-success");
        $("#popupCust .alert").html(data.messages);
        $("#popupCust .alert").fadeOut("slow");
        //close popup modal here
        $("#popupCust").modal("hide");

        //direct start game
        start();
        started = true;
      } else {
        $("#popupCust .alert")
          .removeClass("alert-success")
          .addClass("alert-danger");
        $("#popupCust .alert").html(data.messages);
      }
    },
  });
}

function submitFormRaceGame() {
  // on submit

  // alert(formatTime(bestTime)); //default time : Infinity
  var formData = {
    updateCustBestTime: true,
    bestTime: formatTime(bestTime),
    cookiePhoneNo: Cookies.get("racing_start_timer_phoneNo"),
  };

  if (formatTime(bestTime) != Infinity) {
    $.ajax({
      type: "POST",
      url: "database/updateBestResult.php",
      data: formData,
      dataType: "JSON",
      beforeSend: function () {
        $("#confirmBtn").attr("disabled", "disabled");
        $("#confirmBtn .spinner").css("display", "inline-block");
      },
      error: function (jqXHR, textStatus, errorThrown) {
        $("#confirmBtn").removeAttr("disabled");
        $("#confirmBtn .spinner").css("display", "none");
        $("#popupConfirm .alert")
          .removeClass("alert-success")
          .addClass("alert-danger");
        $("#popupConfirm .alert").html(
          "Status Code: " +
            jqXHR.status +
            "\n" +
            "errorThrown: " +
            errorThrown +
            "\n" +
            "jqXHR.responseText: " +
            jqXHR.responseText +
            "\n"
        );
      },
      success: function (data) {
        $("#confirmBtn .spinner").css("display", "none");
        $("#confirmBtn").removeAttr("disabled");
        if (data.response == "ok") {
          //set cookie here
          Cookies.set("racing_start_timer_submitted_result", true, {
            expires: 1,
          });

          $("#popupConfirm .alert")
            .removeClass("alert-danger")
            .addClass("alert-success");
          $("#popupConfirm .alert").html(data.messages + "\n");

          location.reload();
        } else {
          $("#popupConfirm .alert")
            .removeClass("alert-success")
            .addClass("alert-danger");
          $("#popupConfirm .alert").html(data.messages + "\n");
        }
      },
    });
  } else {
    $("#popupConfirm .alert")
      .removeClass("alert-success")
      .addClass("alert-danger");
    $("#popupConfirm .alert").html(
      "Please play at least 1 valid game before submit the result" + "\n"
    );
  }
}

//submitcust detail form
$(document).ready(function () {
  $("#form-popupCust").submit(function (event) {
    submitFormPopUpCust();
    event.preventDefault();
  });
});

//submit best result
$(document).ready(function () {
  $("#submitResultBtn").mousedown(function (event) {
    event.stopPropagation(); // to prevent click on the main container without intent and the game start immediately
    //show confirm dialog here
    $("#popupConfirm").modal("show");
  });
});

//confirmbtn in confirm popup
$(document).ready(function () {
  $("#confirmBtn").click(function () {
    submitFormRaceGame();
  });
});

//cancelbtn in confirm popup
$(document).ready(function () {
  $("#cancelBtn").click(function () {
    $("#popupConfirm").modal("hide");
  });
});

$(document).ready(function () {
  var cookieSubmitted = Cookies.get("racing_start_timer_submitted_result");
  if (cookieSubmitted == "true") {
    $("#clickable-area").replaceWith(
      '<div class="text-center end-game-title">' +
        "Game Over! You have submitted the best result" +
        "</div>" +
        '<div class="results">' +
        '<a id="liveRankingBtn" class="btn btn-secondary ml-3" href="ranking/">Live Ranking</a>' +
        "</div>"
    );
  }
});

// $(document).ready(function () {
//   if (document.location.pathname.matches(/your-page\.html/)) {
//     // do someting
//   }
// });

/// socketio

const socket = io();
const form = document.getElementById('form');
const input = document.getElementById('input');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
  }
});
