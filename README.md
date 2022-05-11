# sniffer_wifi_multi
Este código se compone de 2 apps:
- app24_1.js que escanea y guarda logs del canal 1 de la banda de 2.4Ghz
- app24_6.js que escanea y guarda logs del canal 6 de la banda de 2.4Ghz
- app24_11.js que escanea y guarda logs del canal 11 de la banda de 2.4Ghz
y 2 scripts en bash:
- pm2monit.sh para inicializar automáticamente la monitorización con pm2. Hay que añadir previamente los procesos a monitorear.
- chan_assign.sh para la asignación automática de canal para cada app.

  
