exec = require("child_process").exec;

setInterval(function () {
  exec(
    "cat /sys/class/thermal/thermal_zone0/temp",
    function (error, stdout, stderr) {
      if (error !== null) {
        console.log("exec error: " + error);
      } else {
        var date = new Date().getTime();
        var temp = parseFloat(stdout / 1000);
        var dataToSend = {
          date: date,
          temperature: temp,
        };
        console.log("temperatureUpdate", dataToSend);
      }
    }
  );
}, 5000);
