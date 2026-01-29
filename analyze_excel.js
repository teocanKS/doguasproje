const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'reference_proposal.xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('Total rows:', data.length);

// Find "MALZEME CİNSİ" row
let headerRowIndex = -1;
for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row && row.some(cell => cell && cell.toString().includes('MALZEME CİNSİ'))) {
        headerRowIndex = i;
        console.log('Found "MALZEME CİNSİ" at row index:', i);
        console.log('Header Row:', row);
        break;
    }
}

if (headerRowIndex !== -1) {
    // Check rows above for metadata
    console.log('\nMetadata Search (Rows 0 to ' + headerRowIndex + '):');
    for (let i = 0; i < headerRowIndex; i++) {
        console.log(`Row ${i}:`, data[i]);
    }

    // Check first few data rows
    console.log('\nFirst 3 Data Rows:');
    for (let i = 1; i <= 3; i++) {
        if (data[headerRowIndex + i]) {
            console.log(`Row ${headerRowIndex + i}:`, data[headerRowIndex + i]);
        }
    }
} else {
    console.log('Could not find "MALZEME CİNSİ" keyword.');
}
