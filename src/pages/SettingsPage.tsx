import React, { useState, useEffect } from 'react';
import {
  api,
  getEffectiveApiUrl,
  subscribeGasConnection,
  GasConnectionState
} from '../services/api';
import codeGsRaw from '../../google-apps-script/Code.gs?raw';
import {
  Database,
  CheckCircle2,
  Copy,
  Save,
  FileSpreadsheet,
  RefreshCw,
  Loader2,
  Code2,
  Check,
  ShieldCheck,
  Users,
  Info
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

  // Live Test State
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);

  // Connection subscription
  const [connState, setConnState] = useState<GasConnectionState>(() => ({
    activeUrl: getEffectiveApiUrl(),
    isConfigured: Boolean(getEffectiveApiUrl()),
    isConnected: true,
    isFallback: false,
  }));

  useEffect(() => {
    const unsubscribe = subscribeGasConnection((state) => {
      setConnState(state);
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

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Gagal menghubungi endpoint Google Apps Script',
        details: err.message || 'Periksa koneksi jaringan atau periksa status deployment Web App.'
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

  const activeApiUrl = connState.activeUrl || getEffectiveApiUrl();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Halaman */}
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pengaturan Sistem &amp; Basis Data</h1>
        <p className="text-xs text-slate-500 mt-1">
          Konfigurasi basis data Google Sheets sebagai Single Source of Truth dan parameter aplikasi.
        </p>
      </div>

      {/* Status Integrasi Database (Terkonfigurasi Otomatis via VITE_API_URL) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl text-white shrink-0 bg-emerald-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900">
                  Basis Data Terhubung Otomatis
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> VITE_API_URL Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Aplikasi telah difinalisasi menggunakan database Google Sheets melalui variabel <code>VITE_API_URL</code> dari menu Settings/Secrets AI Studio.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-test-connection"
            onClick={handleTestConnection}
            disabled={testing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors self-start sm:self-auto disabled:opacity-50 cursor-pointer"
          >
            {testing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Memeriksa Respon...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Tes Ping Endpoint</span>
              </>
            )}
          </button>
        </div>

        {/* Informasi Endpoint Aktif */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Endpoint Web App Google Apps Script Aktif:</span>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Terkunci Permanen
            </span>
          </div>
          <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 break-all select-all">
            {activeApiUrl || '(Memuat endpoint default...)'}
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Koneksi ini berjalan secara seamless di background tanpa meminta intervensi konfigurasi dari pengguna.
          </p>
        </div>

        {/* Hasil Pengujian Tes Ping jika dijalankan */}
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
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
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
      </div>

      {/* Bagian Khusus Developer: Konfigurasi Spreadsheet ID di Code.gs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Konfigurasi Developer (ID Spreadsheet di Code.gs)
              </h3>
              <p className="text-xs text-slate-500">
                Petunjuk penempatan ID Google Spreadsheet oleh developer di Google Apps Script.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-copy-code-gs-guide"
            onClick={handleCopyCodeGs}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Tersalin ke Clipboard!' : 'Salin Seluruh Isi Code.gs'}</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono space-y-2 overflow-x-auto">
          <div className="text-emerald-400 font-bold">// Diisi oleh developer pada baris atas google-apps-script/Code.gs:</div>
          <div className="text-slate-400">// Salin ID dari URL: https://docs.google.com/spreadsheets/d/[ID_SPREADSHEET]/edit</div>
          <div className="text-amber-300 font-semibold">const SPREADSHEET_ID = "1-WcoLYkF6J0LjaPvfwk85bK7ABhXGvGMxbJoRKZ1Weg";</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Akun Admin</span>
            </div>
            <p className="text-slate-600">Username: <code className="font-mono font-bold text-slate-900">admin</code></p>
            <p className="text-slate-600">Password: <code className="font-mono font-bold text-emerald-700">Admin123!</code></p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Akun NAQIB</span>
            </div>
            <p className="text-slate-600">Username: <code className="font-mono font-bold text-slate-900">naqib01</code>, <code className="font-mono font-bold text-slate-900">naqib02</code></p>
            <p className="text-slate-600">Password: <code className="font-mono font-bold text-emerald-700">Naqib123!</code></p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Akun Anggota</span>
            </div>
            <p className="text-slate-600">Username: <code className="font-mono font-bold text-slate-900">anggota01</code> ... <code className="font-mono font-bold text-slate-900">anggota06</code></p>
            <p className="text-slate-600">Password: <code className="font-mono font-bold text-emerald-700">Anggota123!</code></p>
          </div>
        </div>
      </div>

      {/* Form Parameter Aplikasi */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Pengaturan Default Aplikasi</h3>

        {saveSuccess && (
          <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Pengaturan berhasil disimpan!</span>
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
