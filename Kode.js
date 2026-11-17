/**
 * APLIKASI SURAT PENGANTAR & BERITA ACARA PKL - SMKN 1 FYJ CHANNEL
 * Backend Google Apps Script terintegrasi Google Sheets & Google Drive
 */

const CONFIG = {
  SPREADSHEET_ID: '19d_Drmf6XlNXZSW9zfO2E7FUGxNHBkumdHRUs1b4yz8',
  DRIVE_FOLDER_ID: '1Y765r1Qq9m753GHCSNjxCw7D-hEUuHDF',
  SHEET_SISWA: 'siswa_pkl',
  SHEET_PENGATURAN: 'pengaturan',
  SHEET_TEMPLATE: 'template_surat'
};

/**
 * Jalankan fungsi ini sekali dari editor Apps Script untuk inisialisasi awal database Spreadsheet & Drive
 */
function setupDatabase() {
  initDatabaseIfEmpty();
  // Simpan / perbarui aset kop surat dan TTD Kepala Sekolah sesuai permintaan resmi
  saveSettings({
    kopUrl: 'https://drive.google.com/file/d/1QXtnYwIrCc-pihDUoidjkRW5UVWykOn-/view?usp=drive_link',
    ttdUrl: 'https://drive.google.com/file/d/1fVDtzPKSHqga0Qz9YxnOzGaUHg7K4roR/view?usp=drive_link',
    ttdBasahUrl: 'https://drive.google.com/file/d/12KTwz7FbhtOq1SOkN0bJP3HEKxu_qkQS/view?usp=drive_link'
  });
  Logger.log('Inisialisasi Database Spreadsheet Berhasil Selesai!');
  return { success: true, message: 'Database Spreadsheet berhasil diisi data awal dan aset kop/ttd.' };
}

/**
 * Web App Entry Point: Menampilkan antarmuka HTML
 */
