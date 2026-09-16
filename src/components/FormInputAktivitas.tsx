import React, { useState } from 'react';
import { JenisAktivitas, Aktivitas } from '../types/aktivitas';
import { SURAH_LIST } from '../utils/quranData';
import { getTodayDateInputValue } from '../utils/dateUtils';
import { BookOpen, Repeat, Award, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface FormInputAktivitasProps {
  onSuccess: (savedAct: Aktivitas) => void;
  onCancel?: () => void;
}

export const FormInputAktivitas: React.FC<FormInputAktivitasProps> = ({
  onSuccess,
  onCancel
}) => {
  const [jenis, setJenis] = useState<JenisAktivitas>('BACA_QURAN');
  const [tanggal, setTanggal] = useState<string>(getTodayDateInputValue());
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(1); // Default 1. Al-Fatihah
  const [ayatMulai, setAyatMulai] = useState<number | ''>(1);
  const [ayatSelesai, setAyatSelesai] = useState<number | ''>(7);
  const [catatan, setCatatan] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cari detail surat saat ini
  const currentSurah = SURAH_LIST.find((s) => s.number === selectedSurahNumber) || SURAH_LIST[0];

  // Saat ganti surat
  const handleSurahChange = (surahNum: number) => {
    setSelectedSurahNumber(surahNum);
    const surahObj = SURAH_LIST.find((s) => s.number === surahNum);
    if (surahObj) {
      setAyatMulai(1);
      // Jika surat pendek, langsung set ayatSelesai = totalVerses, jika panjang default 10 ayat
      setAyatSelesai(Math.min(10, surahObj.totalVerses));
    }
  };

  // Hitung jumlah ayat
  const computedAyatCount =
    typeof ayatMulai === 'number' && typeof ayatSelesai === 'number' && ayatSelesai >= ayatMulai
      ? ayatSelesai - ayatMulai + 1
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!tanggal) {
      setErrorMsg('Tanggal setoran wajib diisi.');
      return;
    }

    if (ayatMulai === '' || ayatSelesai === '') {
      setErrorMsg('Ayat mulai dan ayat selesai wajib diisi.');
      return;
    }

    if (Number(ayatSelesai) < Number(ayatMulai)) {
      setErrorMsg('Ayat selesai tidak boleh lebih kecil dari ayat mulai.');
      return;
    }

    if (Number(ayatSelesai) > currentSurah.totalVerses) {
      setErrorMsg(
        `Surat ${currentSurah.name} hanya memiliki ${currentSurah.totalVerses} ayat. Ayat selesai tidak boleh melebihi ${currentSurah.totalVerses}.`
      );
      return;
    }

    setLoading(true);
    try {
      const payload: Partial<Aktivitas> = {
        tanggal,
        jenis_aktivitas: jenis,
        surah: currentSurah.name,
        ayat_mulai: Number(ayatMulai),
        ayat_selesai: Number(ayatSelesai),
        jumlah_ayat: computedAyatCount,
        jumlah_halaman: 1,
        jumlah_hafalan: `${computedAyatCount} ayat`,
        nilai: jenis === 'HAFALAN' ? 85 : undefined,
        status: 'selesai',
        catatan: catatan.trim() || undefined
      };

      const result = await api.createAktivitas(payload);
      onSuccess(result);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Data gagal disimpan. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id="form-catat-aktivitas" onSubmit={handleSubmit} className="space-y-4">
      {/* 1. Pilih Jenis Aktivitas */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Jenis Aktivitas
        </label>
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setJenis('BACA_QURAN')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              jenis === 'BACA_QURAN'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Setor Baca</span>
          </button>

          <button
            type="button"
            onClick={() => setJenis('MUROJAAH')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              jenis === 'MUROJAAH'
                ? 'bg-white text-teal-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Muroja'ah</span>
          </button>

          <button
            type="button"
            onClick={() => setJenis('HAFALAN')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              jenis === 'HAFALAN'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Hafalan Baru</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          {errorMsg}
        </div>
      )}

      {/* 2. Pilihan Surat Al-Qur'an (Urut dari surat pertama 1 - 114) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-slate-700">
            Pilih Surat Al-Qur'an <span className="text-rose-500">*</span>
          </label>
          <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
            Total: {currentSurah.totalVerses} Ayat
          </span>
        </div>
        <select
          id="select-surah-quran"
          value={selectedSurahNumber}
          onChange={(e) => handleSurahChange(Number(e.target.value))}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium text-slate-900 shadow-2xs"
        >
          {SURAH_LIST.map((s) => (
            <option key={s.number} value={s.number}>
              {s.number}. Surat {s.name} ({s.totalVerses} ayat)
            </option>
          ))}
        </select>
      </div>

      {/* 3. Rentang Ayat: Ayat Mulai & Selesai */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Ayat Mulai <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            max={currentSurah.totalVerses}
            value={ayatMulai}
            onChange={(e) => setAyatMulai(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            placeholder="1"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Ayat Selesai <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            max={currentSurah.totalVerses}
            value={ayatSelesai}
            onChange={(e) => setAyatSelesai(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            placeholder={String(currentSurah.totalVerses)}
            required
          />
        </div>
      </div>

      {/* Ringkasan Perhitungan Ayat */}
      <div className="flex items-center justify-between text-xs px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-slate-600">
        <span>Cakupan Setoran:</span>
        <span className="font-semibold text-emerald-800">
          Surat {currentSurah.name}: Ayat {ayatMulai || '-'} s/d {ayatSelesai || '-'} ({computedAyatCount} ayat)
        </span>
      </div>

      {/* 4. Tanggal Setoran */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Tanggal Setoran <span className="text-rose-500">*</span>
        </label>
        <input
          type="date"
          required
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
        />
      </div>

      {/* 5. Catatan Singkat (Opsional) */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Catatan Singkat <span className="text-slate-400 font-normal">(Opsional)</span>
        </label>
        <input
          type="text"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          placeholder="Contoh: Ba'da shubuh, lancar tartil"
        />
      </div>

      {/* Tombol Simpan & Batal */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
        )}

        <button
          id="btn-submit-aktivitas"
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors cursor-pointer min-w-[130px]"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Simpan Setoran</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
