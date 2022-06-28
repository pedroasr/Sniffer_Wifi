import { io } from "socket.io-client";
import exec from "child_process";

const socket = io.connect("*****");

socket.on("connection", function (socket) {
  setInterval(function () {
    exec.exec(
      "cat /sys/class/thermal/thermal_zone0/temp",
      function (error, stdout, stderr) {
        if (error !== null) {
          console.log("exec error: " + error);
        } else {
          const date = new Date().getTime();
          const temp = parseFloat(stdout / 1000);
          const dataToSend = {
            deviceID: "PachiBerry",
            value: temp,
            timestamp: date,
          };
          socket.emit("temperatureUpdate", dataToSend);
        }
      }
    );
  }, 1000);
});
