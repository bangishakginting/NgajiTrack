import React, { useState, useEffect } from 'react';
import { Naqib } from '../types/naqib';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { NaqibMemberComparisonChart } from '../components/charts/NaqibMemberComparisonChart';
import {
  UserCheck,
  Plus,
  Search,
  Loader2,
  Edit2,
  Mail,
  Phone,
  MapPin,
  Users,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export const NaqibPage: React.FC = () => {
  const [naqibList, setNaqibList] = useState<Naqib[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNaqib, setSelectedNaqib] = useState<Naqib | null>(null);

  // Form states
  const [formNama, setFormNama] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNoHp, setFormNoHp] = useState('');
  const [formWilayah, setFormWilayah] = useState('');
  const [formStatus, setFormStatus] = useState<'aktif' | 'nonaktif'>('aktif');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchNaqib = async () => {
    setLoading(true);
    try {
      const data = await api.getNaqib();
      setNaqibList(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNaqib();
  }, []);

  const handleOpenAdd = () => {
    setFormNama('');
    setFormUsername('');
    setFormPassword('Naqib123!');
    setFormEmail('');
    setFormNoHp('');
    setFormWilayah('');
    setFormStatus('aktif');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (n: Naqib) => {
    setSelectedNaqib(n);
    setFormNama(n.nama);
    setFormEmail(n.email || '');
    setFormNoHp(n.no_hp || '');
    setFormWilayah(n.wilayah || '');
    setFormStatus(n.status as any);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formNama.trim() || !formUsername.trim()) {
      setFormError('Nama dan Username wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createNaqib({
        nama: formNama.trim(),
        username: formUsername.trim(),
        password: formPassword || 'Naqib123!',
        email: formEmail.trim(),
        no_hp: formNoHp.trim(),
        wilayah: formWilayah.trim(),
        status: 'aktif'
      });
      setIsAddModalOpen(false);
      await fetchNaqib();
    } catch (err: any) {
      setFormError(err.message || 'Data gagal disimpan. Silakan coba kembali.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNaqib) return;
    setFormError(null);

    setSubmitting(true);
    try {
      await api.updateNaqib({
        naqib_id: selectedNaqib.naqib_id,
        nama: formNama.trim(),
        email: formEmail.trim(),
        no_hp: formNoHp.trim(),
        wilayah: formWilayah.trim(),
        status: formStatus
      });
      setIsEditModalOpen(false);
      await fetchNaqib();
    } catch (err: any) {
      setFormError(err.message || 'Data gagal disimpan. Silakan coba kembali.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = naqibList.filter((n) => {
    const q = searchTerm.toLowerCase();
    return (
      n.nama.toLowerCase().includes(q) ||
      (n.wilayah && n.wilayah.toLowerCase().includes(q)) ||
      (n.email && n.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Data Naqib (Pembina Halaqah)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data pembina dan penanggung jawab halaqah tilawah
          </p>
        </div>

        <button
          type="button"
          id="btn-tambah-naqib"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Naqib</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, wilayah, atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          />
        </div>
      </div>

      {/* Grafik Perbandingan Naqib vs Binaan */}
      {!loading && naqibList.length > 0 && (
        <NaqibMemberComparisonChart
          data={naqibList.map(n => ({
            naqib_id: n.naqib_id,
            nama: n.nama,
            jumlah_anggota: n.jumlah_anggota || 0
          }))}
          title="Grafik Distribusi Binaan per Naqib"
          subtitle="Komparasi kuota dan sebaran jumlah anggota yang dibimbing oleh masing-masing Naqib"
        />
      )}

      {/* Table List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
            <p className="text-xs">Memuat data Naqib...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs">Tidak ada data Naqib yang cocok.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="text-[11px] uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">ID Naqib</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Kontak</th>
                  <th className="py-3 px-4">Wilayah</th>
                  <th className="py-3 px-4 text-center">Binaan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((naqib) => (
                  <tr key={naqib.naqib_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-500">
                      {naqib.naqib_id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {naqib.nama}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5 text-slate-600">
                        {naqib.email && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {naqib.email}
                          </span>
                        )}
                        {naqib.no_hp && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {naqib.no_hp}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                      {naqib.wilayah || '-'}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold">
                        <Users className="w-3 h-3 text-slate-400" />
                        {naqib.jumlah_anggota || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={naqib.status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(naqib)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Naqib"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Naqib Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Naqib Baru"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formNama}
              onChange={(e) => setFormNama(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
              placeholder="Contoh: Ustadz Ahmad Fauzi"
            />
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                placeholder="naqib03"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password Awal
              </label>
              <input
                type="text"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                placeholder="Naqib123!"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                placeholder="naqib@ngajitrack.id"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                No. WhatsApp
              </label>
              <input
                type="text"
                value={formNoHp}
                onChange={(e) => setFormNoHp(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                placeholder="08123456789"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Wilayah / Cabang
            </label>
            <input
              type="text"
              value={formWilayah}
              onChange={(e) => setFormWilayah(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
              placeholder="Contoh: Bandung Timur"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simpan Naqib</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Naqib Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Data Naqib"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                No. WhatsApp
              </label>
              <input
                type="text"
                value={formNoHp}
                onChange={(e) => setFormNoHp(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Wilayah
              </label>
              <input
                type="text"
                value={formWilayah}
                onChange={(e) => setFormWilayah(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Status Akun
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

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
