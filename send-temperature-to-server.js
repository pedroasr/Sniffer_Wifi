import exec from "child_process";
import fetch from "node-fetch";

setInterval(function () {
  exec.exec(
    "cat /sys/class/thermal/thermal_zone0/temp",
    function (error, stdout, stderr) {
      if (error !== null) {
        console.log("exec error: " + error);
      } else {
        const date = new Date().getTime();
        const temp = parseFloat(stdout / 1000).toString();
        var dataToSend = {
          sensorId: "temp-digio",
          value: temp,
          timestamp: date,
        };
        fetch("http://api.digiot.teamcamp.ovh:3030/data", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(dataToSend),
        }).then((response) => console.log(response));
      }
    }
  );
}, 5000);
