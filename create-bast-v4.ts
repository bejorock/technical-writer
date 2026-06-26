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

async function createDocumentV4() {
  console.log('Creating document via Drive API...');
  
  // Create document in Shared Drive
  const file = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: 'BAST Profil Tahap II (V4 - Tables)',
      mimeType: 'application/vnd.google-apps.document',
      parents: [FOLDER_ID],
    },
  });
  
  const docId = file.data.id!;
  console.log('Document ID:', docId);
  
  // Wait for document to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Get the document to find the end index
  const doc = await docs.documents.get({ documentId: docId });
  let body = doc.data.body!;
  let content = body.content!;
  let endIndex = content[content.length - 1].endIndex!;
  
  console.log('Document ready. End index:', endIndex);
  
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
    
    // Party 1 - using proper indentation
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
  let currentIndex = 1; // Start at 1 (after the body start marker)
  
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
  
  // Execute inserts
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: insertRequests,
    },
  });
  
  console.log('Text inserted. Now applying formatting...');
  
  // Wait for inserts to be processed
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Now calculate indices for each section
  let offset = 1;
  const sections: { start: number; end: number; text: string }[] = [];
  
  for (const text of texts) {
    sections.push({
      start: offset,
      end: offset + text.length,
      text: text,
    });
    offset += text.length;
  }
  
  // Build formatting requests
  const formatRequests: any[] = [];
  
  // 1. Title: Bold, Underlined, 14pt, Centered
  const title = sections[0];
  formatRequests.push(
    {
      updateTextStyle: {
        range: { startIndex: title.start, endIndex: title.end - 1 },
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
        range: { startIndex: title.start, endIndex: title.end },
        paragraphStyle: {
          alignment: 'CENTER',
        },
        fields: 'alignment',
      },
    }
  );
  
  // 2. Nomor: Centered
  const nomor = sections[2];
  formatRequests.push({
    updateParagraphStyle: {
      range: { startIndex: nomor.start, endIndex: nomor.end },
      paragraphStyle: {
        alignment: 'CENTER',
      },
      fields: 'alignment',
    },
  });
  
  // 3. Project title: Bold, Centered, 12pt
  const project = sections[4];
  formatRequests.push(
    {
      updateTextStyle: {
        range: { startIndex: project.start, endIndex: project.end - 1 },
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
        range: { startIndex: project.start, endIndex: project.end },
        paragraphStyle: {
          alignment: 'CENTER',
        },
        fields: 'alignment',
      },
    }
  );
  
  // 4. Intro paragraph: Justified, 1.5 line spacing
  const intro = sections[6];
  formatRequests.push({
    updateParagraphStyle: {
      range: { startIndex: intro.start, endIndex: intro.end },
      paragraphStyle: {
        alignment: 'JUSTIFIED',
        lineSpacing: 150,
      },
      fields: 'alignment,lineSpacing',
    },
  });
  
  // 5. Party 1 name: Bold
  const name1 = sections[10];
  formatRequests.push({
    updateTextStyle: {
      range: { startIndex: name1.start, endIndex: name1.end },
      textStyle: {
        bold: true,
        weightedFontFamily: { fontFamily: 'Arial' },
      },
      fields: 'bold,weightedFontFamily',
    },
  });
  
  // 6. PIHAK PERTAMA (first): Bold
  const label1 = sections[12];
  formatRequests.push({
    updateTextStyle: {
      range: { startIndex: label1.start, endIndex: label1.end },
      textStyle: {
        bold: true,
        weightedFontFamily: { fontFamily: 'Arial' },
      },
      fields: 'bold,weightedFontFamily',
    },
  });
  
  // 7. Party 2 name: Bold
  const name2 = sections[16];
  formatRequests.push({
    updateTextStyle: {
      range: { startIndex: name2.start, endIndex: name2.end },
      textStyle: {
        bold: true,
        weightedFontFamily: { fontFamily: 'Arial' },
      },
      fields: 'bold,weightedFontFamily',
    },
  });
  
  // 8. PIHAK KEDUA (second): Bold
  const label2 = sections[18];
  formatRequests.push({
    updateTextStyle: {
      range: { startIndex: label2.start, endIndex: label2.end },
      textStyle: {
        bold: true,
        weightedFontFamily: { fontFamily: 'Arial' },
      },
      fields: 'bold,weightedFontFamily',
    },
  });
  
  // 9. Reference paragraph: Justified, 1.5 line spacing
  const ref = sections[20];
  formatRequests.push({
    updateParagraphStyle: {
      range: { startIndex: ref.start, endIndex: ref.end },
      paragraphStyle: {
        alignment: 'JUSTIFIED',
        lineSpacing: 150,
      },
      fields: 'alignment,lineSpacing',
    },
  });
  
  // 10. PIHAK KEDUA (third): Bold
  const label3 = sections[22];
  formatRequests.push({
    updateTextStyle: {
      range: { startIndex: label3.start, endIndex: label3.end },
      textStyle: {
        bold: true,
        weightedFontFamily: { fontFamily: 'Arial' },
      },
      fields: 'bold,weightedFontFamily',
    },
  });
  
  // 11. PIHAK KEDUA (fourth): Bold
  const label4 = sections[27];
  formatRequests.push({
    updateTextStyle: {
      range: { startIndex: label4.start, endIndex: label4.end },
      textStyle: {
        bold: true,
        weightedFontFamily: { fontFamily: 'Arial' },
      },
      fields: 'bold,weightedFontFamily',
    },
  });
  
  // 12. PIHAK PERTAMA (second): Bold
  const label4b = sections[29];
  formatRequests.push({
    updateTextStyle: {
      range: { startIndex: label4b.start, endIndex: label4b.end },
      textStyle: {
        bold: true,
        weightedFontFamily: { fontFamily: 'Arial' },
      },
      fields: 'bold,weightedFontFamily',
    },
  });
  
  // 13. PIHAK PERTAMA (third): Bold
  const label5 = sections[33];
  formatRequests.push({
    updateTextStyle: {
      range: { startIndex: label5.start, endIndex: label5.end },
      textStyle: {
        bold: true,
        weightedFontFamily: { fontFamily: 'Arial' },
      },
      fields: 'bold,weightedFontFamily',
    },
  });
  
  // 14. Closing paragraph: Justified, 1.5 line spacing
  const closing = sections[36];
  formatRequests.push({
    updateParagraphStyle: {
      range: { startIndex: closing.start, endIndex: sections[40].end },
      paragraphStyle: {
        alignment: 'JUSTIFIED',
        lineSpacing: 150,
      },
      fields: 'alignment,lineSpacing',
    },
  });
  
  // 15. PIHAK PERTAMA (fourth): Bold
  const label6 = sections[37];
  formatRequests.push({
    updateTextStyle: {
      range: { startIndex: label6.start, endIndex: label6.end },
      textStyle: {
        bold: true,
        weightedFontFamily: { fontFamily: 'Arial' },
      },
      fields: 'bold,weightedFontFamily',
    },
  });
  
  // 16. PIHAK KEDUA (fifth): Bold
  const label7 = sections[39];
  formatRequests.push({
    updateTextStyle: {
      range: { startIndex: label7.start, endIndex: label7.end },
      textStyle: {
        bold: true,
        weightedFontFamily: { fontFamily: 'Arial' },
      },
      fields: 'bold,weightedFontFamily',
    },
  });
  
  // Execute formatting
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: formatRequests,
    },
  });
  
  // Wait for formatting to be processed
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Now insert a table for signatories
  console.log('Inserting signatories table...');
  
  // Get current document state
  const doc2 = await docs.documents.get({ documentId: docId });
  const content2 = doc2.data.body!.content!;
  const lastElement = content2[content2.length - 1];
  const insertIndex = lastElement.endIndex! - 1;
  
  // Insert a 2-column table for signatories
  const tableRequests = [
    // Insert table with 2 columns, 6 rows
    {
      insertTable: {
        rows: 6,
        columns: 2,
        location: {
          index: insertIndex,
        },
      },
    },
  ];
  
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: tableRequests,
    },
  });
  
  // Wait for table to be created
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Get updated document to find table cells
  const doc3 = await docs.documents.get({ documentId: docId });
  const content3 = doc3.data.body!.content!;
  
  // Find the table
  let tableElement: any = null;
  for (const element of content3) {
    if (element.table) {
      tableElement = element.table;
      break;
    }
  }
  
  if (tableElement) {
    console.log('Table found. Filling in content...');
    
    // Table structure: 6 rows x 2 columns
    // Row 0: Header (PIHAK PERTAMA | PIHAK KEDUA)
    // Row 1: Company name
    // Row 2: Empty (space for stamp)
    // Row 3: Empty (space for stamp)
    // Row 4: Name
    // Row 5: Title
    
    const tableCells = tableElement.tableCells!;
    
    // Helper to get cell content index
    const getCellContentIndex = (row: number, col: number) => {
      const cell = tableCells[row * 2 + col];
      return cell.content![0].startIndex!;
    };
    
    // Fill in table content
    const tableContent = [
      // Row 0: Headers
      ['PIHAK PERTAMA', 'PIHAK KEDUA'],
      // Row 1: Company names
      ['PT PRIMA LAYANAN NASIONAL ENJINIRING', 'PT RURA MAS'],
      // Row 2: Empty (stamp space)
      ['', ''],
      // Row 3: Empty (stamp space)
      ['', ''],
      // Row 4: Names
      ['AMY MAULANY SETYAMAN', 'NALOANDA'],
      // Row 5: Titles
      ['VP Project Management Office', 'Direktur Utama'],
    ];
    
    const fillRequests: any[] = [];
    
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 2; col++) {
        const cellIndex = getCellContentIndex(row, col);
        const text = tableContent[row][col];
        
        if (text) {
          // Insert text
          fillRequests.push({
            insertText: {
              location: {
                index: cellIndex,
              },
              text: text,
            },
          });
        }
      }
    }
    
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests: fillRequests,
      },
    });
    
    // Wait for text insertion
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Now format the table
    const doc4 = await docs.documents.get({ documentId: docId });
    const content4 = doc4.data.body!.content!;
    
    // Find table again to get updated indices
    let tableElement2: any = null;
    for (const element of content4) {
      if (element.table) {
        tableElement2 = element.table;
        break;
      }
    }
    
    if (tableElement2) {
      const tableCells2 = tableElement2.tableCells!;
      
      const formatTableRequests: any[] = [];
      
      // Format Row 0 (headers) - Bold, Centered
      for (let col = 0; col < 2; col++) {
        const cell = tableCells2[col];
        const cellContent = cell.content!;
        const text = tableContent[0][col];
        
        if (text) {
          const startIdx = cellContent[0].startIndex!;
          const endIdx = startIdx + text.length;
          
          formatTableRequests.push({
            updateTextStyle: {
              range: { startIndex: startIdx, endIndex: endIdx },
              textStyle: {
                bold: true,
                weightedFontFamily: { fontFamily: 'Arial' },
              },
              fields: 'bold,weightedFontFamily',
            },
          });
          
          formatTableRequests.push({
            updateParagraphStyle: {
              range: { startIndex: startIdx, endIndex: endIdx + 1 },
              paragraphStyle: {
                alignment: 'CENTER',
              },
              fields: 'alignment',
            },
          });
        }
      }
      
      // Format Row 1 (company names) - Centered
      for (let col = 0; col < 2; col++) {
        const cell = tableCells2[2 + col]; // Row 1
        const cellContent = cell.content!;
        const text = tableContent[1][col];
        
        if (text) {
          const startIdx = cellContent[0].startIndex!;
          const endIdx = startIdx + text.length;
          
          formatTableRequests.push({
            updateTextStyle: {
              range: { startIndex: startIdx, endIndex: endIdx },
              textStyle: {
                weightedFontFamily: { fontFamily: 'Arial' },
              },
              fields: 'weightedFontFamily',
            },
          });
          
          formatTableRequests.push({
            updateParagraphStyle: {
              range: { startIndex: startIdx, endIndex: endIdx + 1 },
              paragraphStyle: {
                alignment: 'CENTER',
              },
              fields: 'alignment',
            },
          });
        }
      }
      
      // Format Row 4 (names) - Bold, Centered
      for (let col = 0; col < 2; col++) {
        const cell = tableCells2[8 + col]; // Row 4
        const cellContent = cell.content!;
        const text = tableContent[4][col];
        
        if (text) {
          const startIdx = cellContent[0].startIndex!;
          const endIdx = startIdx + text.length;
          
          formatTableRequests.push({
            updateTextStyle: {
              range: { startIndex: startIdx, endIndex: endIdx },
              textStyle: {
                bold: true,
                weightedFontFamily: { fontFamily: 'Arial' },
              },
              fields: 'bold,weightedFontFamily',
            },
          });
          
          formatTableRequests.push({
            updateParagraphStyle: {
              range: { startIndex: startIdx, endIndex: endIdx + 1 },
              paragraphStyle: {
                alignment: 'CENTER',
              },
              fields: 'alignment',
            },
          });
        }
      }
      
      // Format Row 5 (titles) - Centered
      for (let col = 0; col < 2; col++) {
        const cell = tableCells2[10 + col]; // Row 5
        const cellContent = cell.content!;
        const text = tableContent[5][col];
        
        if (text) {
          const startIdx = cellContent[0].startIndex!;
          const endIdx = startIdx + text.length;
          
          formatTableRequests.push({
            updateTextStyle: {
              range: { startIndex: startIdx, endIndex: endIdx },
              textStyle: {
                weightedFontFamily: { fontFamily: 'Arial' },
              },
              fields: 'weightedFontFamily',
            },
          });
          
          formatTableRequests.push({
            updateParagraphStyle: {
              range: { startIndex: startIdx, endIndex: endIdx + 1 },
              paragraphStyle: {
                alignment: 'CENTER',
              },
              fields: 'alignment',
            },
          });
        }
      }
      
      await docs.documents.batchUpdate({
        documentId: docId,
        requestBody: {
          requests: formatTableRequests,
        },
      });
    }
  }
  
  console.log('\n✅ Document created with table signatories!');
  console.log('\nDocument ID:', docId);
  console.log('Open: https://docs.google.com/document/d/' + docId + '/edit');
}

createDocumentV4().catch(console.error);