function doGet(e) {
  // Jika ada parameter api, tangani sebagai JSON endpoint
  if (e && e.parameter && e.parameter.api) {
    return handleApiGet(e.parameter);
  }

  const template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Aplikasi Surat PKL - SMKN 1 FYJ Channel')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Endpoint POST untuk panggilan API eksternal jika diperlukan
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
    const action = payload.action || (e && e.parameter ? e.parameter.action : '');
    let result = {};

    switch (action) {
      case 'getInitialData':
        result = getInitialData();
        break;
      case 'saveStudent':
        result = saveStudent(payload.record);
        break;
      case 'deleteStudent':
        result = deleteStudent(payload.id);
        break;
      case 'importStudents':
        result = importStudents(payload.records, payload.mode);
        break;
      case 'clearAllStudents':
        result = clearAllStudents();
        break;
      case 'saveSettings':
        result = saveSettings(payload.settings);
        break;
      case 'saveTemplate':
        result = saveTemplate(payload.template);
        break;
      case 'deleteTemplate':
        result = deleteTemplate(payload.id);
        break;
      case 'saveFileToDrive':
        result = saveFileToDrive(payload);
        break;
      default:
        result = { success: false, message: 'Action tidak dikenal: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper untuk menyertakan file HTML parsial dalam Apps Script
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Mendapatkan objek Spreadsheet
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

/**
 * Mendapatkan folder Google Drive penyimpanan file
 */
function getDriveFolder() {
  return DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
}

/**
 * Inisialisasi Database Spreadsheet: Membuat sheet dan 10+ data dummy jika masih kosong
 */
function initDatabaseIfEmpty() {
  const ss = getSpreadsheet();

  // 1. Sheet: siswa_pkl
  let sheetSiswa = ss.getSheetByName(CONFIG.SHEET_SISWA);
  if (!sheetSiswa) {
    sheetSiswa = ss.insertSheet(CONFIG.SHEET_SISWA);
  }
  
  if (sheetSiswa.getLastRow() === 0) {
    const siswaHeaders = [
      'id', 'no_urut', 'guru', 'nip', 'siswa', 'nis', 'nisn', 'kelas', 'jurusan', 'tempat', 'alamat'
    ];
    sheetSiswa.appendRow(siswaHeaders);
    sheetSiswa.getRange(1, 1, 1, siswaHeaders.length).setFontWeight('bold').setBackground('#e0e7ff');

    // 10 Data Dummy Otentik dari Referensi
    const dummySiswa = [
      [1, 1, 'Ida Ayu Agung Endrayani, S.Pd.', '19670224 198902 2 002', 'Ni Komang Sri Damayanti', '1201', '0061234501', 'XII BD 1', 'Bisnis Digital', 'PT. Sumber Alfaria Trijaya Tbk / SEMARAPURA KLOD', 'Jl. Rama Ling. Semarapura Kelod, Kel. Semarapura Kelod, Kec. Klungkung, Kab. Klungkung'],
      [2, 2, 'Ida Ayu Agung Endrayani, S.Pd.', '19670224 198902 2 002', 'Ni Made Sari Astini', '1202', '0061234502', 'XII BD 1', 'Bisnis Digital', 'PT. Sumber Alfaria Trijaya Tbk / KUSANEGARA', 'Jl. Kusanegara Banjar Dinas Bandung, Kel. Gunaksa, Kec. Dawan, Kab. Klungkung'],
      [3, 3, 'Ida Ayu Agung Endrayani, S.Pd.', '19670224 198902 2 002', 'I Gede Ari Widnyana', '1203', '0061234503', 'XII TSM', 'Teknik Sepeda Motor', 'Gemilang Motor', 'Jl. Flamboyan No.53, Semarapura Kauh, Kec. Klungkung, Kab. Klungkung, Bali'],
      [4, 4, 'I Ketut Mutra, S.Pd., M.Pd.', '19670521 199512 1 005', 'Ketut Ananta Wardana', '1204', '0061234504', 'XII AK', 'Akuntansi', 'LPD Desa Pekraman Gelgel', 'Jl. Watu Renggong, Gelgel, Kec. Klungkung, Kab Klungkung'],
      [5, 5, 'I Ketut Mutra, S.Pd., M.Pd.', '19670521 199512 1 005', 'Anisa Safila', '1205', '0061234505', 'XII BD 2', 'Bisnis Digital', 'Toko Oneska Digital Store', 'Jl. Subali II, Br. Siku, Desa Kamasan, Klungkung'],
      [6, 6, 'I Ketut Mutra, S.Pd., M.Pd.', '19670521 199512 1 005', 'Komang Ayu Seri Musthikarani', '1206', '0061234506', 'XII MP 1', 'Manajemen Perkantoran', 'PT. PLN (PERSERO) ULP KLUNGKUNG', 'JALAN NGURAH RAI NO 40 SEMARAPURA TENGAH, KLUNGKUNG'],
      [7, 7, 'I Gede Wiraguna, S.Pd.', '19791024 200312 1 004', 'Ni Kadek Anggun Putri Pramesti', '1207', '0061234507', 'XII AK', 'Akuntansi', 'PT. Pegadaian Persero Cabang Klungkung', 'Jl. Gn. Batukaru No.9, Semarapura Kelod Kangin, Kec. Klungkung'],
      [8, 8, 'I Gede Wiraguna, S.Pd.', '19791024 200312 1 004', 'Ni Made Ari Diana Sari', '1208', '0061234508', 'XII LPB', 'Layanan Perbankan', 'PT. BRI Persero, Tbk. Cabang Klungkung', 'Jl. Gunung Batukaru, No. 7, Semarapura Kelod Kangin, Kec. Klungkung'],
      [9, 9, 'Ni Made Ari Naswati, ST', '19830802 201001 2 026', 'Ni Putu Dian Cahyani', '1209', '0061234509', 'XII DKV', 'Desain Komunikasi Visual', 'Mandala Gold', 'Jl. Kecubung, Semarapura Kelod, Kab. Klungkung'],
      [10, 10, 'Luh Desy Dianayanti, S.Pd., M.Pd', '19841213 200902 2 009', 'Kadek Gita Anindita Kemulan', '1210', '0061234510', 'XII DKV', 'Desain Komunikasi Visual', 'E Sanctuary Ubud', 'Jl. Raya Br. Tunon, Singakerta, Kecamatan Ubud, Kab. Gianyar, Bali']
    ];

    dummySiswa.forEach(row => sheetSiswa.appendRow(row));
  }

  // 2. Sheet: pengaturan
  let sheetPengaturan = ss.getSheetByName(CONFIG.SHEET_PENGATURAN);
  if (!sheetPengaturan) {
    sheetPengaturan = ss.insertSheet(CONFIG.SHEET_PENGATURAN);
  }

  if (sheetPengaturan.getLastRow() === 0) {
    const pengHeaders = ['kunci', 'nilai', 'kategori', 'keterangan'];
    sheetPengaturan.appendRow(pengHeaders);
    sheetPengaturan.getRange(1, 1, 1, pengHeaders.length).setFontWeight('bold').setBackground('#fef3c7');
  }

  const defaultPengaturan = [
    ['namaSekolah', 'SMK Negeri 1 Klungkung', 'lembaga', 'Nama resmi sekolah / instansi'],
    ['subJudulSekolah', 'SMK Negeri 1 Klungkung • Tahun Ajaran 2026/2027', 'lembaga', 'Sub-judul sekolah di kop dan header'],
    ['alamatSekolah', 'Jalan Subali II, Banjar Siku, Desa Kamasan Telp. (0366) 23520 Klungkung', 'lembaga', 'Alamat lengkap instansi'],
    ['kepsekNama', 'Sri Rejeki, S.Pd.,M.Pd.', 'kepsek', 'Nama lengkap dan gelar Kepala Sekolah'],
    ['kepsekPangkat', 'Pembina (IV/a)', 'kepsek', 'Pangkat dan golongan ruang Kepala Sekolah'],
    ['kepsekNip', '19770309 200903 2 010', 'kepsek', 'Nomor Induk Pegawai (NIP) Kepala Sekolah'],
    ['tahunAjaran', '2026/2027', 'jadwal', 'Tahun ajaran aktif pelaksanaan PKL'],
    ['periodePkl', '13 November 2026 sampai dengan 30 April 2027', 'jadwal', 'Rentang periode PKL'],
    ['tglPelepasan', '13 November 2026', 'jadwal', 'Tanggal pelepasan / pengantaran siswa ke DU/DI'],
    ['tglPenarikan', '30 April 2027', 'jadwal', 'Tanggal penarikan siswa dari DU/DI'],
    ['tglSurat', '12 November 2026', 'jadwal', 'Tanggal penerbitan surat pengantar resmi'],
    ['titimangsaTempat', 'Klungkung', 'jadwal', 'Kota penerbitan surat dinas'],
    ['noSurat', 'B.10.000/9546/SMKN1KLK/DIKPORA', 'jadwal', 'Nomor surat dinas standar'],
    ['kopUrl', 'https://drive.google.com/file/d/1QXtnYwIrCc-pihDUoidjkRW5UVWykOn-/view?usp=drive_link', 'media', 'URL Berkas Kop Surat Resmi'],
    ['ttdUrl', 'https://drive.google.com/file/d/1fVDtzPKSHqga0Qz9YxnOzGaUHg7K4roR/view?usp=drive_link', 'media', 'URL Berkas TTD Barcode Elektronik Kepsek'],
    ['ttdBasahUrl', 'https://drive.google.com/file/d/12KTwz7FbhtOq1SOkN0bJP3HEKxu_qkQS/view?usp=drive_link', 'media', 'URL Berkas TTD Manual / Basah Kepsek'],
    ['logoWebUrl', 'https://drive.google.com/file/d/1_4m0lkw99HvxaPXvOhy0UOudoPmiIRc-/view?usp=drive_link', 'media', 'URL Berkas Logo Web Aplikasi (Bawaan)']
  ];

  const existingPengData = sheetPengaturan.getDataRange().getValues();
  const existingKeys = {};
  for (let i = 1; i < existingPengData.length; i++) {
    const k = String(existingPengData[i][0]).trim();
    if (k) existingKeys[k] = true;
  }
  defaultPengaturan.forEach(row => {
    if (!existingKeys[row[0]]) {
      sheetPengaturan.appendRow(row);
    }
  });

  // 3. Sheet: template_surat
  let sheetTemplate = ss.getSheetByName(CONFIG.SHEET_TEMPLATE);
  if (!sheetTemplate) {
    sheetTemplate = ss.insertSheet(CONFIG.SHEET_TEMPLATE);
  }

  if (sheetTemplate.getLastRow() === 0) {
    const tplHeaders = ['id', 'nama', 'html_content', 'is_default', 'status'];
    sheetTemplate.appendRow(tplHeaders);
    sheetTemplate.getRange(1, 1, 1, tplHeaders.length).setFontWeight('bold').setBackground('#dcfce7');
  }

function getDefaultTemplatesList() {
  return [
    [
      'tpl_berita_acara',
      'Redaksi Surat (Editor Teks / WYSIWYG)',
      '<p style="text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 4px;">BERITA ACARA SERAH TERIMA SISWA PRAKTEK KERJA LAPANGAN (PKL)</p>\n<p style="text-align: center; font-size: 11pt; margin-bottom: 16px;">Nomor: {noSurat}</p>\n\n<p style="margin-bottom: 8px; text-align: justify; line-height: 1.5;">Pada hari ini, tanggal <strong>{tglPelepasan}</strong>, bertempat di <strong>{tempatPkl}</strong>, kami yang bertanda tangan di bawah ini:</p>\n\n<table style="width: 100%; margin-left: 15px; margin-bottom: 12px; font-size: 11pt;">\n  <tr>\n    <td style="width: 140px; vertical-align: top;">Nama Guru Pembimbing</td>\n    <td style="width: 15px; vertical-align: top;">:</td>\n    <td style="font-weight: bold; vertical-align: top;">{guruNama}</td>\n  </tr>\n  <tr>\n    <td style="vertical-align: top;">NIP</td>\n    <td style="vertical-align: top;">:</td>\n    <td style="vertical-align: top;">{guruNip}</td>\n  </tr>\n  <tr>\n    <td style="vertical-align: top;">Unit Kerja</td>\n    <td style="vertical-align: top;">:</td>\n    <td style="vertical-align: top;">{namaSekolah}</td>\n  </tr>\n</table>\n\n<p style="margin-bottom: 8px; text-align: justify; line-height: 1.5;">Dalam hal ini bertindak atas nama Kepala {namaSekolah}, selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong>.</p>\n\n<table style="width: 100%; margin-left: 15px; margin-bottom: 12px; font-size: 11pt;">\n  <tr>\n    <td style="width: 140px; vertical-align: top;">Nama Pimpinan / DU-DI</td>\n    <td style="width: 15px; vertical-align: top;">:</td>\n    <td style="font-weight: bold; vertical-align: top;">Pimpinan {tempatPkl}</td>\n  </tr>\n  <tr>\n    <td style="vertical-align: top;">Alamat Perusahaan</td>\n    <td style="vertical-align: top;">:</td>\n    <td style="vertical-align: top;">{alamatPkl}</td>\n  </tr>\n</table>\n\n<p style="margin-bottom: 8px; text-align: justify; line-height: 1.5;">Dalam hal ini bertindak sebagai perwakilan industri/dunia kerja, selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong>.</p>\n\n<p style="text-indent: 30px; margin-bottom: 10px; text-align: justify; line-height: 1.5;">\n  PIHAK PERTAMA secara resmi menyerahkan siswa/siswi {namaSekolah} Tahun Ajaran {tahunAjaran} kepada PIHAK KEDUA untuk melaksanakan kegiatan Praktek Kerja Lapangan (PKL) terhitung mulai tanggal {periodePkl}.\n</p>\n\n<p style="margin-bottom: 6px;">Adapun daftar siswa yang diserahkan adalah sebagai berikut:</p>\n{tabelSiswaPermohonan}\n\n<p style="text-indent: 30px; margin-top: 10px; margin-bottom: 8px; text-align: justify; line-height: 1.5;">\n  Demikian Berita Acara ini dibuat dalam rangkap 2 (dua) yang masing-masing mempunyai kekuatan hukum yang sama, untuk dipergunakan sebagaimana mestinya.\n</p>',
      1,
      'active'
    ],
    [
      'tpl_standar_resmi',
      'Template Standar Resmi (Surat Pengantar PKL)',
      '<p style="text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 4px;">SURAT PENGANTAR</p>\n<p style="text-align: center; font-size: 11pt; margin-bottom: 14px;">Nomor: {noSurat}</p>\n\n<table style="width: 100%; margin-bottom: 14px; font-size: 11pt;">\n  <tr>\n    <td style="width: 70px; vertical-align: top;">Kepada:</td>\n    <td></td>\n  </tr>\n  <tr>\n    <td style="vertical-align: top;">Yth.</td>\n    <td>\n      <div style="font-weight: bold;">{tempatPkl}</div>\n      <div style="font-size: 10.5pt; color: #333;">{alamatPkl}</div>\n      <div>di -</div>\n      <div style="text-indent: 20px;">Tempat</div>\n    </td>\n  </tr>\n</table>\n\n<p style="margin-bottom: 8px;">Dengan hormat,</p>\n<p style="text-indent: 30px; margin-bottom: 8px; text-align: justify;">\n  Dalam rangka pelaksanaan kegiatan Praktek Kerja Lapangan (PKL) bagi siswa/siswi {namaSekolah} Tahun Ajaran {tahunAjaran}, bersama ini kami menugaskan guru pembimbing untuk menyerahkan sekaligus mengantarkan siswa/siswi kami melaksanakan PKL di perusahaan/instansi yang Bapak/Ibu pimpin.\n</p>\n<p style="margin-bottom: 4px;">Adapun identitas Guru Pembimbing yang ditugaskan adalah sebagai berikut:</p>\n<table style="width: 100%; margin-left: 20px; margin-bottom: 10px;">\n  <tr>\n    <td style="width: 130px; vertical-align: top;">Nama</td>\n    <td style="width: 20px; vertical-align: top;">:</td>\n    <td style="font-weight: bold; vertical-align: top;">{guruNama}</td>\n  </tr>\n  <tr>\n    <td style="vertical-align: top;">NIP</td>\n    <td style="vertical-align: top;">:</td>\n    <td style="vertical-align: top;">{guruNip}</td>\n  </tr>\n  <tr>\n    <td style="vertical-align: top;">Tempat PKL</td>\n    <td style="vertical-align: top;">:</td>\n    <td style="font-weight: bold; vertical-align: top;">{tempatPkl}</td>\n  </tr>\n</table>\n<p style="text-indent: 30px; margin-bottom: 8px; text-align: justify;">\n  Siswa yang diserahkan berjumlah sebagaimana terlampir, dan kegiatan PKL akan dilaksanakan terhitung mulai tanggal {periodePkl}.\n</p>\n<p style="text-indent: 30px; margin-bottom: 8px; text-align: justify;">\n  Demikian surat pengantar ini kami sampaikan, atas bantuan dan kerja sama yang baik kami ucapkan terima kasih.\n</p>',
      0,
      'active'
    ],
    [
      'tpl_surat_permohonan_pkl_murid',
      'Surat Permohonan PKL Murid',
      '<table style="width: 100%; margin-bottom: 12px; font-size: 11pt; border-collapse: collapse; font-family: \'Arial Narrow\', Arial, sans-serif;">\n  <tr>\n    <td style="width: 80px; vertical-align: top;">Nomor</td>\n    <td style="width: 15px; vertical-align: top;">:</td>\n    <td style="vertical-align: top;">{noSurat}</td>\n  </tr>\n  <tr>\n    <td style="vertical-align: top;">Lampiran</td>\n    <td style="vertical-align: top;">:</td>\n    <td style="vertical-align: top;">-</td>\n  </tr>\n  <tr>\n    <td style="vertical-align: top;">Perihal</td>\n    <td style="vertical-align: top;">:</td>\n    <td style="vertical-align: top; font-weight: bold;">Permohonan Penerimaan Murid<br>Praktek Kerja Lapangan (PKL)</td>\n  </tr>\n</table>\n\n<div style="margin-bottom: 12px; font-size: 11pt; font-family: \'Arial Narrow\', Arial, sans-serif;">\n  <div>Kepada</div>\n  <div>Yth. Bapak/Ibu Pimpinan <strong>{tempatPkl}</strong></div>\n  <div>di</div>\n  <div>Tempat</div>\n</div>\n\n<p style="margin-bottom: 8px; font-size: 11pt; font-family: \'Arial Narrow\', Arial, sans-serif;">Dengan hormat,</p>\n<p style="text-indent: 30px; margin-bottom: 10px; text-align: justify; line-height: 1.4; font-size: 11pt; font-family: \'Arial Narrow\', Arial, sans-serif;">\n  Sesuai dengan kurikulum {namaSekolah} terkait dengan Praktek Kerja Lapangan (PKL) murid kelas {tingkatKelas}, maka kami mohon bantuan Bapak/Ibu untuk dapat kiranya menerima murid kami konsentrasi keahlian {jurusanPkl} untuk melaksanakan Praktek Kerja Lapangan (PKL) pada perusahaan yang Bapak/Ibu pimpin. Adapun kegiatan PKL tersebut akan dilaksanakan pada tanggal {periodePkl}.\n</p>\n<p style="margin-bottom: 8px; font-size: 11pt; font-family: \'Arial Narrow\', Arial, sans-serif;">Adapun nama murid kami, sebagai berikut:</p>\n\n{tabelSiswaPermohonan}\n\n<p style="text-indent: 30px; margin-top: 10px; margin-bottom: 12px; text-align: justify; line-height: 1.4; font-size: 11pt; font-family: \'Arial Narrow\', Arial, sans-serif;">\n  Demikian yang dapat kami sampaikan atas kerjasama Bapak/Ibu kami ucapkan terimakasih.\n</p>',
      0,
      'active'
    ],
    [
      'tpl_surat_keterangan_pkl',
      'Surat Keterangan PKL',
      '<p style="text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 4px;">SURAT KETERANGAN</p>\n<p style="text-align: center; font-size: 11pt; margin-bottom: 16px;">Nomor: {noSurat}</p>\n\n<p style="margin-bottom: 8px;">Yang bertanda tangan dibawah ini :</p>\n<table style="width: 100%; margin-left: 20px; margin-bottom: 12px; font-size: 11pt;">\n  <tr>\n    <td style="width: 130px; vertical-align: top;">Nama</td>\n    <td style="width: 15px; vertical-align: top;">:</td>\n    <td style="font-weight: bold; vertical-align: top;">{kepsekNama}</td>\n  </tr>\n  <tr>\n    <td style="vertical-align: top;">NIP</td>\n    <td style="vertical-align: top;">:</td>\n    <td style="vertical-align: top;">{kepsekNip}</td>\n  </tr>\n  <tr>\n    <td style="vertical-align: top;">Pangkat/Gol</td>\n    <td style="vertical-align: top;">:</td>\n    <td style="vertical-align: top;">{kepsekPangkat}</td>\n  </tr>\n  <tr>\n    <td style="vertical-align: top;">Jabatan</td>\n    <td style="vertical-align: top;">:</td>\n    <td style="vertical-align: top;">Kepala {namaSekolah}</td>\n  </tr>\n  <tr>\n    <td style="vertical-align: top;">Unit Kerja</td>\n    <td style="vertical-align: top;">:</td>\n    <td style="vertical-align: top;">{namaSekolah}</td>\n  </tr>\n</table>\n\n<p style="margin-bottom: 8px;">Menerangkan kepada yang tersebut dibawah ini bahwa:</p>\n<table style="width: 100%; margin-left: 20px; margin-bottom: 12px; font-size: 11pt;">\n  <tr>\n    <td style="width: 130px; vertical-align: top;">Nama</td>\n    <td style="width: 15px; vertical-align: top;">:</td>\n    <td style="font-weight: bold; vertical-align: top;">{siswaNama}</td>\n  </tr>\n  <tr>\n    <td style="vertical-align: top;">NIS/NISN</td>\n    <td style="vertical-align: top;">:</td>\n    <td style="vertical-align: top;">{siswaNisNisn}</td>\n  </tr>\n  <tr>\n    <td style="vertical-align: top;">Jurusan</td>\n    <td style="vertical-align: top;">:</td>\n    <td style="vertical-align: top;">{siswaJurusan}</td>\n  </tr>\n</table>\n\n<p style="text-indent: 30px; margin-bottom: 12px; text-align: justify; line-height: 1.5;">\n  Adalah benar telah melaksanakan PKL di <strong>{tempatPkl}</strong> selama 6 bulan dan yang bersangkutan telah melaksanakan tugasnya dengan baik dan penuh tanggung jawab.\n</p>\n\n<p style="text-indent: 30px; margin-bottom: 14px; text-align: justify; line-height: 1.5;">\n  Demikian Surat Keterangan ini dibuat dengan benar untuk digunakan sebagaimana mestinya.\n</p>',
      0,
      'active'
    ],
    [
      'tpl_pkl_terpadu',
      'Template PKL Model Terpadu / Fleksibel',
      '<p style="text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 4px;">SURAT PENGANTAR PKL TERPADU</p>\n<p style="text-align: center; font-size: 11pt; margin-bottom: 14px;">Nomor: {noSurat}</p>\n\n<table style="width: 100%; margin-bottom: 14px; font-size: 11pt;">\n  <tr>\n    <td style="width: 70px; vertical-align: top;">Kepada:</td>\n    <td></td>\n  </tr>\n  <tr>\n    <td style="vertical-align: top;">Yth.</td>\n    <td>\n      <div style="font-weight: bold;">{tempatPkl}</div>\n      <div style="font-size: 10.5pt; color: #333;">{alamatPkl}</div>\n      <div>di -</div>\n      <div style="text-indent: 20px;">Tempat</div>\n    </td>\n  </tr>\n</table>\n\n<p style="margin-bottom: 8px;">Dengan hormat,</p>\n<p style="text-indent: 30px; margin-bottom: 8px; text-align: justify;">\n  Sehubungan dengan program kurikulum vokasi {namaSekolah} Tahun Ajaran {tahunAjaran}, kami bermaksud mendelegasikan siswa/siswi kami untuk melaksanakan kegiatan Praktek Kerja Lapangan (PKL) terpadu di perusahaan/instansi yang Bapak/Ibu pimpin.\n</p>\n<p style="margin-bottom: 4px;">Bersama surat ini, kami menugaskan guru pembimbing sebagai narahubung resmi:</p>\n<table style="width: 100%; margin-left: 20px; margin-bottom: 10px;">\n  <tr>\n    <td style="width: 110px;">Nama</td>\n    <td style="width: 15px;">:</td>\n    <td style="font-weight: bold;">{guruNama}</td>\n  </tr>\n  <tr>\n    <td>NIP</td>\n    <td>:</td>\n    <td>{guruNip}</td>\n  </tr>\n  <tr>\n    <td>Jabatan</td>\n    <td>:</td>\n    <td>Guru Pembimbing PKL</td>\n  </tr>\n</table>\n<p style="margin-bottom: 4px;">Adapun rincian jadwal pelaksanaan program PKL adalah sebagai berikut:</p>\n<ol style="margin-left: 20px; margin-bottom: 10px; list-style-type: decimal;">\n  <li style="padding-left: 4px;">Pelepasan siswa/siswi PKL: <strong>{tglPelepasan}</strong>.</li>\n  <li style="padding-left: 4px;">Masa PKL &amp; Evaluasi Berkala: <strong>{periodePkl}</strong>. Monitoring dilaksanakan secara berkala untuk mengevaluasi perkembangan kompetensi siswa.</li>\n  <li style="padding-left: 4px;">Penarikan resmi siswa: <strong>{tglPenarikan}</strong>.</li>\n</ol>\n<p style="text-indent: 30px; margin-bottom: 14px; text-align: justify;">\n  Rincian nama siswa/siswi terlampir pada Lampiran 2 surat ini. Besar harapan kami agar kerja sama yang baik antara institusi pendidikan dan DU/DI terus terjalin erat. Atas perhatian dan kesediaan Bapak/Ibu, kami haturkan terima kasih.\n</p>',
      0,
      'active'
    ]
  ];
}

function getDefaultTemplatesMap() {
  const map = {};
  getDefaultTemplatesList().forEach(row => { map[row[0]] = row; });
  return map;
}

  const defaultTemplates = getDefaultTemplatesList();
  const defaultTplMap = getDefaultTemplatesMap();

  const existingTplData = sheetTemplate.getDataRange().getValues();
  const existingTplKeys = {};
  for (let i = 1; i < existingTplData.length; i++) {
    const k = String(existingTplData[i][0]).trim();
    if (k) {
      existingTplKeys[k] = true;
      const curContent = String(existingTplData[i][2]);
      // Jika template bawaan di sheet belum memiliki {noSurat}, otomatis perbarui agar judul & nomor dapat diedit
      if (defaultTplMap[k] && !curContent.includes('{noSurat}')) {
        try {
          sheetTemplate.getRange(i + 1, 3).setValue(defaultTplMap[k][2]);
        } catch (e) {}
      }
    }
  }
  defaultTemplates.forEach(row => {
    if (!existingTplKeys[row[0]]) {
      sheetTemplate.appendRow(row);
    }
  });

  // Hapus Sheet default 'Sheet1' jika ada dan sheet lain sudah terisi
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {}
  }
}

/**
 * Membersihkan cache server saat data berubah
 */
function clearInitialDataCache() {
  try {
    CacheService.getScriptCache().remove('app_initial_data');
  } catch (e) {}
}

/**
 * Mengambil seluruh data awal untuk aplikasi (Siswa, Pengaturan, Template) dalam 1 kali panggil
 * Dilengkapi caching server berkecepatan tinggi
 */
function getInitialData(forceRefresh) {
  if (!forceRefresh) {
    try {
      const cached = CacheService.getScriptCache().get('app_initial_data');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}
  }

  const ss = getSpreadsheet();
  let sheetSiswa = ss.getSheetByName(CONFIG.SHEET_SISWA);
  if (!sheetSiswa) {
    initDatabaseIfEmpty();
    sheetSiswa = ss.getSheetByName(CONFIG.SHEET_SISWA);
  }

  // 1. Data Siswa
  const siswaData = sheetSiswa ? sheetSiswa.getDataRange().getValues() : [];
  const students = [];
  if (siswaData.length > 1) {
    const headers = siswaData[0];
    for (let i = 1; i < siswaData.length; i++) {
      const row = siswaData[i];
      const item = {};
      headers.forEach((h, idx) => {
        item[h] = row[idx];
      });
      students.push(item);
    }
  }

  // 2. Data Pengaturan
  const sheetPengaturan = ss.getSheetByName(CONFIG.SHEET_PENGATURAN);
  const pengData = sheetPengaturan ? sheetPengaturan.getDataRange().getValues() : [];
  const settings = {};
  if (pengData.length > 1) {
    for (let i = 1; i < pengData.length; i++) {
      const key = String(pengData[i][0]).trim();
      const val = pengData[i][1];
      if (key) {
        settings[key] = val;
      }
    }
  }

  // Standar Bawaan untuk Aset & Informasi Sekolah
  const DEFAULT_SETTINGS = {
    namaSekolah: 'SMK Negeri 1 Klungkung',
    subJudulSekolah: 'SMK Negeri 1 Klungkung • Tahun Ajaran 2026/2027',
    alamatSekolah: 'Jalan Subali II, Banjar Siku, Desa Kamasan Telp. (0366) 23520 Klungkung',
    kepsekNama: 'Sri Rejeki, S.Pd.,M.Pd.',
    kepsekPangkat: 'Pembina (IV/a)',
    kepsekNip: '19770309 200903 2 010',
    tahunAjaran: '2026/2027',
    periodePkl: '13 November 2026 sampai dengan 30 April 2027',
    tglPelepasan: '13 November 2026',
    tglPenarikan: '30 April 2027',
    tglSurat: '12 November 2026',
    titimangsaTempat: 'Klungkung',
    noSurat: 'B.10.000/9546/SMKN1KLK/DIKPORA',
    kopUrl: 'https://drive.google.com/file/d/1QXtnYwIrCc-pihDUoidjkRW5UVWykOn-/view?usp=drive_link',
    ttdUrl: 'https://drive.google.com/file/d/1fVDtzPKSHqga0Qz9YxnOzGaUHg7K4roR/view?usp=drive_link',
    ttdBasahUrl: 'https://drive.google.com/file/d/12KTwz7FbhtOq1SOkN0bJP3HEKxu_qkQS/view?usp=drive_link',
    logoWebUrl: 'https://drive.google.com/file/d/1_4m0lkw99HvxaPXvOhy0UOudoPmiIRc-/view?usp=drive_link'
  };

  for (const k in DEFAULT_SETTINGS) {
    if (!settings[k] || String(settings[k]).trim() === '') {
      settings[k] = DEFAULT_SETTINGS[k];
    }
  }

  // 3. Data Template
  const defaultTplMap = getDefaultTemplatesMap();
  const sheetTemplate = ss.getSheetByName(CONFIG.SHEET_TEMPLATE);
  const tplData = sheetTemplate ? sheetTemplate.getDataRange().getValues() : [];
  const templates = [];
  if (tplData.length > 1) {
    for (let i = 1; i < tplData.length; i++) {
      const tId = String(tplData[i][0]).trim();
      let content = String(tplData[i][2]);
      // Jika template bawaan di database sheets belum ada {noSurat}, otomatis gunakan template dengan judul & nomor
      if (defaultTplMap && defaultTplMap[tId] && !content.includes('{noSurat}')) {
        content = defaultTplMap[tId][2];
        try {
          sheetTemplate.getRange(i + 1, 3).setValue(content);
        } catch (e) {}
      }
      templates.push({
        id: tId,
        nama: String(tplData[i][1]),
        html_content: content,
        is_default: Number(tplData[i][3]) || 0,
        status: String(tplData[i][4] || 'active')
      });
    }
  }

  const result = {
    success: true,
    students: students,
    settings: settings,
    templates: templates,
    driveFolderUrl: 'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID
  };

  try {
    const jsonStr = JSON.stringify(result);
    if (jsonStr.length < 95000) {
      CacheService.getScriptCache().put('app_initial_data', jsonStr, 1800);
    }
  } catch (e) {}

  return result;
}

/**
 * Tambah atau Perbarui Data Siswa PKL
 */
function saveStudent(record) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_SISWA);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const idColIdx = headers.indexOf('id');
  let targetRowIdx = -1;

  if (record.id) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idColIdx]) === String(record.id)) {
        targetRowIdx = i + 1;
        break;
      }
    }
  }

  if (targetRowIdx > 0) {
    // Mode Update
    const rowValues = [];
    headers.forEach(h => {
      rowValues.push(record[h] !== undefined ? record[h] : '');
    });
    sheet.getRange(targetRowIdx, 1, 1, headers.length).setValues([rowValues]);
    clearInitialDataCache();
    return { success: true, mode: 'updated', record: record };
  } else {
    // Mode Insert Baru
    const newId = record.id || (new Date().getTime());
    const newNoUrut = data.length;
    record.id = newId;
    record.no_urut = record.no_urut || newNoUrut;

    const rowValues = [];
    headers.forEach(h => {
      rowValues.push(record[h] !== undefined ? record[h] : '');
    });
    sheet.appendRow(rowValues);
    clearInitialDataCache();
    return { success: true, mode: 'inserted', record: record };
  }
}

