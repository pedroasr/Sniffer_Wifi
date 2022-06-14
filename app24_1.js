require("dotenv").config();
const pcap = require("pcap");
const colors = require("colors");

const Database = require("better-sqlite3");
const db = new Database("Sniffer-Wifi.db");
const createTable =
  "CREATE TABLE IF NOT EXISTS ProbeRequestFrames ('timestamp', 'snifferId', 'SSID', 'RSSI', 'MAC_origen', 'canal')";
db.exec(createTable);
const insertInto = db.prepare(
  "INSERT INTO ProbeRequestFrames (timestamp, snifferId, SSID, RSSI, MAC_origen, canal) VALUES (?, ?, ?, ?, ?, ?)"
);

/*=========================== MQTT =========================*/

const connectUrl = 'mqtt://192.168.200.106'
const client = mqtt.connect(connectUrl)

client.on('connect', function () {
        console.log("Connected to MQTT URL")
})

// ====================== SNIFFER WIFI ==================================

const snifferId = "sniffer2.4Ghz_1"; //cambiar por id del sniffer en el que se ejecute
const { parseSSID, parseType, parseFreq } = require("./functions");

var timestamp = new Date();

function init() {
  console.log("iniciando capturas...");
  // creamos sesion de pcap indicando interfaz (en modo monitor con airmon-ng) y filtros
  // sustituir interfaz por la del dispositivo en el que se ejecuta la app
  var pcapSession = pcap.createSession("wlan1", {
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

    if (canal == 1) {
      var packet = pcap.decode.packet(rawPacket);
      var tipo = parseType(rawPacket.buf, length_RT);
      SSID = parseSSID(rawPacket.buf, length_RT, tipo);
      RSSI = packet.payload.fields.antenna_signal;
      MAC_origen = packet.payload.ieee802_11Frame.shost.toString(16);
      date = `${timestamp.getFullYear()}-${
        timestamp.getMonth() + 1
      }-${timestamp.getDate()} ${timestamp.getHours()}:${timestamp.getMinutes()}:${timestamp.getSeconds()}:${timestamp.getMilliseconds()}`;

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
      
      client.publish("CRAIUPCT_WifiData",JSON.stringify(wifidata));

      insertInto.run(date, snifferId, SSID, RSSI, MAC_origen, canal);
    }
  });
}

console.log("esperando 5 seg a que se inicie script");
setTimeout(init, 5000);
