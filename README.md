# Aplikasi Surat Pengantar & Berita Acara PKL (Google Apps Script Edition)

Aplikasi web modern berbasis **Google Apps Script** (GAS) yang terintegrasi langsung dengan **Google Sheets** sebagai basis data (*database*) dan **Google Drive** sebagai folder arsip penyimpanan berkas. Didesain secara khusus untuk mempermudah dan mempercepat administrasi pelaksanaan Praktek Kerja Lapangan (PKL), mulai dari pembuatan surat pengantar, berita acara serah terima, surat permohonan murid, hingga surat keterangan selesai PKL.

---

## 🌟 Fitur-Fitur Utama

1. **Editor Naskah Visual (WYSIWYG)**:
   - Format teks bebas (Tebal, Miring, Garis Bawah, Coret, Rata Kiri/Tengah/Kanan/Justify, Daftar Poin & Nomor, Indentasi).
   - Dilengkapi tombol cepat untuk menyisipkan variabel dinamis (`{noSurat}`, `{tglSurat}`, `{guruNama}`, `{tempatPkl}`, `{tabelSiswaPermohonan}`, dll.).
   - Mode editor ganda: **Mode Visual** (WYSIWYG) dan **Mode HTML** bagi pengguna yang ingin menyunting kode secara langsung.
2. **Kustomisasi Judul & Nomor Surat**:
   - Seluruh judul surat dan nomor surat (`{noSurat}`) berada langsung di dalam naskah template, sehingga pengguna bebas mengubah redaksi, penomoran, maupun perihal surat.
3. **Multi-Template & Fitur Tambah Redaksi**:
   - Tersedia template bawaan standar (Surat Pengantar PKL, Berita Acara Serah Terima, Surat Permohonan PKL Murid, Surat Keterangan PKL, dan PKL Terpadu).
   - Tombol **+ Tambah Redaksi** untuk membuat format surat baru yang langsung tersimpan permanen di Google Sheets.
   - Manajemen template: Gunakan, Edit, Duplikasi (Salinan Baru), atau Hapus template.
4. **Pratinjau Kertas Nyata (Real-time Paper Preview)**:
   - Tampilan visual lembar kerja presisi sesuai standar ukuran cetak kertas **F4/Folio (21.5 × 33.0 cm)** maupun **A4 (21.0 × 29.7 cm)**.
   - Tombol navigasi dan kontrol antarmuka otomatis tidak ikut tercetak saat dokumen dicetak atau disimpan ke PDF.
5. **Pilihan Tanda Tangan Dinamis**:
   - **Tanda Tangan Elektronik**: Menampilkan barcode QR resmi (nama dan NIP otomatis tersembunyi karena sudah tercantum di dalam barcode).
   - **Tanda Tangan Basah**: Menampilkan stempel resmi sekolah dan tanda tangan manual kepala sekolah lengkap dengan nama dan NIP bergaris bawah.
6. **Cetak Massal (Batch Print)**:
   - Cetak banyak dokumen sekaligus dengan filter per guru pembimbing, per DU/DI (tempat PKL), atau seluruh siswa dengan jeda halaman (*page-break*) otomatis.
7. **Ekspor Berkas Lengkap**:
   - Simpan langsung ke Google Drive sebagai dokumen PDF resmi.
   - Unduh dokumen dalam format Microsoft Word (**`.DOCX`**).
   - Buka folder arsip Google Drive dengan satu klik.
8. **Kelola Database Siswa Terpadu**:
   - Filter pencarian cepat berdasarkan nama guru pembimbing, tempat PKL, atau nama siswa.
   - Tambah dan edit data siswa langsung dari modal aplikasi.
   - **Impor Data Excel**: Mendukung unggah berkas `.xlsx` atau `.xls` (pilihan mode Tambah/Append atau Ganti Semua/Replace).
   - **Ekspor Data Excel**: Unduh seluruh isi database siswa ke format Excel asli.
   - **Hapus Semua Data**: Fitur pembersihan data siswa sekaligus dengan tata ulang nomor urut otomatis.
