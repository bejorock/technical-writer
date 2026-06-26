import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  TabStopType,
  TabStopPosition,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  VerticalAlign,
  convertInchesToTwip,
} from 'docx';
import { writeFileSync } from 'fs';

// Create document
const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          right: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1),
        },
      },
    },
    children: [
      // Title
      new Paragraph({
        children: [
          new TextRun({
            text: 'BERITA ACARA SERAH TERIMA',
            bold: true,
            underline: { type: 'single' },
            size: 28, // 14pt
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      
      // Nomor
      new Paragraph({
        children: [
          new TextRun({
            text: 'Nomor : 20.002.BAST/PLNE/VI/2024',
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      
      // Project title
      new Paragraph({
        children: [
          new TextRun({
            text: 'PEKERJAAN PENGADAAN APLIKASI PROFIL TAHUN 2023 DI PT PLN ENJINIRING',
            bold: true,
            size: 24, // 12pt
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      
      // Intro paragraph
      new Paragraph({
        children: [
          new TextRun({
            text: 'Pada hari ini Kamis, tanggal Dua Puluh, bulan Juni, tahun Dua Ribu Dua Puluh Empat (20-06-2024), kami yang bertanda tangan dibawah ini :',
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200, line: 360 }, // 1.5 line spacing
      }),
      
      // Party 1 - Number
      new Paragraph({
        children: [
          new TextRun({
            text: '1.',
            font: 'Arial',
          }),
          new TextRun({
            text: '\t',
          }),
          new TextRun({
            text: 'AMY MAULANY SETYAMAN',
            bold: true,
            font: 'Arial',
          }),
          new TextRun({
            text: ' : Selaku Vice President Project Management Office PT Prima Layanan Nasional Enjiniring, yang dalam hal ini bertindak atas nama PT Prima Layanan Nasional Enjiniring berkedudukan di Jl. Aipda KS. Tubun I No. 2, Kelurahan Kota Bambu, Kecamatan Palmerah, Jakarta Barat yang selanjutnya disebut ',
            font: 'Arial',
          }),
          new TextRun({
            text: 'PIHAK PERTAMA',
            bold: true,
            font: 'Arial',
          }),
          new TextRun({
            text: '.',
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200, line: 360 },
        indent: { firstLine: 0 },
        tabStops: [
          {
            type: TabStopType.LEFT,
            position: convertInchesToTwip(0.3),
          },
        ],
      }),
      
      // Party 2
      new Paragraph({
        children: [
          new TextRun({
            text: '2.',
            font: 'Arial',
          }),
          new TextRun({
            text: '\t',
          }),
          new TextRun({
            text: 'NALOANDA',
            bold: true,
            font: 'Arial',
          }),
          new TextRun({
            text: ' : Selaku Direktur Utama PT Rura Mas yang berkedudukan di Jl. Ciater Raya No.163, Tangerang Selatan, Banten 15310, berdasarkan Surat Perintah Kerja Nomor 0003.SPK/P.00.00/PLNE01030/2023 tertanggal 09 Maret 2023 dan Amandemen I No.0004.Amd/P.12.00/PLNE01030/2023 tertanggal 21 Juni 2023, selanjutnya dalam Kesepakatan Kerjasama ini disebut ',
            font: 'Arial',
          }),
          new TextRun({
            text: 'PIHAK KEDUA',
            bold: true,
            font: 'Arial',
          }),
          new TextRun({
            text: '.',
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 400, line: 360 },
        tabStops: [
          {
            type: TabStopType.LEFT,
            position: convertInchesToTwip(0.3),
          },
        ],
      }),
      
      // Reference paragraph
      new Paragraph({
        children: [
          new TextRun({
            text: 'Berdasarkan Surat Perintah Kerja Nomor 0003.SPK/P.00.00/PLNE01030/2023 tertanggal 09 Maret 2023 dan Amandemen I No.0004.Amd/P.12.00/PLNE01030/2023 tertanggal 21 Juni 2023 tentang Pekerjaan Pengadaan Aplikasi Profil Tahun 2023 di PT PLN Enjiniring, dengan ini kedua belah pihak bersama-sama menyatakan kebenaran dan persetujuan mengenai hal-hal yang dilakukan, sebagai berikut :',
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200, line: 360 },
      }),
      
      // Point 1 - no indent (matches PDF)
      new Paragraph({
        children: [
          new TextRun({
            text: '1. PIHAK KEDUA',
            bold: true,
            font: 'Arial',
          }),
          new TextRun({
            text: ' telah menyelesaikan retensi masa pemeliharaan selama 12 (dua belas ) bulan dari Berita Acara Go-Live Pekerjaan Pengadaan Aplikasi Profil Tahun 2023 di PT PLN Enjiniring dalam keadaan baik dan terlaksana sebagaimana mestinya sesuai dengan Surat Perintah Kerja.',
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200, line: 360 },
      }),
      
      // Point 2 - with indent
      new Paragraph({
        children: [
          new TextRun({
            text: '2.',
            font: 'Arial',
          }),
          new TextRun({
            text: '\t',
          }),
          new TextRun({
            text: 'PIHAK KEDUA',
            bold: true,
            font: 'Arial',
          }),
          new TextRun({
            text: ' akan menerima pembayaran sesuai dengan Poin 2 (dua) Nilai Pekerjaan dan Poin 3 (tiga) Syarat Pembayaran dalam Surat Perintah Kerja dan berhak menerima pembayaran Tahap II untuk pembayaran retensi masa pemeliharaan selama 12 (dua belas ) bulan dari Berita Acara Go-Live sebesar 5% (lima persen) dari Nilai Pekerjaan dari ',
            font: 'Arial',
          }),
          new TextRun({
            text: 'PIHAK PERTAMA',
            bold: true,
            font: 'Arial',
          }),
          new TextRun({
            text: '.',
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200, line: 360 },
        tabStops: [
          {
            type: TabStopType.LEFT,
            position: convertInchesToTwip(0.3),
          },
        ],
      }),
      
      // Point 3 - with indent
      new Paragraph({
        children: [
          new TextRun({
            text: '3.',
            font: 'Arial',
          }),
          new TextRun({
            text: '\t',
          }),
          new TextRun({
            text: 'PIHAK PERTAMA',
            bold: true,
            font: 'Arial',
          }),
          new TextRun({
            text: ' telah menerima dengan baik dan lengkap hasil pelaksanaan pekerjaan serta dapat dipergunakan sebagaimana mestinya terhitung sejak Berita Acara ini ditandatangani.',
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 400, line: 360 },
        tabStops: [
          {
            type: TabStopType.LEFT,
            position: convertInchesToTwip(0.3),
          },
        ],
      }),
      
      // Closing paragraph
      new Paragraph({
        children: [
          new TextRun({
            text: 'Berita Acara Serah Terima ini dibuat dalam rangkap 3 (tiga) rangkap, 2 (dua) diantaranya ditandatangani diatas meterai tempel secukupnya pada rangkap pertama dan kedua yang mempunyai kekuatan hukum yang sama, 1 (satu) rangkap untuk ',
            font: 'Arial',
          }),
          new TextRun({
            text: 'PIHAK PERTAMA',
            bold: true,
            font: 'Arial',
          }),
          new TextRun({
            text: ' dan 1 (satu) rangkap untuk ',
            font: 'Arial',
          }),
          new TextRun({
            text: 'PIHAK KEDUA',
            bold: true,
            font: 'Arial',
          }),
          new TextRun({
            text: ', dan 1 (satu) rangkap lainnya untuk arsip PT PRIMA LAYANAN NASIONAL ENJINIRING.',
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200, line: 360 },
      }),
      
      // Final line
      new Paragraph({
        children: [
          new TextRun({
            text: 'Demikian Berita Acara Serah Terima ini dibuat dan ditandatangani di Jakarta oleh PIHAK PERTAMA dan PIHAK KEDUA.',
            font: 'Arial',
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 600, line: 360 },
      }),
      
      // Spacer
      new Paragraph({
        children: [],
        spacing: { after: 600 },
      }),
      
      // Signatories table
      new Table({
        rows: [
          // Headers row
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'PIHAK PERTAMA',
                        bold: true,
                        font: 'Arial',
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                width: { size: 50, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'PIHAK KEDUA',
                        bold: true,
                        font: 'Arial',
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                width: { size: 50, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
              }),
            ],
          }),
          // Company names row
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'PT PRIMA LAYANAN NASIONAL ENJINIRING',
                        font: 'Arial',
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                width: { size: 50, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'PT RURA MAS',
                        font: 'Arial',
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                width: { size: 50, type: WidthType.PERCENTAGE },
              }),
            ],
          }),
          // Empty row for stamps
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [],
                    spacing: { after: 400 },
                  }),
                ],
                width: { size: 50, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [],
                    spacing: { after: 400 },
                  }),
                ],
                width: { size: 50, type: WidthType.PERCENTAGE },
              }),
            ],
          }),
          // Names row
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'AMY MAULANY SETYAMAN',
                        bold: true,
                        font: 'Arial',
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                width: { size: 50, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'NALOANDA',
                        bold: true,
                        font: 'Arial',
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                width: { size: 50, type: WidthType.PERCENTAGE },
              }),
            ],
          }),
          // Titles row
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'VP Project Management Office',
                        font: 'Arial',
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                width: { size: 50, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Direktur Utama',
                        font: 'Arial',
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                width: { size: 50, type: WidthType.PERCENTAGE },
              }),
            ],
          }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
    ],
  }],
});

// Generate document
const buffer = await Packer.toBuffer(doc);
writeFileSync('./output/BAST Profil Tahap II.docx', buffer);

console.log('✅ Document created: output/BAST Profil Tahap II.docx');
console.log('\nOpen with LibreOffice to view the document.');
