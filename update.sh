echo "starting update..."

pm2 stop whiskyBot
pm2 stop whiskySite

git pull

bash install.sh

cd whiskyBot
pm2 start index.js --name whiskyBot
cd ..

cd whiskySite
sudo pm2 start index.js --name whiskySite
cd ..

echo "update done..."