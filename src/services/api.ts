import { ApiResponse, AdminDashboardData, NaqibDashboardData, AnggotaDashboardData } from '../types/dashboard';
import { User } from '../types/user';
import { Naqib } from '../types/naqib';
import { Anggota } from '../types/anggota';
import { Aktivitas } from '../types/aktivitas';
import { authService } from './auth';
import { generateResetPassword } from '../utils/userUtils';

// URL Web App Google Apps Script permanen dari konfigurasi VITE_API_URL Settings / Secrets AI Studio
export const PERMANENT_GAS_URL = 'https://script.google.com/macros/s/AKfycbzmzg4_0dsCxwAx9JCpstBW46YXaZNfjdRNSlDl9s737aWT05t51vUJe4iYL0oBV_Kdrg/exec';

const STORAGE_KEY_GAS_URL = 'ngajitrack_gas_api_url';

export function getEffectiveApiUrl(): string {
  // 1. Prioritas Utama: VITE_API_URL dari Menu Settings / Secrets AI Studio atau file .env
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (envUrl && !envUrl.includes('YOUR_SCRIPT_ID') && envUrl.startsWith('https://script.google.com')) {
    return envUrl;
  }
  return PERMANENT_GAS_URL;
}

export function getCustomGasUrl(): string {
  return getEffectiveApiUrl();
}

export function isLiveApiActive(): boolean {
  const url = getEffectiveApiUrl();
  return Boolean(
    url &&
    !url.includes('YOUR_SCRIPT_ID') &&
    url.startsWith('https://script.google.com')
  );
}

// Untuk backward compatibility
export const API_URL = getEffectiveApiUrl();
export const isLiveApiConfigured = isLiveApiActive();

export interface GasConnectionState {
  activeUrl: string;
  isConfigured: boolean;
  isConnected: boolean;
  isFallback: boolean;
  errorMessage?: string;
}

export let gasConnectionState: GasConnectionState = {
  activeUrl: getEffectiveApiUrl(),
  isConfigured: isLiveApiActive(),
  isConnected: false,
  isFallback: !isLiveApiActive(),
};

type GasListener = (state: GasConnectionState) => void;
const gasListeners: GasListener[] = [];

export function subscribeGasConnection(listener: GasListener): () => void {
  gasListeners.push(listener);
  listener(gasConnectionState);
  return () => {
    const idx = gasListeners.indexOf(listener);
    if (idx !== -1) gasListeners.splice(idx, 1);
  };
}

export function setGasState(update: Partial<GasConnectionState>) {
  gasConnectionState = { ...gasConnectionState, ...update };
  gasListeners.forEach((fn) => {
    try {
      fn(gasConnectionState);
    } catch (_) {}
  });
}

export async function setCustomGasUrl(newUrl: string): Promise<void> {
  const trimmed = newUrl.trim();
  if (typeof window !== 'undefined') {
    if (!trimmed) {
      localStorage.removeItem(STORAGE_KEY_GAS_URL);
    } else {
      localStorage.setItem(STORAGE_KEY_GAS_URL, trimmed);
    }
  }

  // Kirim ke backend proxy lokal agar file .env dan server sinkron
  try {
    await fetch('/api/gas/set-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: trimmed }),
    });
  } catch (_) {}

  const active = getEffectiveApiUrl();
  const configured = Boolean(active && active.startsWith('https://script.google.com'));

  setGasState({
    activeUrl: active,
    isConfigured: configured,
    isConnected: false,
    isFallback: !configured,
    errorMessage: undefined,
  });
}

/**
 * Simulasi Database Google Sheets di memori browser
 * Digunakan jika Google Apps Script Web App belum terhubung atau belum memiliki fungsi doPost
 */
const nowIso = new Date().toISOString();
const todayStr = new Date().toISOString().split('T')[0];

const getPastDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

let simUsers: any[] = [
  { user_id: 'USR001', username: 'admin', password: 'Admin123!', nama: 'Administrator', email: 'admin@ngajitrack.id', role: 'admin', reference_id: '', status: 'aktif' },
  { user_id: 'USR002', username: 'naqib01', password: 'Naqib123!', nama: 'Ahmad Fauzi', email: 'ahmad@ngajitrack.id', role: 'naqib', reference_id: 'NQB001', status: 'aktif' },
  { user_id: 'USR003', username: 'naqib02', password: 'Naqib123!', nama: 'Ustadz Hasan', email: 'hasan@ngajitrack.id', role: 'naqib', reference_id: 'NQB002', status: 'aktif' },
  { user_id: 'USR004', username: 'anggota01', password: 'Anggota123!', nama: 'Muhammad Ali', email: 'ali@email.com', role: 'anggota', reference_id: 'AGT001', status: 'aktif' },
  { user_id: 'USR005', username: 'anggota02', password: 'Anggota123!', nama: 'Zaid bin Tsabit', email: 'zaid@email.com', role: 'anggota', reference_id: 'AGT002', status: 'aktif' },
  { user_id: 'USR006', username: 'anggota03', password: 'Anggota123!', nama: 'Budi Santoso', email: 'budi@email.com', role: 'anggota', reference_id: 'AGT003', status: 'aktif' },
  { user_id: 'USR007', username: 'anggota04', password: 'Anggota123!', nama: 'Bilal Al-Habasyi', email: 'bilal@email.com', role: 'anggota', reference_id: 'AGT004', status: 'aktif' },
  { user_id: 'USR008', username: 'anggota05', password: 'Anggota123!', nama: 'Abdullah bin Mas\'ud', email: 'abdullah@email.com', role: 'anggota', reference_id: 'AGT005', status: 'aktif' },
  { user_id: 'USR009', username: 'anggota06', password: 'Anggota123!', nama: 'Salman Al-Farisi', email: 'salman@email.com', role: 'anggota', reference_id: 'AGT006', status: 'aktif' },
];

