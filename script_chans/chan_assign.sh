#!/bin/bash
# -*- ENCODING: UTF-8 -*-
# Codigo encargado de configurar las terminales Wifi. En nuestro caso queremos valores fijos por lo que es más sencillo.
# Ejecutar antes este script para configurar las interfaces.

iface1='wlan1'
iface2='wlan2'
iface3='wlan3'

sleep 10
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

sleep 4

chan24_1=1
chan24_2=6
chan24_3=11

iwconfig $iface1 channel ${chan24_1}
iwconfig $iface2 channel ${chan24_2}
iwconfig $iface3 channel ${chan24_3}

echo "canal de $iface1: ${chan24_1}"
echo "canal de $iface2: ${chan24_2}"
echo "canal de $iface3: ${chan24_3}"
