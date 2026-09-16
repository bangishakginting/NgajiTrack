import React, { useState, useEffect } from 'react';
import { AnggotaDashboardData } from '../types/dashboard';
import { Aktivitas } from '../types/aktivitas';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { HistoryChart } from '../components/charts/HistoryChart';
import { PopularSurahDonutChart } from '../components/charts/PopularSurahDonutChart';
import { MemberSpiderChart } from '../components/charts/MemberSpiderChart';
import { formatIndonesianDate } from '../utils/dateUtils';
import {
  BookOpen,
  Repeat,
  Award,
  CalendarCheck,
  TrendingUp,
  Activity,
  PlusCircle,
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface AnggotaDashboardProps {
  onOpenCatat: () => void;
}

export const AnggotaDashboard: React.FC<AnggotaDashboardProps> = ({ onOpenCatat }) => {
  const [data, setData] = useState<AnggotaDashboardData | null>(null);
  const [activities, setActivities] = useState<Aktivitas[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [dashRes, actRes] = await Promise.all([
        api.getAnggotaDashboard(),
        api.getAktivitas().catch(() => [])
      ]);
      setData(dashRes);
      setActivities(actRes || []);
    } catch (err: any) {
      setError(err.message || 'Database tidak dapat dihubungi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm font-medium">Memuat data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
          <p className="text-sm font-semibold mb-2">{error || 'Gagal memuat dashboard'}</p>
          <button
            type="button"
            onClick={() => loadDashboard()}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const safe7Hari = data.aktivitas_7_hari || [];
  const safeTerakhir = data.aktivitas_terakhir || [];

  // Find maximum count in 7 days for visual relative bar calculation
  const max7Day = Math.max(...safe7Hari.map((d) => d.jumlah || 0), 1);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard Anggota
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor target tilawah, hafalan, dan muroja'ah harian Anda
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            id="btn-refresh-anggota"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Memuat...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            id="btn-catat-aktivitas-hero"
            onClick={onOpenCatat}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Catat Aktivitas</span>
          </button>
        </div>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* CARD 1: Total aktivitas bulan ini */}
        <StatCard
          id="card-total-aktivitas"
          title="Total Aktivitas"
          value={data.total_aktivitas_bulan_ini}
          subtitle="Bulan ini"
          icon={Activity}
          variant="emerald"
        />

        {/* CARD 2: Total Baca Qur'an */}
        <StatCard
          id="card-total-baca"
          title="Baca Qur'an"
          value={data.total_baca_quran}
          subtitle={`Target: ${data.target_baca_harian}`}
          icon={BookOpen}
          variant="emerald"
        />

        {/* CARD 3: Total Muroja'ah */}
        <StatCard
          id="card-total-murojaah"
          title="Muroja'ah"
          value={data.total_murojaah}
          subtitle={`Target: ${data.target_murojaah}`}
          icon={Repeat}
          variant="amber"
        />

        {/* CARD 4: Total Hafalan */}
        <StatCard
          id="card-total-hafalan"
          title="Hafalan"
          value={data.total_hafalan}
          subtitle={`Target: ${data.target_hafalan}`}
          icon={Award}
          variant="blue"
        />

        {/* CARD 5: Jumlah hari aktif */}
        <StatCard
          id="card-hari-aktif"
          title="Hari Aktif"
          value={`${data.jumlah_hari_aktif} hari`}
          subtitle="Bulan berjalan"
          icon={CalendarCheck}
          variant="purple"
        />

        {/* CARD 6: Progress bulan ini */}
        <StatCard
          id="card-progress-bulan"
          title="Progress Bulan Ini"
          value={`${data.progress_bulan_ini}%`}
          subtitle="Estimasi target 30 hari"
          icon={TrendingUp}
          variant="slate"
        />
      </div>

      {/* 1. Grafik Garis / Batang untuk Histori Harian / Pekan / Bulan dengan Garis & Notifikasi Target */}
      <HistoryChart
        activities={activities}
        title="Histori Setoran Pribadi"
        subtitle="Pantau dinamika setoran tilawah Anda dari waktu ke waktu dilengkapi garis & notifikasi target harian"
        dailyTarget={2}
      />

      {/* 2. Donut Chart & 3. Spider Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <PopularSurahDonutChart
            activities={activities}
            title="Surat Sering Disetor"
            subtitle="Distribusi surat-surat yang paling sering Anda baca & hafalkan"
          />
        </div>

        <div className="lg:col-span-7">
          <MemberSpiderChart
            activities={activities}
            isSelfView={true}
            currentUserName="Capaian Saya"
            title="Radar Keseimbangan Tilawah"
            subtitle="Evaluasi 5 dimensi capaian pribadi dibandingkan benchmark rata-rata halaqah"
          />
        </div>
      </div>

      {/* Main Grid: Aktivitas 7 Hari Terakhir & Aktivitas Terakhir */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Grafik Aktivitas 7 Hari Terakhir */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Aktivitas 7 Hari Terakhir</h2>
              <p className="text-xs text-slate-500">Konsistensi setor harian</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Mingguan
            </span>
          </div>

          {/* Bar chart representation */}
          <div className="space-y-3 pt-2">
            {safe7Hari.map((item, idx) => {
              const widthPct = Math.round((item.jumlah / max7Day) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 w-16">{item.hari}</span>
                    <span className="text-[11px] text-slate-400">
                      {formatIndonesianDate(item.tanggal)}
                    </span>
                    <span className="font-bold text-emerald-800 text-right w-12">
                      {item.jumlah} setoran
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(widthPct, item.jumlah > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Target Harian Anda:</span>
            <span className="font-semibold text-emerald-800">
              {data.target_baca_harian}
            </span>
          </div>
        </div>

        {/* Tabel Aktivitas Terakhir */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Aktivitas Terakhir</h2>
              <p className="text-xs text-slate-500">Catatan tilawah &amp; setoran terbaru</p>
            </div>
            <button
              type="button"
              onClick={onOpenCatat}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              + Tambah Baru
            </button>
          </div>

          {safeTerakhir.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">Belum ada aktivitas yang dicatat.</p>
              <button
                type="button"
                onClick={onOpenCatat}
                className="mt-2 text-xs font-semibold text-emerald-600 underline cursor-pointer"
              >
                Catat sekarang
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="text-[11px] uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Jenis</th>
                    <th className="py-2.5 px-3">Surah</th>
                    <th className="py-2.5 px-3">Ayat / Jml</th>
                    <th className="py-2.5 px-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeTerakhir.map((act: Aktivitas) => (
                    <tr key={act.aktivitas_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800">
                        {formatIndonesianDate(act.tanggal)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {act.jenis_aktivitas === 'BACA_QURAN' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Baca Qur'an
                          </span>
                        )}
                        {act.jenis_aktivitas === 'MUROJAAH' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Muroja'ah
                          </span>
                        )}
                        {act.jenis_aktivitas === 'HAFALAN' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            Hafalan
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                        {act.surah || '-'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                        {act.ayat_mulai && act.ayat_selesai
                          ? `Ayat ${act.ayat_mulai} - ${act.ayat_selesai}`
                          : act.jumlah_ayat
                          ? `${act.jumlah_ayat} ayat`
                          : '-'}
                        {act.nilai ? ` (Nilai: ${act.nilai})` : ''}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-[160px] truncate" title={act.catatan}>
                        {act.catatan || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
