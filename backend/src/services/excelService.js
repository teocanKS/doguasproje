const xlsx = require('xlsx');

const parseQuoteExcel = (filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Header is at index 8 (Row 9)
    const headerRowIndex = 8;

    // Metadata extraction (Scanning rows above header)
    let musteri_adi = '';
    let proje_adi = '';
    let teklif_tarihi = new Date();

    for (let i = 0; i < headerRowIndex; i++) {
        const row = data[i];
        if (!row) continue;

        const rowStr = row.join(' ').toUpperCase();

        if (rowStr.includes('ALICI FİRMA')) {
            const index = row.findIndex(cell => cell && cell.toString().toUpperCase().includes('ALICI FİRMA'));
            if (index !== -1 && row[index + 1]) musteri_adi = row[index + 1];
        }

        if (rowStr.includes('ŞANTİYE')) {
            const index = row.findIndex(cell => cell && cell.toString().toUpperCase().includes('ŞANTİYE'));
            if (index !== -1 && row[index + 1]) proje_adi = row[index + 1];
        }

        if (rowStr.includes('TARİH')) {
            const index = row.findIndex(cell => cell && cell.toString().toUpperCase().includes('TARİH'));
            if (index !== -1 && row[index + 1]) {
                if (typeof row[index + 1] === 'number') {
                    teklif_tarihi = new Date((row[index + 1] - (25567 + 2)) * 86400 * 1000);
                } else {
                    teklif_tarihi = new Date(row[index + 1]);
                }
            }
        }
    }

    // Items extraction
    const items = [];
    let toplam_tutar = 0;

    for (let i = headerRowIndex + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        // Based on analysis:
        // 0: Name
        // 8: Quantity
        // 10: Unit
        // 14: Unit Price
        // 26: Total Price

        const malzeme_cinsi = row[0];

        // Skip summary rows
        if (malzeme_cinsi && malzeme_cinsi.toString().includes('TOPLAM TONAJ')) continue;

        const miktar = row[8];
        const birim = row[10];
        const birim_fiyat = row[14];
        const toplam_fiyat = row[26]; // Using 26 based on the log output

        if (malzeme_cinsi && miktar) {
            items.push({
                malzeme_cinsi,
                miktar: parseFloat(miktar),
                birim,
                birim_fiyat: parseFloat(birim_fiyat || 0),
                toplam_fiyat: parseFloat(toplam_fiyat || 0)
            });
            toplam_tutar += parseFloat(toplam_fiyat || 0);
        }
    }

    return {
        metadata: {
            musteri_adi: musteri_adi || 'Bilinmeyen Müşteri',
            proje_adi: proje_adi || 'Genel Proje',
            teklif_tarihi,
            toplam_tutar
        },
        items
    };
};

module.exports = {
    parseQuoteExcel
};
