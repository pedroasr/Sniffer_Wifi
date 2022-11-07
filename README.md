# sniffer_Wifi_BLE

Este código se compone de 4 apps:

- app24_1.js que escanea y guarda logs y registra en el servidor las tramas captadas en el canal 1 de la banda de 2.4Ghz
- app24_6.js que escanea y guarda logs y registra en el servidor las tramas captadas en el canal 6 de la banda de 2.4Ghz
- app24_11.js que escanea y guarda logs y registra en el servidor las tramas captadas en el canal 11 de la banda de 2.4Ghz
- appBLE.js que escanea y guarda logs y registra en el servidor las tramas Bluetooth captadas por el módulo ESP32
  y un script en bash:
- startup.sh para conectar la raspberry a internet, comprobar el estado de las interfaces Wifi, configurarlas en modo monitor y guardar en pm2

# Ejecucion

- Se debe entrar como usuario root:
  $sudo -i

  A continuación ir al directorio y ejecutar 
  
  #pm2 start startup.sh 

## CRONTAB
### Se debe ejecutar crontab -e como usuario root e introducir las siguientes

  45 06 * * * /sbin/reboot now  
  */10 * * * * /home/kali/Sniffer_Wifi/wifimonit.sh > /root/log_wifimonit.log
  * 0 * * 1 /home/kali/Sniffer_Wifi/logrm.sh > /root/log_logrm.sh
  00 22 * * * /usr/bin/node /usr/local/bin/pm2 stop all > /root/pm2_stop.txt
  00 06 * * * /usr/bin/node /usr/local/bin/pm2 start all > /root/pm2_start.txt

El primero reinicia la raspberry todos los dias a las 6:45
El segundo ejecutar el script bash wifimonit para comprobar que 



## TO-DO


