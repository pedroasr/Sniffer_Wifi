require('dotenv').config();
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const pcap = require('pcap');
const colors = require('colors')


// ====================== SNIFFER WIFI ==================================

const snifferId = 'sniffer2.4Ghz_6'; //cambiar por id del sniffer en el que se ejecute
let files = fs.readdirSync('./results');
const {
    parseSSID,
    parseType,
    parseFreq
} = require('./functions');

var timestamp = new Date();

var csvWriter = createCsvWriter({
    path: `./results/Sniffer_2.4_${files.length}_${timestamp.getFullYear()}_${timestamp.getMonth()+1}_${timestamp.getDate()}.csv`,
    fieldDelimiter: ";",
    header: [
        { id: 'timestamp', title: 'TIMESTAMP' },
        { id: 'snifferId', title: 'SNIFFERID' },
        { id: 'SSID', title: 'SSID' },
        { id: 'RSSI', title: 'RSSI' },
        { id: 'MAC_origen', title: 'MAC_O' },
        { id: 'canal', title: 'CANAL' }
    ]
});


function init() {

    console.log("iniciando capturas...");
    // creamos sesion de pcap indicando interfaz (en modo monitor con airmon-ng) y filtros
    // sustituir interfaz por la del dispositivo en el que se ejecuta la app
    var pcapSession = pcap.createSession('wlan2', { filter: 'type mgt subtype probe-req' });

    let SSID;
    let RSSI;
    let MAC_origen;
    let frec;
    let canal;
    let date;

    pcapSession.on('packet', (rawPacket) => {
        var length_RT = rawPacket.buf[2];
        frec = parseFreq(rawPacket.buf, length_RT);
        canal = (frec % 2407) / 5;
        
        if (canal == 6){
            var packet = pcap.decode.packet(rawPacket);
            var tipo = parseType(rawPacket.buf, length_RT);
            SSID = parseSSID(rawPacket.buf, length_RT, tipo);
            RSSI = packet.payload.fields.antenna_signal;
            MAC_origen = packet.payload.ieee802_11Frame.shost.toString(16);
            date = `${timestamp.getFullYear()}-${timestamp.getMonth()+1}-${timestamp.getDate()} ${timestamp.getHours()}:${timestamp.getMinutes()}:${timestamp.getSeconds()}:${timestamp.getMilliseconds()}`;

            var disp = `===================\n`.green +
                `===PROBE RESQUEST===\n`.green +
                `===================\n`.green +
                `ssid: ${ SSID }\n` +
                `RSSI: ${ RSSI } dBm\n` +
                `TimeStamp: ${date}\n` +
                `MAC origen: ${ MAC_origen }\n` +
                `Canal: ${ canal }\n`

            console.log(disp)

            var datos_prob = {
                snifferId,
                timestamp: `${ date }`,
                SSID,
                RSSI: `${ RSSI }`,
                MAC_origen,
                canal
            }


            csvWriter.writeRecords([datos_prob]) // returns a promise
                .then(() => {
                    console.log('Guardado en csv local'.blue);
                }); 
          }

    });
}

console.log("esperando 5 seg a que se inicie script");
setTimeout(init, 5000);