let simNaqib: Naqib[] = [
  { naqib_id: 'NQB001', nama: 'Ahmad Fauzi', email: 'ahmad@ngajitrack.id', no_hp: '081234567890', wilayah: 'Bandung', jumlah_anggota: 3, status: 'aktif', created_at: nowIso, updated_at: nowIso },
  { naqib_id: 'NQB002', nama: 'Ustadz Hasan', email: 'hasan@ngajitrack.id', no_hp: '081298765432', wilayah: 'Jakarta', jumlah_anggota: 3, status: 'aktif', created_at: nowIso, updated_at: nowIso },
];

let simAnggota: Anggota[] = [
  { anggota_id: 'AGT001', nomor_anggota: '001', nama: 'Muhammad Ali', email: 'ali@email.com', no_hp: '0811111111', jenis_kelamin: 'L', tanggal_lahir: '2000-01-01', naqib_id: 'NQB001', target_baca_harian: '2 halaman', target_murojaah: '1 surat', target_hafalan: '5 ayat', status: 'aktif', created_at: nowIso, updated_at: nowIso },
  { anggota_id: 'AGT002', nomor_anggota: '002', nama: 'Zaid bin Tsabit', email: 'zaid@email.com', no_hp: '0811111112', jenis_kelamin: 'L', tanggal_lahir: '2001-03-15', naqib_id: 'NQB001', target_baca_harian: '3 halaman', target_murojaah: '1 juz', target_hafalan: '10 ayat', status: 'aktif', created_at: nowIso, updated_at: nowIso },
  { anggota_id: 'AGT003', nomor_anggota: '003', nama: 'Budi Santoso', email: 'budi@email.com', no_hp: '0811111113', jenis_kelamin: 'L', tanggal_lahir: '1999-07-20', naqib_id: 'NQB001', target_baca_harian: '1 halaman', target_murojaah: '1 maqra', target_hafalan: '3 ayat', status: 'aktif', created_at: nowIso, updated_at: nowIso },
  { anggota_id: 'AGT004', nomor_anggota: '004', nama: 'Bilal Al-Habasyi', email: 'bilal@email.com', no_hp: '0811111114', jenis_kelamin: 'L', tanggal_lahir: '2002-11-10', naqib_id: 'NQB002', target_baca_harian: '2 halaman', target_murojaah: '1 surat', target_hafalan: '7 ayat', status: 'aktif', created_at: nowIso, updated_at: nowIso },
  { anggota_id: 'AGT005', nomor_anggota: '005', nama: 'Abdullah bin Mas\'ud', email: 'abdullah@email.com', no_hp: '0811111115', jenis_kelamin: 'L', tanggal_lahir: '2000-05-25', naqib_id: 'NQB002', target_baca_harian: '4 halaman', target_murojaah: '2 surat', target_hafalan: '10 ayat', status: 'aktif', created_at: nowIso, updated_at: nowIso },
  { anggota_id: 'AGT006', nomor_anggota: '006', nama: 'Salman Al-Farisi', email: 'salman@email.com', no_hp: '0811111116', jenis_kelamin: 'L', tanggal_lahir: '1998-09-08', naqib_id: 'NQB002', target_baca_harian: '1 halaman', target_murojaah: '1 surat', target_hafalan: '5 ayat', status: 'aktif', created_at: nowIso, updated_at: nowIso },
];

