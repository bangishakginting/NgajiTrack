import React, { useState, useEffect } from 'react';
import { NaqibDashboardData } from '../types/dashboard';
import { Aktivitas } from '../types/aktivitas';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { HistoryChart } from '../components/charts/HistoryChart';
import { PopularSurahDonutChart } from '../components/charts/PopularSurahDonutChart';
import { MemberSpiderChart } from '../components/charts/MemberSpiderChart';
import { formatRelativeTime } from '../utils/dateUtils';
import {
  Users,
  UserCheck,
  Activity,
  UserX,
  Trophy,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ExternalLink,
  Phone
} from 'lucide-react';

interface NaqibDashboardProps {
  onViewMemberDetail: (anggotaId: string) => void;
}

export const NaqibDashboard: React.FC<NaqibDashboardProps> = ({ onViewMemberDetail }) => {
  const [data, setData] = useState<NaqibDashboardData | null>(null);
  const [activities, setActivities] = useState<Aktivitas[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [dashRes, actRes] = await Promise.all([
        api.getNaqibDashboard(),
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
    loadData();
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
            onClick={() => loadData()}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const safeAnggotaList = data.anggota_list || [];
  const safeTeraktif = data.anggota_teraktif || [];
  const safePerhatian = data.anggota_perlu_perhatian || [];

  // List members for spider chart comparison
  const membersOptions = safeAnggotaList.map((m) => ({
    id: m.anggota_id,
    name: m.nama
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard Naqib
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring aktivitas &amp; tilawah anggota binaan halaqah Anda
          </p>
        </div>

        <button
          type="button"
          id="btn-refresh-naqib"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Memuat...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: Jumlah Anggota */}
        <StatCard
          id="card-jumlah-anggota"
          title="Jumlah Anggota"
          value={data.jumlah_anggota}
          subtitle="Total binaan aktif"
          icon={Users}
          variant="emerald"
        />

        {/* CARD 2: Anggota Aktif Hari Ini */}
        <StatCard
          id="card-aktif-hari-ini"
          title="Aktif Hari Ini"
          value={data.anggota_aktif_hari_ini}
          subtitle="Sudah setor hari ini"
          icon={UserCheck}
          variant="emerald"
        />

        {/* CARD 3: Total Aktivitas Bulan Ini */}
        <StatCard
          id="card-total-aktivitas-naqib"
          title="Aktivitas Bulan Ini"
          value={data.total_aktivitas_bulan_ini}
          subtitle="Semua jenis setoran"
          icon={Activity}
          variant="blue"
        />

        {/* CARD 4: Anggota Belum Setor */}
        <StatCard
          id="card-belum-setor"
          title="Belum Setor Hari Ini"
          value={data.anggota_belum_setor}
          subtitle="Perlu diingatkan"
          icon={UserX}
          variant={data.anggota_belum_setor > 0 ? 'amber' : 'slate'}
        />
      </div>

      {/* 1. Grafik Garis / Batang untuk Histori Harian / Pekan / Bulan dengan Garis Target */}
      <HistoryChart
        activities={activities}
        title="Histori Setoran Halaqah Binaan"
        subtitle="Pantauan target jumlah anggota yang menyetor setiap hari vs total binaan"
        dailyTarget={Math.max(1, data.jumlah_anggota || 5)}
        totalAnggota={Math.max(1, data.jumlah_anggota || 5)}
        role="naqib"
      />

      {/* 2. Donut Chart & 3. Spider Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <PopularSurahDonutChart
            activities={activities}
            title="Surat Populer Binaan"
            subtitle="Distribusi surat Al-Qur'an yang paling sering disetorkan di halaqah"
          />
        </div>

        <div className="lg:col-span-7">
          <MemberSpiderChart
            activities={activities}
            membersList={membersOptions}
            compareAll={true}
            title="Komparasi Performansi Seluruh Anggota"
            subtitle="Perbandingan langsung seluruh anggota binaan dalam 5 dimensi tilawah & konsistensi"
          />
        </div>
      </div>

      {/* Monitoring Section: Anggota Paling Aktif & Anggota Perlu Perhatian */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ranking: Anggota Paling Aktif */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Anggota Paling Aktif</h2>
                <p className="text-xs text-slate-500">Ranking frekuensi setoran</p>
              </div>
            </div>
          </div>

          {safeTeraktif.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Belum ada data aktivitas</p>
          ) : (
            <div className="space-y-2.5">
              {safeTeraktif.map((agt, idx) => (
                <div
                  key={agt.anggota_id}
                  onClick={() => onViewMemberDetail(agt.anggota_id)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 hover:bg-emerald-50/60 border border-slate-200/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700">
                      {agt.nama}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {agt.total_aktivitas} aktivitas
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Anggota Perlu Perhatian: Tidak setor >= 7 hari */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Anggota Perlu Perhatian</h2>
                <p className="text-xs text-slate-500">Tidak ada aktivitas selama &ge; 7 hari</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {safePerhatian.length} orang
            </span>
          </div>

          {safePerhatian.length === 0 ? (
            <div className="p-6 text-center text-xs text-emerald-700 bg-emerald-50/50 rounded-xl border border-emerald-100">
              Alhamdulillah! Seluruh anggota aktif menyetor dalam 7 hari terakhir.
            </div>
          ) : (
            <div className="space-y-2.5">
              {safePerhatian.map((agt) => (
                <div
                  key={agt.anggota_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 border border-rose-100"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{agt.nama}</p>
                    <p className="text-[11px] text-rose-700 font-medium">
                      {agt.hari_tidak_aktif} hari tidak setor (terakhir: {formatRelativeTime(agt.aktivitas_terakhir)})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Assalamu'alaikum ${agt.nama}, mengingatkan untuk menyetor tilawah Qur'an pekan ini di NGajiTrack. Baarakallahu fiik.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs"
                      title="Kirim pesan WhatsApp pengingat"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Ingatkan WA</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => onViewMemberDetail(agt.anggota_id)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors"
                      title="Lihat Detail"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabel "Anggota Saya" */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Anggota Saya</h2>
            <p className="text-xs text-slate-500">Daftar anggota di bawah binaan Anda</p>
          </div>
          <span className="text-xs text-slate-500">
            Total {safeAnggotaList.length} Anggota
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="text-[11px] uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Nama Anggota</th>
                <th className="py-3 px-3 text-center">Baca Qur'an</th>
                <th className="py-3 px-3 text-center">Muroja'ah</th>
                <th className="py-3 px-3 text-center">Hafalan</th>
                <th className="py-3 px-3">Aktivitas Terakhir</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safeAnggotaList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Belum ada data anggota
                  </td>
                </tr>
              ) : (
                safeAnggotaList.map((member) => (
                  <tr
                    key={member.anggota_id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {member.nama}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-slate-800">
                      {member.total_baca}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-slate-800">
                      {member.total_murojaah}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-slate-800">
                      {member.total_hafalan}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                      {formatRelativeTime(member.aktivitas_terakhir)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={member.status_keaktifan} />
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewMemberDetail(member.anggota_id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                      >
                        <span>Detail</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
