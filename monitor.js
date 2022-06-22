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
let ifaces = []
let packets = []

exec("cat /etc/hostname",(error,stdout,stderr)=>{
    if(error !== null) {
        console.log("Exec error: "+ error);
    }else{
      dataToSend.id = stdout.split('\n')[0];
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
          

        }
      }
    );

    let auxcom = ''
    let chain = ''
    

    for(let i = 1;i<4;i++){ //Getting the interfaces RX packets to monitor if alive
      auxcom = `ifconfig ${env.process.iface}i |grep "RX packets"`
      exec(
        auxcom,
        (error,stdout,stderr) => {
          if (error !== null) {
            console.log("exec error: " + error);
            ifaces[i-1] = "KO"
          }else{

            chain = stdout.split(" ")
            if(packets[i-1]<chain[10]){
              ifaces[i-1] = "OK"
            }else{
              ifaces[i-1] = "nOK"
            }
            
          }
        }
      )
    }
    
    dataToSend.iface1 = ifaces[0]
    dataToSend.iface2 = ifaces[1]
    dataToSend.iface3 = ifaces[2]
    
    
    exec(
      "ls /dev/ttyUSB*",
      (error,stdout,stderr) => {
        if (error !== null) {
          console.log("exec error: " + error);
          dataToSend.BLEface = "KO"
        }else{

          dataToSend.BLEface = 'OK'
          
        }
      }
    )



    client.publish("keepalive",JSON.stringify(dataToSend))
}, 1000*10*60);