let simAktivitas: Aktivitas[] = [
  { aktivitas_id: 'AKT0001', tanggal: todayStr, anggota_id: 'AGT001', naqib_id: 'NQB001', jenis_aktivitas: 'BACA_QURAN', surah: 'Al-Baqarah', ayat_mulai: 1, ayat_selesai: 10, juz: 1, halaman: 1, jumlah_ayat: 10, jumlah_halaman: 1, status: 'selesai', catatan: 'Tilawah ba\'da Shubuh', created_at: nowIso },
  { aktivitas_id: 'AKT0002', tanggal: todayStr, anggota_id: 'AGT001', naqib_id: 'NQB001', jenis_aktivitas: 'MUROJAAH', surah: 'Al-Mulk', ayat_mulai: 1, ayat_selesai: 15, juz: 29, jumlah_ayat: 15, status: 'selesai', catatan: 'Lancar dan tartil', created_at: nowIso },
  { aktivitas_id: 'AKT0003', tanggal: todayStr, anggota_id: 'AGT001', naqib_id: 'NQB001', jenis_aktivitas: 'HAFALAN', surah: 'An-Naba\'', ayat_mulai: 1, ayat_selesai: 10, juz: 30, jumlah_ayat: 10, jumlah_hafalan: '10 ayat', nilai: 85, status: 'selesai', catatan: 'Masih perlu memperbaiki tajwid ayat 6-8.', created_at: nowIso },
  { aktivitas_id: 'AKT0004', tanggal: getPastDateStr(1), anggota_id: 'AGT001', naqib_id: 'NQB001', jenis_aktivitas: 'BACA_QURAN', surah: 'Al-Baqarah', ayat_mulai: 11, ayat_selesai: 25, juz: 1, halaman: 2, jumlah_ayat: 15, jumlah_halaman: 1, status: 'selesai', catatan: 'Lancar', created_at: nowIso },
  { aktivitas_id: 'AKT0005', tanggal: getPastDateStr(2), anggota_id: 'AGT002', naqib_id: 'NQB001', jenis_aktivitas: 'BACA_QURAN', surah: 'Ali \'Imran', ayat_mulai: 1, ayat_selesai: 20, juz: 3, halaman: 50, jumlah_ayat: 20, jumlah_halaman: 2, status: 'selesai', catatan: 'Tilawah rutin', created_at: nowIso },
  { aktivitas_id: 'AKT0006', tanggal: getPastDateStr(2), anggota_id: 'AGT002', naqib_id: 'NQB001', jenis_aktivitas: 'HAFALAN', surah: 'An-Nazi\'at', ayat_mulai: 1, ayat_selesai: 15, juz: 30, jumlah_ayat: 15, jumlah_hafalan: '15 ayat', nilai: 92, status: 'selesai', catatan: 'Sangat lancar', created_at: nowIso },
  { aktivitas_id: 'AKT0007', tanggal: getPastDateStr(9), anggota_id: 'AGT003', naqib_id: 'NQB001', jenis_aktivitas: 'BACA_QURAN', surah: 'Al-Kahf', ayat_mulai: 1, ayat_selesai: 10, juz: 15, halaman: 293, jumlah_ayat: 10, jumlah_halaman: 1, status: 'selesai', catatan: 'Tilawah Jumat', created_at: nowIso },
  { aktivitas_id: 'AKT0008', tanggal: todayStr, anggota_id: 'AGT004', naqib_id: 'NQB002', jenis_aktivitas: 'BACA_QURAN', surah: 'Ya-Sin', ayat_mulai: 1, ayat_selesai: 30, juz: 22, halaman: 440, jumlah_ayat: 30, jumlah_halaman: 2, status: 'selesai', catatan: 'Ba\'da Maghrib', created_at: nowIso },
  { aktivitas_id: 'AKT0009', tanggal: getPastDateStr(1), anggota_id: 'AGT004', naqib_id: 'NQB002', jenis_aktivitas: 'MUROJAAH', surah: 'Ar-Rahman', ayat_mulai: 1, ayat_selesai: 40, juz: 27, jumlah_ayat: 40, status: 'selesai', catatan: 'Lancar', created_at: nowIso },
  { aktivitas_id: 'AKT0010', tanggal: getPastDateStr(1), anggota_id: 'AGT005', naqib_id: 'NQB002', jenis_aktivitas: 'HAFALAN', surah: 'Al-Waqi\'ah', ayat_mulai: 1, ayat_selesai: 25, juz: 27, jumlah_ayat: 25, jumlah_hafalan: '25 ayat', nilai: 95, status: 'selesai', catatan: 'Mumtaz', created_at: nowIso },
  { aktivitas_id: 'AKT0011', tanggal: getPastDateStr(5), anggota_id: 'AGT006', naqib_id: 'NQB002', jenis_aktivitas: 'BACA_QURAN', surah: 'Al-Mulk', ayat_mulai: 1, ayat_selesai: 30, juz: 29, halaman: 562, jumlah_ayat: 30, jumlah_halaman: 2, status: 'selesai', catatan: 'Murojaah malam', created_at: nowIso }
];

let simSettings: Record<string, string> = {
  app_name: 'NGajiTrack',
  app_tagline: 'Catat, Monitor, dan Tingkatkan Tilawah Al-Qur\'an',
  default_target_baca: '2 halaman',
  default_target_murojaah: '1 surat',
  default_target_hafalan: '5 ayat'
};

/**
 * Main Network Request Wrapper
 * Memanggil Google Apps Script Web App dengan Content-Type: text/plain
 * atau melalui proxy /api/gas. Jika server Google Apps Script belum siap
 * (misal fungsi doPost belum dideploy), aplikasi otomatis beralih ke mode
 * simulasi sehingga tidak crash dan seluruh fitur tetap dapat digunakan.
 */
async function callGasApi<T>(action: string, payload: Record<string, any> = {}): Promise<ApiResponse<T>> {
  const currentUser = authService.getUser();
  const requestBody = {
    action,
    auth_user_id: currentUser ? currentUser.user_id : undefined,
    ...payload,
  };

  const effectiveUrl = getEffectiveApiUrl();
  const isConfigured = isLiveApiActive();

  if (isConfigured && effectiveUrl) {
    let liveSuccess = false;
    let liveResult: any = null;

    // 1. Coba melalui proxy internal /api/gas untuk melewati batasan CORS & redirect browser
    try {
      const proxyRes = await fetch('/api/gas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gas-url': effectiveUrl,
        },
        body: JSON.stringify({ ...requestBody, _gas_url: effectiveUrl }),
      });

      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.isGasNotReady) {
          setGasState({
            activeUrl: effectiveUrl,
            isConfigured: true,
            isConnected: false,
            isFallback: true,
            errorMessage: data.message || 'Fungsi doPost belum terpasang di Google Apps Script.',
          });
        } else if (data.success !== undefined) {
          liveSuccess = true;
          liveResult = data;
          setGasState({
            activeUrl: effectiveUrl,
            isConfigured: true,
            isConnected: true,
            isFallback: false,
            errorMessage: undefined,
          });
        }
      }
    } catch (_) {
      // 2. Jika proxy /api/gas tidak tersedia (misal di Vercel build murni tanpa serverless), coba direct fetch
      try {
        const directRes = await fetch(effectiveUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(requestBody),
        });

        if (directRes.ok) {
          const directData = await directRes.json();
          if (directData && directData.success !== undefined) {
            liveSuccess = true;
            liveResult = directData;
            setGasState({
              activeUrl: effectiveUrl,
              isConfigured: true,
              isConnected: true,
              isFallback: false,
              errorMessage: undefined,
            });
          }
        }
      } catch (err: any) {
        setGasState({
          activeUrl: effectiveUrl,
          isConfigured: true,
          isConnected: false,
          isFallback: true,
          errorMessage: 'Tidak dapat menjangkau Google Apps Script langsung (CORS/Deployment). Mengalihkan ke database simulasi.',
        });
      }
    }

    if (liveSuccess && liveResult) {
      return liveResult as ApiResponse<T>;
    }
  }

  // JIKA VITE_API_URL belum terhubung atau GAS belum memiliki fungsi doPost,
  // jalankan mesin simulasi Google Sheets di memori agar user tetap dapat menguji aplikasi
  await new Promise((resolve) => setTimeout(resolve, 150));
  return handleSimulatedApi<T>(action, requestBody);
}

