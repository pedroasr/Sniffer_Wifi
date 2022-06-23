require("dotenv").config();
const pcap = require("pcap");
const colors = require("colors");
const mqtt = require("mqtt");
const Database = require("better-sqlite3");
const db = new Database("Sniffer-Wifi.db");
const createTable =
  "CREATE TABLE IF NOT EXISTS ProbeRequestFrames ('timestamp', 'snifferId', 'SSID', 'RSSI', 'MAC_origen', 'canal')";
db.exec(createTable);
const insertInto = db.prepare(
  "INSERT INTO ProbeRequestFrames (timestamp, snifferId, SSID, RSSI, MAC_origen, canal) VALUES (?, ?, ?, ?, ?, ?)"
);

/*=========================== MQTT =========================*/

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

// ====================== SNIFFER WIFI ==================================

const snifferId = "sniffer2.4Ghz_11"; //cambiar por id del sniffer en el que se ejecute
const {
  parseSSID,
  parseType,
  parseFreq,
  getFullDate,
  parseRSSI,
  parseSourceMAC,
} = require("./functions");

let wifidata = {};
wifidata.id = process.env.id;

function init() {
  console.log("iniciando capturas...");
  // creamos sesion de pcap indicando interfaz (en modo monitor con airmon-ng) y filtros
  // sustituir interfaz por la del dispositivo en el que se ejecuta la app
  var pcapSession = pcap.createSession(process.env.iface3, {
    filter: "type mgt subtype probe-req",
  });

  let SSID;
  let RSSI;
  let MAC_origen;
  let frec;
  let canal;
  let date;

  pcapSession.on("packet", (rawPacket) => {
    var length_RT = rawPacket.buf[2];
    frec = parseFreq(rawPacket.buf, length_RT);
    canal = (frec % 2407) / 5;

    if (canal == 11) {
      var tipo = parseType(rawPacket.buf, length_RT);
      SSID = parseSSID(rawPacket.buf, length_RT, tipo);
      RSSI = parseRSSI(rawPacket.buf, length_RT);
      MAC_origen = parseSourceMAC(rawPacket.buf, length_RT);
      date = getFullDate();

      var disp =
        `====================\n`.green +
        `===PROBE RESQUEST===\n`.green +
        `====================\n`.green +
        `ssid: ${SSID}\n` +
        `RSSI: ${RSSI} dBm\n` +
        `TimeStamp: ${date}\n` +
        `MAC origen: ${MAC_origen}\n` +
        `Canal: ${canal}\n`;

      console.log(disp);

      wifidata.ssid = SSID;
      wifidata.rssi = RSSI;
      wifidata.timestamp = date;
      wifidata.OrigMAC = MAC_origen;
      wifidata.canal = canal;

      client.publish("CRAIUPCT_WifiData", JSON.stringify(wifidata));

      insertInto.run(date, snifferId, SSID, RSSI, MAC_origen, canal);
    }
  });
}

console.log("esperando 5 seg a que se inicie script");
setTimeout(init, 5000);
