import React, { useState, useEffect } from 'react';
import { Aktivitas } from '../types/aktivitas';
import { UserRole } from '../types/user';
import { api } from '../services/api';
import { formatIndonesianDate } from '../utils/dateUtils';
import {
  BookMarked,
  Search,
  Filter,
  Trash2,
  Loader2,
  Calendar,
  BookOpen,
  Repeat,
  Award
} from 'lucide-react';

interface AktivitasPageProps {
  role: UserRole;
  currentUserId?: string;
  onOpenCatat?: () => void;
}

export const AktivitasPage: React.FC<AktivitasPageProps> = ({
  role,
  onOpenCatat
}) => {
  const [aktivitasList, setAktivitasList] = useState<Aktivitas[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAktivitas = async () => {
    setLoading(true);
    try {
      const data = await api.getAktivitas({
        jenis_aktivitas: filterJenis || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined
      });
      setAktivitasList(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAktivitas();
  }, [filterJenis, startDate, endDate]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus catatan aktivitas ini?')) return;
    try {
      await api.deleteAktivitas(id);
      setAktivitasList((prev) => prev.filter((a) => a.aktivitas_id !== id));
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus aktivitas');
    }
  };

  const filtered = aktivitasList.filter((a) => {
    const q = searchTerm.toLowerCase();
    return (
      (a.nama_anggota && a.nama_anggota.toLowerCase().includes(q)) ||
      (a.surah && a.surah.toLowerCase().includes(q)) ||
      (a.catatan && a.catatan.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Aktivitas Setoran Al-Qur'an
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log seluruh tilawah, muroja'ah, dan hafalan anggota
          </p>
        </div>

        {onOpenCatat && (
          <button
            type="button"
            onClick={onOpenCatat}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <span>+ Catat Aktivitas</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama anggota, surah, catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Jenis Filter */}
          <div>
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="">Semua Jenis Aktivitas</option>
              <option value="BACA_QURAN">Baca Qur'an</option>
              <option value="MUROJAAH">Muroja'ah</option>
              <option value="HAFALAN">Hafalan Qur'an</option>
            </select>
          </div>

          {/* Reset Filters button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterJenis('');
                setStartDate('');
                setEndDate('');
              }}
              className="w-full py-2 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
            >
              Reset Filter
            </button>
          </div>
        </div>

        {/* Date Filter Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Rentang Tanggal:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 border border-slate-200 rounded-md text-xs bg-white"
          />
          <span>s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 border border-slate-200 rounded-md text-xs bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
            <p className="text-xs">Memuat data aktivitas...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <BookMarked className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs">Tidak ada data aktivitas yang sesuai.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="text-[11px] uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  {role !== 'anggota' && <th className="py-3 px-4">Nama Anggota</th>}
                  <th className="py-3 px-4">Jenis</th>
                  <th className="py-3 px-4">Surah</th>
                  <th className="py-3 px-4">Ayat / Jml</th>
                  <th className="py-3 px-4">Halaman / Juz</th>
                  <th className="py-3 px-4">Nilai</th>
                  <th className="py-3 px-4">Catatan</th>
                  {role === 'admin' && <th className="py-3 px-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((act) => (
                  <tr key={act.aktivitas_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                      {formatIndonesianDate(act.tanggal)}
                    </td>

                    {role !== 'anggota' && (
                      <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        {act.nama_anggota || act.anggota_id}
                      </td>
                    )}

                    <td className="py-3 px-4 whitespace-nowrap">
                      {act.jenis_aktivitas === 'BACA_QURAN' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <BookOpen className="w-3 h-3" />
                          <span>Baca</span>
                        </span>
                      )}
                      {act.jenis_aktivitas === 'MUROJAAH' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <Repeat className="w-3 h-3" />
                          <span>Muroja'ah</span>
                        </span>
                      )}
                      {act.jenis_aktivitas === 'HAFALAN' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <Award className="w-3 h-3" />
                          <span>Hafalan</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {act.surah || '-'}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                      {act.ayat_mulai && act.ayat_selesai
                        ? `${act.ayat_mulai} - ${act.ayat_selesai}`
                        : act.jumlah_ayat
                        ? `${act.jumlah_ayat} ayat`
                        : '-'}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {act.halaman ? `Hal ${act.halaman}` : ''}
                      {act.juz ? ` (Juz ${act.juz})` : ''}
                      {!act.halaman && !act.juz ? '-' : ''}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                      {act.nilai !== undefined && act.nilai !== null && act.nilai !== ''
                        ? act.nilai
                        : '-'}
                    </td>

                    <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate" title={act.catatan}>
                      {act.catatan || '-'}
                    </td>

                    {role === 'admin' && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDelete(act.aktivitas_id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Aktivitas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
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
