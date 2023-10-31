const lights = Array.prototype.slice.call(document.querySelectorAll('.light-strip'));
const time = document.querySelector('.time');
const best = document.querySelector('.best span');
let bestTime = Number(localStorage.getItem('best')) || Infinity;
let started = false;
let lightsOutTime = 0;
let raf;
let timeout;
let timeStart;


function formatTime(time) {
    time = Math.round(time);
    let outputTime = time / 1000;
    if (time < 10000) {
        outputTime = '0' + outputTime;
    }
    while (outputTime.length < 6) {
        outputTime += '0';
    }
    return outputTime;
}

if (bestTime != Infinity) {
    best.textContent = formatTime(bestTime);
}

function start() {
    for (const light of lights) {
        light.classList.remove('on');
    }

    time.textContent = '00.000';
    time.classList.remove('anim');

    lightsOutTime = 0;
    let lightsOn = 0;
    const lightsStart = performance.now(); //returns a high resolution timestamp in milliseconds

    function frame(now) {
        const toLight = Math.floor((now - lightsStart) / 1000) + 1;

        if (toLight > lightsOn) {
            for (const light of lights.slice(0, toLight)) {
                light.classList.add('on');
            }
        }

        if (toLight < 5) {
            raf = requestAnimationFrame(frame);
        } else {
            const delay = Math.random() * 4000 + 1000;
            timeout = setTimeout(() => {
                for (const light of lights) {
                    light.classList.remove('on');
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
        time.classList.add('anim');
        return;
    } else {
        const thisTime = timeStamp - lightsOutTime; //start time - light out time 
        time.textContent = formatTime(thisTime);

        if (thisTime < bestTime) {
            bestTime = thisTime;
            best.textContent = time.textContent;
            localStorage.setItem('best', thisTime);
        }

        time.classList.add('anim');
    }
}

function showpopupmodal() {
    $('#popupCust').modal('show');
}

function tap(event) {

    if (!started && event.target && event.target.closest && event.target.closest('a')) return;
    event.preventDefault();

    if (started) {
        //end game 
        end(timeStamp);
        started = false;
    } else {
        //start game 
        showpopupmodal();
    }
}

//tap on light only 
const f1lights = document.querySelector('#f1-lights');

f1lights.addEventListener('touchstart', tap, {
    passive: false
}); //for mobile

f1lights.addEventListener('mousedown', event => {
    if (event.button === 0) tap(event); //left click
}, {
    passive: false
});

f1lights.addEventListener('keydown', event => {
    if (event.key == ' ') tap(event); //space?
}, {
    passive: false
});

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

if (navigator.serviceWorker) { // check if support service worker 
    navigator.serviceWorker.register('sw.js');
}


function submitFormPopUpCust(){ // on submit
    var formData = new FormData();
    formData.append('updateCustInfo', true);
    formData.append('txtName', $('#txtName').val());
    formData.append('txtEmail', $('#txtEmail').val());
    formData.append('txtContact', $('#txtContact').val());

    $.ajax({
        url: "database/updateCustInfo.php",
        cache: false,
        processData: false,
        contentType: false,
        dataType: 'JSON',
        method: 'POST',
        data: formData,
        beforeSend: function() {
            $("#submitBtn").attr("disabled", "disabled"); 
            $(".spinner").css("display", "block");
        },
        error: function(jqXHR, textStatus, errorThrown) {
            $(".spinner").css("display", "none");
            $('#popupCust .alert').addClass('alert-danger');
            $('#popupCust .alert').html("<p>Status Code: " + jqXHR.status + "</p>" +
                "<p>errorThrown: " + errorThrown + "</p>" +
                "<p>jqXHR.responseText: " + jqXHR.responseText + "</p>");
        },
        success: function(data) {
            $(".spinner").css("display", "none");
            if (data.response == 'ok') {
                $("#submitBtn").removeAttr("disabled");
                $('#popupCust .alert').addClass('alert-success');
                $('#popupCust .alert').html('<div style="height:50px;">' + data.messages + '</div>');
                $('#popupCust .alert').fadeOut('slow');
                //close popup modal here
                $('#popupCust').modal('hide');

                //start game here 
                timeStart = performance.now();
                start();
                started = true;
            } else {
                $("#submitBtn").removeAttr("disabled");
                $('#popupCust .alert').addClass('alert-danger');
                $('#popupCust .alert').html('<div style="height:50px;">' + data.messages + '</div>');
            }
        }

    });
}


$(document).ready(function () {
    $("#submitBtn").click(function () {
         submitFormPopUpCust();
    });
  });