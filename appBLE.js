const { exec } = require("child_process");
const { SerialPort, ReadlineParser } = require("serialport");
require("dotenv").config();
const Database = require("better-sqlite3");
const mqtt = require("mqtt");
var cron = require("node-cron");


/* Timestamp*/
//Funciones para tomar el instante actual, formato: YYYY-MM-DD HH:MM:SS

//Esta funcion mete ceros a la izquierda si el numero es menor de 10
function pad(n, z) {
  z = z || 2;
  return ("00" + n).slice(-z);
}

//Aqui se obtiene la fecha
const getFechaCompleta = () => {
  let d = new Date(),
    dformat =
      [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join("-") +
      " " +
      [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(":");

  return dformat;
};

/*MQTT*/

//En estas lineas se crea la conexion MQTT
const options = {
  clean: true, // retain session
  connectTimeout: 4000, // Timeout period
  // Authentication information
  clientId: process.env.id+"_BLE",
  username: process.env.id+"_BLE",
  password: process.env.id+"_BLE",
}

const connectUrl = "ws://212.128.44.50:8083/mqtt";
const client = mqtt.connect(connectUrl,options);

client.on("connect", function () {
  console.log("Connected to MQTT URL");
});

client.on('error', (error) => {
  console.log('Connection failed:', error)
})

client.on("disconnect", () => {

  mqtt.connect(connectUrl,options);

})


/*SQLITE3 - Local storagement*/
//Configuracion SQLITE3

let db_name = getFechaCompleta().split(" ")[0]+"_"+"DatosBLE_"+process.env.id+".db"

const db = new Database(db_name);
const createTable =
  "CREATE TABLE IF NOT EXISTS ble_data ('Id','MAC','TipoMAC','TipoADV','BLE_Size','RSP_Size','BLE_Data','RSSI','Nseq','Timestamp')";
db.exec(createTable);

const insertInto = db.prepare(
  "INSERT INTO ble_data (Id,MAC,TipoMAC,TipoADV,BLE_Size,RSP_Size,BLE_Data,RSSI,Nseq,Timestamp) VALUES (?,?,?,?,?,?,?,?,?,?)"
);



/* Data processing */
//Se llama a esta funcion para procesar los datos
function ble_process(buff){
  chain = buff.toString("hex"); //va de uno a uno

  if (chain.length == 46 * 2) {
    if (
      chain[0] == "f" &&
      chain[1] == "a" &&
      chain[2] == "f" &&
      chain[3] == "a"
    ) {
      //ID
      dato.id = parseInt(chain[4] + chain[5], 16);

      //MAC
      dato.mac =
        chain[6] +
        chain[7] +
        ":" +
        chain[8] +
        chain[9] +
        ":" +
        chain[10] +
        chain[11] +
        ":" +
        chain[12] +
        chain[13] +
        ":" +
        chain[14] +
        chain[15] +
        ":" +
        chain[16] +
        chain[17];

      //Tipo MAC
      let aux = chain[18] + chain[19];

      dato.tipoMac = "Random";

      if (aux == "00") dato.tipoMac = "Public";

      //Tipo ADV
      aux = chain[20] + chain[21];

      switch (aux) {
        case "00":
          dato.tipoADV = "ADV_IND";
          break;

        case "01":
          dato.tipoADV = "ADV_DIRECT_IND";
          break;

        case "02":
          dato.tipoADV = "ADV_SCAN_IND";
          break;

        case "03":
          dato.tipoADV = "ADV_NONCONN_IND";
          break;

        case "04":
          dato.tipoADV = "SCAN_RSP";
          break;

        default:
          dato.tipoADV = "DEFAULT";
          break;
      }

      //BLE_Size
      dato.bleSize = parseInt(chain[22] + chain[23], 16);

      //RSP_Size
      dato.rspSize = parseInt(chain[24] + chain[25], 16);

      aux = "";
      //BLE_Data || RSP_Data
      //31 bytes * 2 --> fa = f + a
      for (let i = 26; i < 26 + 31 * 2; i++) {
        aux += chain[i];
      }

      dato.bleData = aux;

      //RSSI

      dato.rssi = -parseInt(chain[88] + chain[89], 16);

      //Num Seq

      dato.nseq = parseInt(chain[90] + chain[91], 16);

      dato.timestamp = getFechaCompleta();

      //console.log(dato);
      client.publish("CRAIUPCT_BLEdata", JSON.stringify(dato));

      //console.log(dato)

      insertInto.run(
        dato.id,
        dato.mac,
        dato.tipoMac,
        dato.tipoADV,
        dato.bleSize,
        dato.rspSize,
        dato.bleData,
        dato.rssi,
        dato.nseq,
        dato.timestamp
      );
      
    }
  }
}

let chain = "";

let dato = {};
dato.idRasp = process.env.id;

var espdir =  process.env.espath;

function init(){

  espdir = process.env.espath;

  const serialport = new SerialPort({
    path: espdir,
    baudRate: 115200,
    parity: "even",
    stopBits: 1,
    dataBits: 8,
    flowControl: false,
  });


  let limit = Buffer.from([0xaa, 0xaa]);

  const parser = serialport.pipe(
    new ReadlineParser({ delimiter: limit, encoding: "hex" })
  );



  parser.on("data", function (datos) {

    ble_process(datos)

  });


}

init();

//Keep alive
let ka = dato

setInterval(()=>{

  exec(
    "cat /sys/class/thermal/thermal_zone0/temp",
    function (error, stdout, stderr) {
      if (error !== null) {
        console.log("exec error: " + error);
      } else {
        
        ka = dato

        ka.rssi = parseFloat(stdout / 1000);
        
        ka.timestamp = getFechaCompleta()
        ka.mac = "00:00:00:00:00:00"
      

        client.publish("CRAIUPCT_BLEdata", JSON.stringify(ka));
        

      }
    }
  );

}, 60000);

