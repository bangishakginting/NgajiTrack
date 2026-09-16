import React, { useState, useEffect } from 'react';
import { Anggota } from '../types/anggota';
import { Naqib } from '../types/naqib';
import { UserRole } from '../types/user';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { formatRelativeTime } from '../utils/dateUtils';
import { generateResetPassword } from '../utils/userUtils';
import {
  Users,
  Plus,
  Search,
  Filter,
  Loader2,
  ExternalLink,
  Edit2,
  CheckCircle2,
  BookOpen,
  KeyRound,
  Copy,
  Check,
  AlertTriangle
} from 'lucide-react';

interface AnggotaPageProps {
  role: UserRole;
  onViewDetail: (anggotaId: string) => void;
}

export const AnggotaPage: React.FC<AnggotaPageProps> = ({ role, onViewDetail }) => {
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
  const [naqibList, setNaqibList] = useState<Naqib[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNaqibFilter, setSelectedNaqibFilter] = useState('');

  // Modal Add / Edit
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAnggota, setEditingAnggota] = useState<Anggota | null>(null);

  // Modal Reset Password
  const [resetModalAnggota, setResetModalAnggota] = useState<Anggota | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{ password: string; message: string } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Form Fields
  const [formNomor, setFormNomor] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNoHp, setFormNoHp] = useState('');
  const [formJk, setFormJk] = useState<'L' | 'P'>('L');
  const [formTglLahir, setFormTglLahir] = useState('');
  const [formNaqibId, setFormNaqibId] = useState('');
  const [formTargetBaca, setFormTargetBaca] = useState('2 halaman');
  const [formTargetMurojaah, setFormTargetMurojaah] = useState('1 surat');
  const [formTargetHafalan, setFormTargetHafalan] = useState('5 ayat');
  const [formStatus, setFormStatus] = useState<'aktif' | 'nonaktif'>('aktif');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agts, nqbs] = await Promise.all([
        api.getAnggota(),
        role === 'admin' ? api.getNaqib() : Promise.resolve([])
      ]);
      setAnggotaList(agts || []);
      setNaqibList(nqbs || []);
      if ((nqbs || []).length > 0 && !formNaqibId) {
        setFormNaqibId(nqbs[0].naqib_id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    const nextNo = String(anggotaList.length + 1).padStart(3, '0');
    setFormNomor(nextNo);
    setFormNama('');
    setFormUsername(`anggota${nextNo}`);
    setFormPassword('Anggota123!');
    setFormEmail('');
    setFormNoHp('');
    setFormJk('L');
    setFormTglLahir('2000-01-01');
    if (naqibList.length > 0) setFormNaqibId(naqibList[0].naqib_id);
    setFormTargetBaca('2 halaman');
    setFormTargetMurojaah('1 surat');
    setFormTargetHafalan('5 ayat');
    setFormStatus('aktif');
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (a: Anggota) => {
    setEditingAnggota(a);
    setFormNomor(a.nomor_anggota);
    setFormNama(a.nama);
    setFormEmail(a.email || '');
    setFormNoHp(a.no_hp || '');
    setFormJk(a.jenis_kelamin || 'L');
    setFormTglLahir(a.tanggal_lahir || '');
    setFormNaqibId(a.naqib_id);
    setFormTargetBaca(a.target_baca_harian || '2 halaman');
    setFormTargetMurojaah(a.target_murojaah || '1 surat');
    setFormTargetHafalan(a.target_hafalan || '5 ayat');
    setFormStatus(a.status as any);
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleOpenReset = (a: Anggota) => {
    setResetModalAnggota(a);
    setResetResult(null);
    setResetError(null);
    setCopiedPassword(false);
  };

  const handleConfirmResetPassword = async () => {
    if (!resetModalAnggota) return;
    setIsResetting(true);
    setResetError(null);

    try {
      const res = await api.resetPasswordAnggota(resetModalAnggota.anggota_id, resetModalAnggota.nama);
      setResetResult({
        password: res.password,
        message: res.message
      });
    } catch (err: any) {
      setResetError(err.message || 'Gagal me-reset password anggota');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopyPassword = (pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 3000);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formNama.trim() || !formUsername.trim()) {
      setFormError('Nama dan Username wajib diisi.');
      return;
    }
    if (!formNaqibId) {
      setFormError('Silakan pilih Naqib Pembina.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createAnggota({
        nomor_anggota: formNomor,
        nama: formNama.trim(),
        username: formUsername.trim(),
        password: formPassword || 'Anggota123!',
        email: formEmail.trim(),
        no_hp: formNoHp.trim(),
        jenis_kelamin: formJk,
        tanggal_lahir: formTglLahir,
        naqib_id: formNaqibId,
        target_baca_harian: formTargetBaca,
        target_murojaah: formTargetMurojaah,
        target_hafalan: formTargetHafalan,
        status: 'aktif'
      });
      setIsAddOpen(false);
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Data gagal disimpan. Silakan coba kembali.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnggota) return;
    setFormError(null);

    setSubmitting(true);
    try {
      await api.updateAnggota({
        anggota_id: editingAnggota.anggota_id,
        nomor_anggota: formNomor,
        nama: formNama.trim(),
        email: formEmail.trim(),
        no_hp: formNoHp.trim(),
        jenis_kelamin: formJk,
        tanggal_lahir: formTglLahir,
        naqib_id: formNaqibId,
        target_baca_harian: formTargetBaca,
        target_murojaah: formTargetMurojaah,
        target_hafalan: formTargetHafalan,
        status: formStatus
      });
      setIsEditOpen(false);
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Data gagal disimpan. Silakan coba kembali.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = anggotaList.filter((a) => {
    const q = searchTerm.toLowerCase();
    const matchQuery =
      a.nama.toLowerCase().includes(q) ||
      a.nomor_anggota.toLowerCase().includes(q) ||
      (a.nama_naqib && a.nama_naqib.toLowerCase().includes(q));

    const matchNaqib = selectedNaqibFilter ? a.naqib_id === selectedNaqibFilter : true;
    return matchQuery && matchNaqib;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {role === 'naqib' ? 'Anggota Saya' : 'Data Anggota Halaqah'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {role === 'naqib'
              ? 'Kelola dan monitor target setoran santri / anggota binaan'
              : 'Daftar seluruh anggota di semua kelompok halaqah'}
          </p>
        </div>

        {role === 'admin' && (
          <button
            type="button"
            id="btn-tambah-anggota"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Anggota</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama atau no. anggota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        {role === 'admin' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedNaqibFilter}
              onChange={(e) => setSelectedNaqibFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
            <p className="text-xs">Memuat data Anggota...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs">Tidak ada data anggota ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="text-[11px] uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No.</th>
                  <th className="py-3 px-4">Nama Anggota</th>
                  {role === 'admin' && <th className="py-3 px-4">Naqib</th>}
                  <th className="py-3 px-4">Target Harian</th>
                  <th className="py-3 px-4 text-center">Bulan Ini</th>
                  <th className="py-3 px-4">Aktivitas Terakhir</th>
                  <th className="py-3 px-4">Keaktifan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((agt) => (
                  <tr key={agt.anggota_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-500">
                      {agt.nomor_anggota}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {agt.nama}
                    </td>
                    {role === 'admin' && (
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {agt.nama_naqib || agt.naqib_id}
                      </td>
                    )}
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {agt.target_baca_harian || '2 halaman'}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="font-bold text-slate-800">
                        {agt.aktivitas_bulan_ini || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatRelativeTime(agt.aktivitas_terakhir)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={agt.status_keaktifan || agt.status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        type="button"
                        onClick={() => onViewDetail(agt.anggota_id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                        title="Lihat Detail Monitoring"
                      >
                        <span>Detail</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      {role === 'admin' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenReset(agt)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200 cursor-pointer"
                            title="Reset password ke format 3 huruf kapital pertama + 123"
                          >
                            <KeyRound className="w-3 h-3 text-amber-600" />
                            <span>Reset Password</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(agt)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Edit Anggota"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Anggota Modal (Admin) */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Tambah Anggota Baru"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                No. Anggota
              </label>
              <input
                type="text"
                required
                value={formNomor}
                onChange={(e) => setFormNomor(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                placeholder="007"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formNama}
                onChange={(e) => setFormNama(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                placeholder="Nama anggota"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Username Akun <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="text"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Naqib Pembina <span className="text-rose-500">*</span>
              </label>
              <select
                value={formNaqibId}
                onChange={(e) => setFormNaqibId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {naqibList.map((n) => (
                  <option key={n.naqib_id} value={n.naqib_id}>
                    {n.nama} ({n.wilayah || 'Umum'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Jenis Kelamin
              </label>
              <select
                value={formJk}
                onChange={(e) => setFormJk(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="L">Laki-laki (Ikhwan)</option>
                <option value="P">Perempuan (Akhwat)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Baca Harian
              </label>
              <input
                type="text"
                value={formTargetBaca}
                onChange={(e) => setFormTargetBaca(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Muroja'ah
              </label>
              <input
                type="text"
                value={formTargetMurojaah}
                onChange={(e) => setFormTargetMurojaah(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Hafalan
              </label>
              <input
                type="text"
                value={formTargetHafalan}
                onChange={(e) => setFormTargetHafalan(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Anggota'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Anggota Modal (Admin) */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Data Anggota"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                No. Anggota
              </label>
              <input
                type="text"
                required
                value={formNomor}
                onChange={(e) => setFormNomor(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={formNama}
                onChange={(e) => setFormNama(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Naqib Pembina
              </label>
              <select
                value={formNaqibId}
                onChange={(e) => setFormNaqibId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {naqibList.map((n) => (
                  <option key={n.naqib_id} value={n.naqib_id}>
                    {n.nama}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Status Anggota
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Baca Harian
              </label>
              <input
                type="text"
                value={formTargetBaca}
                onChange={(e) => setFormTargetBaca(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Muroja'ah
              </label>
              <input
                type="text"
                value={formTargetMurojaah}
                onChange={(e) => setFormTargetMurojaah(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Hafalan
              </label>
              <input
                type="text"
                value={formTargetHafalan}
                onChange={(e) => setFormTargetHafalan(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Reset Password Anggota */}
      <Modal
        isOpen={Boolean(resetModalAnggota)}
        onClose={() => setResetModalAnggota(null)}
        title="Reset Password Anggota"
        maxWidth="md"
      >
        {resetModalAnggota && (
          <div className="space-y-4">
            {resetError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {resetError}
              </div>
            )}

            {!resetResult ? (
              <>
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Nama Anggota:</p>
                      <p className="text-sm font-bold text-slate-900">{resetModalAnggota.nama}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        No. Anggota: {resetModalAnggota.nomor_anggota}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                      <KeyRound className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-700">
                      Aturan Format Password Baru:
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      Password akan di-reset otomatis mengikuti aturan: <strong>3 huruf kapital pertama dari nama</strong> ditambah angka <strong>123</strong>.
                    </p>
                    <div className="mt-2 p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center justify-between">
                      <span className="text-xs text-amber-900">
                        Contoh ({resetModalAnggota.nama}):
                      </span>
                      <span className="text-xs font-mono font-bold bg-white px-2.5 py-1 rounded border border-amber-300 text-amber-900 shadow-2xs">
                        {generateResetPassword(resetModalAnggota.nama)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalAnggota(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmResetPassword}
                    disabled={isResetting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50 shadow-2xs transition-colors cursor-pointer"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Memproses Reset...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Konfirmasi Reset Password</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Password Berhasil Direset!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Berikan kata sandi baru berikut kepada anggota <strong>{resetModalAnggota.nama}</strong>:
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Kata Sandi Baru
                    </span>
                    <span className="text-base font-mono font-bold text-emerald-800 tracking-wider">
                      {resetResult.password}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyPassword(resetResult.password)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {copiedPassword ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                        <span>Salin Password</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 text-left leading-relaxed bg-amber-50/60 p-3 rounded-lg border border-amber-100">
                  💡 Anggota dapat langsung masuk menggunakan username mereka dan kata sandi baru <strong>{resetResult.password}</strong>.
                </p>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalAnggota(null)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                  >
                    Selesai &amp; Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
