
const pdf = require('pdf-parse');
console.log('Type of pdf:', typeof pdf);
console.log('Value of pdf:', pdf);
if (typeof pdf === 'object') {
    console.log('Keys:', Object.keys(pdf));
}
