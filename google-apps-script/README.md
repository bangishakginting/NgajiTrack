# Panduan Google Apps Script & Google Sheets — NGajiTrack

Dokumen ini berisi panduan lengkap instalasi Google Apps Script (Backend) dan struktur Google Sheets (Database Single Source of Truth).

---

## 1. STRUKTUR GOOGLE SHEETS

Buat 1 file Google Spreadsheet (misalnya bernama `DB_NGAJITRACK`).
Database ini memiliki 5 sheet:

### 1.1 Sheet: `USERS`
Menyimpan akun login pengguna.
| Kolom | Tipe | Keterangan |
|---|---|---|
| `user_id` | String | Contoh: USR001, USR002 |
| `username` | String | Username unik (lowercase) |
| `password_hash` | String | Hash SHA-256 atau plain saat testing |
| `nama` | String | Nama lengkap |
| `email` | String | Email aktif |
| `role` | String | `admin`, `naqib`, atau `anggota` |
| `reference_id` | String | Kosong untuk admin, `naqib_id` untuk naqib, `anggota_id` untuk anggota |
| `status` | String | `aktif` atau `nonaktif` |
| `created_at` | ISO Date | Waktu pembuatan |
| `updated_at` | ISO Date | Waktu update |
| `last_login` | ISO Date | Waktu login terakhir |

### 1.2 Sheet: `NAQIB`
Menyimpan profil Naqib (pembina kelompok).
| Kolom | Tipe | Keterangan |
|---|---|---|
| `naqib_id` | String | Contoh: NQB001, NQB002 |
| `nama` | String | Nama Naqib |
| `email` | String | Email Naqib |
| `no_hp` | String | No WhatsApp / HP |
| `wilayah` | String | Kota / Wilayah Halaqah |
| `jumlah_anggota`| Number | Dihitung otomatis |
| `status` | String | `aktif` / `nonaktif` |
| `created_at` | ISO Date | Waktu pembuatan |
| `updated_at` | ISO Date | Waktu update |

### 1.3 Sheet: `ANGGOTA`
Menyimpan profil anggota binaan. Setiap anggota memiliki satu `naqib_id`.
| Kolom | Tipe | Keterangan |
|---|---|---|
| `anggota_id` | String | Contoh: AGT001, AGT002 |
| `nomor_anggota`| String | No urut / NIK (contoh: 001) |
| `nama` | String | Nama lengkap anggota |
| `email` | String | Email |
| `no_hp` | String | No WhatsApp / HP |
| `jenis_kelamin`| String | `L` atau `P` |
| `tanggal_lahir`| Date/String | Format YYYY-MM-DD |
| `naqib_id` | String | ID Naqib pembina (relasi ke sheet NAQIB) |
| `target_baca_harian` | String | Contoh: "2 halaman" |
| `target_murojaah` | String | Contoh: "1 surat" |
| `target_hafalan` | String | Contoh: "5 ayat" |
| `status` | String | `aktif` / `nonaktif` |
| `created_at` | ISO Date | Waktu pembuatan |
| `updated_at` | ISO Date | Waktu update |

### 1.4 Sheet: `AKTIVITAS`
Tabel transaksi utama pencatatan setoran.
| Kolom | Tipe | Keterangan |
|---|---|---|
| `aktivitas_id` | String | Contoh: AKT0001 |
| `tanggal` | String | YYYY-MM-DD |
| `anggota_id` | String | ID anggota yang setor |
| `naqib_id` | String | ID naqib pembina |
| `jenis_aktivitas` | String | `BACA_QURAN`, `MUROJAAH`, atau `HAFALAN` |
| `surah` | String | Nama Surah Al-Qur'an |
| `ayat_mulai` | Number | Nomor ayat mulai |
| `ayat_selesai` | Number | Nomor ayat selesai |
| `juz` | Number | Juz (1-30) |
| `halaman` | Number | Halaman mushaf |
| `jumlah_ayat` | Number | Total ayat |
| `jumlah_halaman` | Number | Total halaman |
| `jumlah_hafalan` | String/Number | Rincian hafalan |
| `nilai` | Number | Nilai kelancaran/tajwid (0-100) |
| `status` | String | `selesai` |
| `catatan` | String | Catatan anggota / naqib |
| `created_at` | ISO Date | Waktu penyimpanan |
| `updated_at` | ISO Date | Waktu update |

