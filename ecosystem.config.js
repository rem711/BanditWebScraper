module.exports = 
{ 
    apps: [{ 
        name: "touchbistroScraper", 
        script: "./scraper.js", 
        watch: true, 
        ignore_watch: ["out"], 
        //log: "./out/logs/logs.txt", 
        out_file: "./out/logs/logs.txt",
        error_file: "./out/logs/logs.txt",
    }] 
}                