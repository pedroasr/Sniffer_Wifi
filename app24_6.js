// const SerialPort = require('serialport');
// const ByteLength = require('@serialport/parser-byte-length');
require('dotenv').config();
const cron = require('node-cron');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const pcap = require('pcap');
const colors = require('colors')


// ====================== SNIFFER WIFI ==================================

const snifferId = 'sniffer2.4Ghz_6'; //cambiar por id del sniffer en el que se ejecute

const {
    parseType,
    parseSSID,
    parseRSSI,
    parseSourceMAC,
    parseFreq
} = require('./functions');

var fecha = new Date();

var csvWriter = createCsvWriter({
    path: `./results/${snifferId}_${fecha.getFullYear()}${fecha.getMonth()}${fecha.getDate()}.csv`,
    fieldDelimiter: ";",
    header: [
        { id: 'snifferId', title: 'SNIFFERID' },
        { id: 'timestamp', title: 'TIMESTAMP' },
        { id: 'tipo', title: 'TIPO' },
        { id: 'SSID', title: 'SSID' },
        { id: 'RSSI', title: 'RSSI' },
        { id: 'MAC_origen', title: 'MAC_O' },
        { id: 'frec', title: 'FREC' },
        { id: 'canal', title: 'CANAL' }
    ]
});

console.log("esperando 5 seg a que se inicie script");
setTimeout(init, 5000);

function init() {
    console.log("iniciando capturas...");
    // creamos sesion de pcap indicando interfaz (en modo monitor con airmon-ng) y filtros
    // sustituir interfaz por la del dispositivo en el que se ejecuta la app
    var pcapSession = pcap.createSession('wlan2', { filter: 'type mgt subtype probe-req' });
    // var pcapSession = pcap.createSession('wlp3s0mon', ' wlan type mgt subtype probe-req');

    let timestamp;
    let SSID;
    let RSSI;
    let MAC_origen;
    let frec;
    let canal;

    pcapSession.on('packet', (rawPacket) => {
        // Esta función decodifica el paquete de bytes en bruto, interpretando algunos campos
        // pero no funciona para todos los vendors (en mi tarjeta WiFi p.ej no funciona)
        // var packet = pcap.decode.packet(rawPacket);

        //     console.log('from: ' + packet.link.ieee802_11Frame.shost);
        //     console.log('to: ' + packet.link.ieee802_11Frame.dhost);
        //     console.log('signal strength: ' + packet.link.ieee802_11Frame.strength);

        // Así que trato directamente el paquete con los bytes en bruto, y así es totálmente vendor independent
        var length_RT = rawPacket.buf[2]; //longitud del RadioTap Header
        var tipo = parseType(rawPacket.buf, length_RT);
        timestamp = new Date();

        // console.log('==================='.green);
        // console.log(`===${tipo}===`.green);
        // console.log('==================='.green);

        SSID = parseSSID(rawPacket.buf, length_RT, tipo);
        RSSI = parseRSSI(rawPacket.buf, length_RT);
        MAC_origen = parseSourceMAC(rawPacket.buf, length_RT);

        // ==FREC Y CANAL==
        // (Comentar las 2 lineas del metodo no usado)

        // Con metodo 1:
        frec = parseFreq(rawPacket.buf, length_RT);
        canal = (frec % 2407) / 5;
        

        // Con metodo 2:
        // var canal = parseChannel(rawPacket.buf, length_RT);
        // var frec = 2407 + canal * 5;

        // console.log(`ssid: ${ SSID }`);
        // console.log(`RSSI: ${ RSSI } dBm`);
        // console.log(`TimeStamp: ${ timestamp}`);
        // console.log(`MAC origen: ${ MAC_origen }`);
        // console.log(`frecuencia: ${ frec } Mhz, canal: ${ canal }`);

        var disp = `===================\n`.green +
            `===${tipo}===\n`.green +
            `===================\n`.green +
            `ssid: ${ SSID }\n` +
            `RSSI: ${ RSSI } dBm\n` +
            `TimeStamp: ${ timestamp.toLocaleString() }:${ timestamp.getMilliseconds() }\n` +
            `MAC origen: ${ MAC_origen }\n` +
            `frecuencia: ${ frec } Mhz, canal: ${ canal }`

        console.log(disp)

        // var datos = {
        //     snifferId,
        //     tipo,
        //     SSID,
        //     RSSI,
        //     timestamp,
        //     MAC_origen,
        //     frec,
        //     canal
        // }

        // console.log(datos);

        // var message = new Buffer.from(JSON.stringify(datos));
        // cambiar datos por los del server
        // client.send(message, 8000, '192.168.1.6');

        var datos_prob = {
            snifferId,
            timestamp: `${ timestamp.toLocaleString() }:${ timestamp.getMilliseconds() }`,
            tipo,
            SSID,
            RSSI: `${ RSSI } dBm`,
            MAC_origen,
            frec: `${ frec } Mhz`,
            canal
        }

        //console.log("datos_prob: ", datos_prob);

        csvWriter.writeRecords([datos_prob]) // returns a promise
            .then(() => {
                console.log('Guardado en csv local'.blue);
            });

        // guardarDB_probe(datos_prob);

    });
}