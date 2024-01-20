   // Function to start the countdown timer
   function startTimer(duration, display) {
    let timer = duration, minutes, seconds;
    const intervalId = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = "Within " + minutes + ":" + seconds;

        if (--timer < 0) {
           
            clearInterval(intervalId);
            display.textContent = "Click the Resend OTP !";
        }
    }, 1000);
}


const duration = 5 * 60;
const display = document.getElementById("timer");
startTimer(duration, display);