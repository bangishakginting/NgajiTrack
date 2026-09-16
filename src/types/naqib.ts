export interface Naqib {
  naqib_id: string;
  nama: string;
  email: string;
  no_hp: string;
  wilayah: string;
  jumlah_anggota: number;
  status: 'aktif' | 'nonaktif';
  created_at?: string;
  updated_at?: string;
}
