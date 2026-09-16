import React, { useState, useEffect } from 'react';
import { User } from '../types/user';
import { Anggota } from '../types/anggota';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  User as UserIcon,
  Shield,
  BookOpen,
  Repeat,
  Award,
  Mail,
  Phone,
  Calendar,
  Loader2
} from 'lucide-react';

interface ProfilProps {
  user: User;
}

export const ProfilPage: React.FC<ProfilProps> = ({ user }) => {
  const [detail, setDetail] = useState<Anggota | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfil = async () => {
      if (user.role === 'anggota' && user.reference_id) {
        setLoading(true);
        try {
          const data = await api.getAnggotaById(user.reference_id);
          setDetail(data);
        } catch (err: any) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchProfil();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
        <p className="text-xs">Memuat profil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-3xl font-extrabold shadow-md">
            {user.nama.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{user.nama}</h1>
              <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {user.role}
              </span>
              {detail && <StatusBadge status={detail.status} />}
            </div>

            <p className="text-xs text-slate-500 mt-1">
              Username: <span className="font-semibold text-slate-700">@{user.username}</span> | ID:{' '}
              <span className="font-mono text-slate-600">{user.reference_id || user.user_id}</span>
            </p>

            {detail && (
              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-600">
                {detail.nama_naqib && (
                  <span className="font-medium">
                    Naqib Pembina: <span className="text-emerald-700 font-bold">{detail.nama_naqib}</span>
                  </span>
                )}
                {detail.no_hp && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {detail.no_hp}
                  </span>
                )}
                {detail.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {detail.email}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Target Setoran Section */}
      {detail && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Target Harian Tilawah</h2>
          <p className="text-xs text-slate-500 mb-4">
            Komitmen target setoran yang ditentukan bersama Naqib pembina
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-800 block">
                  Target Baca Qur'an
                </span>
                <span className="text-base font-bold text-slate-900 mt-1 block">
                  {detail.target_baca_harian || '2 halaman'}
                </span>
                <span className="text-[11px] text-emerald-700 mt-0.5 block">
                  Rutin setiap hari
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-100 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-teal-100 text-teal-800">
                <Repeat className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-teal-800 block">
                  Target Muroja'ah
                </span>
                <span className="text-base font-bold text-slate-900 mt-1 block">
                  {detail.target_murojaah || '1 surat'}
                </span>
                <span className="text-[11px] text-teal-700 mt-0.5 block">
                  Menjaga hafalan lama
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-blue-800 block">
                  Target Hafalan Baru
                </span>
                <span className="text-base font-bold text-slate-900 mt-1 block">
                  {detail.target_hafalan || '5 ayat'}
                </span>
                <span className="text-[11px] text-blue-700 mt-0.5 block">
                  Peningkatan hafalan
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
