import { google, docs_v1, drive_v3 } from 'googleapis';
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

async function createDocumentV6() {
  console.log('Creating document via Drive API...');
  
  const file = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: 'BAST Profil Tahap II (V6 - Final)',
      mimeType: 'application/vnd.google-apps.document',
      parents: [FOLDER_ID],
    },
  });
  
  const docId = file.data.id!;
  console.log('Document ID:', docId);
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Insert all text content
  const texts = [
    'BERITA ACARA SERAH TERIMA',                    // 0
    '\n',                                            // 1
    'Nomor : 20.002.BAST/PLNE/VI/2024',             // 2
    '\n\n',                                          // 3
    'PEKERJAAN PENGADAAN APLIKASI PROFIL TAHUN 2023 DI PT PLN ENJINIRING',  // 4
    '\n\n',                                          // 5
    'Pada hari ini Kamis, tanggal Dua Puluh, bulan Juni, tahun Dua Ribu Dua Puluh Empat (20-06-2024), kami yang bertanda tangan dibawah ini :',  // 6
    '\n\n',                                          // 7
    '1.   AMY MAULANY SETYAMAN',                     // 8
    ' : Selaku Vice President Project Management Office PT Prima Layanan Nasional Enjiniring, yang dalam hal ini bertindak atas nama PT Prima Layanan Nasional Enjiniring berkedudukan di Jl. Aipda KS. Tubun I No. 2, Kelurahan Kota Bambu, Kecamatan Palmerah, Jakarta Barat yang selanjutnya disebut ',  // 9
    'PIHAK PERTAMA',                                 // 10
    '.\n\n',                                         // 11
    '2.   NALOANDA',                                  // 12
    ' : Selaku Direktur Utama PT Rura Mas yang berkedudukan di Jl. Ciater Raya No.163, Tangerang Selatan, Banten 15310, berdasarkan Surat Perintah Kerja Nomor 0003.SPK/P.00.00/PLNE01030/2023 tertanggal 09 Maret 2023 dan Amandemen I No.0004.Amd/P.12.00/PLNE01030/2023 tertanggal 21 Juni 2023, selanjutnya dalam Kesepakatan Kerjasama ini disebut ',  // 13
    'PIHAK KEDUA',                                   // 14
    '.\n\n',                                         // 15
    'Berdasarkan Surat Perintah Kerja Nomor 0003.SPK/P.00.00/PLNE01030/2023 tertanggal 09 Maret 2023 dan Amandemen I No.0004.Amd/P.12.00/PLNE01030/2023 tertanggal 21 Juni 2023 tentang Pekerjaan Pengadaan Aplikasi Profil Tahun 2023 di PT PLN Enjiniring, dengan ini kedua belah pihak bersama-sama menyatakan kebenaran dan persetujuan mengenai hal-hal yang dilakukan, sebagai berikut :',  // 16
    '\n',                                            // 17
    '1. PIHAK KEDUA',                               // 18
    ' telah menyelesaikan retensi masa pemeliharaan selama 12 (dua belas ) bulan dari Berita Acara Go-Live Pekerjaan Pengadaan Aplikasi Profil Tahun 2023 di PT PLN Enjiniring dalam keadaan baik dan terlaksana sebagaimana mestinya sesuai dengan Surat Perintah Kerja.',  // 19
    '\n',                                            // 20
    '2.   PIHAK KEDUA',                              // 21
    ' akan menerima pembayaran sesuai dengan Poin 2 (dua) Nilai Pekerjaan dan Poin 3 (tiga) Syarat Pembayaran dalam Surat Perintah Kerja dan berhak menerima pembayaran Tahap II untuk pembayaran retensi masa pemeliharaan selama 12 (dua belas ) bulan dari Berita Acara Go-Live sebesar 5% (lima persen) dari Nilai Pekerjaan dari ',  // 22
    'PIHAK PERTAMA',                                 // 23
    '.\n',                                            // 24
    '3.   PIHAK PERTAMA',                            // 25
    ' telah menerima dengan baik dan lengkap hasil pelaksanaan pekerjaan serta dapat dipergunakan sebagaimana mestinya terhitung sejak Berita Acara ini ditandatangani.',  // 26
    '\n\n',                                          // 27
    'Berita Acara Serah Terima ini dibuat dalam rangkap 3 (tiga) rangkap, 2 (dua) diantaranya ditandatangani diatas meterai tempel secukupnya pada rangkap pertama dan kedua yang mempunyai kekuatan hukum yang sama, 1 (satu) rangkap untuk ',  // 28
    'PIHAK PERTAMA',                                 // 29
    ' dan 1 (satu) rangkap untuk ',                  // 30
    'PIHAK KEDUA',                                   // 31
    ', dan 1 (satu) rangkap lainnya untuk arsip PT PRIMA LAYANAN NASIONAL ENJINIRING.\n',  // 32
    'Demikian Berita Acara Serah Terima ini dibuat dan ditandatangani di Jakarta oleh PIHAK',  // 33
    '\n',                                            // 34
    'PERTAMA dan PIHAK KEDUA.',                      // 35
    '\n\n\n',                                        // 36
  ];
  
  console.log('\nInserting all text...');
  
  const insertRequests: any[] = [];
  let currentIndex = 1;
  
  for (let i = 0; i < texts.length; i++) {
    insertRequests.push({
      insertText: {
        location: { index: currentIndex },
        text: texts[i],
      },
    });
    currentIndex += texts[i].length;
  }
  
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: { requests: insertRequests },
  });
  
  console.log('Text inserted. Applying formatting...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Calculate indices
  let offset = 1;
  const s: { start: number; end: number }[] = [];
  for (const text of texts) {
    s.push({ start: offset, end: offset + text.length });
    offset += text.length;
  }
  
  // Formatting requests
  const fmt: any[] = [];
  
  // Title: Bold, Underlined, 14pt, Centered
  fmt.push(
    { updateTextStyle: { range: { startIndex: s[0].start, endIndex: s[0].end - 1 }, textStyle: { bold: true, underline: true, fontSize: { magnitude: 14, unit: 'PT' }, weightedFontFamily: { fontFamily: 'Arial' } }, fields: 'bold,underline,fontSize,weightedFontFamily' } },
    { updateParagraphStyle: { range: { startIndex: s[0].start, endIndex: s[0].end }, paragraphStyle: { alignment: 'CENTER' }, fields: 'alignment' } }
  );
  
  // Nomor: Centered
  fmt.push({ updateParagraphStyle: { range: { startIndex: s[2].start, endIndex: s[2].end }, paragraphStyle: { alignment: 'CENTER' }, fields: 'alignment' } });
  
  // Project: Bold, Centered, 12pt
  fmt.push(
    { updateTextStyle: { range: { startIndex: s[4].start, endIndex: s[4].end - 1 }, textStyle: { bold: true, fontSize: { magnitude: 12, unit: 'PT' }, weightedFontFamily: { fontFamily: 'Arial' } }, fields: 'bold,fontSize,weightedFontFamily' } },
    { updateParagraphStyle: { range: { startIndex: s[4].start, endIndex: s[4].end }, paragraphStyle: { alignment: 'CENTER' }, fields: 'alignment' } }
  );
  
  // Intro: Justified, 1.5 line spacing
  fmt.push({ updateParagraphStyle: { range: { startIndex: s[6].start, endIndex: s[6].end }, paragraphStyle: { alignment: 'JUSTIFIED', lineSpacing: 150 }, fields: 'alignment,lineSpacing' } });
  
  // Bold names and labels
  [8, 10, 12, 14, 18, 21, 23, 25, 29, 31, 33, 35].forEach(idx => {
    fmt.push({ updateTextStyle: { range: { startIndex: s[idx].start, endIndex: s[idx].end }, textStyle: { bold: true, weightedFontFamily: { fontFamily: 'Arial' } }, fields: 'bold,weightedFontFamily' } });
  });
  
  // Reference: Justified, 1.5 line spacing
  fmt.push({ updateParagraphStyle: { range: { startIndex: s[16].start, endIndex: s[16].end }, paragraphStyle: { alignment: 'JUSTIFIED', lineSpacing: 150 }, fields: 'alignment,lineSpacing' } });
  
  // Closing: Justified, 1.5 line spacing
  fmt.push({ updateParagraphStyle: { range: { startIndex: s[28].start, endIndex: s[32].end }, paragraphStyle: { alignment: 'JUSTIFIED', lineSpacing: 150 }, fields: 'alignment,lineSpacing' } });
  
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: { requests: fmt },
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Insert table for signatories
  console.log('Inserting signatories table...');
  
  let doc2 = await docs.documents.get({ documentId: docId });
  let insertIndex = doc2.data.body!.content![doc2.data.body!.content!.length - 1].endIndex! - 1;
  
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [{
        insertTable: {
          rows: 4,
          columns: 2,
          location: { index: insertIndex },
        },
      }],
    },
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Get table structure
  let doc3 = await docs.documents.get({ documentId: docId });
  let table = doc3.data.body!.content!.find(e => e.table)?.table;
  
  if (table?.tableRows) {
    console.log('Table found with', table.tableRows.length, 'rows');
    
    // Table content (4 rows x 2 columns)
    // Row 0: Headers (PIHAK PERTAMA | PIHAK KEDUA)
    // Row 1: Company names
    // Row 2: Names
    // Row 3: Titles
    const tableContent = [
      ['PIHAK PERTAMA', 'PIHAK KEDUA'],
      ['PT PRIMA LAYANAN NASIONAL ENJINIRING', 'PT RURA MAS'],
      ['AMY MAULANY SETYAMAN', 'NALOANDA'],
      ['VP Project Management Office', 'Direktur Utama'],
    ];
    
    const fillReqs: any[] = [];
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 2; col++) {
        const cell = table.tableRows[row].tableCells![col];
        const cellStart = cell.content![0].startIndex!;
        const text = tableContent[row][col];
        
        if (text) {
          // Insert text
          fillReqs.push({
            insertText: {
              location: { index: cellStart },
              text: text,
            },
          });
        }
      }
    }
    
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: { requests: fillReqs },
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get updated table
    let doc4 = await docs.documents.get({ documentId: docId });
    let table2 = doc4.data.body!.content!.find(e => e.table)?.table;
    
    if (table2?.tableRows) {
      const formatReqs: any[] = [];
      
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 2; col++) {
          const cell = table2.tableRows[row].tableCells![col];
          const cellStart = cell.content![0].startIndex!;
          const text = tableContent[row][col];
          
          if (text) {
            const endIdx = cellStart + text.length;
            
            // Center align
            formatReqs.push({
              updateParagraphStyle: {
                range: { startIndex: cellStart, endIndex: endIdx },
                paragraphStyle: { alignment: 'CENTER' },
                fields: 'alignment',
              },
            });
            
            // Font
            formatReqs.push({
              updateTextStyle: {
                range: { startIndex: cellStart, endIndex: endIdx },
                textStyle: { weightedFontFamily: { fontFamily: 'Arial' } },
                fields: 'weightedFontFamily',
              },
            });
          }
        }
      }
      
      // Bold headers (row 0) and names (row 2)
      [[0, 0], [0, 1], [2, 0], [2, 1]].forEach(([row, col]) => {
        const cell = table2.tableRows[row].tableCells![col];
        const cellStart = cell.content![0].startIndex!;
        const text = tableContent[row][col];
        if (text) {
          formatReqs.push({
            updateTextStyle: {
              range: { startIndex: cellStart, endIndex: cellStart + text.length },
              textStyle: { bold: true },
              fields: 'bold',
            },
          });
        }
      });
      
      await docs.documents.batchUpdate({
        documentId: docId,
        requestBody: { requests: formatReqs },
      });
    }
  }
  
  // Verify the document
  console.log('\nVerifying document...');
  let doc5 = await docs.documents.get({ documentId: docId });
  let content = doc5.data.body!.content!;
  
  console.log('Document has', content.length, 'elements');
  
  // Check for table
  let hasTable = content.some(e => e.table);
  console.log('Has table:', hasTable);
  
  console.log('\n✅ Document created!');
  console.log('\nDocument ID:', docId);
  console.log('Open: https://docs.google.com/document/d/' + docId + '/edit');
}

createDocumentV6().catch(console.error);
