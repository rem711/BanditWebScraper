#!/bin/bash
cd /root/dev/BanditWebScraper/

apt-get install -y curl software-properties-common
curl -sL https://deb.nodesource.com/setup_12.x | sudo bash -
apt-get install -y nodejs
apt-get install -y xvfb x11-xkb-utils xfonts-100dpi xfonts-75dpi xfonts-scalable xfonts-cyrillic x11-apps clang libdbus-1-dev libgtk2.0-dev libnotify-dev libgnome-keyring-dev libgconf2-dev libasound2-dev libcap-dev libcups2-dev libxtst-dev libxss1 libnss3-dev gcc-multilib g++-multilib

npm install
touch touchbistroAuth.json && echo '{"login" : "yourLogin", "password" : "yourPassword"}' >> touchbistroAuth.json
echo You need to edit /root/dev/BanditWebScraper/touchbistroAuth.json with your login and password!

cd /data/ && ln -s /root/dev/BanditWebScraper/out/ touchbistro
echo "0 06 * * * cd /root/dev/BanditWebScraper/ && git pull" >> /var/spool/cron/crontabs/root
echo "0 07 * * * cd /root/dev/BanditWebScraper/ && xvfb-run node ./scraper.js 2>&1 | tee -a ./out/logs/logs.txt" >> /var/spool/cron/crontabs/root
