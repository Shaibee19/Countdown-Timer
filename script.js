// WHEN THE PAGE LOADS, SET EVERYTHING UP
document.addEventListener("DOMContentLoaded", function () {
  updateDate();
});

// UPDATE THE DATE IN THE HEADER
function updateDate() {
  const now = new Date();
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayName = days[now.getDay()];
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const year = now.getFullYear();
  const formattedDate = `${month}/${day}/${year}`;

  document.getElementById("currentDay").textContent = dayName;
  document.getElementById("currentDate").textContent = formattedDate;
}

const timerForm = document.getElementById("countdownForm");
const modeCheckbox = document.getElementById("modeCheckbox");
const timerNameInput = document.getElementById("timerName");
const breakDurationDecrementButton = document.getElementById("breakDurationDecrement");
const breakDurationIncrementButton = document.getElementById("breakDurationIncrement");
const breakDurationInput = document.getElementById("breakDuration");
const radioCountdownButton = document.getElementById("radioCountdown");
const radioDateCountdownButton = document.getElementById("radioDateCountdown");
const daysDecrementButton = document.getElementById("daysDecrement");
const daysIncrementButton = document.getElementById("daysIncrement");
const daysInput = document.getElementById("days");
const hoursDecrementButton = document.getElementById("hoursDecrement");
const hoursIncrementButton = document.getElementById("hoursIncrement");
const hoursInput = document.getElementById("hours");
const minutesDecrementButton = document.getElementById("minutesDecrement");
const minutesIncrementButton = document.getElementById("minutesIncrement");
const minutesInput = document.getElementById("minutes");
const secondsDecrementButton = document.getElementById("secondsDecrement");
const secondsIncrementButton = document.getElementById("secondsIncrement");
const secondsInput = document.getElementById("seconds");
const dateInput = document.getElementById("date");
const dateTimeInput = document.getElementById("dateTime");
const addTimerButton = document.getElementById("addTimer");

const countdownDateSettingsDiv = document.querySelector(".countdown__date--settings");
const countdownTimeSettingsDiv = document.querySelector(".countdown__time--settings");
const countdownTimerTypeGroup = document.querySelector(".countdown__timer--typeGroup");
const countdownPomodoroSettingsDiv = document.querySelector(".countdown__pomodoro--setting");
const errorMessageElement = document.querySelector(".error__message");
const countdownTimersList = document.querySelector(".countdown__timers--list");

const showError = (message) => {
    errorMessageElement.textContent = message;
    errorMessageElement.style.display = "block";
};

let timers = [];
// load timers from localStorage if available
if (localStorage.getItem("timers")) {
  timers = JSON.parse(localStorage.getItem("timers"));
  timers.forEach((timer) => {
    if (!timer.isCountdownDate) {
      // stop the timer if it was running when the page closed
      timer.started = false;
    } else {
      // for countdown date timers, ensure the countdownDate is converted to a Date object from string
      timer.countdownDate = new Date(timer.countdownDate);
      // calculate time left based on the countdown date
      timer.timeLeft = Math.floor((timer.countdownDate = Date.now()) / 100);
    }
    // ensure intervalID is null for all timers
    timer.intervalID = null;
  });
}

