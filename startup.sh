#!/bin/bash
# -*- ENCODING: UTF-8 -*-
# Codigo encargado de configurar las terminales Wifi. En nuestro caso queremos valores fijos por lo que es más sencillo.
# Ejecutar antes este script para configurar las interfaces.

rm .env

# Hay que editar esta variable para que funcione
ipint="192.168.102.X" 
hostname="Raspberry1"
####################################################

if [[ $ipint == "192.168.102.X" ]]	#Me pasa que se me olvida configurar esto
then
		echo "No IP Assigned, stopping!"
		exit 0
fi
	

old_host=$(cat /etc/hostname)
echo $hostname > /etc/hostname

if [[ $old_host != $hostname ]]
then
        echo "127.0.1.1 "$hostname >>/etc/hosts
        echo "New hostname assigned"
fi

echo "Establishing timezone"
timedatectl set-timezone "Europe/Madrid"

iface1=''
iface2=''
iface3=''

pm2 save

taken="false"
count=0

aux=$(ifconfig wlan0 |grep inet)
echo "wlan0:";

for i in $aux; do
	if [[ $i == $ipint ]]
	then
		echo $i
		taken="true"
	fi	
done

if [[ $taken == "false" ]]
then
	iface1='wlan0'
	((count = $count + 1))
else
	echo 'wlan0 is taken as data interface'
	taken="false"
fi

aux=$(ifconfig wlan1 |grep inet)
echo "wlan1:";

for i in $aux; do
	if [[ $i == $ipint ]]
	then
		echo $i
		taken="true"
	fi	
done

if [[ $taken == "false" ]]
then
	if [[ $count == 0 ]]
	then
		iface1='wlan1'
	else
		iface2='wlan1'
	fi
	((count=count+1))
else
	echo 'wlan1 is taken as data interface'
	taken="false"
fi

aux=$(ifconfig wlan2 |grep inet)
echo "wlan2:";

for i in $aux; do
	if [[ $i == $ipint ]]
	then
		echo $i
		taken="true"
	fi	
done

if [[ $taken == "false" ]]
then
	if [[ $count == 1 ]]
	then
		iface2='wlan2'
	else
		iface3='wlan2'
	fi
else
	echo 'wlan2 is taken as data interface'
	$taken="false"
fi

aux=$(ifconfig wlan3 |grep inet)
echo "wlan3:";

for i in $aux; do
	if [[ $i == $ipint ]]
	then
		echo $i
		taken="true"
	fi	
done

if [[ $taken == "false" ]]
then
	iface3='wlan3'
else
	echo 'wlan3 is taken as data interface'
	$taken="false"
fi

echo "Las interfaces utilizables son:"
echo $iface1
echo $iface2
echo $iface3

echo "iface1="$iface1 >> .env
echo "iface2="$iface2 >> .env
echo "iface3="$iface3 >> .env
echo "id="$hostname >> .env

sleep 1
echo "bajando interfaces wifi $iface1, $iface2, $iface3"
ip link set $iface1 down
ip link set $iface2 down
ip link set $iface3 down
sleep 2
echo "cambiando interfaces wifi $iface1, $iface2, $iface3 a modo monitor..."
iw dev $iface1 set type monitor
iw dev $iface2 set type monitor
iw dev $iface3 set type monitor
sleep 2
echo "levantando interfaz wifi $iface1, $iface2, $iface3..."
ip link set $iface1 up
ip link set $iface2 up
ip link set $iface3 up

sleep 3

chan24_1=1
chan24_2=6
chan24_3=11

iwconfig $iface1 channel ${chan24_1}
iwconfig $iface2 channel ${chan24_2}
iwconfig $iface3 channel ${chan24_3}

echo "canal de $iface1: ${chan24_1}"
echo "canal de $iface2: ${chan24_2}"
echo "canal de $iface3: ${chan24_3}"

echo "Starting scripts"

pm2 start app24_1.js
pm2 start app24_6.js
pm2 start app24_11.js
pm2 start appBLE.js
pm2 start monitor.js
pm2 delete startup.sh