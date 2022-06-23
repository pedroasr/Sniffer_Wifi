const { exec } = require("child_process");
const mqtt = require("mqtt");
require("dotenv").config();

/*MQTT */

const options = {
  clean: true, // retain session
connectTimeout: 4000, // Timeout period
// Authentication information
clientId: process.env.id,
username: process.env.id,
password: process.env.id,
}

const connectUrl = "ws://10.147.18.134:8083/mqtt";
const client = mqtt.connect(connectUrl,options);

client.on("connect", function () {
  console.log("Connected to MQTT URL");
});

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




let dataToSend = {};
let ifaces = []
let packets = []

exec("cat /etc/hostname", (error, stdout, stderr) => {
  if (error !== null) {
    console.log("Exec error: " + error);
  } else {
    dataToSend.id = stdout.split("\n")[0];
  }
  
});



setInterval(function () {
    exec(
      "cat /sys/class/thermal/thermal_zone0/temp",
      function (error, stdout, stderr) {
        if (error !== null) {
          console.log("exec error: " + error);
        } else {
          dataToSend.temp = parseFloat(stdout / 1000);
          console.log("temperatureUpdate", dataToSend);
          

        }
      }
    );

    let auxcom = ''
    let chain = ''
    

    for(let i = 1;i<4;i++){ //Getting the interfaces RX packets to monitor if alive

      switch(i){
        case 1:
          auxcom = `ifconfig ${process.env.iface1} |grep "RX packets"`
          break;
        case 2:
          auxcom = `ifconfig ${process.env.iface2} |grep "RX packets"`
          break;
        case 3:
          auxcom = `ifconfig ${process.env.iface3} |grep "RX packets"`
          break;
      }
        

      exec(
        auxcom,
        (error,stdout,stderr) => {
          if (error !== null) {
            //console.log("exec error: " + error);
            console.log("At least one Wifi Interface is down")
            console.log(auxcom)
            ifaces[i-1] = "KO"
          }else{

            chain = stdout.split(" ")
            /*if(packets[i-1]<chain[10]){//Code moved to server
              ifaces[i-1] = "OK"
            }else{
              ifaces[i-1] = "nOK"
            }*/
            packets[i-1] = chain[10]
            ifaces[i-1] = chain[10]
            
          }
        }
      )
    }
    
    dataToSend.iface1 = ifaces[0]
    dataToSend.iface2 = ifaces[1]
    dataToSend.iface3 = ifaces[2]

    dataToSend.timestamp = getFechaCompleta();
    
    
    exec(
      "ls /dev/ttyUSB*",
      (error,stdout,stderr) => {
        if (error !== null) {
          console.log("ESP32 disconnected");
          dataToSend.BLEface = "KO"
        }else{

          dataToSend.BLEface = 'OK'
          
        }
      }
    )


    console.log(`${getFechaCompleta()} -- Sending monitoring data to server`)
    client.publish("keepalive",JSON.stringify(dataToSend))
}, 1000*10*60);

