#!/bin/bash
pm2 stop all


echo "Moving databases to folder" > /root/database_change.log

cd /home/kali/Sniffer_Wifi
mkdir databases

rm -r databases/today

cp *.db databases

mkdir databases/today

mv *.db databases/today/.

echo "Done!"

timedatectl |grep "Local time" >> /root/database_change.log

pm2 restart all