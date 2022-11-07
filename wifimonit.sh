#!/bin/bash

wiface=$(cat /home/kali/wififace |grep -oP "wiface=\K.*")
#wiface=wlp2s02
check=$(iwconfig $wiface|grep ESSID)


if [[ $check == "" ]]
then

	echo "Wifi is down! Stopping pm2!"
	pm2 delete all > wifimonit.log
	echo "Restarting it"
	pm2 start /home/Kali/Sniffer_Wifi/startup.sh >> wifimonit.log
	echo "Scripts restarted at: " >> wifimonit.log
	timedatectl |grep "Local time" >> wifimonit.log

fi
