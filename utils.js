const d3 = require('d3-dsv');
const { writeFileSync } = require('fs');

function saveAsCSV(fileName, folder, header, data) {    
    let flag = 'a'; // append at the end of the file

    let finalData = [...data];
    
    // if there is a header, we push it before the data, it is a new file so we create it instead of append the content to the existing file
    if(header !== null) {
        finalData.unshift(header);
        flag = 'w';
    }
    else {
        // add an empty tab that will be converted as a new line in the file, new content will be added from this line next time
        finalData.push([]);
    }

    const csvData = d3.csvFormatRows(finalData);
    writeFileSync(folder + '/' + fileName + '.csv', csvData, { encoding: 'utf8', flag: flag });
}

module.exports = {
    saveAsCSV : saveAsCSV,
}