### 1.5 Sheet: `SETTINGS`
Menyimpan konfigurasi key-value aplikasi.
| Kolom | Tipe | Keterangan |
|---|---|---|
| `key` | String | Kunci setting (app_name, tagline, dll) |
| `value` | String | Nilai konfigurasi |
| `updated_at` | ISO Date | Waktu perubahan |

---

## 2. CARA INSTALASI GOOGLE APPS SCRIPT

1. Buka [Google Sheets](https://sheets.google.com) dan buat Spreadsheet baru.
2. Beri nama spreadsheet Anda, misalnya: `Database NGajiTrack`.
3. Di toolbar atas, klik **Extensions** (Ekstensi) > **Apps Script**.
4. Hapus seluruh isi file default `Code.gs`.
5. Salin seluruh isi file `Code.gs` dari folder project ini (`google-apps-script/Code.gs`), lalu tempel ke editor Apps Script.
6. Klik ikon disket **Save** (Simpan).
7. Di dropdown fungsi (di sebelah ikon Run), pilih fungsi:
   - Pilih `setupDatabase` lalu klik **Run** (Jalankan).
   - Atau pilih `seedSampleData` untuk langsung membuat tabel beserta data contoh testing (1 Admin, 2 Naqib, 6 Anggota, dan riwayat aktivitas).
8. Berikan izin otorisasi (Review Permissions > Pilih Akun Google > Advanced > Go to Untitled Project (unsafe) > Allow).
9. Periksa spreadsheet Anda, kini 5 sheet telah otomatis terbuat dengan header warna hijau rapi!

---

## 3. DEPLOY SEBAGAI WEB APP (API ENDPOINT)

1. Di pojok kanan atas Apps Script, klik tombol biru **Deploy** > **New deployment**.
2. Klik ikon gerigi (Select type) di kiri, pilih **Web app**.
3. Konfigurasikan:
   - **Description**: `NGajiTrack Production API`
   - **Execute as**: `Me (email-anda@gmail.com)`
   - **Who has access**: `Anyone` *(PENTING: Harus Anyone agar frontend dapat memanggil API)*
4. Klik **Deploy**.
5. Salin URL yang dihasilkan, formatnya seperti:
   `https://script.google.com/macros/s/AKfycbx.../exec`
6. Simpan URL ini untuk dimasukkan ke variabel environment frontend.

---

## 4. KONFIGURASI FRONTEND (VERCEL / LOCAL)

### 4.1 Di Vercel:
1. Buka Project NGajiTrack di dashboard Vercel.
2. Buka tab **Settings** > **Environment Variables**.
3. Tambahkan:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://script.google.com/macros/s/AKfycbx.../exec`
4. Lakukan **Redeploy**.

### 4.2 Di Komputer Lokal:
1. Buat file `.env.local` di root folder project.
2. Isi dengan:
   ```env
   VITE_API_URL=https://script.google.com/macros/s/AKfycbx.../exec
   ```
3. Jalankan `npm run dev`.

---

## 5. AKUN DEFAULT TESTING (SETELAH SEED)

| Role | Username | Password | Keterangan |
|---|---|---|---|
| **Admin** | `admin` | `Admin123!` | Akses seluruh dashboard, kelola naqib & anggota |
| **Naqib 1** | `naqib01` | `naqib123` | Ahmad Fauzi (Binaan: Muhammad Ali, Zaid, Budi) |
| **Naqib 2** | `naqib02` | `naqib123` | Ustadz Hasan (Binaan: Bilal, Abdullah, Salman) |
| **Anggota 1**| `anggota01` | `anggota123` | Muhammad Ali (Binaan Ahmad Fauzi) |
| **Anggota 2**| `anggota02` | `anggota123` | Zaid bin Tsabit |
| **Anggota 3**| `anggota03` | `anggota123` | Budi Santoso (Perlu Perhatian > 7 hari) |
