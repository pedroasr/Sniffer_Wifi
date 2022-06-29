import { io } from "socket.io-client";
import exec from "child_process";

const socket = io.connect("http://api.digiot.teamcamp.ovh:3030/data");

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
          sensorId: "PachiBerry",
          value: temp,
          timestamp: date,
        };
        socket.emit("temperatureUpdate", dataToSend);
      }
    }
  );
}, 2000);
