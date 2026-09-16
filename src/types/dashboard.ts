export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface AdminDashboardData {
  total_naqib: number;
  total_anggota: number;
  total_aktivitas_bulan_ini: number;
  total_baca_quran: number;
  total_murojaah: number;
  total_hafalan: number;
  aktivitas_30_hari: { tanggal: string; jumlah: number }[];
  aktivitas_per_jenis: { jenis: string; jumlah: number }[];
  aktivitas_per_naqib: {
    naqib_id: string;
    nama: string;
    jumlah_anggota: number;
    jumlah_aktivitas: number;
    anggota_aktif: number;
  }[];
  aktivitas_terbaru: any[];
}

export interface NaqibDashboardData {
  jumlah_anggota: number;
  anggota_aktif_hari_ini: number;
  total_aktivitas_bulan_ini: number;
  anggota_belum_setor: number;
  anggota_list: {
    anggota_id: string;
    nama: string;
    total_baca: number;
    total_murojaah: number;
    total_hafalan: number;
    aktivitas_terakhir: string;
    status_keaktifan: 'Aktif' | 'Perlu Perhatian' | 'Tidak Aktif';
  }[];
  anggota_teraktif: {
    anggota_id: string;
    nama: string;
    total_aktivitas: number;
  }[];
  anggota_perlu_perhatian: {
    anggota_id: string;
    nama: string;
    aktivitas_terakhir: string;
    hari_tidak_aktif: number;
  }[];
}

export interface AnggotaDashboardData {
  total_aktivitas_bulan_ini: number;
  total_baca_quran: number;
  total_murojaah: number;
  total_hafalan: number;
  jumlah_hari_aktif: number;
  progress_bulan_ini: number; // e.g. percentage against estimated target
  target_baca_harian: string;
  target_murojaah: string;
  target_hafalan: string;
  aktivitas_7_hari: { hari: string; tanggal: string; jumlah: number }[];
  aktivitas_terakhir: any[];
}