// create HTML for a timer item
const createTimerHTML = (timer) => {
    // calculate hours, minutes, and seconds left
    const hoursLeft = Math.floor(timer.timeLeft / 3600).toString().padStart(2, "0");
    const minutesLeft = Math.floor((timer.timeLeft % 3600) / 60).toString().padStart(2, "0");
    const secondsLeft = Math.floor(timer.timeLeft % 60).toString().padStart(2, "0");

    return `
        <div class="countdown__timer">
            <!-- changing colors based on the time left and mode -->
            <span class="countdown__timer--time ${timer.timeLeft === 0 && "timer__ended"} ${timer.isOnBreak && "timer__break"}" id="sampleTimer">${hoursLeft}:${minutesLeft}:${secondsLeft}</span>
            <h3 class="countdown__timer--name">${timer.name}</h3>
        </div>
        <div class="countdown__timer--controls">
            <!-- displaying tags on pomodoro and countdown date timers -->
            ${timer.pomodoro 
                ? `
                <div class="countdown__timer--tag">
                    Pomodoro Mode - ${timer.breakDuration.toString().padStart(2, "0")}:00 break set
                </div>
                `
                : ""
            }
            ${timer.isCountdownDate
                ? `
                <div class="countdown__timer--tag">
                    Countdown to: ${timer.countdownDate}
                </div>
                `
                : ""
            }
            <div class="countdown__timer--buttons">
                <button class="countdown__timer--button countdown__timer--buttonStart">Start</button>
                <button class="countdown__timer--button countdown__timer--buttonStop">Pause</button>
                <button class="countdown__timer--button countdown__timer--buttonReset">Reset</button>
                <button class="countdown__timer--button countdown__timer--buttonNext">${timer.isOnBreak ? "End Break" : "Start Break"}</button>
                <button class="countdown__timer--button countdown__timer--buttonDelete">Delete</button>
            </div>
        </div>
    `;
};

// timer object structure 
// {
//      name: string, // name of the timer
//      pomodoro: bool, // indicats if it's a pomodoro timer
//      breakDuration: int, // break duration in minutes (only for pomodoro)
//      totalTime: int, // initial time in seconds (not for countdown date time)
//      timeLeft: int, // time left in seconds
//      started: bool, // indicates if the timer is currently running
//      isOnBreak: bool, // indicates if the timer is currently on a break (only)
//      isCountdownDate: bool, // indicates if t it's a countdown to a specific
//      countdownDate: Date, // the date to count down to (only for countdown)
//      intervalID: null // the interval ID for the timer (needed to run multi)
// }

