echo "starting update..."

pm2 stop whiskyBot
pm2 stop whiskySite

pm2 delete whiskyBot
pm2 delete whiskySite

su -c 'git pull' conrad

bash install.sh

cd whiskyBot
pm2 start index.js --name whiskyBot
cd ..

cd whiskySite
pm2 start index.js --name whiskySite
cd ..

echo "update done..."