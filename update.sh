echo "╭─────────────────────────────────────────────────────────────────╮"
echo "│                                                                 │"
echo "│                         Starting Update                         │"
echo "│                         [] whiskyBot                            │"
echo "│                         [] whiskySite                           │"
echo "│                                                                 │"
echo "╰─────────────────────────────────────────────────────────────────╯"


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

echo "╭─────────────────────────────────────────────────────────────────╮"
echo "│                                                                 │"
echo "│                         Update Done                             │"
echo "│                         [*] whiskyBot                           │"
echo "│                         [*] whiskySite                          │"
echo "│                                                                 │"
echo "╰─────────────────────────────────────────────────────────────────╯"

echo "Add CertBot hook scripts"
sh -c 'printf "sudo pm2 stop all \n" > /etc/letsencrypt/renewal-hooks/pre/whiskybot.sh'
sh -c 'printf "sudo bash /home/conrad/WhiskyBot/update.sh \n" > /etc/letsencrypt/renewal-hooks/post/whiskybot.sh'
chmod 755 /etc/letsencrypt/renewal-hooks/pre/haproxy.sh
chmod 755 /etc/letsencrypt/renewal-hooks/post/haproxy.sh
echo "Finished adding CertBot hook scripts"