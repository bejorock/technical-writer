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

async function createDocumentExact() {
  console.log('Creating document via Drive API...');
  
  // Create document in Shared Drive
  const file = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: 'BAST Profil Tahap II (Exact Match)',
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
  
  // Define all the text content - matching exact PDF layout
  // Note: The PDF shows numbered items with ~6 spaces (36pt) indent
  const texts = [
    'BERITA ACARA SERAH TERIMA',                    // 0: title
    '\n',                                            // 1: newline
    'Nomor : 20.002.BAST/PLNE/VI/2024',             // 2: nomor
    '\n\n',                                          // 3: 2 newlines
    'PEKERJAAN PENGADAAN APLIKASI PROFIL TAHUN 2023 DI PT PLN ENJINIRING',  // 4: project
    '\n\n',                                          // 5: 2 newlines
    'Pada hari ini Kamis, tanggal Dua Puluh, bulan Juni, tahun Dua Ribu Dua Puluh Empat (20-06-2024), kami yang bertanda tangan dibawah ini :',  // 6: intro
    '\n\n',                                          // 7: 2 newlines
    
    // Party 1 - with 6 spaces indent before number
    '      ',                                       // 8: indent (6 spaces)
    '1. AMY MAULANY SETYAMAN',                      // 9: name1
    ' : Selaku Vice President Project Management Office PT Prima Layanan Nasional Enjiniring, yang dalam hal ini bertindak atas nama PT Prima Layanan Nasional Enjiniring berkedudukan di Jl. Aipda KS. Tubun I No. 2, Kelurahan Kota Bambu, Kecamatan Palmerah, Jakarta Barat yang selanjutnya disebut ',  // 10: desc1
    'PIHAK PERTAMA',                                 // 11: label1
    '.\n\n',                                         // 12: end1
    
    // Party 2 - with 6 spaces indent before number
    '      ',                                       // 13: indent (6 spaces)
    '2. NALOANDA',                                   // 14: name2
    ' : Selaku Direktur Utama PT Rura Mas yang berkedudukan di Jl. Ciater Raya No.163, Tangerang Selatan, Banten 15310, berdasarkan Surat Perintah Kerja Nomor 0003.SPK/P.00.00/PLNE01030/2023 tertanggal 09 Maret 2023 dan Amandemen I No.0004.Amd/P.12.00/PLNE01030/2023 tertanggal 21 Juni 2023, selanjutnya dalam Kesepakatan Kerjasama ini disebut ',  // 15: desc2
    'PIHAK KEDUA',                                   // 16: label2
    '.\n\n',                                         // 17: end2
    
    // Reference paragraph
    'Berdasarkan Surat Perintah Kerja Nomor 0003.SPK/P.00.00/PLNE01030/2023 tertanggal 09 Maret 2023 dan Amandemen I No.0004.Amd/P.12.00/PLNE01030/2023 tertanggal 21 Juni 2023 tentang Pekerjaan Pengadaan Aplikasi Profil Tahun 2023 di PT PLN Enjiniring, dengan ini kedua belah pihak bersama-sama menyatakan kebenaran dan persetujuan mengenai hal-hal yang dilakukan, sebagai berikut :',  // 18: ref
    '\n',                                            // 19: 1 newline
    
    // Point 1 - with 6 spaces indent
    '      ',                                       // 20: indent (6 spaces)
    '1. PIHAK KEDUA',                               // 21: label3
    ' telah menyelesaikan retensi masa pemeliharaan selama 12 (dua belas ) bulan dari Berita Acara Go-Live Pekerjaan Pengadaan Aplikasi Profil Tahun 2023 di PT PLN Enjiniring dalam keadaan baik dan terlaksana sebagaimana mestinya sesuai dengan Surat Perintah Kerja.',  // 22: desc3
    '\n',                                            // 23: 1 newline
    
    // Point 2 - with 6 spaces indent
    '      ',                                       // 24: indent (6 spaces)
    '2. PIHAK KEDUA',                               // 25: label4
    ' akan menerima pembayaran sesuai dengan Poin 2 (dua) Nilai Pekerjaan dan Poin 3 (tiga) Syarat Pembayaran dalam Surat Perintah Kerja dan berhak menerima pembayaran Tahap II untuk pembayaran retensi masa pemeliharaan selama 12 (dua belas ) bulan dari Berita Acara Go-Live sebesar 5% (lima persen) dari Nilai Pekerjaan dari ',  // 26: desc4
    'PIHAK PERTAMA',                                 // 27: label4b
    '.\n',                                            // 28: end4
    
    // Point 3 - with 6 spaces indent
    '      ',                                       // 29: indent (6 spaces)
    '3. PIHAK PERTAMA',                             // 30: label5
    ' telah menerima dengan baik dan lengkap hasil pelaksanaan pekerjaan serta dapat dipergunakan sebagaimana mestinya terhitung sejak Berita Acara ini ditandatangani.',  // 31: desc5
    '\n\n',                                          // 32: 2 newlines
    
    // Closing paragraph
    'Berita Acara Serah Terima ini dibuat dalam rangkap 3 (tiga) rangkap, 2 (dua) diantaranya ditandatangani diatas meterai tempel secukupnya pada rangkap pertama dan kedua yang mempunyai kekuatan hukum yang sama, 1 (satu) rangkap untuk ',  // 33: closing
    'PIHAK PERTAMA',                                 // 34: label6
    ' dan 1 (satu) rangkap untuk ',                  // 35: and
    'PIHAK KEDUA',                                   // 36: label7
    ', dan 1 (satu) rangkap lainnya untuk arsip PT PRIMA LAYANAN NASIONAL ENJINIRING.\n',  // 37: endclosing
    
    // Final line
    'Demikian Berita Acara Serah Terima ini dibuat dan ditandatangani di Jakarta oleh PIHAK',  // 38: demikian1
    '\n',                                            // 39: newline
    'PERTAMA dan PIHAK KEDUA.',                      // 40: demikian2
    '\n\n\n',                                        // 41: 3 newlines
    
    // Signatories - using tab stops for left/right layout
    // Left side: PIHAK PERTAMA
    'PIHAK PERTAMA',                                 // 42: sigLeft1
    '\n',                                            // 43: newline
    'PT PRIMA LAYANAN NASIONAL ENJINIRING',          // 44: sigLeft2
    '\n\n',                                          // 45: 2 newlines
    'AMY MAULANY SETYAMAN',                          // 46: sigLeft3
    '\n',                                            // 47: newline
    'VP Project Management Office',                  // 48: sigLeft4
    '\n\n\n\n\n',                                   // 49: 5 newlines (space for stamp/signature)
    
    // Right side: PIHAK KEDUA (using spaces to position)
    '                                 PIHAK KEDUA',  // 50: sigRight1 (with spaces)
    '\n',                                            // 51: newline
    '                                 PT RURA MAS',   // 52: sigRight2 (with spaces)
    '\n\n',                                          // 53: 2 newlines
    '                                 NALOANDA',     // 54: sigRight3 (with spaces)
    '\n',                                            // 55: newline
    '                                 Direktur Utama',  // 56: sigRight4 (with spaces)
    '\n\n\n\n\n\n\n',                               // 57: 7 newlines
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
  const name1 = sections[9];
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
  const label1 = sections[11];
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
  const name2 = sections[14];
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
  const label2 = sections[16];
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
  const ref = sections[18];
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
  const label3 = sections[21];
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
  const label4 = sections[25];
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
  const label4b = sections[27];
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
  const label5 = sections[30];
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
  const closing = sections[33];
  formatRequests.push({
    updateParagraphStyle: {
      range: { startIndex: closing.start, endIndex: sections[37].end },
      paragraphStyle: {
        alignment: 'JUSTIFIED',
        lineSpacing: 150,
      },
      fields: 'alignment,lineSpacing',
    },
  });
  
  // 15. PIHAK PERTAMA (fourth): Bold
  const label6 = sections[34];
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
  const label7 = sections[36];
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
  
  // 17. Signatories section - Left side
  const sigLeft1 = sections[42]; // 'PIHAK PERTAMA'
  formatRequests.push({
    updateTextStyle: {
      range: { startIndex: sigLeft1.start, endIndex: sigLeft1.end },
      textStyle: {
        bold: true,
        weightedFontFamily: { fontFamily: 'Arial' },
      },
      fields: 'bold,weightedFontFamily',
    },
  });
  
  const sigLeft2 = sections[44]; // 'PT PRIMA LAYANAN NASIONAL ENJINIRING'
  formatRequests.push({
    updateTextStyle: {
      range: { startIndex: sigLeft2.start, endIndex: sigLeft2.end },
      textStyle: {
        weightedFontFamily: { fontFamily: 'Arial' },
      },
      fields: 'weightedFontFamily',
    },
  });
  
  const sigLeft3 = sections[46]; // 'AMY MAULANY SETYAMAN'
  formatRequests.push({
    updateTextStyle: {
      range: { startIndex: sigLeft3.start, endIndex: sigLeft3.end },
      textStyle: {
        bold: true,
        weightedFontFamily: { fontFamily: 'Arial' },
      },
      fields: 'bold,weightedFontFamily',
    },
  });
  
  const sigLeft4 = sections[48]; // 'VP Project Management Office'
  formatRequests.push({
    updateTextStyle: {
      range: { startIndex: sigLeft4.start, endIndex: sigLeft4.end },
      textStyle: {
        weightedFontFamily: { fontFamily: 'Arial' },
      },
      fields: 'weightedFontFamily',
    },
  });
  
  // 18. Right side labels (already positioned with spaces)
  const sigRight1 = sections[50]; // 'PIHAK KEDUA'
  formatRequests.push({
    updateTextStyle: {
      range: { startIndex: sigRight1.start, endIndex: sigRight1.end },
      textStyle: {
        bold: true,
        weightedFontFamily: { fontFamily: 'Arial' },
      },
      fields: 'bold,weightedFontFamily',
    },
  });
  
  const sigRight3 = sections[54]; // 'NALOANDA'
  formatRequests.push({
    updateTextStyle: {
      range: { startIndex: sigRight3.start, endIndex: sigRight3.end },
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
  
  console.log('\n✅ Document created with exact formatting!');
  console.log('\nDocument ID:', docId);
  console.log('Open: https://docs.google.com/document/d/' + docId + '/edit');
}

createDocumentExact().catch(console.error);
