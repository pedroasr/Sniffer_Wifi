#!/bin/bash

echo "iniciando monitoreo de pm2 en 10 seg. pulse ctr+c para cancelar"
sleep 10
echo "iniciando monitoreo"
sudo pm2 monit
#pm2 monit