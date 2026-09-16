import React, { useState, useEffect } from 'react';
import { AdminDashboardData } from '../types/dashboard';
import { Aktivitas } from '../types/aktivitas';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { HistoryChart } from '../components/charts/HistoryChart';
import { PopularSurahDonutChart } from '../components/charts/PopularSurahDonutChart';
import { NaqibSpiderChart } from '../components/charts/NaqibSpiderChart';
import { NaqibMemberComparisonChart } from '../components/charts/NaqibMemberComparisonChart';
import { formatIndonesianDate } from '../utils/dateUtils';
import {
  UserCheck,
  Users,
  Activity,
  BookOpen,
  Repeat,
  Award,
  RefreshCw,
  Loader2
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [activities, setActivities] = useState<Aktivitas[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [dashRes, actRes] = await Promise.all([
        api.getAdminDashboard(),
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
      <div className="p-6 max-w-md mx-auto text-center">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
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

  const safePerNaqib = data.aktivitas_per_naqib || [];
  const safeTerbaru = data.aktivitas_terbaru || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard Administrator
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan sistem monitoring tilawah seluruh halaqah &amp; naqib
          </p>
        </div>

        <button
          type="button"
          id="btn-refresh-admin"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Memuat...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* CARD 1: Total Naqib */}
        <StatCard
          id="card-total-naqib"
          title="Total Naqib"
          value={data.total_naqib}
          subtitle="Naqib aktif"
          icon={UserCheck}
          variant="emerald"
        />

        {/* CARD 2: Total Anggota */}
        <StatCard
          id="card-total-anggota"
          title="Total Anggota"
          value={data.total_anggota}
          subtitle="Anggota aktif"
          icon={Users}
          variant="blue"
        />

        {/* CARD 3: Total Aktivitas Bulan Ini */}
        <StatCard
          id="card-total-aktivitas-admin"
          title="Aktivitas Bln Ini"
          value={data.total_aktivitas_bulan_ini}
          subtitle="Semua kategori"
          icon={Activity}
          variant="purple"
        />

        {/* CARD 4: Total Baca Qur'an */}
        <StatCard
          id="card-total-baca-admin"
          title="Baca Qur'an"
          value={data.total_baca_quran}
          subtitle="Total setoran"
          icon={BookOpen}
          variant="emerald"
        />

        {/* CARD 5: Total Muroja'ah */}
        <StatCard
          id="card-total-murojaah-admin"
          title="Muroja'ah"
          value={data.total_murojaah}
          subtitle="Total setoran"
          icon={Repeat}
          variant="amber"
        />

        {/* CARD 6: Total Hafalan */}
        <StatCard
          id="card-total-hafalan-admin"
          title="Hafalan Qur'an"
          value={data.total_hafalan}
          subtitle="Total setoran"
          icon={Award}
          variant="blue"
        />
      </div>

      {/* 1. Grafik Garis / Batang untuk Histori Harian / Pekan / Bulan dengan Garis & Notifikasi Target per Naqib */}
      <HistoryChart
        activities={activities}
        title="Histori Setoran & Target Kehadiran Anggota per Naqib"
        subtitle="Pantauan target jumlah anggota yang menyetor setiap hari per Naqib maupun akumulasi seluruh halaqah"
        role="admin"
        naqibList={safePerNaqib}
        dailyTarget={data.total_anggota || 8}
      />

      {/* Grafik Perbandingan Naqib dengan Jumlah Anggotanya */}
      {safePerNaqib.length > 0 && (
        <NaqibMemberComparisonChart
          data={safePerNaqib}
          title="Perbandingan Jumlah Anggota Antar Naqib"
          subtitle="Komparasi proporsi jumlah anggota binaan dan keaktifan pada tiap Naqib"
        />
      )}

      {/* 2. Donut Chart (Surat Populer) & 3. Spider Chart (Perbandingan Capaian Antar Naqib) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <PopularSurahDonutChart
            activities={activities}
            title="Surat Populer Disetor"
            subtitle="Distribusi surat Al-Qur'an terbanyak yang disetorkan anggota"
          />
        </div>

        <div className="lg:col-span-7">
          <NaqibSpiderChart
            activities={activities}
            naqibList={safePerNaqib}
            title="Perbandingan Capaian Antar Naqib"
            subtitle="Komparasi langsung capaian seluruh Naqib dalam 5 dimensi tilawah & rasio keaktifan halaqah"
          />
        </div>
      </div>

      {/* 2 Tables: Aktivitas per Naqib & Aktivitas Terbaru Global */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabel Aktivitas per Naqib */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Aktivitas per Naqib</h2>
              <p className="text-xs text-slate-500">Performa dan binaan masing-masing Naqib</p>
            </div>
            <span className="text-xs text-slate-500">
              Total {safePerNaqib.length} Naqib
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Nama Naqib</th>
                  <th className="py-2.5 px-2 text-center">Binaan</th>
                  <th className="py-2.5 px-2 text-center">Aktif</th>
                  <th className="py-2.5 px-3 text-right">Total Setoran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safePerNaqib.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      Belum ada data aktivitas per naqib
                    </td>
                  </tr>
                ) : (
                  safePerNaqib.map((n) => (
                    <tr key={n.naqib_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-800">{n.nama}</td>
                      <td className="py-3 px-2 text-center text-slate-600">{n.jumlah_anggota} orang</td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                          {n.anggota_aktif} aktif
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {n.jumlah_aktivitas}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabel Aktivitas Terbaru Global */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Setoran Terbaru</h2>
              <p className="text-xs text-slate-500">Aktivitas real-time seluruh binaan</p>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Live Feed
            </span>
          </div>

          <div className="space-y-3">
            {safeTerbaru.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada aktivitas setoran terbaru</p>
            ) : (
              safeTerbaru.slice(0, 5).map((act, idx) => (
                <div
                  key={act.aktivitas_id || idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white border border-slate-200/80 text-emerald-600 shadow-2xs">
                      {act.jenis_aktivitas === 'BACA_QURAN' ? (
                        <BookOpen className="w-4 h-4" />
                      ) : act.jenis_aktivitas === 'MUROJAAH' ? (
                        <Repeat className="w-4 h-4" />
                      ) : (
                        <Award className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {act.nama_anggota || 'Anggota'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Surat {act.surah} (Ayat {act.ayat_mulai || 1}-{act.ayat_selesai || act.jumlah_ayat})
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-medium text-slate-400 block">
                      {formatIndonesianDate(act.tanggal)}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      {act.jenis_aktivitas}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
