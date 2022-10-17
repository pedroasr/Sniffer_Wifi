#!/bin/bash
echo "Removing pm2 logs" > logrm.log

pm2 stop all

rm /root/.pm2/logs/app24-1-out.log
rm /root/.pm2/logs/app24-6-out.log
rm /root/.pm2/logs/app24-11-out.log
rm /root/.pm2/logs/appBLE-out.log

rm /home/kali/Sniffer_Wifi/DatosBLE.db

rm /home/kali/Sniffer_Wifi/Sniffer-Wifi.db

pm2 start all

timedatectl |grep "Local time" >> logrm.log