import React, { useState, useEffect } from 'react';
import { Aktivitas } from '../types/aktivitas';
import { Naqib } from '../types/naqib';
import { Anggota } from '../types/anggota';
import { UserRole } from '../types/user';
import { api } from '../services/api';
import { exportAktivitasToCsv } from '../utils/exportCsv';
import { formatIndonesianDate } from '../utils/dateUtils';
import { HistoryChart } from '../components/charts/HistoryChart';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  BookOpen,
  Repeat,
  Award,
  Users,
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface LaporanProps {
  role: UserRole;
}

export const LaporanPage: React.FC<LaporanProps> = ({ role }) => {
  const [aktivitas, setAktivitas] = useState<Aktivitas[]>([]);
  const [naqibList, setNaqibList] = useState<Naqib[]>([]);
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterNaqib, setFilterNaqib] = useState('');
  const [filterAnggota, setFilterAnggota] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [acts, nqbs, agts] = await Promise.all([
        api.getAktivitas({
          naqib_id: filterNaqib || undefined,
          anggota_id: filterAnggota || undefined,
          jenis_aktivitas: filterJenis || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined
        }),
        role === 'admin' ? api.getNaqib() : Promise.resolve([]),
        api.getAnggota()
      ]);
      setAktivitas(acts || []);
      setNaqibList(nqbs || []);
      setAnggotaList(agts || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterNaqib, filterAnggota, filterJenis, startDate, endDate]);

  const safeAktivitas = aktivitas || [];

  const handleExportCsv = () => {
    const filename = `Laporan_Setoran_NGajiTrack_${new Date().toISOString().split('T')[0]}.csv`;
    exportAktivitasToCsv(safeAktivitas, filename);
  };

  // Aggregates
  const totalBaca = safeAktivitas.filter((a) => a.jenis_aktivitas === 'BACA_QURAN').length;
  const totalMurojaah = safeAktivitas.filter((a) => a.jenis_aktivitas === 'MUROJAAH').length;
  const totalHafalan = safeAktivitas.filter((a) => a.jenis_aktivitas === 'HAFALAN').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Laporan & Rekap Setoran
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis rekap tilawah halaqah dan unduh data dalam format CSV
          </p>
        </div>

        <button
          type="button"
          id="btn-export-csv"
          onClick={handleExportCsv}
          disabled={safeAktivitas.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export ke CSV ({safeAktivitas.length})</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Setoran
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {safeAktivitas.length}
          </span>
          <span className="text-[11px] text-slate-500">Sesuai filter</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">
            Baca Qur'an
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {totalBaca}
          </span>
          <span className="text-[11px] text-slate-500">Setoran tilawah</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block">
            Muroja'ah
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {totalMurojaah}
          </span>
          <span className="text-[11px] text-slate-500">Pengulangan hafalan</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block">
            Hafalan Baru
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {totalHafalan}
          </span>
          <span className="text-[11px] text-slate-500">Setoran hafalan</span>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Kriteria Filter Laporan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {role === 'admin' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Pilih Naqib
              </label>
              <select
                value={filterNaqib}
                onChange={(e) => setFilterNaqib(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="">Semua Naqib</option>
                {naqibList.map((n) => (
                  <option key={n.naqib_id} value={n.naqib_id}>
                    {n.nama}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Pilih Anggota
            </label>
            <select
              value={filterAnggota}
              onChange={(e) => setFilterAnggota(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="">Semua Anggota</option>
              {anggotaList.map((a) => (
                <option key={a.anggota_id} value={a.anggota_id}>
                  {a.nama} ({a.nomor_anggota})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Jenis Aktivitas
            </label>
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="">Semua Jenis</option>
              <option value="BACA_QURAN">Baca Qur'an</option>
              <option value="MUROJAAH">Muroja'ah</option>
              <option value="HAFALAN">Hafalan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Rentang Tanggal
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-1/2 px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              />
              <span className="text-xs text-slate-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-1/2 px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grafik Pantauan Setoran dengan Garis Target & Notifikasi Capaian */}
      <HistoryChart
        activities={safeAktivitas}
        title="Pantauan Grafik Setoran (Hasil Filter Laporan)"
        subtitle="Analisis tren aktivitas setoran hasil filter dilengkapi garis target harian dan notifikasi pencapaian target"
        dailyTarget={role === 'admin' ? 8 : role === 'naqib' ? 5 : 2}
      />

      {/* Table Preview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Preview Data Setoran ({safeAktivitas.length} Baris)
          </span>
          <span className="text-[11px] text-slate-400">
            Klik tombol "Export ke CSV" di atas untuk mengunduh
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
            <p className="text-xs">Menyiapkan laporan...</p>
          </div>
        ) : safeAktivitas.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Tidak ada data setoran yang cocok dengan filter yang dipilih.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="text-[11px] uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Nama Anggota</th>
                  <th className="py-3 px-4">Naqib</th>
                  <th className="py-3 px-4">Jenis</th>
                  <th className="py-3 px-4">Surah</th>
                  <th className="py-3 px-4">Ayat</th>
                  <th className="py-3 px-4">Hal</th>
                  <th className="py-3 px-4">Nilai</th>
                  <th className="py-3 px-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {aktivitas.map((act) => (
                  <tr key={act.aktivitas_id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                      {formatIndonesianDate(act.tanggal)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-900">
                      {act.nama_anggota || act.anggota_id}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {act.nama_naqib || act.naqib_id}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {act.jenis_aktivitas === 'BACA_QURAN' ? "Baca Qur'an" : act.jenis_aktivitas === 'MUROJAAH' ? "Muroja'ah" : "Hafalan"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900">
                      {act.surah || '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                      {act.ayat_mulai && act.ayat_selesai ? `${act.ayat_mulai}-${act.ayat_selesai}` : act.jumlah_ayat ? `${act.jumlah_ayat} ayat` : '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {act.halaman || '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                      {act.nilai || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-[160px] truncate" title={act.catatan}>
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
  );
};
