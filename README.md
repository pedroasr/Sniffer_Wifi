# sniffer_Wifi_BLE

Este código se compone de 4 apps:

- app24_1.js que escanea y guarda logs y registra en el servidor las tramas captadas en el canal 1 de la banda de 2.4Ghz
- app24_6.js que escanea y guarda logs y registra en el servidor las tramas captadas en el canal 6 de la banda de 2.4Ghz
- app24_11.js que escanea y guarda logs y registra en el servidor las tramas captadas en el canal 11 de la banda de 2.4Ghz
- appBLE.js que escanea y guarda logs y registra en el servidor las tramas Bluetooth captadas por el módulo ESP32
  y un script en bash:
- startup.sh para comprobar el estado de las interfaces Wifi, configurarlas en modo monitor y guardar en pm2
