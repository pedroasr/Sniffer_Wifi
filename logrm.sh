#!/bin/bash
echo "Removing pm2 logs and databases" > logrm.log

pm2 stop all

rm /root/.pm2/logs/app24-1-out.log
rm /root/.pm2/logs/app24-6-out.log
rm /root/.pm2/logs/app24-11-out.log
rm /root/.pm2/logs/appBLE-out.log



#id=$(cat /home/kali/intconfig |grep -oP "id=\K.*")
#
#ruta="*DatosBLE_"$id".db"
#aux=$(ls $ruta)

rm /home/kali/Sniffer_Wifi/databases/*

pm2 start all

timedatectl |grep "Local time" >> logrm.log