const { exec } = require("child_process");
const { SerialPort, ReadlineParser } = require("serialport");
require("dotenv").config();
const Database = require("better-sqlite3");
const mqtt = require("mqtt");

let espdir = '/dev/ttyUSB0'
var serialport;

//get esp32 dir
exec(
  "ls /dev/ttyUSB*",
  (error,stdout,stderr) => {
    if (error !== null) {
      console.log("ESP32 disconnected");
      
    }else{

      console.log(stdout)
      espdir = stdout
      serialport = new SerialPort({
        path: stdout,
        baudRate: 115200,
        parity: "even",
        stopBits: 1,
        dataBits: 8,
        flowControl: false,
      });
      
    }
  }
)


  





/* Timestamp*/
function pad(n, z) {
  z = z || 2;
  return ("00" + n).slice(-z);
}

const getFechaCompleta = () => {
  let d = new Date(),
    dformat =
      [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join("-") +
      " " +
      [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(":");

  return dformat;
};

/*MQTT*/
const options = {
  clean: true, // retain session
  connectTimeout: 4000, // Timeout period
  // Authentication information
  clientId: process.env.id+"_BLE",
  username: process.env.id+"_BLE",
  password: process.env.id+"_BLE",
}

const connectUrl = "ws://10.147.18.134:8083/mqtt";
const client = mqtt.connect(connectUrl,options);

client.on("connect", function () {
  console.log("Connected to MQTT URL");
});

/*SQLITE3 - Local storagement*/
const db = new Database("DatosBLE.db");
const createTable =
  "CREATE TABLE IF NOT EXISTS ble_data ('Id','MAC','TipoMAC','TipoADV','BLE_Size','RSP_Size','BLE_Data','RSSI','Nseq','Timestamp')";
db.exec(createTable);

const insertInto = db.prepare(
  "INSERT INTO ble_data (Id,MAC,TipoMAC,TipoADV,BLE_Size,RSP_Size,BLE_Data,RSSI,Nseq,Timestamp) VALUES (?,?,?,?,?,?,?,?,?,?)"
);

let limit = Buffer.from([0xaa, 0xaa]);

const parser = serialport.pipe(
  new ReadlineParser({ delimiter: limit, encoding: "hex" })
);

let chain = "";

let dato = {};
dato.idRasp = process.env.id;

parser.on("data", function (buff) {
  //console.log(buff.toString('hex'))
  //chain += buff.toString('hex')
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
          dato.tipoMac = "DEFAULT";
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
      console.log(dato);
      client.publish("CRAIUPCT_BLEdata", JSON.stringify(dato));
    }
  }
});
