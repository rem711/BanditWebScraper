# BanditWebScraper

Web scraper to loop and parse the bills available on touchBistro plateform for your restaurant and get info that the plateform doesn't offer (ex : number of people by table). Default configuration get every day the bills from the previous day and save them in a csv file (coma "," seperated) in the Daily folder and also concatenate them in an other global csv file in the Global folder. Finally you can parse bills by defining a begining and ending date (both previous than today).
  
  
-> To do a quick install, just run install.sh .
-> Do not forget to insert your login and your password in touchbistroAuth.json .
  
-> To use it also on windows if you want to easily schedule it, instead of the linux crontab use node-cron and configure scraper.js to run the script depending on the node-cron setup of your choice (ex : cron.schedule("* 07 * * *", _ => main()); ).