9. **Responsif & Antarmuka Modern**:
   - Optimal diakses melalui Desktop, Tablet, maupun Smartphone (dilengkapi *Bottom Navigation Bar* khusus tampilan seluler).
   - Sistem notifikasi *Toast Floating Glassmorphism* dan dialog konfirmasi modern tanpa `alert()` bawaan browser.

---

## 📁 Struktur File Proyek

```text
├── Kode.js             # Skrip Backend Apps Script (Database Sheets, Drive API, Router, API Endpoint)
├── Index.html          # Halaman Utama Surat (Sidebar Pemilih, Form Nomor/Jadwal & Preview Kertas)
├── Database.html       # Halaman Database Siswa PKL (Tabel Siswa, Impor/Ekspor Excel, Ubah Jurusan)
├── TemplateManager.html# Halaman Manajemen Template & Redaksi Surat (WYSIWYG Rich Text Editor)
├── Pengaturan.html     # Halaman Pengaturan Sistem, Lembaga & Media (Aset Kop, TTD, Spreadsheet)
├── Header.html         # Komponen Navbar Atas Bersama & Mobile Bottom Navigation Bar
├── Modals.html         # Komponen Modal Bersama (Form Siswa, Cetak Batch, Changelog, Ubah Jurusan)
├── Styles.html         # Lembar gaya CSS, layout cetak F4/A4, efek glassmorphism, responsive utilities
├── Scripts.html        # Skrip Frontend JavaScript (State management, WYSIWYG, filter, impor/ekspor Excel)
├── Assets.html         # Aset bawaan base64 SVG (Kop surat, TTD basah, stempel, logo default)
├── appsscript.json     # Manifest konfigurasi Apps Script (zona waktu Asia/Makassar & dependensi)
├── .clasp.json         # Konfigurasi deployment Google Clasp CLI
├── .claspignore        # Berkas yang dikecualikan dari push Google Apps Script
├── .gitignore          # Pengecualian berkas git
├── preview_local.html  # Pratinjau mandiri aplikasi (dapat dibuka langsung di browser secara lokal)
└── README.md           # Dokumentasi teknis dan panduan penggunaan
```

---

## 🚀 Panduan Penerapan di Google Apps Script

Anda dapat memasang aplikasi ini ke akun Google Anda menggunakan salah satu dari dua metode berikut:

### Metode 1: Melalui Editor Google Apps Script (Browser)

