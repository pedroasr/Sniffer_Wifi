var io = require("socket.io-client");
var exec = require("child_process").exec;

const socket = io.connect("http://localhost:3000");

socket.on("connection", function (socket) {
  setInterval(function () {
    child = exec(
      "cat /sys/class/thermal/thermal_zone0/temp",
      function (error, stdout, stderr) {
        if (error !== null) {
          console.log("exec error: " + error);
        } else {
          var date = new Date();
          var temp = parseFloat(stdout / 1000);
          var dataToSend = {
            date: date,
            temperature: temp,
          };
          socket.emit("temperatureUpdate", dataToSend);
        }
      }
    );
  }, 5000);
});
