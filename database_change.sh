pm2 stop all

mkdir databases
echo "Moving databases to folder" > /root/database_change.log

cd /home/kali/Sniffer_Wifi

mv *.db databases

echo "Done!"

timedatectl |grep "Local time" >> /root/database_change.log

pm2 restart all