#!/bin/bash
cd /root/dev/BanditWebScraper/
git pull
node ./scraper.js 2>&1 | tee -a ./out/logs/logs.txt