/**
 * Simulated Engine matching Google Apps Script Logic
 */
function handleSimulatedApi<T>(action: string, payload: any): ApiResponse<T> {
  const authUser = payload.auth_user_id
    ? simUsers.find(u => u.user_id === payload.auth_user_id)
    : null;

  switch (action) {
    case 'login': {
      const { username, password } = payload;
      const user = simUsers.find(
        u => u.username.toLowerCase() === (username || '').trim().toLowerCase()
      );
      if (!user || user.password !== password) {
        return { success: false, message: 'Username atau password salah.' };
      }
      if (user.status !== 'aktif') {
        return { success: false, message: 'Akun Anda dinonaktifkan. Hubungi admin.' };
      }
      const safeUser = { ...user };
      delete safeUser.password;
      return { success: true, message: 'Login berhasil', data: safeUser as any };
    }

    case 'getCurrentUser': {
      if (!authUser) return { success: false, message: 'Sesi tidak valid' };
      const safeUser = { ...authUser };
      delete safeUser.password;
      return { success: true, message: 'Data user berhasil diambil', data: safeUser as any };
    }

    // NAQIB
    case 'getNaqib': {
      if (authUser?.role !== 'admin') {
        return { success: false, message: 'Akses ditolak: Khusus Admin' };
      }
      // calculate real member counts
      const counts: Record<string, number> = {};
      simAnggota.forEach(a => {
        if (a.status === 'aktif') counts[a.naqib_id] = (counts[a.naqib_id] || 0) + 1;
      });
      const list = simNaqib.map(n => ({
        ...n,
        jumlah_anggota: counts[n.naqib_id] || 0
      }));
      return { success: true, message: 'Data Naqib berhasil diambil', data: list as any };
    }

    case 'createNaqib': {
      if (authUser?.role !== 'admin') {
        return { success: false, message: 'Hanya admin yang dapat menambah Naqib' };
      }
      const newNaqibId = `NQB${String(simNaqib.length + 1).padStart(3, '0')}`;
      const newUserId = `USR${String(simUsers.length + 1).padStart(3, '0')}`;
      const now = new Date().toISOString();

      const newNaqib: Naqib = {
        naqib_id: newNaqibId,
        nama: payload.nama,
        email: payload.email || '',
        no_hp: payload.no_hp || '',
        wilayah: payload.wilayah || '',
        jumlah_anggota: 0,
        status: 'aktif',
        created_at: now,
        updated_at: now
      };
      simNaqib.push(newNaqib);

      simUsers.push({
        user_id: newUserId,
        username: payload.username.toLowerCase(),
        password: payload.password || 'Naqib123!',
        nama: payload.nama,
        email: payload.email || '',
        role: 'naqib',
        reference_id: newNaqibId,
        status: 'aktif'
      });

      return { success: true, message: 'Data Naqib berhasil disimpan', data: newNaqib as any };
    }

    case 'updateNaqib': {
      if (authUser?.role !== 'admin') {
        return { success: false, message: 'Hanya admin yang berwenang' };
      }
      const idx = simNaqib.findIndex(n => n.naqib_id === payload.naqib_id);
      if (idx === -1) return { success: false, message: 'Naqib tidak ditemukan' };
      simNaqib[idx] = { ...simNaqib[idx], ...payload, updated_at: new Date().toISOString() };
      return { success: true, message: 'Data Naqib berhasil disimpan' };
    }

    // ANGGOTA
    case 'getAnggota': {
      const naqibMap: Record<string, string> = {};
      simNaqib.forEach(n => { naqibMap[n.naqib_id] = n.nama; });

      let list = [...simAnggota];
      if (authUser?.role === 'naqib') {
        list = list.filter(a => a.naqib_id === authUser.reference_id);
      } else if (authUser?.role === 'anggota') {
        list = list.filter(a => a.anggota_id === authUser.reference_id);
      } else if (authUser?.role === 'admin' && payload.naqib_id) {
        list = list.filter(a => a.naqib_id === payload.naqib_id);
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const enriched = list.map(a => {
        const userActs = simAktivitas.filter(act => act.anggota_id === a.anggota_id);
        const thisMonthActs = userActs.filter(act => {
          const d = new Date(act.tanggal);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        // Last activity
        let lastDate: string | null = null;
        userActs.forEach(act => {
          if (!lastDate || act.tanggal > lastDate) lastDate = act.tanggal;
        });

        let daysInactive = 999;
        let statusKeaktifan: 'Aktif' | 'Perlu Perhatian' | 'Tidak Aktif' = 'Tidak Aktif';
        if (lastDate) {
          const d = new Date(lastDate);
          daysInactive = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
          if (daysInactive <= 3) statusKeaktifan = 'Aktif';
          else if (daysInactive <= 7) statusKeaktifan = 'Perlu Perhatian';
          else statusKeaktifan = 'Tidak Aktif';
        }

        return {
          ...a,
          nama_naqib: naqibMap[a.naqib_id] || '-',
          aktivitas_bulan_ini: thisMonthActs.length,
          aktivitas_terakhir: lastDate,
          hari_tidak_aktif: daysInactive,
          status_keaktifan: statusKeaktifan
        };
      });

      return { success: true, message: 'Data anggota berhasil diambil', data: enriched as any };
    }

    case 'getAnggotaById': {
      const agt = simAnggota.find(a => a.anggota_id === payload.anggota_id);
      if (!agt) return { success: false, message: 'Anggota tidak ditemukan' };
      const myNaqib = simNaqib.find(n => n.naqib_id === agt.naqib_id);
      return {
        success: true,
        message: 'Detail anggota berhasil diambil',
        data: { ...agt, nama_naqib: myNaqib ? myNaqib.nama : '-' } as any
      };
    }

    case 'createAnggota': {
      if (authUser?.role !== 'admin') {
        return { success: false, message: 'Hanya admin yang berwenang' };
      }
      const nextNum = simAnggota.length + 1;
      const newAnggotaId = `AGT${String(nextNum).padStart(3, '0')}`;
      const newUserId = `USR${String(simUsers.length + 1).padStart(3, '0')}`;
      const now = new Date().toISOString();

      const newAnggota: Anggota = {
        anggota_id: newAnggotaId,
        nomor_anggota: payload.nomor_anggota || String(nextNum).padStart(3, '0'),
        nama: payload.nama,
        email: payload.email || '',
        no_hp: payload.no_hp || '',
        jenis_kelamin: payload.jenis_kelamin || 'L',
        tanggal_lahir: payload.tanggal_lahir || '',
        naqib_id: payload.naqib_id,
        target_baca_harian: payload.target_baca_harian || '2 halaman',
        target_murojaah: payload.target_murojaah || '1 surat',
        target_hafalan: payload.target_hafalan || '5 ayat',
        status: 'aktif',
        created_at: now,
        updated_at: now
      };
      simAnggota.push(newAnggota);

      simUsers.push({
        user_id: newUserId,
        username: payload.username.toLowerCase(),
        password: payload.password || 'Anggota123!',
        nama: payload.nama,
        email: payload.email || '',
        role: 'anggota',
        reference_id: newAnggotaId,
        status: 'aktif'
      });

      return { success: true, message: 'Data anggota berhasil disimpan', data: newAnggota as any };
    }

    case 'updateAnggota': {
      if (authUser?.role !== 'admin') {
        return { success: false, message: 'Hanya admin yang berwenang' };
      }
      const idx = simAnggota.findIndex(a => a.anggota_id === payload.anggota_id);
      if (idx === -1) return { success: false, message: 'Anggota tidak ditemukan' };
      simAnggota[idx] = { ...simAnggota[idx], ...payload, updated_at: new Date().toISOString() };
      return { success: true, message: 'Data anggota berhasil disimpan' };
    }

    case 'resetPasswordAnggota': {
      if (authUser?.role !== 'admin') {
        return { success: false, message: 'Hanya admin yang berwenang me-reset password anggota' };
      }
      const agt = simAnggota.find(a => a.anggota_id === payload.anggota_id);
      if (!agt) return { success: false, message: 'Anggota tidak ditemukan' };
      
      const newPassword = payload.new_password || generateResetPassword(agt.nama);
      
      // Update password di simUsers
      const usr = simUsers.find(u => u.reference_id === agt.anggota_id || (u.role === 'anggota' && u.nama === agt.nama));
      if (usr) {
        usr.password = newPassword;
      }
      return {
        success: true,
        message: `Password berhasil di-reset menjadi: ${newPassword}`,
        data: { password: newPassword } as any
      };
    }

    // AKTIVITAS
    case 'getAktivitas': {
      const agtMap: Record<string, string> = {};
      simAnggota.forEach(a => { agtMap[a.anggota_id] = a.nama; });
      const nqbMap: Record<string, string> = {};
      simNaqib.forEach(n => { nqbMap[n.naqib_id] = n.nama; });

      let list = [...simAktivitas];
      if (authUser?.role === 'naqib') {
        list = list.filter(a => a.naqib_id === authUser.reference_id);
      } else if (authUser?.role === 'anggota') {
        list = list.filter(a => a.anggota_id === authUser.reference_id);
      } else if (authUser?.role === 'admin') {
        if (payload.naqib_id) list = list.filter(a => a.naqib_id === payload.naqib_id);
        if (payload.anggota_id) list = list.filter(a => a.anggota_id === payload.anggota_id);
      }

      if (payload.jenis_aktivitas) {
        list = list.filter(a => a.jenis_aktivitas === payload.jenis_aktivitas);
      }
      if (payload.start_date) {
        list = list.filter(a => a.tanggal >= payload.start_date);
      }
      if (payload.end_date) {
        list = list.filter(a => a.tanggal <= payload.end_date);
      }

      const enriched = list.map(act => ({
        ...act,
        nama_anggota: agtMap[act.anggota_id] || '-',
        nama_naqib: nqbMap[act.naqib_id] || '-'
      }));

      enriched.sort((x, y) => new Date(y.tanggal).getTime() - new Date(x.tanggal).getTime());
      return { success: true, message: 'Data aktivitas berhasil diambil', data: enriched as any };
    }

    case 'createAktivitas': {
      let anggota_id = payload.anggota_id;
      if (authUser?.role === 'anggota') {
        anggota_id = authUser.reference_id;
      }
      const agt = simAnggota.find(a => a.anggota_id === anggota_id);
      if (!agt) return { success: false, message: 'Anggota tidak ditemukan' };

      const newId = `AKT${String(simAktivitas.length + 1).padStart(4, '0')}`;
      const now = new Date().toISOString();

      const newAct: Aktivitas = {
        aktivitas_id: newId,
        tanggal: payload.tanggal || todayStr,
        anggota_id: agt.anggota_id,
        naqib_id: agt.naqib_id,
        jenis_aktivitas: payload.jenis_aktivitas,
        surah: payload.surah || '',
        ayat_mulai: payload.ayat_mulai ? Number(payload.ayat_mulai) : undefined,
        ayat_selesai: payload.ayat_selesai ? Number(payload.ayat_selesai) : undefined,
        juz: payload.juz ? Number(payload.juz) : undefined,
        halaman: payload.halaman ? Number(payload.halaman) : undefined,
        jumlah_ayat: payload.jumlah_ayat ? Number(payload.jumlah_ayat) : undefined,
        jumlah_halaman: payload.jumlah_halaman ? Number(payload.jumlah_halaman) : undefined,
        jumlah_hafalan: payload.jumlah_hafalan || '',
        nilai: payload.nilai ? Number(payload.nilai) : undefined,
        status: 'selesai',
        catatan: payload.catatan || '',
        created_at: now,
        updated_at: now
      };

      simAktivitas.unshift(newAct);
      return { success: true, message: 'Data berhasil disimpan', data: newAct as any };
    }

    case 'deleteAktivitas': {
      const idx = simAktivitas.findIndex(a => a.aktivitas_id === payload.aktivitas_id);
      if (idx === -1) return { success: false, message: 'Aktivitas tidak ditemukan' };
      simAktivitas.splice(idx, 1);
      return { success: true, message: 'Aktivitas berhasil dihapus' };
    }

    // DASHBOARDS
    case 'getAdminDashboard': {
      if (authUser?.role !== 'admin') return { success: false, message: 'Akses ditolak' };
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let totalBulanIni = 0;
      let totalBaca = 0;
      let totalMurojaah = 0;
      let totalHafalan = 0;

      const dailyMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        dailyMap[d.toISOString().split('T')[0]] = 0;
      }

      const activeAnggotaSet = new Set<string>();
      const threeDaysAgo = getPastDateStr(3);

      simAktivitas.forEach(a => {
        const d = new Date(a.tanggal);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          totalBulanIni++;
          if (a.jenis_aktivitas === 'BACA_QURAN') totalBaca++;
          else if (a.jenis_aktivitas === 'MUROJAAH') totalMurojaah++;
          else if (a.jenis_aktivitas === 'HAFALAN') totalHafalan++;
        }
        if (dailyMap[a.tanggal] !== undefined) {
          dailyMap[a.tanggal]++;
        }
        if (a.tanggal >= threeDaysAgo) {
          activeAnggotaSet.add(a.anggota_id);
        }
      });

      const perNaqib = simNaqib.map(n => {
        const memberIds = simAnggota.filter(a => a.naqib_id === n.naqib_id).map(a => a.anggota_id);
        const acts = simAktivitas.filter(a => a.naqib_id === n.naqib_id);
        const activeCount = memberIds.filter(id => activeAnggotaSet.has(id)).length;
        return {
          naqib_id: n.naqib_id,
          nama: n.nama,
          jumlah_anggota: memberIds.length,
          jumlah_aktivitas: acts.length,
          anggota_aktif: activeCount
        };
      });

      const dailyChart = Object.keys(dailyMap).sort().map(k => ({ tanggal: k, jumlah: dailyMap[k] }));

      const dashboardData: AdminDashboardData = {
        total_naqib: simNaqib.filter(n => n.status === 'aktif').length,
        total_anggota: simAnggota.filter(a => a.status === 'aktif').length,
        total_aktivitas_bulan_ini: totalBulanIni,
        total_baca_quran: totalBaca,
        total_murojaah: totalMurojaah,
        total_hafalan: totalHafalan,
        aktivitas_30_hari: dailyChart,
        aktivitas_per_jenis: [
          { jenis: "Baca Qur'an", jumlah: totalBaca },
          { jenis: "Muroja'ah", jumlah: totalMurojaah },
          { jenis: "Hafalan", jumlah: totalHafalan }
        ],
        aktivitas_per_naqib: perNaqib,
        aktivitas_terbaru: simAktivitas.slice(0, 5)
      };

      return { success: true, message: 'Dashboard admin berhasil dimuat', data: dashboardData as any };
    }

    case 'getNaqibDashboard': {
      if (authUser?.role !== 'naqib') return { success: false, message: 'Akses ditolak' };
      const myNaqibId = authUser.reference_id;
      const myMembers = simAnggota.filter(a => a.naqib_id === myNaqibId && a.status === 'aktif');
      const myActs = simAktivitas.filter(a => a.naqib_id === myNaqibId);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let totalMonth = 0;
      const todaySet = new Set<string>();

      const memberStats: Record<string, any> = {};
      myMembers.forEach(m => {
        memberStats[m.anggota_id] = {
          anggota_id: m.anggota_id,
          nama: m.nama,
          total_baca: 0,
          total_murojaah: 0,
          total_hafalan: 0,
          total_aktivitas: 0,
          aktivitas_terakhir: null,
          hari_tidak_aktif: 999,
          status_keaktifan: 'Tidak Aktif'
        };
      });

      myActs.forEach(a => {
        const d = new Date(a.tanggal);
        if (a.tanggal === todayStr) {
          todaySet.add(a.anggota_id);
        }
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          totalMonth++;
        }
        if (memberStats[a.anggota_id]) {
          const st = memberStats[a.anggota_id];
          st.total_aktivitas++;
          if (a.jenis_aktivitas === 'BACA_QURAN') st.total_baca++;
          else if (a.jenis_aktivitas === 'MUROJAAH') st.total_murojaah++;
          else if (a.jenis_aktivitas === 'HAFALAN') st.total_hafalan++;
          if (!st.aktivitas_terakhir || a.tanggal > st.aktivitas_terakhir) {
            st.aktivitas_terakhir = a.tanggal;
          }
        }
      });

      const list = Object.values(memberStats);
      const perhatianList: any[] = [];

      list.forEach(m => {
        if (!m.aktivitas_terakhir) {
          m.hari_tidak_aktif = 999;
          m.status_keaktifan = 'Tidak Aktif';
          perhatianList.push({
            anggota_id: m.anggota_id,
            nama: m.nama,
            aktivitas_terakhir: 'Belum pernah',
            hari_tidak_aktif: 999
          });
        } else {
          const d = new Date(m.aktivitas_terakhir);
          const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
          m.hari_tidak_aktif = diff;
          if (diff <= 3) m.status_keaktifan = 'Aktif';
          else if (diff <= 7) m.status_keaktifan = 'Perlu Perhatian';
          else m.status_keaktifan = 'Tidak Aktif';

          if (diff >= 7) {
            perhatianList.push({
              anggota_id: m.anggota_id,
              nama: m.nama,
              aktivitas_terakhir: m.aktivitas_terakhir,
              hari_tidak_aktif: diff
            });
          }
        }
      });

      const ranking = list.slice().sort((a, b) => b.total_aktivitas - a.total_aktivitas);

      const dashboardData: NaqibDashboardData = {
        jumlah_anggota: myMembers.length,
        anggota_aktif_hari_ini: todaySet.size,
        total_aktivitas_bulan_ini: totalMonth,
        anggota_belum_setor: Math.max(0, myMembers.length - todaySet.size),
        anggota_list: list,
        anggota_teraktif: ranking.slice(0, 5),
        anggota_perlu_perhatian: perhatianList
      };

      return { success: true, message: 'Dashboard Naqib berhasil dimuat', data: dashboardData as any };
    }

    case 'getAnggotaDashboard': {
      if (authUser?.role !== 'anggota') return { success: false, message: 'Akses ditolak' };
      const myId = authUser.reference_id;
      const me = simAnggota.find(a => a.anggota_id === myId) || ({} as any);
      const myActs = simAktivitas.filter(a => a.anggota_id === myId);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let totalMonth = 0;
      let totalBaca = 0;
      let totalMurojaah = 0;
      let totalHafalan = 0;
      const activeDays = new Set<string>();

      const daysOfWeek = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const last7: Record<string, { hari: string; tanggal: string; jumlah: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dtStr = d.toISOString().split('T')[0];
        last7[dtStr] = {
          hari: daysOfWeek[d.getDay()],
          tanggal: dtStr,
          jumlah: 0
        };
      }

      myActs.forEach(a => {
        const d = new Date(a.tanggal);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          totalMonth++;
          activeDays.add(a.tanggal);
          if (a.jenis_aktivitas === 'BACA_QURAN') totalBaca++;
          else if (a.jenis_aktivitas === 'MUROJAAH') totalMurojaah++;
          else if (a.jenis_aktivitas === 'HAFALAN') totalHafalan++;
        }
        if (last7[a.tanggal]) {
          last7[a.tanggal].jumlah++;
        }
      });

      const dashboardData: AnggotaDashboardData = {
        total_aktivitas_bulan_ini: totalMonth,
        total_baca_quran: totalBaca,
        total_murojaah: totalMurojaah,
        total_hafalan: totalHafalan,
        jumlah_hari_aktif: activeDays.size,
        progress_bulan_ini: Math.min(100, Math.round((totalMonth / 30) * 100)),
        target_baca_harian: me.target_baca_harian || '2 halaman',
        target_murojaah: me.target_murojaah || '1 surat',
        target_hafalan: me.target_hafalan || '5 ayat',
        aktivitas_7_hari: Object.values(last7),
        aktivitas_terakhir: myActs.slice(0, 5)
      };

      return { success: true, message: 'Dashboard Anggota berhasil dimuat', data: dashboardData as any };
    }

    case 'getSettings': {
      return { success: true, message: 'Settings berhasil diambil', data: simSettings as any };
    }

    case 'updateSettings': {
      if (authUser?.role !== 'admin') return { success: false, message: 'Khusus admin' };
      simSettings = { ...simSettings, ...(payload.settings || {}) };
      return { success: true, message: 'Pengaturan berhasil disimpan' };
    }

    default:
      return { success: false, message: `Aksi ${action} tidak ditemukan` };
  }
}

