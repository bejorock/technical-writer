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

async function createDocumentV5() {
  console.log('Creating document via Drive API...');
  
  // Create document in Shared Drive
  const file = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: 'BAST Profil Tahap II (V5 - Fixed)',
      mimeType: 'application/vnd.google-apps.document',
      parents: [FOLDER_ID],
    },
  });
  
  const docId = file.data.id!;
  console.log('Document ID:', docId);
  
  // Wait for document to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Insert all text content
  const texts = [
    'BERITA ACARA SERAH TERIMA',                    // 0: title
    '\n',                                            // 1: newline
    'Nomor : 20.002.BAST/PLNE/VI/2024',             // 2: nomor
    '\n\n',                                          // 3: 2 newlines
    'PEKERJAAN PENGADAAN APLIKASI PROFIL TAHUN 2023 DI PT PLN ENJINIRING',  // 4: project
    '\n\n',                                          // 5: 2 newlines
    'Pada hari ini Kamis, tanggal Dua Puluh, bulan Juni, tahun Dua Ribu Dua Puluh Empat (20-06-2024), kami yang bertanda tangan dibawah ini :',  // 6: intro
    '\n\n',                                          // 7: 2 newlines
    
    // Party 1
    '1.',                                            // 8: num1
    '   ',                                           // 9: 3 spaces
    'AMY MAULANY SETYAMAN',                          // 10: name1
    ' : Selaku Vice President Project Management Office PT Prima Layanan Nasional Enjiniring, yang dalam hal ini bertindak atas nama PT Prima Layanan Nasional Enjiniring berkedudukan di Jl. Aipda KS. Tubun I No. 2, Kelurahan Kota Bambu, Kecamatan Palmerah, Jakarta Barat yang selanjutnya disebut ',  // 11: desc1
    'PIHAK PERTAMA',                                 // 12: label1
    '.\n\n',                                         // 13: end1
    
    // Party 2
    '2.',                                            // 14: num2
    '   ',                                           // 15: 3 spaces
    'NALOANDA',                                      // 16: name2
    ' : Selaku Direktur Utama PT Rura Mas yang berkedudukan di Jl. Ciater Raya No.163, Tangerang Selatan, Banten 15310, berdasarkan Surat Perintah Kerja Nomor 0003.SPK/P.00.00/PLNE01030/2023 tertanggal 09 Maret 2023 dan Amandemen I No.0004.Amd/P.12.00/PLNE01030/2023 tertanggal 21 Juni 2023, selanjutnya dalam Kesepakatan Kerjasama ini disebut ',  // 17: desc2
    'PIHAK KEDUA',                                   // 18: label2
    '.\n\n',                                         // 19: end2
    
    // Reference paragraph
    'Berdasarkan Surat Perintah Kerja Nomor 0003.SPK/P.00.00/PLNE01030/2023 tertanggal 09 Maret 2023 dan Amandemen I No.0004.Amd/P.12.00/PLNE01030/2023 tertanggal 21 Juni 2023 tentang Pekerjaan Pengadaan Aplikasi Profil Tahun 2023 di PT PLN Enjiniring, dengan ini kedua belah pihak bersama-sama menyatakan kebenaran dan persetujuan mengenai hal-hal yang dilakukan, sebagai berikut :',  // 20: ref
    '\n',                                            // 21: 1 newline
    
    // Point 1 - no indent (matches PDF)
    '1. PIHAK KEDUA',                               // 22: label3
    ' telah menyelesaikan retensi masa pemeliharaan selama 12 (dua belas ) bulan dari Berita Acara Go-Live Pekerjaan Pengadaan Aplikasi Profil Tahun 2023 di PT PLN Enjiniring dalam keadaan baik dan terlaksana sebagaimana mestinya sesuai dengan Surat Perintah Kerja.',  // 23: desc3
    '\n',                                            // 24: 1 newline
    
    // Point 2 - with indent
    '2.',                                            // 25: num4
    '   ',                                           // 26: 3 spaces
    'PIHAK KEDUA',                                   // 27: label4
    ' akan menerima pembayaran sesuai dengan Poin 2 (dua) Nilai Pekerjaan dan Poin 3 (tiga) Syarat Pembayaran dalam Surat Perintah Kerja dan berhak menerima pembayaran Tahap II untuk pembayaran retensi masa pemeliharaan selama 12 (dua belas ) bulan dari Berita Acara Go-Live sebesar 5% (lima persen) dari Nilai Pekerjaan dari ',  // 28: desc4
    'PIHAK PERTAMA',                                 // 29: label4b
    '.\n',                                            // 30: end4
    
    // Point 3 - with indent
    '3.',                                            // 31: num5
    '   ',                                           // 32: 3 spaces
    'PIHAK PERTAMA',                                 // 33: label5
    ' telah menerima dengan baik dan lengkap hasil pelaksanaan pekerjaan serta dapat dipergunakan sebagaimana mestinya terhitung sejak Berita Acara ini ditandatangani.',  // 34: desc5
    '\n\n',                                          // 35: 2 newlines
    
    // Closing paragraph
    'Berita Acara Serah Terima ini dibuat dalam rangkap 3 (tiga) rangkap, 2 (dua) diantaranya ditandatangani diatas meterai tempel secukupnya pada rangkap pertama dan kedua yang mempunyai kekuatan hukum yang sama, 1 (satu) rangkap untuk ',  // 36: closing
    'PIHAK PERTAMA',                                 // 37: label6
    ' dan 1 (satu) rangkap untuk ',                  // 38: and
    'PIHAK KEDUA',                                   // 39: label7
    ', dan 1 (satu) rangkap lainnya untuk arsip PT PRIMA LAYANAN NASIONAL ENJINIRING.\n',  // 40: endclosing
    
    // Final line
    'Demikian Berita Acara Serah Terima ini dibuat dan ditandatangani di Jakarta oleh PIHAK',  // 41: demikian1
    '\n',                                            // 42: newline
    'PERTAMA dan PIHAK KEDUA.',                      // 43: demikian2
    '\n\n\n',                                        // 44: 3 newlines
  ];
  
  // First, insert all text
  console.log('\nInserting all text...');
  
  const insertRequests: any[] = [];
  let currentIndex = 1;
  
  for (let i = 0; i < texts.length; i++) {
    insertRequests.push({
      insertText: {
        location: {
          index: currentIndex,
        },
        text: texts[i],
      },
    });
    currentIndex += texts[i].length;
  }
  
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: insertRequests,
    },
  });
  
  console.log('Text inserted. Applying formatting...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Calculate indices
  let offset = 1;
  const sections: { start: number; end: number; text: string }[] = [];
  for (const text of texts) {
    sections.push({ start: offset, end: offset + text.length, text });
    offset += text.length;
  }
  
  // Build formatting requests
  const formatRequests: any[] = [];
  
  // Title: Bold, Underlined, 14pt, Centered
  formatRequests.push(
    {
      updateTextStyle: {
        range: { startIndex: sections[0].start, endIndex: sections[0].end - 1 },
        textStyle: {
          bold: true,
          underline: true,
          fontSize: { magnitude: 14, unit: 'PT' },
          weightedFontFamily: { fontFamily: 'Arial' },
        },
        fields: 'bold,underline,fontSize,weightedFontFamily',
      },
    },
    {
      updateParagraphStyle: {
        range: { startIndex: sections[0].start, endIndex: sections[0].end },
        paragraphStyle: { alignment: 'CENTER' },
        fields: 'alignment',
      },
    }
  );
  
  // Nomor: Centered
  formatRequests.push({
    updateParagraphStyle: {
      range: { startIndex: sections[2].start, endIndex: sections[2].end },
      paragraphStyle: { alignment: 'CENTER' },
      fields: 'alignment',
    },
  });
  
  // Project title: Bold, Centered, 12pt
  formatRequests.push(
    {
      updateTextStyle: {
        range: { startIndex: sections[4].start, endIndex: sections[4].end - 1 },
        textStyle: {
          bold: true,
          fontSize: { magnitude: 12, unit: 'PT' },
          weightedFontFamily: { fontFamily: 'Arial' },
        },
        fields: 'bold,fontSize,weightedFontFamily',
      },
    },
    {
      updateParagraphStyle: {
        range: { startIndex: sections[4].start, endIndex: sections[4].end },
        paragraphStyle: { alignment: 'CENTER' },
        fields: 'alignment',
      },
    }
  );
  
  // Intro: Justified, 1.5 line spacing
  formatRequests.push({
    updateParagraphStyle: {
      range: { startIndex: sections[6].start, endIndex: sections[6].end },
      paragraphStyle: { alignment: 'JUSTIFIED', lineSpacing: 150 },
      fields: 'alignment,lineSpacing',
    },
  });
  
  // Bold labels and names
  const boldIndices = [10, 12, 16, 18, 22, 27, 29, 33, 37, 39];
  for (const idx of boldIndices) {
    formatRequests.push({
      updateTextStyle: {
        range: { startIndex: sections[idx].start, endIndex: sections[idx].end },
        textStyle: {
          bold: true,
          weightedFontFamily: { fontFamily: 'Arial' },
        },
        fields: 'bold,weightedFontFamily',
      },
    });
  }
  
  // Reference: Justified, 1.5 line spacing
  formatRequests.push({
    updateParagraphStyle: {
      range: { startIndex: sections[20].start, endIndex: sections[20].end },
      paragraphStyle: { alignment: 'JUSTIFIED', lineSpacing: 150 },
      fields: 'alignment,lineSpacing',
    },
  });
  
  // Closing: Justified, 1.5 line spacing
  formatRequests.push({
    updateParagraphStyle: {
      range: { startIndex: sections[36].start, endIndex: sections[40].end },
      paragraphStyle: { alignment: 'JUSTIFIED', lineSpacing: 150 },
      fields: 'alignment,lineSpacing',
    },
  });
  
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: { requests: formatRequests },
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Now insert table for signatories
  console.log('Inserting signatories table...');
  
  let doc2 = await docs.documents.get({ documentId: docId });
  let content2 = doc2.data.body!.content!;
  let insertIndex = content2[content2.length - 1].endIndex! - 1;
  
  // Insert 2-column table
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [{
        insertTable: {
          rows: 6,
          columns: 2,
          location: { index: insertIndex },
        },
      }],
    },
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Get table structure
  let doc3 = await docs.documents.get({ documentId: docId });
  let tableRow = doc3.data.body!.content!.find(e => e.table)?.table?.tableRows;
  
  if (tableRow) {
    console.log('Table found with', tableRow.length, 'rows');
    
    // Table content
    const tableContent = [
      ['PIHAK PERTAMA', 'PIHAK KEDUA'],
      ['PT PRIMA LAYANAN NASIONAL ENJINIRING', 'PT RURA MAS'],
      ['', ''],
      ['', ''],
      ['AMY MAULANY SETYAMAN', 'NALOANDA'],
      ['VP Project Management Office', 'Direktur Utama'],
    ];
    
    const fillRequests: any[] = [];
    
    // Fill in table content
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 2; col++) {
        const cell = tableRow[row].tableCells![col];
        const cellStart = cell.content![0].startIndex!;
        const text = tableContent[row][col];
        
        if (text) {
          fillRequests.push({
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
      requestBody: { requests: fillRequests },
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get updated table
    let doc4 = await docs.documents.get({ documentId: docId });
    let tableRow2 = doc4.data.body!.content!.find(e => e.table)?.table?.tableRows;
    
    if (tableRow2) {
      const formatTableRequests: any[] = [];
      
      // Format all cells: Centered + Arial
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 2; col++) {
          const cell = tableRow2[row].tableCells![col];
          const cellStart = cell.content![0].startIndex!;
          const text = tableContent[row][col];
          
          if (text) {
            const endIdx = cellStart + text.length;
            
            // Center align
            formatTableRequests.push({
              updateParagraphStyle: {
                range: { startIndex: cellStart, endIndex: endIdx + 1 },
                paragraphStyle: { alignment: 'CENTER' },
                fields: 'alignment',
              },
            });
            
            // Font
            formatTableRequests.push({
              updateTextStyle: {
                range: { startIndex: cellStart, endIndex: endIdx },
                textStyle: {
                  weightedFontFamily: { fontFamily: 'Arial' },
                },
                fields: 'weightedFontFamily',
              },
            });
          }
        }
      }
      
      // Bold headers and names
      const boldCells = [
        [0, 0], [0, 1],  // Headers
        [4, 0], [4, 1],  // Names
      ];
      
      for (const [row, col] of boldCells) {
        const cell = tableRow2[row].tableCells![col];
        const cellStart = cell.content![0].startIndex!;
        const text = tableContent[row][col];
        
        if (text) {
          formatTableRequests.push({
            updateTextStyle: {
              range: { startIndex: cellStart, endIndex: cellStart + text.length },
              textStyle: { bold: true },
              fields: 'bold',
            },
          });
        }
      }
      
      await docs.documents.batchUpdate({
        documentId: docId,
        requestBody: { requests: formatTableRequests },
      });
    }
  }
  
  console.log('\n✅ Document created with table signatories!');
  console.log('\nDocument ID:', docId);
  console.log('Open: https://docs.google.com/document/d/' + docId + '/edit');
}

createDocumentV5().catch(console.error);
