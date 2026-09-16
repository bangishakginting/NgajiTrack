export type JenisAktivitas = 'BACA_QURAN' | 'MUROJAAH' | 'HAFALAN';

export interface Aktivitas {
  aktivitas_id: string;
  tanggal: string;
  anggota_id: string;
  naqib_id: string;
  jenis_aktivitas: JenisAktivitas;
  surah?: string;
  ayat_mulai?: number;
  ayat_selesai?: number;
  juz?: number;
  halaman?: number;
  jumlah_ayat?: number;
  jumlah_halaman?: number;
  jumlah_hafalan?: string | number;
  nilai?: number;
  status?: string;
  catatan?: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields for display
  nama_anggota?: string;
  nama_naqib?: string;
}
