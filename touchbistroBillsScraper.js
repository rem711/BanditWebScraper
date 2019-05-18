const fs = require('fs');

const loginUrl = "https://cloud.touchbistro.com/login";
const {login, password} = require("./touchbistroAuth.json");

const staticBillsUrl = "https://cloud.touchbistro.com/reporting/bills";

// run all the process of scraping the bills, parse them and save the datas as csv file
// using an async function to wait nightmare's execution on the page
// beginingDate and endingDate have to be dates or null and the date need to be previous than yesterday or it'll be set to yesterday
async function execute(nightmare, cheerio, saveAsCSV, beginingDate, endingDate) {
    const start = new Date();
    console.log("**********");
    console.log("Process start", start.toString());    

    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);    

    // if no begining date is given, we set it to yesterday
    if(beginingDate === null) {
        beginingDate = new Date(yesterday.getTime());
    }

    // if no ending date is given, we set it to yesterday
    if(endingDate === null) {
        endingDate = new Date(yesterday.getTime());
    }

    // check that dates are instance of Date
    if(!beginingDate instanceof Date || !endingDate instanceof Date) {
        console.log("error :", "beginingDate and endingDate must be instance of Date");
        console.log("");
        console.log("");
        return 0;
    }

    // check that dates are equal or older than yesterday
    if(beginingDate.getTime() > yesterday.getTime() || endingDate.getTime() > yesterday.getTime()) {
        console.log("error :", "beginingDate and endingDate can't be newer than yesterday");
        console.log("");
        console.log("");
        return 0;
    }

    // check that the begining date is equal or older than the ending date
    if(beginingDate.getTime() > endingDate.getTime()) {
        console.log("error :", "beginingDate must be older or equal to endingDate");
        console.log("");
        console.log("");
        return 0;
    }

    // connect to touchbistro
    console.log("Connection to ", loginUrl)
    const connected = await connect(nightmare, loginUrl, login, password);

    if(!connected) {
        closeConnection();
        console.log("error :", "Password and username did not match");
        console.log("");
        console.log("");
        return 0;
    }

    // set the begining and the ending dates properly
    let currentDate = new Date(beginingDate.toISOString().substring(0, 10).replace("-","/"));
    let endDate = new Date(endingDate.toISOString().substring(0, 10).replace("-","/"));

    let daily = false;
    if(currentDate.getTime() == endDate.getTime()) {
        daily = true;
    }

    let round = 0;

    // we scrap the data day by day
    // so we loop until the the currentDate is one day after the ending date
    while(currentDate.getTime() <= endDate.getTime()) {
        const timestamp = currentDate.getTime();
        const dateFormated = new Date(timestamp).toISOString().substring(0, 10);

        const billsUrl = staticBillsUrl + "?start=" + timestamp + "&end=" + timestamp;
    
        console.log("Begin bills scraping at", billsUrl, "for", dateFormated);
        const arrayBills = await getBills(nightmare, billsUrl);
        console.log(arrayBills.length + " bills scraped");

        console.log("Fetching data from bills...");
        const {parsedBillsHeader, parsedBillsData} = parseBills(cheerio, arrayBills);
        
        console.log("Saving bills as CSV file...");
        if(daily) {
            // save the previous day data in the global file
            const outputFileNameGlobal = 'banditbrewery_billsFull_global';
            const outputFolderGlobal = './out/Bills_reports/Global';
            const globalFileExists = fs.existsSync('./out/Bills_reports/Global/banditbrewery_billsFull_global.csv');
            // add the header if the file need to be created
            const globalHeader = (globalFileExists) ? null : parsedBillsHeader;
            saveAsCSV(outputFileNameGlobal, outputFolderGlobal, globalHeader, parsedBillsData);

            // save the previous day data in its own csv file
            const outputFileNameDaily = 'banditbrewery_billsFull_' + dateFormated;
            const outputFolderDaily = './out/Bills_reports/Daily';
            saveAsCSV(outputFileNameDaily, outputFolderDaily, parsedBillsHeader, parsedBillsData);
        }
        else {
            const beginDateFormated = beginingDate.toISOString().substring(0, 10);
            const endDateFormated = endingDate.toISOString().substring(0, 10);

            // save the day's data in the global file
            const outputFileNameGlobal = 'banditbrewery_billsFull_from_' + beginDateFormated + '_to_' + endDateFormated;
            const outputFolderGlobal = './out/Bills_reports';
            // add the header only whenb the file is created
            const customHeader = (round === 0) ? parsedBillsHeader : null;
            saveAsCSV(outputFileNameGlobal, outputFolderGlobal, customHeader, parsedBillsData);
        }

        // set the date to the next day
        currentDate.setDate(currentDate.getDate() + 1);
        round++;
        console.log("");
    }

    closeConnection(nightmare);
    
    const end = new Date(); 
    console.log("Process end", end.toString());
    const duration = end.getTime() - start.getTime();
    console.log("Bills scraping finished after :", duration, "ms"); 
    console.log("**********");

    return 1;
}

async function connect(nightmare, loginUrl, login, password) {
    const nameInputLogin = "username";
    const nameInputPassword = "password";
    let connection = false;
    try {
        await nightmare
            // login
            .goto(loginUrl)
            .type("input[name='" + nameInputLogin + "']", login)
            .type("input[name='" + nameInputPassword + "']", password)
            .click("button[data-cy='submit-button']")    
            .wait("ul .dropdown-menu")
            .evaluate(() => {
                // check if there is an alert message
                if(document.querySelector(".alert-danger") == null) return true;
                return false;
            })
            .then(res => connection = res) // login successfull
            .catch(e => {
                connection = false;
                console.log(e);
            });            
    }
    catch(e) {
        console.log("error :", e);
    }
    return connection;
}

