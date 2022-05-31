# sniffer_wifi_multi
Este código se compone de 4 apps:
- app5_1.js que escanea y guarda logs de la primera mitad de canales de la banda de 5Ghz
- app5_2.js que escanea y guarda logs de la segunda mitad de canales de la banda de 5Ghz
- app24_1.js que escanea y guarda logs de la primera mitad de canales de la banda de 2.4Ghz
- app24_2.js que escanea y guarda logs de la segunda mitad de canales de la banda de 2.4Ghz
y 2 scripts en bash:
- pm2monit.sh para inicializar automáticamente la monitorización con pm2, para ello hay que editar el archivo .bashrc y añadir al final:
 sh [ruta al script]
- chan_rotation5ghz.sh para la rotación automática de canales dentro de cada app, es decir, para el grupo de canales que monitoriza cada app, va rotando cada 3 segundos el canal monitorizado. Este script creo que lo inicializaba también como un proceso de pm2, al igual que cada app
- En mi tfg puedes ver el funcionamiento básico de pm2 y como configurarlo para que inicie todos los procesos asociados automaticamente al inicio
  