const updateTimersView = () => {
    if (timers.length === 0) {
        countdownTimersList.innerHTML = 
            "<li class='noTimer__message'>No timers added yet.</li>";
        return;
    }
    countdownTimersList.innerHTML = "";
    timers.forEach((timer, index) => {
        const timerItem = document.createElement("li");
        timerItem.className = "countdown__timer--item";
        timerItem.dataset.index = index;
        timerItem.innerHTML = createTimerHTML(timer);
        countdownTimersList.appendChild(timerItem);

        // display of start button
        const startButton = timerItem.querySelector(".countdown__timer--buttonStart");

        if (!timer.started && timer.timeLeft !== 0) {
            startButton.style.display = "inline-block";
        } else {
            startButton.style.display = "none";
        }

        // display of stop button
        const stopButton = timerItem.querySelector(".countdown__timer--buttonStop");

        if (!timer.started && !timer.isCountdownDate) {
            stopButton.style.display = "inline-block";
        } else {
            stopButton.style.display = "none";
        }

        // display of reset button
        const resetButton = timerItem.querySelector(".countdown__timer--buttonReset");

        if (
            !timer.isCountdownDate && 
            timer.timeLeft !== timer.totalTime &&
            !timer.started &&
            timer.breakDuration * 60 !== timer.timeLeft
        ) {
            resetButton.style.display = "inline-block";
        } else {
            resetButton.style.display = "none";
        }

        // display of next button
        const nextButton = timerItem.querySelector(".countdown__timer--buttonNext");

        if (timer.pomodoro) {
            nextButton.style.display = "inline-block";
        } else {
            nextButton.style.display = "none";
        }

        // adding interval for countdown timers
        if (!timer.intervalID && timer.started) {
            timer.intervalID = setInterval(() => {
                // if the timer is a countdown date, calculate time left based on
                if (timer.isCountdownDate) {
                    timer.timeLeft = Math.floor((timer.countdownDate - Date.now()) / 1000);
                } else {
                    // for regular countdown timers, just decrement the time left
                    timer.timeLeft--;
                }
                // what to do when the timer reaches zero
                if (timer.timeLeft <= 0) {
                    // if it's pomodoro mode, toggle break state
                    if (timer.pomodoro) {
                        if (timer.isOnBreak) {
                            timer.isOnBreak = false;
                            timer.timeLeft = timer.totalTime;
                        } else {
                            timer.isOnBreak = true;
                            // break duration is in minutes, convert to seconds
                            timer.timeLeft = timer.breakDuration * 60;
                        }
                    } else {
                        // if it's a countdown timer, stop the timer
                        clearInterval(timer.intervalID);
                        timer.intervalID = null;
                        timer.started = false;
                        timer.timeLeft = 0;
                    }
                }
                updateTimersView();
            }, 1000);
        }

        //  event listeners for start button
        startButton.addEventListener("click", () => {
            timer.started = true;
            updateTimersView();
        });

        //  event listeners for stop button
        stopButton.addEventListener("click", () => {
            clearInterval(timer.intervalID);
            timer.intervalID = null;
            timer.started = false;
            updateTimersView();
        });

        //  event listeners for reset button
        resetButton.addEventListener("click", () => {
            clearInterval(timer.intervalID);
            timer.intervalID = null;
            // if it's in pomodoro mode timer, reset depending on break
            if (timer.pomodoro && timer.isOnBreak) {
                timer.timeLeft = timer.breakDuration * 60;
            } else {
                timer.timeLeft = timer.totalTime;
            }
            updateTimersView();
        });

        //  event listeners for next button
        nextButton.addEventListener("click", () => {
            // toggle between pomodorod break state
            if (timer.isOnBreak) {
                timer.isOnBreak = false;
                timer.timeLeft = timer.totalTime;
            } else {
                timer.isOnBreak = true;
                timer.timeLeft = timer.breakDuration * 60;
            }
            updateTimersView();
        });

        //  event listeners for delete button
        const deleteButton = timerItem.querySelector(".countdown__timer--buttonDelete");
        deleteButton.addEventListener("click", () => {
            clearInterval(timer.intervalID);
            timers.splice(index, 1);
            updateTimersView();
        });
    });
    // save timers to localStorage
    localStorage.setItem("timers", JSON.stringify(timers));
};

updateTimersView();

// FORM SUBMISSION HANDLING 
timerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const timerName = timerNameInput.value.trim();
    const breakDuration = +breakDurationInput.value;
    const isPomodoroMode = modeCheckbox.checked;
    const isCountdown = radioCountdownButton.checked;
    const isCountdownDate = radioDateCountdownButton.checked;
    const days = +daysInput.value;
    const hours = +hoursInput.value;
    const minutes = +minutesInput.value;
    const seconds = +secondsInput.value;
    const date = dateInput.value;
    const dateTime = dateTimeInput.value;
    
    let error = "";

    if(!timerName) {
        error = "Please enter a timer name.";
        showError(error);
        return;
    }
    if (isCountdown) {
        let totalTime = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;

        if (totalTime === 0) {
            error = "Please set a valid countdown time.";
            showError(error);
            return;
        }
        if (isPomodoroMode) {
            timers.push({
                name: timerName,
                pomodoro: true,
                breakDuration: breakDuration,
                totalTime: totalTime,
                timeLeft: totalTime,
            });
        } else {
            timers.push({
                name: timerName,
                totalTime: totalTime,
                timeLeft: totalTime,
            });
        }
        updateTimersView();
    }
    if (isCountdownDate) {
        if (!date || !dateTime) {
            error = "Please select a date and time for the countdown.";
            showError(error);
            return;
        }
        const countdownDate = new Date(date + "T" + dateTime);
        const currentDate = new Date();
        if (countdownDate <= currentDate) {
            error = "The selected date and time must be in the future.";
            showError(error);
            return;
        }
        const timeLeft = Math.floor((countdownDate - currentDate) / 1000);
        timers.push({
            name: timerName,
            isCountdownDate: true,
            countdownDate: countdownDate,
            started: true,
            timeLeft: timeLeft,
        });
        updateTimersView();
    }
});

