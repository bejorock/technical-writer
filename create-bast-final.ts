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

async function createDocumentFinal() {
  console.log('Creating document via Drive API...');
  
  // Create document in Shared Drive
  const file = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: 'BAST Profil Tahap II (Final)',
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
  
  // Define all the text content with placeholders for indented items
  const texts = [
    'BERITA ACARA SERAH TERIMA',                    // 0: title
    '\n',                                            // 1: newline
    'Nomor : 20.002.BAST/PLNE/VI/2024',             // 2: nomor
    '\n\n',                                          // 3: 2 newlines
    'PEKERJAAN PENGADAAN APLIKASI PROFIL TAHUN 2023 DI PT PLN ENJINIRING',  // 4: project
    '\n\n',                                          // 5: 2 newlines
    'Pada hari ini Kamis, tanggal Dua Puluh, bulan Juni, tahun Dua Ribu Dua Puluh Empat (20-06-2024), kami yang bertanda tangan dibawah ini :',  // 6: intro
    '\n\n',                                          // 7: 2 newlines
    '1.',                                            // 8: num1 (no space for indent)
    ' ',                                             // 9: space
    'AMY MAULANY SETYAMAN',                          // 10: name1
    ' : Selaku Vice President Project Management Office PT Prima Layanan Nasional Enjiniring, yang dalam hal ini bertindak atas nama PT Prima Layanan Nasional Enjiniring berkedudukan di Jl. Aipda KS. Tubun I No. 2, Kelurahan Kota Bambu, Kecamatan Palmerah, Jakarta Barat yang selanjutnya disebut ',  // 11: desc1
    'PIHAK PERTAMA',                                 // 12: label1
    '.\n\n',                                         // 13: end1
    '2.',                                            // 14: num2
    ' ',                                             // 15: space
    'NALOANDA',                                      // 16: name2
    ' : Selaku Direktur Utama PT Rura Mas yang berkedudukan di Jl. Ciater Raya No.163, Tangerang Selatan, Banten 15310, berdasarkan Surat Perintah Kerja Nomor 0003.SPK/P.00.00/PLNE01030/2023 tertanggal 09 Maret 2023 dan Amandemen I No.0004.Amd/P.12.00/PLNE01030/2023 tertanggal 21 Juni 2023, selanjutnya dalam Kesepakatan Kerjasama ini disebut ',  // 17: desc2
    'PIHAK KEDUA',                                   // 18: label2
    '.\n\n',                                         // 19: end2
    'Berdasarkan Surat Perintah Kerja Nomor 0003.SPK/P.00.00/PLNE01030/2023 tertanggal 09 Maret 2023 dan Amandemen I No.0004.Amd/P.12.00/PLNE01030/2023 tertanggal 21 Juni 2023 tentang Pekerjaan Pengadaan Aplikasi Profil Tahun 2023 di PT PLN Enjiniring, dengan ini kedua belah pihak bersama-sama menyatakan kebenaran dan persetujuan mengenai hal-hal yang dilakukan, sebagai berikut :',  // 20: ref
    '\n\n',                                          // 21: 2 newlines
    '1.',                                            // 22: num3
    ' ',                                             // 23: space
    'PIHAK KEDUA',                                   // 24: label3
    ' telah menyelesaikan retensi masa pemeliharaan selama 12 (dua belas ) bulan dari Berita Acara Go-Live Pekerjaan Pengadaan Aplikasi Profil Tahun 2023 di PT PLN Enjiniring dalam keadaan baik dan terlaksana sebagaimana mestinya sesuai dengan Surat Perintah Kerja.',  // 25: desc3
    '\n\n',                                          // 26: 2 newlines
    '2.',                                            // 27: num4
    ' ',                                             // 28: space
    'PIHAK KEDUA',                                   // 29: label4
    ' akan menerima pembayaran sesuai dengan Poin 2 (dua) Nilai Pekerjaan dan Poin 3 (tiga) Syarat Pembayaran dalam Surat Perintah Kerja dan berhak menerima pembayaran Tahap II untuk pembayaran retensi masa pemeliharaan selama 12 (dua belas ) bulan dari Berita Acara Go-Live sebesar 5% (lima persen) dari Nilai Pekerjaan dari ',  // 30: desc4
    'PIHAK PERTAMA',                                 // 31: label4b
    '.\n\n',                                         // 32: end4
    '3.',                                            // 33: num5
    ' ',                                             // 34: space
    'PIHAK PERTAMA',                                 // 35: label5
    ' telah menerima dengan baik dan lengkap hasil pelaksanaan pekerjaan serta dapat dipergunakan sebagaimana mestinya terhitung sejak Berita Acara ini ditandatangani.',  // 36: desc5
    '\n\n\n',                                        // 37: 3 newlines
    'Berita Acara Serah Terima ini dibuat dalam rangkap 3 (tiga) rangkap, 2 (dua) diantaranya ditandatangani diatas meterai tempel secukupnya pada rangkap pertama dan kedua yang mempunyai kekuatan hukum yang sama, 1 (satu) rangkap untuk ',  // 38: closing
    'PIHAK PERTAMA',                                 // 39: label6
    ' dan 1 (satu) rangkap untuk ',                  // 40: and
    'PIHAK KEDUA',                                   // 41: label7
    ', dan 1 (satu) rangkap lainnya untuk arsip PT PRIMA LAYANAN NASIONAL ENJINIRING.',  // 42: endclosing
    '\n\n\n\n',                                      // 43: 4 newlines (space before signatories)
    
    // Signatories section
    'Mengetahui,',                                   // 44: mengetahui
    '\n\n\n',                                        // 45: 3 newlines (space for signature)
    'PRIMA LAYANAN NASIONAL ENJINIRING',             // 46: company1
    '\n\n',                                          // 47: 2 newlines
    'AMY MAULANY SETYAMAN',                          // 48: signatory1 name
    '\n',                                            // 49: newline
    'Vice President Project Management Office',      // 50: title1
    '\n\n\n\n\n\n',                                 // 51: 6 newlines (space for stamp/signature)
    
    // Right side signatories
    'PT PLN ENJINIRING',                             // 52: company2
    '\n\n',                                          // 53: 2 newlines
    'NALOANDA',                                      // 54: signatory2 name
    '\n',                                            // 55: newline
    'Direktur Utama PT Rura Mas',                    // 56: title2
    '\n\n\n\n\n\n\n\n',                             // 57: 8 newlines (space before stamp)
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
  
  // Helper function to add bullet indent
  const addBulletIndent = (numIdx: number, spaceIdx: number) => {
    // Number + space + text gets indented
    formatRequests.push({
      updateParagraphStyle: {
        range: { startIndex: sections[numIdx].start, endIndex: sections[numIdx + 2].end - 1 },
        paragraphStyle: {
          indentStart: { magnitude: 36, unit: 'PT' },  // 0.5 inch indent
        },
        fields: 'indentStart',
      },
    });
  };
  
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
  
  // 5. Party 1: Add indent
  addBulletIndent(8, 9);  // num1 + space + name1
  
  // 6. Party 1 name: Bold
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
  
  // 7. PIHAK PERTAMA (first): Bold
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
  
  // 8. Party 2: Add indent
  addBulletIndent(14, 15);  // num2 + space + name2
  
  // 9. Party 2 name: Bold
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
  
  // 10. PIHAK KEDUA (second): Bold
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
  
  // 11. Reference paragraph: Justified, 1.5 line spacing
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
  
  // 12. Point 1: Add indent
  addBulletIndent(22, 23);  // num3 + space
  
  // 13. PIHAK KEDUA (third): Bold
  const label3 = sections[24];
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
  
  // 14. Point 2: Add indent
  addBulletIndent(27, 28);  // num4 + space
  
  // 15. PIHAK KEDUA (fourth): Bold
  const label4 = sections[29];
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
  
  // 16. PIHAK PERTAMA (second): Bold
  const label4b = sections[31];
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
  
  // 17. Point 3: Add indent
  addBulletIndent(33, 34);  // num5 + space
  
  // 18. PIHAK PERTAMA (third): Bold
  const label5 = sections[35];
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
  
  // 19. Closing paragraph: Justified, 1.5 line spacing
  const closing = sections[38];
  formatRequests.push({
    updateParagraphStyle: {
      range: { startIndex: closing.start, endIndex: sections[42].end },
      paragraphStyle: {
        alignment: 'JUSTIFIED',
        lineSpacing: 150,
      },
      fields: 'alignment,lineSpacing',
    },
  });
  
  // 20. PIHAK PERTAMA (fourth): Bold
  const label6 = sections[39];
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
  
  // 21. PIHAK KEDUA (fifth): Bold
  const label7 = sections[41];
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
  
  // 22. Signatories section
  // "Mengetahui," - centered
  const mengetahui = sections[44];
  formatRequests.push({
    updateParagraphStyle: {
      range: { startIndex: mengetahui.start, endIndex: mengetahui.end },
      paragraphStyle: {
        alignment: 'CENTER',
      },
      fields: 'alignment',
    },
  });
  
  // "PRIMA LAYANAN NASIONAL ENJINIRING" - centered, bold
  const company1 = sections[46];
  formatRequests.push({
    updateTextStyle: {
      range: { startIndex: company1.start, endIndex: company1.end },
      textStyle: {
        bold: true,
        weightedFontFamily: { fontFamily: 'Arial' },
      },
      fields: 'bold,weightedFontFamily',
    },
  });
  
  // Signatory 1 name: centered
  const signatory1 = sections[48];
  formatRequests.push({
    updateParagraphStyle: {
      range: { startIndex: signatory1.start, endIndex: signatory1.end },
      paragraphStyle: {
        alignment: 'CENTER',
      },
      fields: 'alignment',
    },
  });
  
  // Title 1: centered
  const title1 = sections[50];
  formatRequests.push({
    updateParagraphStyle: {
      range: { startIndex: title1.start, endIndex: title1.end },
      paragraphStyle: {
        alignment: 'CENTER',
      },
      fields: 'alignment',
    },
  });
  
  // "PT PLN ENJINIRING" - centered, bold
  const company2 = sections[52];
  formatRequests.push({
    updateTextStyle: {
      range: { startIndex: company2.start, endIndex: company2.end },
      textStyle: {
        bold: true,
        weightedFontFamily: { fontFamily: 'Arial' },
      },
      fields: 'bold,weightedFontFamily',
    },
  });
  
  // Signatory 2 name: centered
  const signatory2 = sections[54];
  formatRequests.push({
    updateParagraphStyle: {
      range: { startIndex: signatory2.start, endIndex: signatory2.end },
      paragraphStyle: {
        alignment: 'CENTER',
      },
      fields: 'alignment',
    },
  });
  
  // Title 2: centered
  const title2 = sections[56];
  formatRequests.push({
    updateParagraphStyle: {
      range: { startIndex: title2.start, endIndex: title2.end },
      paragraphStyle: {
        alignment: 'CENTER',
      },
      fields: 'alignment',
    },
  });
  
  // Execute formatting
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: formatRequests,
    },
  });
  
  console.log('\n✅ Document created with final formatting!');
  console.log('\nDocument ID:', docId);
  console.log('Open: https://docs.google.com/document/d/' + docId + '/edit');
}

createDocumentFinal().catch(console.error);
