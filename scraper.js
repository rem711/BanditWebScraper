const cron = require("node-cron");
const utils = require('./utils');
const billsScraper = require('./touchbistroBillsScraper');

// Nightmare is a high-level browser automation library
const Nightmare = require('nightmare'); // https://github.com/segmentio/nightmare
// Fast, flexible & lean implementation of core jQuery designed specifically for the server.
const cheerio = require('cheerio'); // https://github.com/cheeriojs/cheerio


//main();
// every day at 7am (3am for Toronto)
cron.schedule("* 07 * * *", function() {
      main();
});


// entry for all scraping functions
// using an async function to wait nightmare's execution on the page
async function main() {  
    // init nightmare
    const nightmare = Nightmare({
        show : false,
        waitTimeout: 300000, // 5min -> 300000
        gotoTimeout: 120000, // 2min
    });

    const resBillsScraping = await billsScraper.execute(nightmare, cheerio, utils.saveAsCSV, null, null);

    if(resBillsScraping === 0) {
        console.log("/******************");
        console.log("Error during bills scraping!");
        console.log("******************/");
    }

    console.log("");
    console.log("");
    return;
}