/**
 * Single Exported API Service
 */
export const api = {
  // AUTH
  async login(username: string, password: string): Promise<User> {
    const res = await callGasApi<User>('login', { username, password });
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Username atau password salah.');
    }
    return res.data;
  },

  async getCurrentUser(): Promise<User> {
    const res = await callGasApi<User>('getCurrentUser');
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Sesi tidak valid.');
    }
    return res.data;
  },

  // NAQIB
  async getNaqib(): Promise<Naqib[]> {
    const res = await callGasApi<Naqib[]>('getNaqib');
    if (!res.success) throw new Error(res.message || 'Data gagal dimuat.');
    return res.data || [];
  },

  async createNaqib(data: Partial<Naqib> & { username: string; password?: string }): Promise<Naqib> {
    const res = await callGasApi<Naqib>('createNaqib', data);
    if (!res.success) throw new Error(res.message || 'Data gagal disimpan. Silakan coba kembali.');
    return res.data as Naqib;
  },

  async updateNaqib(data: Partial<Naqib> & { naqib_id: string }): Promise<void> {
    const res = await callGasApi('updateNaqib', data);
    if (!res.success) throw new Error(res.message || 'Data gagal disimpan. Silakan coba kembali.');
  },

  // ANGGOTA
  async getAnggota(params?: { naqib_id?: string }): Promise<Anggota[]> {
    const res = await callGasApi<Anggota[]>('getAnggota', params || {});
    if (!res.success) throw new Error(res.message || 'Data gagal dimuat.');
    return res.data || [];
  },

  async getAnggotaById(anggota_id: string): Promise<Anggota> {
    const res = await callGasApi<Anggota>('getAnggotaById', { anggota_id });
    if (!res.success || !res.data) throw new Error(res.message || 'Anggota tidak ditemukan.');
    return res.data;
  },

  async createAnggota(data: Partial<Anggota> & { username: string; password?: string }): Promise<Anggota> {
    const res = await callGasApi<Anggota>('createAnggota', data);
    if (!res.success) throw new Error(res.message || 'Data gagal disimpan. Silakan coba kembali.');
    return res.data as Anggota;
  },

  async updateAnggota(data: Partial<Anggota> & { anggota_id: string }): Promise<void> {
    const res = await callGasApi('updateAnggota', data);
    if (!res.success) throw new Error(res.message || 'Data gagal disimpan. Silakan coba kembali.');
  },

  async resetPasswordAnggota(anggota_id: string, namaAnggota: string): Promise<{ success: boolean; message: string; password: string }> {
    const generatedPassword = generateResetPassword(namaAnggota);
    const res = await callGasApi<{ password?: string }>('resetPasswordAnggota', {
      anggota_id,
      new_password: generatedPassword
    });
    if (!res.success) {
      throw new Error(res.message || 'Gagal me-reset password.');
    }
    return {
      success: true,
      message: res.message || `Password berhasil direset menjadi ${generatedPassword}`,
      password: generatedPassword
    };
  },

  // AKTIVITAS
  async getAktivitas(params?: {
    anggota_id?: string;
    naqib_id?: string;
    jenis_aktivitas?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Aktivitas[]> {
    const res = await callGasApi<Aktivitas[]>('getAktivitas', params || {});
    if (!res.success) throw new Error(res.message || 'Data gagal dimuat.');
    return res.data || [];
  },

  async createAktivitas(data: Partial<Aktivitas>): Promise<Aktivitas> {
    const res = await callGasApi<Aktivitas>('createAktivitas', data);
    if (!res.success) throw new Error(res.message || 'Data gagal disimpan. Silakan coba kembali.');
    return res.data as Aktivitas;
  },

  async updateAktivitas(data: Partial<Aktivitas> & { aktivitas_id: string }): Promise<void> {
    const res = await callGasApi('updateAktivitas', data);
    if (!res.success) throw new Error(res.message || 'Data gagal disimpan. Silakan coba kembali.');
  },

  async deleteAktivitas(aktivitas_id: string): Promise<void> {
    const res = await callGasApi('deleteAktivitas', { aktivitas_id });
    if (!res.success) throw new Error(res.message || 'Data gagal dihapus.');
  },

  // DASHBOARDS
  async getAdminDashboard(): Promise<AdminDashboardData> {
    const res = await callGasApi<AdminDashboardData>('getAdminDashboard');
    if (!res.success || !res.data) throw new Error(res.message || 'Database tidak dapat dihubungi.');
    return res.data;
  },

  async getNaqibDashboard(): Promise<NaqibDashboardData> {
    const res = await callGasApi<NaqibDashboardData>('getNaqibDashboard');
    if (!res.success || !res.data) throw new Error(res.message || 'Database tidak dapat dihubungi.');
    return res.data;
  },

  async getAnggotaDashboard(): Promise<AnggotaDashboardData> {
    const res = await callGasApi<AnggotaDashboardData>('getAnggotaDashboard');
    if (!res.success || !res.data) throw new Error(res.message || 'Database tidak dapat dihubungi.');
    return res.data;
  },

  // SETTINGS
  async getSettings(): Promise<Record<string, string>> {
    const res = await callGasApi<Record<string, string>>('getSettings');
    if (!res.success || !res.data) return {};
    return res.data;
  },

  async updateSettings(settings: Record<string, string>): Promise<void> {
    const res = await callGasApi('updateSettings', { settings });
    if (!res.success) throw new Error(res.message || 'Data gagal disimpan.');
  },

  // TEST CONNECTION
  async testConnection(customUrlToTest?: string): Promise<{ success: boolean; message: string; details?: string }> {
    const targetUrl = (customUrlToTest !== undefined ? customUrlToTest : getEffectiveApiUrl()).trim();

    if (!targetUrl || !targetUrl.startsWith('https://script.google.com')) {
      return {
        success: false,
        message: 'URL Google Apps Script belum diisi atau tidak valid.',
        details: 'Format URL yang benar: https://script.google.com/macros/s/.../exec',
      };
    }

    try {
      const res = await fetch('/api/gas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gas-url': targetUrl,
        },
        body: JSON.stringify({ action: 'ping', _gas_url: targetUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isGasNotReady) {
          setGasState({
            activeUrl: targetUrl,
            isConfigured: true,
            isConnected: false,
            isFallback: true,
            errorMessage: data.message || 'Fungsi doPost belum terpasang di Google Apps Script.',
          });
          return {
            success: false,
            message: data.message || 'Fungsi doPost belum terpasang di Google Apps Script.',
            details: 'Buka editor Apps Script di Google Sheets, tempel isi Code.gs, simpan, lalu buat deployment baru (Manage deployments > Edit > New version > Deploy).',
          };
        }
        if (data.success) {
          setGasState({
            activeUrl: targetUrl,
            isConfigured: true,
            isConnected: true,
            isFallback: false,
            errorMessage: undefined,
          });
          return {
            success: true,
            message: 'Koneksi ke Google Apps Script dan Google Sheets berhasil!',
            details: 'Spreadsheet Anda siap digunakan sebagai Single Source of Truth.',
          };
        }
      }

      // Direct fallback test
      try {
        const directRes = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'ping' }),
        });
        if (directRes.ok) {
          const directData = await directRes.json();
          if (directData.success) {
            setGasState({
              activeUrl: targetUrl,
              isConfigured: true,
              isConnected: true,
              isFallback: false,
              errorMessage: undefined,
            });
            return {
              success: true,
              message: 'Koneksi ke Google Apps Script berhasil!',
              details: 'Spreadsheet Anda siap digunakan sebagai Single Source of Truth.',
            };
          }
        }
      } catch (_) {}

      return {
        success: false,
        message: 'Koneksi ke Google Apps Script gagal.',
        details: 'Pastikan web app dideploy dengan akses "Anyone" (Siapa saja).',
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Tidak dapat menghubungi server Apps Script.',
        details: err.message,
      };
    }
  },
};

