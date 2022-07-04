#!/bin/bash
# -*- ENCODING: UTF-8 -*-
# Codigo encargado de configurar las terminales Wifi. En nuestro caso queremos valores fijos por lo que es más sencillo.
# Ejecutar antes este script para configurar las interfaces.

rm .env

# Hay que crear archivo intconfig en ~

mac=$(cat /home/kali/intconfig |grep -oP "mac=\K.*")
eth=$(cat /home/kali/intconfig |grep -oP "eth=\K.*")
ipint=$(cat /home/kali/intconfig |grep -oP "wlan=\K.*")
hostname=$(cat /home/kali/intconfig |grep -oP "id=\K.*")

echo "Connecting to Wifi IoTUT"

echo "Remember to create intconfig file in ~"
echo "Deactivating NetworkManager"
systemctl stop NetworkManager
#systemctl disable NetworkManager in case of fail use restart rasp
ifconfig eth0 up
ifconfig wlan0 up
ifconfig wlan1 up
ifconfig wlan2 up
ifconfig wlan3 up

echo "Detecting integrated wifi interface"
ipa=$(ip address show dev wlan0|grep ether)


for i in $ipa; do
	if [[ $i == $mac ]]
	then
		echo $i
		internetiface="wlan0"
	fi
done

ipa=$(ip address show dev wlan1|grep ether)


for i in $ipa; do
        if [[ $i == $mac ]]
        then
                echo $i
                internetiface="wlan1"
        fi
done

ipa=$(ip address show dev wlan2|grep ether)


for i in $ipa; do
        if [[ $i == $mac ]]
        then
                echo $i
                internetiface="wlan2"
        fi
done


ipa=$(ip address show dev wlan3|grep ether)


for i in $ipa; do
        if [[ $i == $mac ]]
        then
                echo $i
                internetiface="wlan3"
        fi
done

echo "Integrated interface is "$internetiface
wpa_supplicant -B -i $internetiface -c<(wpa_passphrase "IoTUT" "vp:tppsd44")



ip address add $eth/24 dev eth0
ip address add $ipint/24 dev $internetiface
ip route add default via 192.168.102.254 dev $internetiface
echo "Interfaces ready!"

##Interfaces in monitor mode
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

espath=$(ls /dev/ttyUSB*)

echo "iface1="$iface1 >> .env
echo "iface2="$iface2 >> .env
echo "iface3="$iface3 >> .env
echo "id="$hostname >> .env
echo "espath="$espath >> .env

sleep 1

echo "bajando interfaces wifi $iface1, $iface2, $iface3"
ip link set $iface1 down
ip link set $iface2 down
ip link set $iface3 down
sleep 2

echo "cambiando interfaz wifi $iface1 a modo monitor..."
iw dev $iface1 set type monitor
iw dev $iface1 set type monitor
iw dev $iface1 set type monitor
sleep 2

echo "cambiando interfaz wifi $iface2 a modo monitor..."
iw dev $iface2 set type monitor
iw dev $iface2 set type monitor
iw dev $iface2 set type monitor
sleep 2

echo "cambiando interfaz wifi $iface3 a modo monitor..."
iw dev $iface3 set type monitor
iw dev $iface3 set type monitor
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