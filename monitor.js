const { exec } = require("child_process");
const mqtt = require("mqtt")

const connectUrl = 'mqtt://10.147.18.134'
const client = mqtt.connect(connectUrl)

client.on('connect', function () {
        console.log("Connected to MQTT URL")
})

/* Timestamp*/
function pad(n, z){
    z = z || 2;
  return ('00' + n).slice(-z);
  }
  
  const getFechaCompleta = () => {
    let d = new Date,
    dformat =   [d.getFullYear(),
                pad(d.getMonth()+1),
                pad(d.getDate())].join('-')+' '+
                [pad(d.getHours()),
                pad(d.getMinutes()),
                pad(d.getSeconds())].join(':');
  
    return dformat;
} 

let dataToSend = {}

exec("cat /etc/hostname",(error,stdout,stderr)=>{
    if(error !== null) {
        console.log("Exec error: "+ error);
    }else{
        dataToSend.id = stdout;
    }
})

setInterval(function () {
    exec(
      "cat /sys/class/thermal/thermal_zone0/temp",
      function (error, stdout, stderr) {
        if (error !== null) {
          console.log("exec error: " + error);
        } else {
          dataToSend.temp = parseFloat(stdout / 1000);
          console.log("temperatureUpdate", dataToSend);
          client.publish("keepalive",JSON.stringify(dato))

        }
      }
    );
}, 10000);