// TIMER MODE HANDLING
radioCountdownButton.addEventListener("change", () => {
    if (radioCountdownButton.checked) {
        countdownDateSettingsDiv.style.display = "none";
        countdownTimeSettingsDiv.style.display = "flex";
    }
});

radioDateCountdownButton.addEventListener("change", () => {
    if (radioDateCountdownButton.checked) {
        countdownDateSettingsDiv.style.display = "flex";
        countdownTimeSettingsDiv.style.display = "none";
    }
});

modeCheckbox.addEventListener("change", () => {
    if (modeCheckbox.checked) {
        countdownTimerTypeGroup.style.display = "none";
        countdownPomodoroSettingsDiv.style.display = "block";
        radioCountdownButton.click();
    } else {
        countdownTimerTypeGroup.style.display = "flex";
        countdownPomodoroSettingsDiv.style.display = "none";
    }
});

// BREAK DURATION INPUT HANDLING
const updateBreakDurationButtonsState = () => {
    const currentValue = + breakDurationInput.value;
    breakDurationDecrementButton.disabled = currentValue <= 1;
    breakDurationIncrementButton.disabled = currentValue >= 60;
    if (currentValue <= 1) {
        breakDurationDecrementButton.style.cursor = "not-allowed";
    } else {
        breakDurationDecrementButton.style.cursor = "pointer";
    }
    if (currentValue >= 60) {
        breakDurationIncrementButton.style.cursor = "not-allowed";
    } else {
        breakDurationIncrementButton.style.cursor = "pointer";
    }
};

breakDurationDecrementButton.addEventListener("click", () => {
    const currentValue = +breakDurationInput.value;
    if (currentValue > 1) {
        breakDurationInput.value = currentValue - 1;
    }
    updateBreakDurationButtonsState();
});

breakDurationIncrementButton.addEventListener("click", () => {
    const currentValue = +breakDurationInput.value;
    if (currentValue < 60) {
        breakDurationInput.value = currentValue + 1;
    }
    updateBreakDurationButtonsState();
});

breakDurationInput.addEventListener("change", () => { // "blur" ??
    const currentValue = +breakDurationInput.value;
    if (currentValue < 1) {
        breakDurationInput.value = 1;
    }
    if (currentValue > 60) {
        breakDurationInput.value = 60;
    }
    updateBreakDurationButtonsState();
});

updateBreakDurationButtonsState();

// TIME INPUT HANDLING
const updateTimeButtonsState = () => {
    const currentDays = +daysInput.value;
    const currentHours = +hoursInput.value;
    const currentMinutes = +minutesInput.value;
    const currentSeconds = +secondsInput.value;
    if (currentDays >= 30) {
        daysIncrementButton.disabled = true;
        daysIncrementButton.style.cursor = "not-allowed";
    } else {
        daysIncrementButton.disabled = false;
        daysIncrementButton.style.cursor = "pointer";
    }
    if (currentDays <= 0) {
        daysDecrementButton.disabled = true;
        daysDecrementButton.style.cursor = "not-allowed";
    } else {
        daysDecrementButton.disabled = false;
        daysDecrementButton.style.cursor = "pointer";
    }
    if (currentHours >= 23) {
        hoursIncrementButton.disabled = true;
        hoursIncrementButton.style.cursor = "not-allowed";
    } else {
        hoursIncrementButton.disabled = false;
        hoursIncrementButton.style.cursor = "pointer";
    }
    if (currentHours <= 0) {
        hoursDecrementButton.disabled = true;
        hoursDecrementButton.style.cursor = "not-allowed";
    } else {
        hoursDecrementButton.disabled = false;
        hoursDecrementButton.style.cursor = "pointer";
    }
    if (currentMinutes >= 59) {
        minutesIncrementButton.disabled = true;
        minutesIncrementButton.style.cursor = "not-allowed";
    } else {
        minutesIncrementButton.disabled = false;
        minutesIncrementButton.style.cursor = "pointer";
    }
    if (currentMinutes <= 0) {
        minutesDecrementButton.disabled = true;
        minutesDecrementButton.style.cursor = "not-allowed";
    } else {
        minutesDecrementButton.disabled = false;
        minutesDecrementButton.style.cursor = "pointer";
    }
    if (currentSeconds >= 59) {
        secondsIncrementButton.disabled = true;
        secondsIncrementButton.style.cursor = "not-allowed";
    } else {
        secondsIncrementButton.disabled = false;
        secondsIncrementButton.style.cursor = "pointer";
    }
    if (currentSeconds <= 0) {
        secondsDecrementButton.disabled = true;
        secondsDecrementButton.style.cursor = "not-allowed";
    } else {
        secondsDecrementButton.disabled = false;
        secondsDecrementButton.style.cursor = "pointer";
    }
};

