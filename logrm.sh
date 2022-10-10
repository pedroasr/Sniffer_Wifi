#!/bin/bash
echo "Removing pm2 logs" > logrm.log

rm /root/.pm2/logs/app24-1-out.log
rm /root/.pm2/logs/app24-6-out.log
rm /root/.pm2/logs/app24-11-out.log
rm /root/.pm2/logs/appBLE-out.log

timedatectl |grep "Local time" >> logrm.log