
const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

// Handle spaces in filename
const filePath = path.join(__dirname, 'data', 'ITROOTS Data Science & AI Brochure .pdf');

if (fs.existsSync(filePath)) {
    let dataBuffer = fs.readFileSync(filePath);
    pdf(dataBuffer).then(function (data) {
        console.log(data.text);
    }).catch(err => {
        console.error("Error parsing PDF:", err);
    });
} else {
    console.error("File not found:", filePath);
}
