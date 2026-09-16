import React, { useState, useEffect } from 'react';
import { Anggota } from '../types/anggota';
import { Aktivitas } from '../types/aktivitas';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { formatIndonesianDate, formatRelativeTime } from '../utils/dateUtils';
import {
  ArrowLeft,
  BookOpen,
  Repeat,
  Award,
  Calendar,
  User,
  Shield,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface DetailAnggotaProps {
  anggotaId: string;
  onBack: () => void;
}

export const DetailAnggota: React.FC<DetailAnggotaProps> = ({ anggotaId, onBack }) => {
  const [anggota, setAnggota] = useState<Anggota | null>(null);
  const [aktivitas, setAktivitas] = useState<Aktivitas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [agtRes, actRes] = await Promise.all([
          api.getAnggotaById(anggotaId),
          api.getAktivitas({ anggota_id: anggotaId })
        ]);
        setAnggota(agtRes);
        setAktivitas(actRes);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat detail anggota.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [anggotaId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm font-medium">Memuat data anggota...</p>
      </div>
    );
  }

  if (error || !anggota) {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
          <p className="text-sm font-semibold mb-2">{error || 'Data tidak ditemukan'}</p>
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const countBaca = aktivitas.filter((a) => a.jenis_aktivitas === 'BACA_QURAN').length;
  const countMurojaah = aktivitas.filter((a) => a.jenis_aktivitas === 'MUROJAAH').length;
  const countHafalan = aktivitas.filter((a) => a.jenis_aktivitas === 'HAFALAN').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Detail Anggota</h1>
          <p className="text-xs text-slate-500">Profil dan monitoring tilawah individual</p>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-bold border border-emerald-200">
              {anggota.nama.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{anggota.nama}</h2>
                <StatusBadge status={anggota.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                No. Anggota: <span className="font-medium text-slate-700">{anggota.nomor_anggota}</span> |{' '}
                {anggota.email || 'Tanpa email'} | {anggota.no_hp || '-'}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Naqib Pembina
            </span>
            <span className="text-sm font-bold text-emerald-800">
              {anggota.nama_naqib || anggota.naqib_id}
            </span>
          </div>
        </div>

        {/* Targets row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Target Baca Harian
            </span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">
              {anggota.target_baca_harian || '2 halaman'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Target Muroja'ah
            </span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">
              {anggota.target_murojaah || '1 surat'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Target Hafalan
            </span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">
              {anggota.target_hafalan || '5 ayat'}
            </span>
          </div>
        </div>
      </div>

      {/* Statistik 3 Card: Baca Qur'an, Muroja'ah, Hafalan (Section 15) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Baca Qur'an
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {countBaca} <span className="text-xs font-normal text-slate-500">setoran</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
            <Repeat className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Muroja'ah
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {countMurojaah} <span className="text-xs font-normal text-slate-500">setoran</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Hafalan
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {countHafalan} <span className="text-xs font-normal text-slate-500">setoran</span>
            </div>
          </div>
        </div>
      </div>

      {/* Histori Aktivitas (Section 15) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Histori Aktivitas</h3>
            <p className="text-xs text-slate-500">Riwayat tilawah, muroja'ah, dan hafalan</p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total {aktivitas.length} catatan
          </span>
        </div>

        {aktivitas.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            Belum ada histori aktivitas untuk anggota ini.
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
                  <th className="py-2.5 px-3">Nilai</th>
                  <th className="py-2.5 px-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {aktivitas.map((act) => (
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
                    <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {act.surah || '-'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                      {act.ayat_mulai && act.ayat_selesai
                        ? `Ayat ${act.ayat_mulai} - ${act.ayat_selesai}`
                        : act.jumlah_ayat
                        ? `${act.jumlah_ayat} ayat`
                        : '-'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-900">
                      {act.nilai !== undefined && act.nilai !== null && act.nilai !== ''
                        ? act.nilai
                        : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-[200px] truncate" title={act.catatan}>
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
