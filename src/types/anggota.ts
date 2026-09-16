export interface Anggota {
  anggota_id: string;
  nomor_anggota: string;
  nama: string;
  email: string;
  no_hp: string;
  jenis_kelamin: 'L' | 'P';
  tanggal_lahir?: string;
  naqib_id: string;
  target_baca_harian: string;
  target_murojaah: string;
  target_hafalan: string;
  status: 'aktif' | 'nonaktif';
  created_at?: string;
  updated_at?: string;
  // Computed fields for UI:
  nama_naqib?: string;
  aktivitas_bulan_ini?: number;
  aktivitas_terakhir?: string;
  hari_tidak_aktif?: number;
  status_keaktifan?: 'Aktif' | 'Perlu Perhatian' | 'Tidak Aktif';
}