/**
 * Hapus Data Siswa PKL dan Tata Ulang Nomor Urut
 */
function deleteStudent(id) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_SISWA);
  const data = sheet.getDataRange().getValues();
  const idColIdx = data[0].indexOf('id');

  let targetRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]) === String(id)) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow > 0) {
    sheet.deleteRow(targetRow);
    renumberSiswa();
    clearInitialDataCache();
    return { success: true };
  }
  return { success: false, message: 'Data siswa dengan ID ' + id + ' tidak ditemukan.' };
}

/**
 * Tata Ulang Penomoran Urut Siswa PKL
 */
function renumberSiswa() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_SISWA);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const noUrutIdx = headers.indexOf('no_urut') + 1;
    if (noUrutIdx > 0) {
      for (let r = 2; r <= lastRow; r++) {
        sheet.getRange(r, noUrutIdx).setValue(r - 1);
      }
    }
  }
}

/**
 * Hapus Semua Data Siswa PKL (Menyisakan Baris Header Kolom)
 */
function clearAllStudents() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_SISWA);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  clearInitialDataCache();
  return { success: true };
}

/**
 * Impor Data Siswa PKL Massal (Append atau Replace)
 */
function importStudents(records, mode) {
  if (!records || !Array.isArray(records) || records.length === 0) {
    return { success: false, message: 'Tidak ada data siswa yang valid untuk diimpor.' };
  }

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_SISWA);
  const headers = ['id', 'no_urut', 'guru', 'nip', 'siswa', 'nis', 'nisn', 'kelas', 'jurusan', 'tempat', 'alamat'];

  if (mode === 'replace') {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
  }

  const currentData = sheet.getDataRange().getValues();
  let nextNoUrut = (mode === 'replace') ? 1 : Math.max(1, currentData.length);
  let maxId = 0;
  if (mode !== 'replace') {
    for (let i = 1; i < currentData.length; i++) {
      const idVal = Number(currentData[i][0]) || 0;
      if (idVal > maxId) maxId = idVal;
    }
  }

  const rowsToInsert = [];
  records.forEach((rec) => {
    maxId++;
    rowsToInsert.push([
      maxId,
      nextNoUrut++,
      rec.guru || '',
      rec.nip ? String(rec.nip) : '',
      rec.siswa || '',
      rec.nis ? String(rec.nis) : '',
      rec.nisn ? String(rec.nisn) : '',
      rec.kelas || '',
      rec.jurusan || '',
      rec.tempat || '',
      rec.alamat || ''
    ]);
  });

  if (rowsToInsert.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToInsert.length, headers.length).setValues(rowsToInsert);
  }

  clearInitialDataCache();
  return { 
    success: true, 
    count: rowsToInsert.length,
    students: getInitialData(true).students
  };
}