daysIncrementButton.addEventListener("click", () => {
    const currentValue = +daysInput.value;
    if (currentValue < 30) {
        daysInput.value = currentValue + 1;
    }
    updateTimeButtonsState();
});

daysDecrementButton.addEventListener("click", () => {
    const currentValue = +daysInput.value;
    if (currentValue > 0) {
        daysInput.value = currentValue - 1;
    }
    updateTimeButtonsState();
});

daysInput.addEventListener("blur", () => {
    const currentValue = +hoursInput.value;
    if (currentValue < 0) {
        daysInput.value = 0;
    }
    if (currentValue > 30) {
        daysInput.value = 30;
    }
    updateTimeButtonsState();
});

hoursIncrementButton.addEventListener("click", () => {
    const currentValue = +hoursInput.value;
    if (currentValue < 23) {
        hoursInput.value = currentValue + 1;
    }
    updateTimeButtonsState();
});

hoursDecrementButton.addEventListener("click", () => {
    const currentValue = +hoursInput.value;
    if (currentValue > 0) {
        hoursInput.value = currentValue - 1;
    }
    updateTimeButtonsState();
});

hoursInput.addEventListener("blur", () => {
    const currentValue = +hoursInput.value;
    if (currentValue < 0) {
        hoursInput.value = 0;
    }
    if (currentValue > 23) {
        hoursInput.value = 23;
    }
    updateTimeButtonsState();
});

minutesIncrementButton.addEventListener("click", () => {
    const currentValue = +minutesInput.value;
    if (currentValue < 59) {
        minutesInput.value = currentValue + 1;
    }
    updateTimeButtonsState();
});

minutesDecrementButton.addEventListener("click", () => {
    const currentValue = +minutesInput.value;
    if (currentValue > 0) {
        minutesInput.value = currentValue - 1;
    }
    updateTimeButtonsState();
});

minutesInput.addEventListener("blur", () => {
    const currentValue = +minutesInput.value;
    if (currentValue < 0) {
        minutesInput.value = 0;
    }
    if (currentValue > 59) {
        minutesInput.value = 59;
    }
    updateTimeButtonsState();
});

secondsIncrementButton.addEventListener("click", () => {
    const currentValue = +secondsInput.value;
    if (currentValue < 59) {
        secondsInput.value = currentValue + 1;
    }
    updateTimeButtonsState();
});

secondsDecrementButton.addEventListener("click", () => {
    const currentValue = +secondsInput.value;
    if (currentValue > 0) {
        secondsInput.value = currentValue - 1;
    }
    updateTimeButtonsState();
});

secondsInput.addEventListener("blur", () => {
    const currentValue = +secondsInput.value;
    if (currentValue < 0) {
        secondsInput.value = 0;
    }
    if (currentValue > 59) {
        secondsInput.value = 59;
    }
    updateTimeButtonsState();
});

updateTimeButtonsState();