1. Buka browser dan kunjungi [Google Apps Script Dashboard](https://script.google.com/).
2. Klik tombol **New Project** (Proyek Baru) di sudut kiri atas.
3. Beri nama proyek Anda, misalnya `Aplikasi Surat PKL`.
4. Buat file-file berikut di editor Apps Script sesuai dengan isi file pada repositori ini:
   - Buat file Skrip bernama `Kode.js` (ganti ekstensi default `.gs` atau gunakan nama `Kode`).
   - Buat file HTML bernama `Index.html`.
   - Buat file HTML bernama `Styles.html`.
   - Buat file HTML bernama `Scripts.html`.
   - Buat file HTML bernama `Assets.html`.
5. Buka **Project Settings** (ikon gerigi di sebelah kiri), lalu centang opsi:  
   ☑ **"Show "appsscript.json" manifest file in editor"**.
6. Kembali ke Editor, buka file `appsscript.json` dan sesuaikan isinya dengan file `appsscript.json` pada repositori ini.
7. Simpan seluruh file (`Ctrl + S`).

---

### Metode 2: Menggunakan Clasp CLI (Command Line)

Jika Anda terbiasa dengan Node.js dan terminal:
```bash
# 1. Login ke Google Apps Script
npx @google/clasp login

# 2. Push seluruh file ke project GAS Anda
npx @google/clasp push --force

# 3. Deploy ke Web App
npx @google/clasp deploy -d "Deploy Versi Terbaru"
```

---

## ⚙️ Penerapan di Database Spreadsheet Baru

Jika Anda ingin menggunakan Google Spreadsheet dan Google Drive milik Anda sendiri, ikuti langkah-langkah mudah berikut:

### 1. Buat Spreadsheet dan Folder Drive Baru
1. Buka [Google Drive](https://drive.google.com/).
2. Buat sebuah **Google Spreadsheet baru**, beri nama misalnya `Database Surat PKL`.
3. Buat sebuah **Folder baru** di Google Drive untuk menampung file surat PDF yang disimpan dari web, beri nama misalnya `Arsip Surat PKL`.

### 2. Bagian yang Perlu Dirubah di `Kode.js`
Buka file `Kode.js` di editor Apps Script Anda. Pada baris ke-6 sampai ke-12, temukan blok konfigurasi `CONFIG`:

```javascript
const CONFIG = {
  SPREADSHEET_ID: 'MASUKKAN_ID_SPREADSHEET_BARU_DISINI',
  DRIVE_FOLDER_ID: 'MASUKKAN_ID_FOLDER_DRIVE_BARU_DISINI',
  SHEET_SISWA: 'siswa_pkl',
  SHEET_PENGATURAN: 'pengaturan',
  SHEET_TEMPLATE: 'template_surat'
};
```

> [!TIP]
> **Zero-Config (Jika skrip dibuat dari dalam Spreadsheet):**
> Jika Anda membuka Apps Script langsung dari spreadsheet melalui menu **Extensions (Ekstensi)** > **Apps Script**, Anda bahkan **tidak perlu mengisi SPREADSHEET_ID** (boleh dibiarkan kosong `''`). Sistem akan otomatis mendeteksi spreadsheet aktif tersebut!
>
> Selain itu, URL Spreadsheet, Folder Drive, dan Aset Kop/TTD/Logo sekarang **diambil secara dinamis langsung dari database (sheet `pengaturan`) dan runtime Apps Script**, sehingga Anda dapat mengubah folder penyimpanan Google Drive kapan saja langsung melalui menu **Pengaturan** di aplikasi web tanpa perlu mengedit kode skrip!

#### Cara Mengambil ID Spreadsheet (Untuk Standalone Script):
Buka Google Spreadsheet baru Anda di tab browser, perhatikan tautan pada address bar:
```text
https://docs.google.com/spreadsheets/d/19d_Drmf6XlNXZSW9zfO2E7FUGxNHBkumdHRUs1b4yz8/edit#gid=0
                                      ▲──────────────────────────────────────────▲
                                                Ini adalah SPREADSHEET_ID
```
Salin kode acak di antara `/d/` dan `/edit`, lalu tempelkan ke `SPREADSHEET_ID`.

#### Cara Mengambil ID Folder Google Drive:
Buka folder Google Drive baru Anda, perhatikan tautan pada address bar:
```text
https://drive.google.com/drive/folders/1Y765r1Qq9m753GHCSNjxCw7D-hEUuHDF
                                       ▲────────────────────────────────▲
                                            Ini adalah DRIVE_FOLDER_ID
```
Salin kode acak setelah `/folders/`, lalu tempelkan ke `DRIVE_FOLDER_ID`.

---

### 3. Jalankan Inisialisasi Database Otomatis
Setelah mengganti kedua ID di atas:
1. Pada editor Apps Script, pilih fungsi **`setupDatabase`** pada dropdown fungsi di bilah toolbar atas.
2. Klik tombol **Run** (Jalankan).
3. Google akan meminta izin otorisasi akses (*Review Permissions*). Klik akun Google Anda, pilih *Advanced* > *Go to Aplikasi Surat PKL (unsafe)* > Klik **Allow**.
4. Skrip secara otomatis akan:
   - Membuat sheet **`siswa_pkl`** lengkap dengan header kolom dan data contoh awal.
   - Membuat sheet **`pengaturan`** dengan data identitas instansi awal.
   - Membuat sheet **`template_surat`** lengkap dengan 5 template bawaan resmi.
   - Menghapus sheet kosong default (`Sheet1`).

---

### 4. Publikasikan Aplikasi sebagai Web App
1. Di pojok kanan atas editor Apps Script, klik tombol **Deploy** > **New deployment**.
2. Klik ikon gerigi (Select type) > pilih **Web app**.
3. Isi konfigurasi sebagai berikut:
   - **Description**: `Rilis Aplikasi Surat PKL`
   - **Execute as**: **Me (email Anda)** *(Sangat penting agar pengguna dapat membaca/menulis ke sheet tanpa perlu login editor)*.
   - **Who has access**: **Anyone** *(Siapapun dapat mengakses aplikasi web)*.
4. Klik **Deploy**.
5. Salin tautan **Web App URL** yang diberikan (berakhiran `/exec`). Tautan ini siap digunakan dan dibagikan kepada para guru/staf.

---

## 🏷️ Daftar Variabel Template Surat yang Didukung

Saat membuat atau mengedit redaksi surat di menu **Template Surat**, Anda dapat menggunakan tag variabel berikut. Sistem akan secara otomatis menggantinya dengan data siswa/guru/sekolah yang terpilih:

| Variabel | Deskripsi Penggantian |
| :--- | :--- |
| `{noSurat}` | Nomor surat dinas yang sedang aktif |
| `{tglSurat}` | Tanggal penerbitan surat dinas (misal: *12 November 2026*) |
| `{namaSekolah}` | Nama instansi / sekolah (misal: *SMK Negeri 1 Klungkung*) |
| `{tahunAjaran}` | Tahun ajaran pelaksanaan PKL (misal: *2026/2027*) |
| `{tglPelepasan}` | Tanggal pengantaran / pelepasan siswa ke DU/DI |
| `{periodePkl}` | Rentang periode waktu PKL |
| `{tglPenarikan}` | Tanggal penarikan resmi siswa dari tempat PKL |
| `{guruNama}` | Nama lengkap beserta gelar guru pembimbing yang dipilih |
| `{guruNip}` | NIP guru pembimbing yang dipilih |
| `{tempatPkl}` | Nama perusahaan / instansi DU-DI tempat PKL |
| `{alamatPkl}` | Alamat lengkap perusahaan tempat PKL |
| `{siswaNama}` | Nama lengkap siswa yang sedang aktif |
| `{siswaNisNisn}` | Nomor Induk Siswa & NISN siswa |
| `{tingkatKelas}` | Tingkat kelas siswa (misal: *XII*) |
| `{jurusanPkl}` | Konsentrasi keahlian / kompetensi keahlian siswa |
| `{kepsekNama}` | Nama lengkap dan gelar Kepala Sekolah |
| `{kepsekNip}` | NIP Kepala Sekolah |
| `{kepsekPangkat}` | Pangkat dan Golongan Ruang Kepala Sekolah |
| `{tabelSiswaPermohonan}` | Tabel daftar seluruh siswa pada kelompok DU/DI terkait |

---

## 🛠️ Pemeliharaan & Kustomisasi Selanjutnya

- **Mengganti Logo Sekolah**: Masuk ke menu **Pengaturan** di aplikasi, lalu masukkan URL berkas gambar logo Google Drive Anda pada kolom *URL Logo Aplikasi Web*.
- **Mengganti Kop Surat & TTD**: Masuk ke menu **Pengaturan**, lalu masukkan tautan berkas gambar Kop Surat resmi dan TTD Kepala Sekolah yang telah dibagikan (*Anyone with the link can view*) di Google Drive.
- **Memperbarui Data Siswa**: Anda dapat mengedit langsung di Google Spreadsheet pada sheet `siswa_pkl` atau menggunakan tombol **Impor Data Excel** di modal Database Siswa aplikasi.

---

## 📄 Lisensi
Proyek ini dikembangkan untuk kebutuhan administrasi pendidikan dan pengelolaan PKL SMK. Bebas digunakan dan dimodifikasi sesuai kebutuhan instansi masing-masing.