/**
 * Simpan atau Perbarui Pengaturan Aplikasi
 */
function saveSettings(settingsObj) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_PENGATURAN);
  const data = sheet.getDataRange().getValues();

  const keyMap = {};
  for (let i = 1; i < data.length; i++) {
    keyMap[String(data[i][0]).trim()] = i + 1;
  }

  for (const key in settingsObj) {
    if (settingsObj.hasOwnProperty(key)) {
      const val = settingsObj[key];
      if (keyMap[key]) {
        sheet.getRange(keyMap[key], 2).setValue(val);
      } else {
        sheet.appendRow([key, val, 'kustom', '']);
        keyMap[key] = sheet.getLastRow();
      }
    }
  }

  clearInitialDataCache();
  return { success: true };
}

/**
 * Simpan atau Perbarui Template Surat
 */
function saveTemplate(tplObj) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_TEMPLATE);
  const data = sheet.getDataRange().getValues();
  let targetRow = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(tplObj.id).trim()) {
      targetRow = i + 1;
      break;
    }
  }

  clearInitialDataCache();
  if (targetRow > 0) {
    sheet.getRange(targetRow, 2).setValue(tplObj.nama);
    sheet.getRange(targetRow, 3).setValue(tplObj.html_content);
    if (tplObj.is_default !== undefined) sheet.getRange(targetRow, 4).setValue(tplObj.is_default);
    if (tplObj.status) sheet.getRange(targetRow, 5).setValue(tplObj.status);
    return { success: true, mode: 'updated' };
  } else {
    sheet.appendRow([
      tplObj.id,
      tplObj.nama,
      tplObj.html_content,
      tplObj.is_default || 0,
      tplObj.status || 'active'
    ]);
    return { success: true, mode: 'inserted' };
  }
}

