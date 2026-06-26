import { readFileSync } from 'fs';
import { DocsClient } from './lib/clients/docs';

async function createBASTDocument() {
  const config = {
    serviceAccountKeyPath: './erica-dev-486223-91b6209d894e.json',
    targetFolderId: '0AHAPdW0qB70bUk9PVA',
    useSharedDrive: true,
  };
  
  const client = new DocsClient(config);
  
  console.log('Creating BAST document with proper formatting...');
  const doc = await client.createDocument('BAST Profil Tahap II', config.targetFolderId);
  
  const getEnd = async () => await client.getEndIndex(doc.documentId);
  let idx: number;
  let startIdx: number;
  
  // ============================================
  // TITLE: BERITA ACARA SERAH TERIMA
  // Bold, underlined, centered, larger font
  // ============================================
  console.log('1. Adding title...');
  await client.appendText(doc.documentId, 'BERITA ACARA SERAH TERIMA\n');
  idx = await getEnd();
  startIdx = idx - 24;
  await client.formatText(doc.documentId, startIdx, idx, { 
    bold: true, 
    underline: true,
    fontSize: 14
  });
  await client.setParagraphAlignment(doc.documentId, startIdx, idx, 'CENTER');
  
  // ============================================
  // NOMOR
  // Centered, normal font
  // ============================================
  console.log('2. Adding nomor...');
  await client.appendText(doc.documentId, 'Nomor : 20.002.BAST/PLNE/VI/2024\n');
  idx = await getEnd();
  startIdx = idx - 39;
  await client.setParagraphAlignment(doc.documentId, startIdx, idx, 'CENTER');
  
  // Blank lines
  await client.appendText(doc.documentId, '\n\n');
  
  // ============================================
  // PROJECT TITLE
  // Bold, centered
  // ============================================
  console.log('3. Adding project title...');
  const projectTitle = 'PEKERJAAN PENGADAAN APLIKASI PROFIL TAHUN 2023 DI PT PLN ENJINIRING';
  await client.appendText(doc.documentId, projectTitle + '\n');
  idx = await getEnd();
  startIdx = idx - projectTitle.length - 1;
  await client.formatText(doc.documentId, startIdx, idx, { bold: true });
  await client.setParagraphAlignment(doc.documentId, startIdx, idx, 'CENTER');
  
  // Blank lines
  await client.appendText(doc.documentId, '\n\n');
  
  // ============================================
  // INTRODUCTION PARAGRAPH
  // Normal text, justified, 1.5 line spacing
  // ============================================
  console.log('4. Adding introduction...');
  const intro = 'Pada hari ini Kamis, tanggal Dua Puluh, bulan Juni, tahun Dua Ribu Dua Puluh Empat (20-06-2024), kami yang bertanda tangan dibawah ini :';
  await client.appendText(doc.documentId, intro + '\n\n');
  idx = await getEnd();
  startIdx = idx - intro.length - 2;
  await client.setLineSpacing(doc.documentId, startIdx, idx, 150);
  await client.setParagraphSpacing(doc.documentId, startIdx, idx, 0, 12);
  
  // ============================================
  // PARTY 1
  // Numbered, with bold name and bold PIHAK PERTAMA
  // ============================================
  console.log('5. Adding party 1...');
  await client.appendText(doc.documentId, '1. ');
  idx = await getEnd();
  
  // Add bold name
  const party1Name = 'AMY MAULANY SETYAMAN';
  await client.appendText(doc.documentId, party1Name);
  idx = await getEnd();
  await client.formatText(doc.documentId, idx - party1Name.length, idx, { bold: true });
  
  // Add description
  const party1Desc = ' : Selaku Vice President Project Management Office PT Prima Layanan Nasional Enjiniring, yang dalam hal ini bertindak atas nama PT Prima Layanan Nasional Enjiniring berkedudukan di Jl. Aipda KS. Tubun I No. 2, Kelurahan Kota Bambu, Kecamatan Palmerah, Jakarta Barat yang selanjutnya disebut ';
  await client.appendText(doc.documentId, party1Desc);
  
  // Add bold PIHAK PERTAMA
  const pihakPertama = 'PIHAK PERTAMA';
  await client.appendText(doc.documentId, pihakPertama + '.\n\n');
  idx = await getEnd();
  await client.formatText(doc.documentId, idx - pihakPertama.length - 1, idx, { bold: true });
  
  // ============================================
  // PARTY 2
  // Numbered, with bold name and bold PIHAK KEDUA
  // ============================================
  console.log('6. Adding party 2...');
  await client.appendText(doc.documentId, '2. ');
  idx = await getEnd();
  
  // Add bold name
  const party2Name = 'NALOANDA';
  await client.appendText(doc.documentId, party2Name);
  idx = await getEnd();
  await client.formatText(doc.documentId, idx - party2Name.length, idx, { bold: true });
  
  // Add description
  const party2Desc = ' : Selaku Direktur Utama PT Rura Mas yang berkedudukan di Jl. Ciater Raya No.163, Tangerang Selatan, Banten 15310, berdasarkan Surat Perintah Kerja Nomor 0003.SPK/P.00.00/PLNE01030/2023 tertanggal 09 Maret 2023 dan Amandemen I No.0004.Amd/P.12.00/PLNE01030/2023 tertanggal 21 Juni 2023, selanjutnya dalam Kesepakatan Kerjasama ini disebut ';
  await client.appendText(doc.documentId, party2Desc);
  
  // Add bold PIHAK KEDUA
  const pihakKedua = 'PIHAK KEDUA';
  await client.appendText(doc.documentId, pihakKedua + '.\n\n');
  idx = await getEnd();
  await client.formatText(doc.documentId, idx - pihakKedua.length - 1, idx, { bold: true });
  
  // ============================================
  // REFERENCE PARAGRAPH
  // Normal text, justified
  // ============================================
  console.log('7. Adding reference...');
  const ref = 'Berdasarkan Surat Perintah Kerja Nomor 0003.SPK/P.00.00/PLNE01030/2023 tertanggal 09 Maret 2023 dan Amandemen I No.0004.Amd/P.12.00/PLNE01030/2023 tertanggal 21 Juni 2023 tentang Pekerjaan Pengadaan Aplikasi Profil Tahun 2023 di PT PLN Enjiniring, dengan ini kedua belah pihak bersama-sama menyatakan kebenaran dan persetujuan mengenai hal-hal yang dilakukan, sebagai berikut :';
  await client.appendText(doc.documentId, ref + '\n\n');
  idx = await getEnd();
  startIdx = idx - ref.length - 2;
  await client.setLineSpacing(doc.documentId, startIdx, idx, 150);
  
  // ============================================
  // POINT 1
  // Numbered, with bold PIHAK KEDUA
  // ============================================
  console.log('8. Adding point 1...');
  await client.appendText(doc.documentId, '1. ');
  idx = await getEnd();
  
  // Add bold PIHAK KEDUA
  await client.appendText(doc.documentId, pihakKedua);
  idx = await getEnd();
  await client.formatText(doc.documentId, idx - pihakKedua.length, idx, { bold: true });
  
  // Add description
  const point1Desc = ' telah menyelesaikan retensi masa pemeliharaan selama 12 (dua belas ) bulan dari Berita Acara Go-Live Pekerjaan Pengadaan Aplikasi Profil Tahun 2023 di PT PLN Enjiniring dalam keadaan baik dan terlaksana sebagaimana mestinya sesuai dengan Surat Perintah Kerja.';
  await client.appendText(doc.documentId, point1Desc + '\n\n');
  
  // ============================================
  // POINT 2
  // Numbered, with bold PIHAK KEDUA and PIHAK PERTAMA
  // ============================================
  console.log('9. Adding point 2...');
  await client.appendText(doc.documentId, '2. ');
  idx = await getEnd();
  
  // Add bold PIHAK KEDUA
  await client.appendText(doc.documentId, pihakKedua);
  idx = await getEnd();
  await client.formatText(doc.documentId, idx - pihakKedua.length, idx, { bold: true });
  
  // Add description
  const point2Desc = ' akan menerima pembayaran sesuai dengan Poin 2 (dua) Nilai Pekerjaan dan Poin 3 (tiga) Syarat Pembayaran dalam Surat Perintah Kerja dan berhak menerima pembayaran Tahap II untuk pembayaran retensi masa pemeliharaan selama 12 (dua belas ) bulan dari Berita Acara Go-Live sebesar 5% (lima persen) dari Nilai Pekerjaan dari ';
  await client.appendText(doc.documentId, point2Desc);
  
  // Add bold PIHAK PERTAMA
  await client.appendText(doc.documentId, pihakPertama + '.\n\n');
  idx = await getEnd();
  await client.formatText(doc.documentId, idx - pihakPertama.length - 1, idx, { bold: true });
  
  // ============================================
  // POINT 3
  // Numbered, with bold PIHAK PERTAMA
  // ============================================
  console.log('10. Adding point 3...');
  await client.appendText(doc.documentId, '3. ');
  idx = await getEnd();
  
  // Add bold PIHAK PERTAMA
  await client.appendText(doc.documentId, pihakPertama);
  idx = await getEnd();
  await client.formatText(doc.documentId, idx - pihakPertama.length, idx, { bold: true });
  
  // Add description
  const point3Desc = ' telah menerima dengan baik dan lengkap hasil pelaksanaan pekerjaan serta dapat dipergunakan sebagaimana mestinya terhitung sejak Berita Acara ini ditandatangani.';
  await client.appendText(doc.documentId, point3Desc + '\n\n');
  
  // ============================================
  // CLOSING PARAGRAPH
  // Normal text, justified
  // ============================================
  console.log('11. Adding closing...');
  const closing = 'Berita Acara Serah Terima ini dibuat dalam rangkap 3 (tiga) rangkap, 2 (dua) diantaranya ditandatangani diatas meterai tempel secukupnya pada rangkap pertama dan kedua yang mempunyai kekuatan hukum yang sama, 1 (satu) rangkap untuk ';
  await client.appendText(doc.documentId, closing);
  
  // Add bold PIHAK PERTAMA
  await client.appendText(doc.documentId, pihakPertama);
  idx = await getEnd();
  await client.formatText(doc.documentId, idx - pihakPertama.length, idx, { bold: true });
  
  await client.appendText(doc.documentId, ' dan 1 (satu) rangkap untuk ');
  
  // Add bold PIHAK KEDUA
  await client.appendText(doc.documentId, pihakKedua);
  idx = await getEnd();
  await client.formatText(doc.documentId, idx - pihakKedua.length - 1, idx, { bold: true });
  
  await client.appendText(doc.documentId, ', dan 1 (satu) rangkap lainnya untuk arsip PT PRIMA LAYANAN NASIONAL ENJINIRING.');
  
  // ============================================
  // Apply final formatting to closing paragraph
  // ============================================
  idx = await getEnd();
  await client.setLineSpacing(doc.documentId, idx - 300, idx, 150);
  
  console.log('\n✅ BAST document created with proper formatting!');
  console.log('\nDocument ID:', doc.documentId);
  console.log('Open: https://docs.google.com/document/d/' + doc.documentId + '/edit');
}

createBASTDocument().catch(console.error);
