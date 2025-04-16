//=======================================================================
// core game function
//=======================================================================
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

const socket = io.connect();

/**
 * format output time
 */
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

/**
 * display best time
 */
if (bestTime != Infinity) {
  best.textContent = formatTime(bestTime);

  //insert best time into database here
}

/**
 * start game (CORE GAME FUNCTION)
 */
function start() {
  // 1. Resetting the UI
  for (const light of lights) {
    light.classList.remove("on");
  }

  time.textContent = "00.000";
  time.classList.remove("anim");
  // 1. Resetting the UI

  // 2. Initializing game Variables
  lightsOutTime = 0;
  let lightsOn = 0;
  const lightsStart = performance.now(); //returns a high resolution timestamp in milliseconds
  // 2. Initializing game Variables

  function frame(now) {
    //3. Animating the Lights (1 per second)
    const toLight = Math.floor((now - lightsStart) / 1000) + 1; // + 1 to make the light light first when 1.5sec for example

    if (toLight > lightsOn) {
      for (const light of lights.slice(0, toLight)) {
        light.classList.add("on");
      }
    }
    //3. Animating the Lights (1 per second)

    //4. Continue or End the Countdown
    if (toLight < 5) {
      // condition not yet light all 5 light
      raf = requestAnimationFrame(frame);
    } else {
      // condition after all 5 light is on: add some random delay and turn off the light and record user reaction time
      const delay = Math.random() * 4000 + 1000;
      timeout = setTimeout(() => {
        for (const light of lights) {
          light.classList.remove("on");
        }
        lightsOutTime = performance.now();
      }, delay);
    }
    //4. Continue or End the Countdown
  }

  raf = requestAnimationFrame(frame);
}

/**
 * end game
 */
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

/**
 * tap function
 * @param {*} event
 * @returns
 */
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
    //fake start game, it just display a popup
    startGame();
  }
}

/**
 * instantly run function to enable tap listener
 */
(function enableTapListeners() {
  const clickableArea = document.querySelector(".clickable-area");

  // Mobile (touch)
  clickableArea.addEventListener("touchstart", tap, { passive: false });

  // Mouse (left click only)
  clickableArea.addEventListener(
    "mousedown",
    (event) => {
      if (event.button === 0) {
        tap(event);
      }
    },
    { passive: false }
  );

  // Keyboard (spacebar)
  clickableArea.addEventListener(
    "keydown",
    (event) => {
      if (event.key === " ") {
        tap(event);
      }
    },
    { passive: false }
  );
})();

/**
 * check cookie to see a person register ady or not
 * if not yet, popup a modal for him to register
 * if register ady, direct play game
 */
function startGame() {
  let x = document.cookie;
  let CustPopupModal = getCookie("racing_start_timer_popup_modal");
  if (CustPopupModal != "true") {
    setCookie("racing_start_timer_popup_modal", true);
    $("#popupCust").modal("show");
  } else {
    //direct start game
    start();
    started = true;
  }
}

/**
 * validate a user submit result or not
 */
function validateUserSubmitResult() {
  let cookieSubmitted = getCookie("racing_start_timer_submitted_result");

  if (cookieSubmitted == "true") {
    $("#clickable-area").replaceWith(
      '<div class="text-center end-game-title">' +
        "Game Over! You have submitted the best result!" +
        "</div>"

      // +
      // '<div class="results">' +
      // '<a id="liveRankingBtn" class="btn btn-secondary ml-3" href="ranking/">Live Ranking</a>' +
      // "</div>"
    );
  }
}

/**
 * document ready -- bind event
 */
$(document).ready(function () {
  validateUserSubmitResult();

  //submit cust detail form
  $("#form-popupCust").submit(function (event) {
    event.preventDefault(); // disable default form submit
    submitFormPopUpCust();
  });

  //submit result
  $("#submitResultBtn").mousedown(function (event) {
    event.stopPropagation(); // to prevent click on the main container without intent and the game start immediately
    //show confirm dialog here
    $("#popupConfirm").modal("show");
  });

  //confirmbtn in submit result popup
  $("#confirmBtn").click(function () {
    submitFormRaceGame();
  });

  //cancelbtn in submit result popup
  $("#cancelBtn").click(function () {
    $("#popupConfirm").modal("hide");
  });

  $("#txtContact").mask("000-00000000");
});

//submit customer detail
function submitFormPopUpCust() {
  // on submit

  const txtName = $("#txtName").val();
  const txtEmail = $("#txtEmail").val();
  const txtContact = $("#txtContact").val();

  setCookie("racing_start_timer_phoneNo", txtContact); // to be save again with bestresult
  setCookie("racing_start_timer_name", txtName); // to be save again with bestresult

  try {
    socket.emit("save-cust-info", {
      name: txtName,
      email: txtEmail,
      contact: txtContact,
    });
    $("#popupCust .alert")
      .removeClass("alert-danger")
      .addClass("alert-success");
    $("#popupCust .alert").html("Sucessfully save the information.");
    $("#popupCust .alert").fadeOut("slow");
    //close popup modal here
    $("#popupCust").modal("hide");

    // set cookie so that the customer popup wont show again
    // Cookies.set("racing_start_timer_popup_modal", true, { expires: 1 });
    setCookie("racing_start_timer_popup_modal", true);
    //direct start game
    start();
    started = true;
  } catch (e) {
    $("#popupCust .alert")
      .removeClass("alert-success")
      .addClass("alert-danger");
    $("#popupCust .alert").html(
      "Something went wrong. Unable to save the information."
    );
    return;
  }
}

//submit best result
function submitFormRaceGame() {
  const finalBestTime = formatTime(bestTime);

  let cookiePhoneNo = getCookie("racing_start_timer_phoneNo");
  let cookieName = getCookie("racing_start_timer_name");

  if (finalBestTime != Infinity) {
    // get best time means got both of info ady
    try {
      //set cookie here
      // Cookies.set("racing_start_timer_submitted_result", true, {expires: 1});
      setCookie("racing_start_timer_submitted_result", true);

      socket.emit("save-best-result", {
        cookiePhoneNo: cookiePhoneNo,
        cookieName: cookieName,
        finalBestTime: finalBestTime,
      });
      $("#popupConfirm .alert")
        .removeClass("alert-danger")
        .addClass("alert-success");
      $("#popupConfirm .alert").html("Sucessfully submit the best result.");
      $("#popupConfirm").modal("hide");
      $("#clickable-area").replaceWith(
        '<div class="text-center end-game-title">' +
          "Game Over! You have submitted the best result!" +
          "</div>"

        // +
        // '<div class="results">' +
        // '<a id="liveRankingBtn" class="btn btn-secondary ml-3" href="ranking/">Live Ranking</a>' +
        // "</div>"
      );

      // location.reload();
    } catch (e) {
      $("#popupConfirm .alert")
        .removeClass("alert-success")
        .addClass("alert-danger");
      $("#popupConfirm .alert").html(
        "Something went wrong. Unable to save the best result."
      );
      return;
    }
  } else {
    $("#popupConfirm .alert")
      .removeClass("alert-success")
      .addClass("alert-danger");
    $("#popupConfirm .alert").html(
      "Please play at least 1 valid game before submiting the result."
    );
  }
}

/**
 * javascript cookie function, tmr 00:00 end
 * @param {*} cname
 * @param {*} cvalue
 */
function setCookie(cname, cvalue) {
  var now = new Date();
  var expire = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // Midnight of the next day
    0,
    0,
    0 // 00:00:00
  );

  var expires = "expires=" + expire.toUTCString(); // Better format for cookies
  document.cookie =
    cname + "=" + encodeURIComponent(cvalue) + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
