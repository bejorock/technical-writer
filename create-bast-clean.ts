import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { readFileSync } from 'fs';

const keyPath = './erica-dev-486223-91b6209d894e.json';
const key = JSON.parse(readFileSync(keyPath, 'utf8'));

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

const docs = google.docs({ version: 'v1', auth });
const drive = google.drive({ version: 'v3', auth });

const FOLDER_ID = '0AHAPdW0qB70bUk9PVA';

async function createDocument() {
  console.log('Creating document...');
  
  const file = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: 'BAST Profil Tahap II (Clean)',
      mimeType: 'application/vnd.google-apps.document',
      parents: [FOLDER_ID],
    },
  });
  
  const docId = file.data.id!;
  console.log('Document ID:', docId);
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 1: Insert main text
  const mainText = `BERITA ACARA SERAH TERIMA
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
  
  console.log('Inserting main text...');
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [{
        insertText: {
          location: { index: 1 },
          text: mainText,
        },
      }],
    },
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 2: Apply text formatting
  console.log('Formatting text...');
  
  // Calculate indices for formatting
  const lines = mainText.split('\n');
  let lineStart = 1;
  
  const formatReqs: any[] = [];
  
  // Title (line 0): Bold, Underlined, 14pt, Centered
  formatReqs.push(
    {
      updateTextStyle: {
        range: { startIndex: lineStart, endIndex: lineStart + lines[0].length },
        textStyle: { bold: true, underline: true, fontSize: { magnitude: 14, unit: 'PT' }, weightedFontFamily: { fontFamily: 'Arial' } },
        fields: 'bold,underline,fontSize,weightedFontFamily',
      },
    },
    {
      updateParagraphStyle: {
        range: { startIndex: lineStart, endIndex: lineStart + lines[0].length + 1 },
        paragraphStyle: { alignment: 'CENTER' },
        fields: 'alignment',
      },
    }
  );
  lineStart += lines[0].length + 1;
  
  // Nomor (line 1): Centered
  formatReqs.push({
    updateParagraphStyle: {
      range: { startIndex: lineStart, endIndex: lineStart + lines[1].length + 1 },
      paragraphStyle: { alignment: 'CENTER' },
      fields: 'alignment',
    },
  });
  lineStart += lines[1].length + 1;
  
  // Find and format project title (line 4)
  const projectLine = lines[4];
  formatReqs.push(
    {
      updateTextStyle: {
        range: { startIndex: lineStart, endIndex: lineStart + projectLine.length },
        textStyle: { bold: true, fontSize: { magnitude: 12, unit: 'PT' }, weightedFontFamily: { fontFamily: 'Arial' } },
        fields: 'bold,fontSize,weightedFontFamily',
      },
    },
    {
      updateParagraphStyle: {
        range: { startIndex: lineStart, endIndex: lineStart + projectLine.length + 1 },
        paragraphStyle: { alignment: 'CENTER' },
        fields: 'alignment',
      },
    }
  );
  
  // Apply basic formatting to whole document
  formatReqs.push({
    updateTextStyle: {
      range: { startIndex: 1, endIndex: mainText.length },
      textStyle: { weightedFontFamily: { fontFamily: 'Arial' } },
      fields: 'weightedFontFamily',
    },
  });
  
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: { requests: formatReqs },
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 3: Insert table for signatories
  console.log('Inserting signatories table...');
  
  let doc2 = await docs.documents.get({ documentId: docId });
  let lastIdx = doc2.data.body!.content![doc2.data.body!.content!.length - 1].endIndex! - 1;
  
  // Insert 2-column table for signatories
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [{
        insertTable: {
          rows: 1,
          columns: 2,
          location: { index: lastIdx },
        },
      }],
    },
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Get table and fill content
  let doc3 = await docs.documents.get({ documentId: docId });
  let table = doc3.data.body!.content!.find(e => e.table)?.table;
  
  if (table?.tableRows) {
    console.log('Table created. Filling content...');
    
    const cell0 = table.tableRows[0].tableCells![0];
    const cell1 = table.tableRows[0].tableCells![1];
    const cell0Start = cell0.content![0].startIndex!;
    const cell1Start = cell1.content![0].startIndex!;
    
    // Fill left cell
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: cell0Start },
              text: 'PIHAK PERTAMA\nPT PRIMA LAYANAN NASIONAL ENJINIRING\n\n\nAMY MAULANY SETYAMAN\nVP Project Management Office',
            },
          },
          {
            insertText: {
              location: { index: cell1Start },
              text: 'PIHAK KEDUA\nPT RURA MAS\n\n\nNALOANDA\nDirektur Utama',
            },
          },
        ],
      },
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get updated table
    let doc4 = await docs.documents.get({ documentId: docId });
    let table2 = doc4.data.body!.content!.find(e => e.table)?.table;
    
    if (table2?.tableRows) {
      const cell0_2 = table2.tableRows[0].tableCells![0];
      const cell1_2 = table2.tableRows[0].tableCells![1];
      const cell0Start2 = cell0_2.content![0].startIndex!;
      const cell1Start2 = cell1_2.content![0].startIndex!;
      
      // Format left cell
      await docs.documents.batchUpdate({
        documentId: docId,
        requestBody: {
          requests: [
            // PIHAK PERTAMA - Bold
            {
              updateTextStyle: {
                range: { startIndex: cell0Start2, endIndex: cell0Start2 + 14 },
                textStyle: { bold: true, weightedFontFamily: { fontFamily: 'Arial' } },
                fields: 'bold,weightedFontFamily',
              },
            },
            {
              updateParagraphStyle: {
                range: { startIndex: cell0Start2, endIndex: cell0Start2 + 14 },
                paragraphStyle: { alignment: 'CENTER' },
                fields: 'alignment',
              },
            },
            // PT PRIMA... - Centered
            {
              updateParagraphStyle: {
                range: { startIndex: cell0Start2 + 15, endIndex: cell0Start2 + 55 },
                paragraphStyle: { alignment: 'CENTER' },
                fields: 'alignment',
              },
            },
            // AMY... - Bold
            {
              updateTextStyle: {
                range: { startIndex: cell0Start2 + 57, endIndex: cell0Start2 + 77 },
                textStyle: { bold: true, weightedFontFamily: { fontFamily: 'Arial' } },
                fields: 'bold,weightedFontFamily',
              },
            },
            {
              updateParagraphStyle: {
                range: { startIndex: cell0Start2 + 57, endIndex: cell0Start2 + 77 },
                paragraphStyle: { alignment: 'CENTER' },
                fields: 'alignment',
              },
            },
            // VP... - Centered
            {
              updateParagraphStyle: {
                range: { startIndex: cell0Start2 + 78, endIndex: cell0Start2 + 108 },
                paragraphStyle: { alignment: 'CENTER' },
                fields: 'alignment',
              },
            },
            // PIHAK KEDUA - Bold
            {
              updateTextStyle: {
                range: { startIndex: cell1Start2, endIndex: cell1Start2 + 11 },
                textStyle: { bold: true, weightedFontFamily: { fontFamily: 'Arial' } },
                fields: 'bold,weightedFontFamily',
              },
            },
            {
              updateParagraphStyle: {
                range: { startIndex: cell1Start2, endIndex: cell1Start2 + 11 },
                paragraphStyle: { alignment: 'CENTER' },
                fields: 'alignment',
              },
            },
            // PT RURA... - Centered
            {
              updateParagraphStyle: {
                range: { startIndex: cell1Start2 + 12, endIndex: cell1Start2 + 22 },
                paragraphStyle: { alignment: 'CENTER' },
                fields: 'alignment',
              },
            },
            // NALOANDA - Bold
            {
              updateTextStyle: {
                range: { startIndex: cell1Start2 + 24, endIndex: cell1Start2 + 32 },
                textStyle: { bold: true, weightedFontFamily: { fontFamily: 'Arial' } },
                fields: 'bold,weightedFontFamily',
              },
            },
            {
              updateParagraphStyle: {
                range: { startIndex: cell1Start2 + 24, endIndex: cell1Start2 + 32 },
                paragraphStyle: { alignment: 'CENTER' },
                fields: 'alignment',
              },
            },
            // Direktur... - Centered
            {
              updateParagraphStyle: {
                range: { startIndex: cell1Start2 + 33, endIndex: cell1Start2 + 50 },
                paragraphStyle: { alignment: 'CENTER' },
                fields: 'alignment',
              },
            },
          ],
        },
      });
    }
  }
  
  console.log('\n✅ Document created!');
  console.log('\nDocument ID:', docId);
  console.log('Open: https://docs.google.com/document/d/' + docId + '/edit');
}

createDocument().catch(console.error);
