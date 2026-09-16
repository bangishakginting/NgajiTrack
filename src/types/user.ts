export type UserRole = 'admin' | 'naqib' | 'anggota';

export interface User {
  user_id: string;
  username: string;
  nama: string;
  email: string;
  role: UserRole;
  reference_id: string; // naqib_id or anggota_id or empty for admin
  status: 'aktif' | 'nonaktif';
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}
