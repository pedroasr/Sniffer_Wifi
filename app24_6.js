require("dotenv").config();
const pcap = require("pcap");
const colors = require("colors");
const mqtt = require("mqtt");
var cron = require("node-cron");

const Database = require("better-sqlite3");
const db = new Database("Sniffer-Wifi.db");
const createTable =
  "CREATE TABLE IF NOT EXISTS ProbeRequestFrames ('timestamp', 'snifferId', 'SSID', 'RSSI', 'MAC_origen', 'canal','Rates','HTC_Capabilities','Vendor_Specific','Extended_rates','Extended_HTC_Capabilities','VHT_Capabilities')";
db.exec(createTable);
const insertInto = db.prepare(
  "INSERT INTO ProbeRequestFrames (timestamp, snifferId, SSID, RSSI, MAC_origen, canal, Rates, HTC_Capabilities, Vendor_Specific, Extended_rates, Extended_HTC_Capabilities, VHT_Capabilities) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);

//=========================MQTT===========================

const options = {
  clean: true, // retain session
  connectTimeout: 4000, // Timeout period
  // Authentication information
  clientId: process.env.id + "_c6",
  username: process.env.id + "_c6",
  password: process.env.id + "_c6",
};

const connectUrl = "ws://10.147.18.134:8083/mqtt";
const client = mqtt.connect(connectUrl, options);

client.on("connect", function () {
  console.log("Connected to MQTT URL");
});

// ====================== SNIFFER WIFI ==================================

const snifferId = "sniffer2.4Ghz_6"; //cambiar por id del sniffer en el que se ejecute
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
var pcapSession;

let rate = 0x0
let htccap = 0x0
let vendorspecific;
let extendedrates = 0x0
let extendedhtc = 0x0
let vhtcap = 0x0	


const checkProbe = (rawData) => {

	//console.log(rawData)
	let i = 0
	let curs = rawData[i]
	
	while (i<rawData.length){
		
		if (rawData[i+1] == 00)
			i+=2;
		else{

			let fr = rawData.slice(i,rawData[i+1]+i+2)
			console.log(fr," - ",i)
			i+=rawData[i+1]+2
			switch(fr[0]){
				case 01:
					rate = fr.slice(2,fr.length).toString('hex')
					break;
				case 45:
					htccap = fr.slice(2,fr.length).toString('hex')
					break;
				case 50:
					extendedrates = fr.slice(2,fr.length).toString('hex')
					break;
				case 127:
					extendedhtc = fr.slice(2,fr.length).toString('hex')
					break;
				case 191:
					vhtcap = fr.slice(2,fr.length).toString('hex')
					break;
				case 221:
					
					vendorspecific += fr.slice(2,5).toString('hex')
					break;
			}

		}

	}
	console.log("rates: ",rate)
	console.log("vendor specific: ",vendorspecific)
	console.log("htc cap: ",htccap)
	console.log("ext rates: ",extendedrates)
	console.log("ext htc cap: ",extendedhtc)
	console.log("vht cap: ",vhtcap)

}

function init() {
  console.log("iniciando capturas...");
  // creamos sesion de pcap indicando interfaz (en modo monitor con airmon-ng) y filtros
  // sustituir interfaz por la del dispositivo en el que se ejecuta la app
  pcapSession = pcap.createSession(process.env.iface2, {
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

    if (canal == 6) {
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
      //console.log(rawPacket.buf)
      checkProbe(rawPacket.buf.slice(42,rawPacket.buf.length))

      wifidata.ssid = SSID;
      wifidata.rssi = RSSI;
      wifidata.timestamp = date;
      wifidata.OrigMAC = MAC_origen;
      wifidata.canal = canal;
      wifidata.rate = rate;
      wifidata.htccap = htccap;
      wifidata.vendorspecific = vendorspecific;
      wifidata.extendedrates = extendedrates;
      wifidata.extendedhtc = extendedhtc;
      wifidata.vhtcap = vhtcap;

      client.publish("CRAIUPCT_WifiData", JSON.stringify(wifidata));

      insertInto.run(date, snifferId, SSID, RSSI, MAC_origen, canal,rate,htccap,vendorspecific,extendedrates,extendedhtc,vhtcap);
      rate = 0x0
      htccap = 0x0
      vendorspecific='';
      extendedrates = 0x0
      extendedhtc = 0x0
      vhtcap = 0x0	

    }
  });
}

console.log("esperando 5 seg a que se inicie script");
setTimeout(init, 5000);

cron.schedule("0 */5 * * * *", () => {
  pcapSession.close();
  console.log("esperando 5 seg a que se inicie script");
  setTimeout(init, 5000);
});


let ka = wifidata

setInterval(()=>{

  exec(
    "cat /sys/class/thermal/thermal_zone0/temp",
    function (error, stdout, stderr) {
      if (error !== null) {
        console.log("exec error: " + error);
      } else {

        ka = wifidata
        
        ka.rssi = parseFloat(stdout / 1000);
        ka.canal = 5
        ka.timestamp = getFullDate()
        ka.ssid = "KeepAlive"
      

        client.publish("CRAIUPCT_WifiData", JSON.stringify(ka));
        

      }
    }
  );

}, 30000);