/**
 * Hapus Template Surat
 */
function deleteTemplate(tplId) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_TEMPLATE);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(tplId).trim()) {
      sheet.deleteRow(i + 1);
      clearInitialDataCache();
      return { success: true };
    }
  }
  return { success: false, message: 'Template tidak ditemukan' };
}

/**
 * Menyimpan File Dokumen (PDF, DOCX, ZIP, Gambar) langsung ke Google Drive Folder
 */
function saveFileToDrive(payload) {
  try {
    const folder = getDriveFolder();
    const filename = payload.filename || ('Dokumen_PKL_' + new Date().getTime() + '.pdf');
    let mimeType = payload.mimeType || 'application/pdf';
    let base64Data = payload.data || payload.base64 || '';

    if (base64Data.indexOf(',') !== -1) {
      base64Data = base64Data.split(',')[1];
    }

    const decodedBytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decodedBytes, mimeType, filename);
    const file = folder.createFile(blob);

    // Jadikan file dapat diakses publik dengan link (Viewer)
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      Logger.log('Sharing set info: ' + e);
    }

    return {
      success: true,
      fileId: file.getId(),
      fileName: file.getName(),
      fileUrl: file.getUrl(),
      viewUrl: 'https://drive.google.com/file/d/' + file.getId() + '/view',
      downloadUrl: 'https://drive.google.com/uc?export=download&id=' + file.getId(),
      folderUrl: 'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Unggah Aset Gambar (Kop, Logo, TTD) ke Google Drive dan Perbarui Setting
 */
function uploadAssetToDrive(payload) {
  try {
    const assetType = payload.type; // 'kop', 'ttd', 'ttd_basah', 'logo'
    const res = saveFileToDrive({
      filename: payload.filename || ('asset_' + assetType + '_' + Date.now() + '.png'),
      mimeType: payload.mimeType || 'image/png',
      data: payload.data
    });

    if (res.success) {
      const typeKeyMap = {
        'kop': 'kopUrl',
        'ttd': 'ttdUrl',
        'ttd_basah': 'ttdBasahUrl',
        'logo': 'logoWebUrl'
      };
      const settingKey = typeKeyMap[assetType];
      if (settingKey) {
        const updateObj = {};
        updateObj[settingKey] = res.viewUrl;
        saveSettings(updateObj);
      }
      return { success: true, url: res.viewUrl, fileId: res.fileId };
    } else {
      return res;
    }
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Handler API GET jika aplikasi diakses melalui REST URL
 */
function handleApiGet(param) {
  let result = {};
  if (param.api === 'getInitialData') {
    result = getInitialData();
  } else if (param.api === 'initDb') {
    initDatabaseIfEmpty();
    result = { success: true, message: 'Database diinisialisasi.' };
  } else {
    result = { success: false, message: 'API tidak dikenal' };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
