#!/bin/bash
cd /root/dev/BanditWebScraper/

apt-get install curl software-properties-common
curl -sL https://deb.nodesource.com/setup_12.x | sudo bash -
apt-get install nodejs
npm install pm2 -g

npm install
touch touchbistroAuth.json && echo '{"login" : "yourLogin", "password" : "yourPassword"}' >> touchbistroAuth.json
echo You need to edit /root/dev/BanditWebScraper/touchbistroAuth.json with your login and password!

cd /data/ && ln -s /root/dev/BanditWebScraper/out/ touchbistro
echo "0 06 * * * cd /root/dev/BanditWebScraper/ && git pull" >> /var/spool/cron/crontabs/root

cd /root/dev/BanditWebScraper/
pm2 start ./scraper.js -o ./out/logs/logs.txt -e ./out/logs/logs.txt
