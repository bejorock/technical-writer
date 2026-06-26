import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { readFileSync } from 'fs';

// Load service account key
const keyPath = './erica-dev-486223-91b6209d894e.json';
const key = JSON.parse(readFileSync(keyPath, 'utf8'));

// Create auth
const auth = new GoogleAuth({
  credentials: {
    client_email: key.client_email,
    private_key: key.private_key,
  },
  scopes: [
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/drive',
  ],
});

// Create clients
const docs = google.docs({ version: 'v1', auth });
const drive = google.drive({ version: 'v3', auth });

const FOLDER_ID = '0AHAPdW0qB70bUk9PVA';

async function createBastDocument() {
  console.log('Creating BAST document...\n');
  
  // Create document
  console.log('1. Creating document...');
  const file = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: 'BAST Profil Tahap II (SDK v3)',
      mimeType: 'application/vnd.google-apps.document',
      parents: [FOLDER_ID],
    },
  });
  
  const docId = file.data.id!;
  console.log('   Document ID:', docId);
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 2. Insert all text at once
  console.log('2. Inserting all text...');
  
  const allText = `BERITA ACARA SERAH TERIMA
Nomor : 20.002.BAST/PLNE/VI/2024


PEKERJAAN PENGADAAN APLIKASI PROFIL TAHUN 2023 DI PT PLN ENJINIRING


Pada hari ini Kamis, tanggal Dua Puluh, bulan Juni, tahun Dua Ribu Dua Puluh Empat (20-06-2024), kami yang bertanda tangan dibawah ini :

1.   AMY MAULANY SETYAMAN : Selaku Vice President Project Management Office PT Prima Layanan Nasional Enjiniring, yang dalam hal ini bertindak atas nama PT Prima Layanan Nasional Enjiniring berkedudukan di Jl. Aipda KS. Tubun I No. 2, Kelurahan Kota Bambu, Kecamatan Palmerah, Jakarta Barat yang selanjutnya disebut PIHAK PERTAMA.

2.   NALOANDA : Selaku Direktur Utama PT Rura Mas yang berkedudukan di Jl. Ciater Raya No.163, Tangerang Selatan, Banten 15310, berdasarkan Surat Perintah Kerja Nomor 0003.SPK/P.00.00/PLNE01030/2023 tertanggal 09 Maret 2023 dan Amandemen I No.0004.Amd/P.12.00/PLNE01030/2023 tertanggal 21 Juni 2023, selanjutnya dalam Kesepakatan Kerjasama ini disebut PIHAK KEDUA.

Berdasarkan Surat Perintah Kerja Nomor 0003.SPK/P.00.00/PLNE01030/2023 tertanggal 09 Maret 2023 dan Amandemen I No.0004.Amd/P.12.00/PLNE01030/2023 tertanggal 21 Juni 2023 tentang Pekerjaan Pengadaan Aplikasi Profil Tahun 2023 di PT PLN Enjiniring, dengan ini kedua belah pihak bersama-sama menyatakan kebenaran dan persetujuan mengenai hal-hal yang dilakukan, sebagai berikut :
1. PIHAK KEDUA telah menyelesaikan retensi masa pemeliharaan selama 12 (dua belas ) bulan dari Berita Acara Go-Live Pekerjaan Pengadaan Aplikasi Profil Tahun 2023 di PT PLN Enjiniring dalam keadaan baik dan terlaksana sebagaimana mestinya sesuai dengan Surat Perintah Kerja.
2.   PIHAK KEDUA akan menerima pembayaran sesuai dengan Poin 2 (dua) Nilai Pekerjaan dan Poin 3 (tiga) Syarat Pembayaran dalam Surat Perintah Kerja dan berhak menerima pembayaran Tahap II untuk pembayaran retensi masa pemeliharaan selama 12 (dua belas ) bulan dari Berita Acara Go-Live sebesar 5% (lima persen) dari Nilai Pekerjaan dari PIHAK PERTAMA.
3.   PIHAK PERTAMA telah menerima dengan baik dan lengkap hasil pelaksanaan pekerjaan serta dapat dipergunakan sebagaimana mestinya terhitung sejak Berita Acara ini ditandatangani.

Berita Acara Serah Terima ini dibuat dalam rangkap 3 (tiga) rangkap, 2 (dua) diantaranya ditandatangani diatas meterai tempel secukupnya pada rangkap pertama dan kedua yang mempunyai kekuatan hukum yang sama, 1 (satu) rangkap untuk PIHAK PERTAMA dan 1 (satu) rangkap untuk PIHAK KEDUA, dan 1 (satu) rangkap lainnya untuk arsip PT PRIMA LAYANAN NASIONAL ENJINIRING.
Demikian Berita Acara Serah Terima ini dibuat dan ditandatangani di Jakarta oleh PIHAK PERTAMA dan PIHAK KEDUA.



`;
  
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [{
        insertText: {
          location: { index: 1 },
          text: allText,
        },
      }],
    },
  });
  
  console.log('   Text inserted');
  
  // 3. Apply formatting
  console.log('3. Applying formatting...');
  
  // Calculate line offsets
  const lines = allText.split('\n');
  let offset = 1;
  const lineOffsets: { start: number; end: number; text: string }[] = [];
  
  for (const line of lines) {
    lineOffsets.push({ start: offset, end: offset + line.length, text: line });
    offset += line.length + 1; // +1 for \n
  }
  
  // Format title (line 0): Bold, Underlined, 14pt, Centered
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [
        {
          updateTextStyle: {
            range: { startIndex: 1, endIndex: 27 },
            textStyle: { bold: true, underline: {}, fontSize: { magnitude: 14, unit: 'PT' }, weightedFontFamily: { fontFamily: 'Arial' } },
            fields: 'bold,underline,fontSize,weightedFontFamily',
          },
        },
        {
          updateParagraphStyle: {
            range: { startIndex: 1, endIndex: 27 },
            paragraphStyle: { alignment: 'CENTER' },
            fields: 'alignment',
          },
        },
      ],
    },
  });
  
  // Format nomor (line 1): Centered
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [{
        updateParagraphStyle: {
          range: { startIndex: 28, endIndex: 62 },
          paragraphStyle: { alignment: 'CENTER' },
          fields: 'alignment',
        },
      }],
    },
  });
  
  // Format project title (line 4): Bold, 12pt, Centered
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [
        {
          updateTextStyle: {
            range: { startIndex: 65, endIndex: 134 },
            textStyle: { bold: true, fontSize: { magnitude: 12, unit: 'PT' }, weightedFontFamily: { fontFamily: 'Arial' } },
            fields: 'bold,fontSize,weightedFontFamily',
          },
        },
        {
          updateParagraphStyle: {
            range: { startIndex: 65, endIndex: 134 },
            paragraphStyle: { alignment: 'CENTER' },
            fields: 'alignment',
          },
        },
      ],
    },
  });
  
  // Format whole document with Arial font
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [{
        updateTextStyle: {
          range: { startIndex: 1, endIndex: allText.length },
          textStyle: { weightedFontFamily: { fontFamily: 'Arial' } },
          fields: 'weightedFontFamily',
        },
      }],
    },
  });
  
  console.log('   Formatting applied');
  
  // 4. Insert signatories table
  console.log('4. Inserting signatories table...');
  
  let doc = await docs.documents.get({ documentId: docId });
  let endIndex = doc.data.body?.content?.[doc.data.body.content.length - 1]?.endIndex || 2;
  
  // Insert 2-column table
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [{
        insertTable: {
          rows: 5,
          columns: 2,
          location: { index: endIndex - 1 },
        },
      }],
    },
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Get table and fill cells
  doc = await docs.documents.get({ documentId: docId });
  const tableElement = doc.data.body?.content?.find(e => e.table);
  
  if (tableElement?.table?.tableRows) {
    console.log('   Table created with', tableElement.table.tableRows.length, 'rows');
    
    // Fill table cells
    for (let row = 0; row < Math.min(5, tableElement.table.tableRows.length); row++) {
      const tableRow = tableElement.table.tableRows[row];
      if (tableRow.tableCells) {
        for (let col = 0; col < tableRow.tableCells.length; col++) {
          const cell = tableRow.tableCells[col];
          const cellStart = cell.content?.[0]?.startIndex;
          
          if (cellStart !== undefined) {
            // Get text based on row and column
            let text = '';
            if (row === 0 && col === 0) text = 'PIHAK PERTAMA';
            else if (row === 0 && col === 1) text = 'PIHAK KEDUA';
            else if (row === 1 && col === 0) text = 'PT PRIMA LAYANAN NASIONAL ENJINIRING';
            else if (row === 1 && col === 1) text = 'PT RURA MAS';
            else if (row === 3 && col === 0) text = 'AMY MAULANY SETYAMAN';
            else if (row === 3 && col === 1) text = 'NALOANDA';
            else if (row === 4 && col === 0) text = 'VP Project Management Office';
            else if (row === 4 && col === 1) text = 'Direktur Utama';
            
            if (text) {
              await docs.documents.batchUpdate({
                documentId: docId,
                requestBody: {
                  requests: [{
                    insertText: {
                      location: { index: cellStart },
                      text,
                    },
                  }],
                },
              });
            }
          }
        }
      }
    }
    
    // Wait for text insertion
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('   Table cells filled');
  }
  
  console.log('\n✅ Document created successfully!');
  console.log('\nDocument ID:', docId);
  console.log('Open: https://docs.google.com/document/d/' + docId + '/edit');
}

createBastDocument().catch(console.error);