function closeConnection(nightmare) {
    nightmare
        .end()
        .catch(e => {
            console.log("error :", e);
        });
}

async function getBills(nightmare, billsUrl) {
    const billItemSelector = ".bill-list-item";
    const billContentSelector = ".bill-report-inner";
    const dashboardSelector = ".row.dashboard-gutter";
    let arrayBills = [];

    await nightmare
        // access bills report
        .goto(billsUrl)
        // wait until the dynamic content is loaded
        .wait(dashboardSelector)
        // check if there is no bill
        .evaluate(() => {
            let numberOfBills = 0;
            if(document.querySelector(".nothing-found") === null) {
                numberOfBills = document.querySelector(".bill-list-header-box h2").innerText;
                numberOfBills = numberOfBills.substr(0, numberOfBills.indexOf(" Bills"));
            }
            return numberOfBills;
        })
        .then(numberOfBills => {
            // if there is no bill, we return the empty array, else continue to scrap them
            if(numberOfBills == 0) {
                return arrayBills;
            }
            else {
                console.log(numberOfBills, "bills to scrap");
            }
        })
        .catch(e => {
            console.log("error :", e);
        }); 

    // loop on all bills preview
    while(await nightmare.exists(billItemSelector)) {
        // click on bill to load its content
        await nightmare
            .click(billItemSelector)
            .wait(billContentSelector)
            .evaluate(() => {                
                // fetch bill's content
                const content = document.querySelector(".bill-report-inner").innerHTML;
                // remove bill from the list to not iterate agin on it
                document.querySelector(".bill-list-item").remove();
                return content;
            })
            .then((billContent) => {
                arrayBills.push(billContent);       
            })
            .catch(e => {
                console.log("error :", e);
            });        
    }
    
    return arrayBills;
}

function parseBills(cheerio, arrayBills) {
    parsedBillsData = [];
    const parsedBillsHeader = ["Bill Number", "Order Number", "Date", "Table Number", "Guest(s) Number", "Server", "Drinks", "Food", "Total ($CA)", "Tips ($CA)"];

    arrayBills.forEach(bill => {
        try {
            let $ = cheerio.load(bill);
            let res = "";

            res = $(".billreport-header .column-left-header.cell-align-left").text();
            // get the date
            let date = res.substr(0, res.indexOf("Table"));
            // remove the date + "Table Name: "
            res = res.substr(res.indexOf("Table") + "Table Name: ".length, res.length);
            // get the table's number
            let table = res.substr(0, res.indexOf(","))
            // remove table's number + "Guests: "
            res = res.substr(res.indexOf("Guests") + "Guests: ".length, res.length);
            // get the number of guests
            const guests = res.substr(0, res.indexOf("Bill"));
            // remove the number of guest + "Bill Number: "
            res = res.substr(res.indexOf("Bill") + "Bill Number: ".length, res.length);
            // get the bill number
            const billNumber = res.substr(0, res.length);


            res = $(".billreport-header .column-right-header.cell-align-right").text();
            // remove "Order Number: "
            res = res.substr("Order Number: ".length, res.length);
            // get order number
            const orderNumber = res.substr(0, res.indexOf("Server"));
            // remove order number + "Server: "
            res = res.substr(res.indexOf("Server") + "Server: ".length, res.length);
            // get server name
            const server = res.substr(0, res.length);

            res = "";
            $(".nested-coi-0").each((index, elem) => {
                if(index > 0) res += " / ";
                res += $(elem).text();
            });
            // get ordered food and drinks
            const ordered = res.substr(0, res.length);
            let drinks = "";
            let food = "";

            // separate food and drinks
            const items = ordered.split(" / ");
            items.forEach(item => {
                const reg = RegExp('^[0-9]'); 
                if(reg.test(item)) {
                    if(drinks.length > 0) drinks += " / ";
                    drinks += item;
                }
                else {
                    if(food.length > 0) food += " / ";
                    food += item;
                }
            })


            res = $(".column-left-content.cell-align-right .thick").text();
            let total = "";
            let tips = "0.00";
            // payed by card with tips
            if(res.indexOf("Tips") != -1) {
                // remove "Total Tips"
                res = res.substr("Total Tips".length, res.length);
                // get total
                total = res.substr(0, res.indexOf("$CA") - 1);
                // remove total
                res = res.substr(res.indexOf("$CA") + "$CA".length, res.length);
                // get tips
                tips = res.substr(0, res.indexOf("$CA"));
            }
            // payed by cash
            else if(res.indexOf("Total Change") != -1) {
                // remove "Total Change"
                res = res.substr("Total Change".length, res.length);
                // get total
                total = res.substr(0, res.indexOf("$CA") - 1);
            }
            // payed by card without tips
            else {
                // get total
                total = res.substr(0, res.indexOf("$CA") - 1);
            }

            // remove comas from the date
            date = date.replace(/,/g, "");
            // if no table number, table number is -1
            table = (table.length === 0) ? "-1" : table;
            // replace the coma by a period for the prices
            total = total.replace(/,/g, ".");
            tips = tips.replace(/,/g, ".").replace(" ", "");
            
            parsedBillsData.push([billNumber, orderNumber, date, table, guests, server, drinks, food, total, tips]);
        }
        catch(e) {
            console.log("error :", e);
        }
    });

    return {parsedBillsHeader, parsedBillsData};
}   

module.exports = {
    execute : execute,
}