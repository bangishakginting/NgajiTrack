import React, { useState, useEffect } from 'react';
import {
  api,
  getEffectiveApiUrl,
  getCustomGasUrl,
  setCustomGasUrl,
  subscribeGasConnection,
  GasConnectionState
} from '../services/api';
import codeGsRaw from '../../google-apps-script/Code.gs?raw';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Save,
  FileSpreadsheet,
  RefreshCw,
  Loader2,
  Code2,
  Link,
  RotateCcw,
  Check
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [appName, setAppName] = useState('NGajiTrack');
  const [appTagline, setAppTagline] = useState('Catat, Monitor, dan Tingkatkan Tilawah Al-Qur\'an');
  const [defaultTargetBaca, setDefaultTargetBaca] = useState('2 halaman');
  const [defaultTargetMurojaah, setDefaultTargetMurojaah] = useState('1 surat');
  const [defaultTargetHafalan, setDefaultTargetHafalan] = useState('5 ayat');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Live Test & Custom URL State
  const [inputGasUrl, setInputGasUrl] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);
  const [urlNotice, setUrlNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);

  // Connection subscription
  const [connState, setConnState] = useState<GasConnectionState>(() => ({
    activeUrl: getEffectiveApiUrl(),
    isConfigured: Boolean(getEffectiveApiUrl()),
    isConnected: false,
    isFallback: true,
  }));

  useEffect(() => {
    const current = getEffectiveApiUrl();
    setInputGasUrl(current);

    const unsubscribe = subscribeGasConnection((state) => {
      setConnState(state);
      if (state.activeUrl) {
        setInputGasUrl(state.activeUrl);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const s = await api.getSettings();
        if (s.app_name) setAppName(s.app_name);
        if (s.app_tagline) setAppTagline(s.app_tagline);
        if (s.default_target_baca) setDefaultTargetBaca(s.default_target_baca);
        if (s.default_target_murojaah) setDefaultTargetMurojaah(s.default_target_murojaah);
        if (s.default_target_hafalan) setDefaultTargetHafalan(s.default_target_hafalan);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const hasCustomUrl = Boolean(getCustomGasUrl());

  const handleSaveGasUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputGasUrl.trim();

    if (!trimmed) {
      setUrlNotice({ type: 'error', message: 'URL Web App tidak boleh kosong.' });
      return;
    }

    if (!trimmed.startsWith('https://script.google.com/macros/s/')) {
      setUrlNotice({
        type: 'error',
        message: 'Format URL salah. URL Web App Google Apps Script harus diawali dengan https://script.google.com/macros/s/ dan diakhiri dengan /exec'
      });
      return;
    }

    setSavingUrl(true);
    setUrlNotice(null);
    setTestResult(null);

    try {
      await setCustomGasUrl(trimmed);
      setUrlNotice({
        type: 'info',
        message: 'URL berhasil disimpan. Sedang melakukan tes koneksi langsung ke Google Apps Script...'
      });

      // Langsung uji koneksi ke URL yang baru disimpan
      const res = await api.testConnection(trimmed);
      setTestResult(res);

      if (res.success) {
        setUrlNotice({
          type: 'success',
          message: '✓ URL berhasil disimpan dan TERHUBUNG LANGSUNG dengan Google Sheets!'
        });
      } else {
        setUrlNotice({
          type: 'error',
          message: 'URL disimpan, namun Google Apps Script belum merespons: ' + res.message
        });
      }
    } catch (err: any) {
      setUrlNotice({
        type: 'error',
        message: err.message || 'Gagal menyimpan URL.'
      });
    } finally {
      setSavingUrl(false);
    }
  };

  const handleResetGasUrl = async () => {
    setSavingUrl(true);
    setUrlNotice(null);
    setTestResult(null);
    try {
      await setCustomGasUrl('');
      const defaultUrl = getEffectiveApiUrl();
      setInputGasUrl(defaultUrl);
      setUrlNotice({
        type: 'info',
        message: 'URL telah direset ke default environment.'
      });
      if (defaultUrl) {
        const res = await api.testConnection(defaultUrl);
        setTestResult(res);
      }
    } finally {
      setSavingUrl(false);
    }
  };

  const handleTestConnection = async () => {
    const target = inputGasUrl.trim() || getEffectiveApiUrl();
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testConnection(target);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Gagal menghubungi Google Apps Script',
        details: err.message || 'Periksa koneksi jaringan atau periksa kembali URL Web App Anda.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCopyCodeGs = () => {
    navigator.clipboard.writeText(codeGsRaw);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.updateSettings({
        app_name: appName,
        app_tagline: appTagline,
        default_target_baca: defaultTargetBaca,
        default_target_murojaah: defaultTargetMurojaah,
        default_target_hafalan: defaultTargetHafalan
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Halaman */}
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pengaturan Sistem & Database</h1>
        <p className="text-xs text-slate-500 mt-1">
          Kelola koneksi basis data Google Sheets sebagai Single Source of Truth dan konfigurasi aplikasi.
        </p>
      </div>

      {/* Kartu Status & Konfigurasi Google Apps Script */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl text-white shrink-0 ${
              connState.isConnected ? 'bg-emerald-600' : 'bg-amber-600'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900">
                  Integrasi Google Sheets & Google Apps Script
                </h2>
                {connState.isConnected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Terhubung Live (Google Sheets)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5" /> Mode Simulasi Memori Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Data tilawah, pengguna, naqib, dan anggota disimpan langsung ke spreadsheet Google Sheets Anda.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-test-connection"
            onClick={handleTestConnection}
            disabled={testing || savingUrl}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors self-start sm:self-auto disabled:opacity-50"
          >
            {testing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Menguji Endpoint...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tes Koneksi API</span>
              </>
            )}
          </button>
        </div>

        {/* Form Input URL Web App (Solusi untuk pengguna memasukkan URL Web App baru) */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <label htmlFor="input-gas-url" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-emerald-600" />
              <span>URL Web App Google Apps Script (Tertanam Permanen di Codebase)</span>
            </label>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 self-start sm:self-auto">
              ✓ Siap Push ke GitHub &amp; Deploy Vercel
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            URL ini sudah tersimpan secara permanen di kode aplikasi. Saat di-push ke GitHub dan dideploy di Vercel, pengguna tidak perlu lagi diminta memasukkan URL Google Apps Script:
          </p>

          <form onSubmit={handleSaveGasUrl} className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="input-gas-url"
                type="url"
                value={inputGasUrl}
                onChange={(e) => setInputGasUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="flex-1 px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs text-slate-900"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  id="btn-save-gas-url"
                  disabled={savingUrl || testing}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  {savingUrl ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan &amp; Hubungkan</span>
                    </>
                  )}
                </button>

                {hasCustomUrl && (
                  <button
                    type="button"
                    id="btn-reset-gas-url"
                    onClick={handleResetGasUrl}
                    disabled={savingUrl}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg border border-slate-300 transition-colors shrink-0"
                    title="Kembalikan ke URL default environment variable"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Notifikasi Simpan URL */}
          {urlNotice && (
            <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
              urlNotice.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : urlNotice.type === 'error'
                ? 'bg-amber-50 border border-amber-200 text-amber-900'
                : 'bg-blue-50 border border-blue-200 text-blue-900'
            }`}>
              {urlNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : urlNotice.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <Loader2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-spin" />
              )}
              <span className="leading-relaxed">{urlNotice.message}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200/70 text-[11px] text-slate-500 font-mono break-all">
            <span className="font-sans text-slate-400 font-medium mr-1">URL Aktif Digunakan:</span>
            <span className="text-slate-700 font-semibold">{connState.activeUrl || '(Belum diisi)'}</span>
          </div>
        </div>

        {/* Hasil Pengujian Koneksi Diagnostik */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-start gap-2 font-bold">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span>{testResult.message}</span>
                {testResult.details && (
                  <p className="mt-1 font-normal text-slate-600 leading-relaxed">
                    {testResult.details}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Peringatan jika doPost belum terdeteksi */}
        {connState.isConfigured && connState.isFallback && (
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-2.5">
            <div className="flex items-start gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span>Fungsi <code>doPost</code> belum terdeteksi di Google Apps Script.</span>
                <p className="font-normal text-slate-600 mt-1 leading-relaxed">
                  Hal ini terjadi jika Anda belum menempelkan kode dari <code>Code.gs</code> ke editor Google Apps Script, atau belum membuat <strong>versi baru (New version)</strong> pada deployment Web App.
                </p>
              </div>
            </div>

            <div className="pl-6 pt-1 flex flex-wrap gap-2">
              <button
                type="button"
                id="btn-copy-code-gs-warning"
                onClick={handleCopyCodeGs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-2xs"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{copiedCode ? '✓ Kode Code.gs Berhasil Tersalin!' : 'Salin Seluruh Isi Code.gs (1.400+ baris)'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Panduan Deployment Google Apps Script */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Panduan Lengkap Setup / Update Google Apps Script
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-copy-code-gs-guide"
              onClick={handleCopyCodeGs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Tersalin ke Clipboard!' : 'Salin Code.gs'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              1
            </span>
            <div>
              <strong className="text-slate-900">Buka Editor Apps Script:</strong> Di Google Sheets Anda, klik menu <code>Extensions</code> &rarr; <code>Apps Script</code>.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              2
            </span>
            <div>
              <strong className="text-slate-900">Tempel Seluruh Kode Code.gs:</strong> Hapus seluruh kode default di editor Apps Script, lalu tempel kode dari tombol <strong>"Salin Code.gs"</strong> di atas. Kemudian klik ikon <strong>Simpan (Ctrl+S)</strong>.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              3
            </span>
            <div>
              <strong className="text-slate-900">Jalankan Inisialisasi Database:</strong> Pada toolbar atas Apps Script, pilih fungsi <code>setupDatabase</code> di menu dropdown lalu klik <strong>Run</strong>. Berikan izin otorisasi akun Google Anda. Sheet <code>USERS</code>, <code>NAQIB</code>, <code>ANGGOTA</code>, <code>AKTIVITAS</code>, dan <code>SETTINGS</code> akan otomatis dibuat lengkap dengan formula dan header.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              4
            </span>
            <div>
              <strong className="text-slate-900">Deploy sebagai Web App:</strong>
              <p className="mt-1 text-slate-600 leading-relaxed">
                Klik tombol biru <strong>Deploy &gt; New deployment</strong> (atau jika sudah pernah, klik <strong>Manage deployments &gt; Edit &gt; Version: New version</strong>).
              </p>
              <div className="mt-1.5 p-2 bg-emerald-50/70 border border-emerald-200/60 rounded-md font-mono text-[11px] text-emerald-900">
                Execute as: <strong>Me (email Anda)</strong><br />
                Who has access: <strong>Anyone (Siapa saja)</strong>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              5
            </span>
            <div>
              <strong className="text-slate-900">Salin URL &amp; Tempel di Aplikasi:</strong> Salin URL Web App yang muncul (berakhiran <code>/exec</code>), tempelkan ke kolom <strong>"URL Web App Google Apps Script Anda"</strong> di atas, lalu klik <strong>"Simpan &amp; Hubungkan"</strong>.
            </div>
          </div>
        </div>
      </div>

      {/* Form Parameter Aplikasi */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Pengaturan Default Aplikasi</h3>

        {saveSuccess && (
          <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Pengaturan berhasil disimpan ke database!</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nama Aplikasi
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tagline Aplikasi
              </label>
              <input
                type="text"
                value={appTagline}
                onChange={(e) => setAppTagline(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Default Target Baca Harian
              </label>
              <input
                type="text"
                value={defaultTargetBaca}
                onChange={(e) => setDefaultTargetBaca(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Default Target Muroja'ah
              </label>
              <input
                type="text"
                value={defaultTargetMurojaah}
                onChange={(e) => setDefaultTargetMurojaah(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Default Target Hafalan
              </label>
              <input
                type="text"
                value={defaultTargetHafalan}
                onChange={(e) => setDefaultTargetHafalan(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Pengaturan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
