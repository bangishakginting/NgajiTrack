import React, { useState, useEffect } from 'react';
import { Aktivitas } from '../types/aktivitas';
import { api } from '../services/api';
import { formatIndonesianDate } from '../utils/dateUtils';
import {
  History,
  BookOpen,
  Repeat,
  Award,
  Calendar,
  Search,
  Loader2,
  PlusCircle
} from 'lucide-react';

interface RiwayatProps {
  onOpenCatat: () => void;
}

export const RiwayatPage: React.FC<RiwayatProps> = ({ onOpenCatat }) => {
  const [aktivitas, setAktivitas] = useState<Aktivitas[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterJenis, setFilterJenis] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getAktivitas();
        setAktivitas(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = aktivitas.filter((a) => {
    const matchJenis = filterJenis ? a.jenis_aktivitas === filterJenis : true;
    const matchSearch = searchTerm
      ? (a.surah && a.surah.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.catatan && a.catatan.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;
    return matchJenis && matchSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Riwayat Setoran Saya
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar lengkap riwayat tilawah, muroja'ah, dan hafalan yang telah dicatat
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCatat}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Catat Aktivitas</span>
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari surah atau catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">Semua Jenis Aktivitas</option>
            <option value="BACA_QURAN">Baca Qur'an</option>
            <option value="MUROJAAH">Muroja'ah</option>
            <option value="HAFALAN">Hafalan</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
            <p className="text-xs">Memuat riwayat...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs">Belum ada riwayat setoran.</p>
            <button
              type="button"
              onClick={onOpenCatat}
              className="mt-2 text-xs font-semibold text-emerald-600 underline"
            >
              Catat tilawah pertama Anda
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="text-[11px] uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Jenis</th>
                  <th className="py-3 px-4">Surah</th>
                  <th className="py-3 px-4">Ayat</th>
                  <th className="py-3 px-4">Halaman / Juz</th>
                  <th className="py-3 px-4">Nilai</th>
                  <th className="py-3 px-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((act) => (
                  <tr key={act.aktivitas_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                      {formatIndonesianDate(act.tanggal)}
                    </td>
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
                      {act.nilai ? act.nilai : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate" title={act.catatan}>
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
