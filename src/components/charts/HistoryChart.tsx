import React, { useState, useMemo, useEffect } from 'react';
import { Aktivitas } from '../../types/aktivitas';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  BarChart3,
  LineChart as LineChartIcon,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Target,
  Minus,
  Plus,
  Users,
  Layers,
  BookOpen
} from 'lucide-react';

export interface NaqibFilterOption {
  naqib_id: string;
  nama: string;
  jumlah_anggota: number;
  jumlah_aktivitas?: number;
  anggota_aktif?: number;
}

interface HistoryChartProps {
  activities: Aktivitas[];
  title?: string;
  subtitle?: string;
  dailyTarget?: number;
  totalAnggota?: number;
  role?: 'admin' | 'naqib' | 'anggota';
  naqibList?: NaqibFilterOption[];
}

type PeriodType = 'harian' | 'pekan' | 'bulanan';
type ChartType = 'bar' | 'line';
type MetricView = 'anggota' | 'rincian';

export const HistoryChart: React.FC<HistoryChartProps> = ({
  activities = [],
  title = 'Histori Aktivitas Setoran',
  subtitle = 'Statistik perkembangan setoran tilawah, muroja\'ah, dan hafalan',
  dailyTarget: initialDailyTarget = 5,
  totalAnggota,
  role = 'anggota',
  naqibList = []
}) => {
  const isTargetAnggota = role === 'naqib' || role === 'admin';

  // Naqib selection for Admin
  const [selectedNaqibId, setSelectedNaqibId] = useState<string>('ALL');

  // Total members across all naqibs
  const totalAnggotaSemua = useMemo(() => {
    if (naqibList && naqibList.length > 0) {
      return naqibList.reduce((acc, n) => acc + (n.jumlah_anggota || 0), 0);
    }
    return totalAnggota || initialDailyTarget;
  }, [naqibList, totalAnggota, initialDailyTarget]);

  // Determine initial target based on role & naqib selection
  const defaultTarget = useMemo(() => {
    if (role === 'naqib') {
      return totalAnggota || initialDailyTarget;
    }
    if (role === 'admin') {
      if (selectedNaqibId !== 'ALL') {
        const found = naqibList.find((n) => n.naqib_id === selectedNaqibId);
        return found ? found.jumlah_anggota : 5;
      }
      return totalAnggotaSemua || initialDailyTarget;
    }
    return initialDailyTarget;
  }, [role, totalAnggota, initialDailyTarget, selectedNaqibId, naqibList, totalAnggotaSemua]);

  const [period, setPeriod] = useState<PeriodType>('harian');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [metricView, setMetricView] = useState<MetricView>(isTargetAnggota ? 'anggota' : 'rincian');
  const [targetHarian, setTargetHarian] = useState<number>(defaultTarget);

  // Update target when naqib filter changes
  useEffect(() => {
    setTargetHarian(defaultTarget);
  }, [defaultTarget]);

  const activeNaqibObj = useMemo(() => {
    if (role === 'admin' && selectedNaqibId !== 'ALL') {
      return naqibList.find((n) => n.naqib_id === selectedNaqibId) || null;
    }
    return null;
  }, [role, selectedNaqibId, naqibList]);

  // Filter activities if admin selected a specific naqib
  const filteredActivities = useMemo(() => {
    const safeActs = activities || [];
    if (role === 'admin' && selectedNaqibId !== 'ALL') {
      return safeActs.filter((a) => a.naqib_id === selectedNaqibId);
    }
    return safeActs;
  }, [activities, role, selectedNaqibId]);

  // Helper formatting dates & aggregation
  const chartData = useMemo(() => {
    const now = new Date();

    if (period === 'harian') {
      // 14 hari terakhir
      const days: {
        [key: string]: {
          label: string;
          dateStr: string;
          baca: number;
          murojaah: number;
          hafalan: number;
          total: number;
          anggotaSetor: number;
          anggotaNames: string[];
          memberIdsSet: Set<string>;
          namesSet: Set<string>;
        };
      } = {};

      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${day}`;
        const label = `${day}/${m}`;
        days[key] = {
          label,
          dateStr: key,
          baca: 0,
          murojaah: 0,
          hafalan: 0,
          total: 0,
          anggotaSetor: 0,
          anggotaNames: [],
          memberIdsSet: new Set<string>(),
          namesSet: new Set<string>()
        };
      }

      filteredActivities.forEach((act) => {
        const actDate = (act.tanggal || '').split('T')[0];
        if (days[actDate]) {
          if (act.jenis_aktivitas === 'BACA_QURAN') days[actDate].baca += 1;
          else if (act.jenis_aktivitas === 'MUROJAAH') days[actDate].murojaah += 1;
          else if (act.jenis_aktivitas === 'HAFALAN') days[actDate].hafalan += 1;
          days[actDate].total += 1;

          const memberId = act.anggota_id || act.nama_anggota;
          if (memberId) {
            days[actDate].memberIdsSet.add(memberId);
          }
          if (act.nama_anggota) {
            days[actDate].namesSet.add(act.nama_anggota);
          }
        }
      });

      return Object.values(days).map((d) => ({
        label: d.label,
        dateStr: d.dateStr,
        baca: d.baca,
        murojaah: d.murojaah,
        hafalan: d.hafalan,
        total: d.total,
        anggotaSetor: d.memberIdsSet.size,
        anggotaNames: Array.from(d.namesSet)
      }));
    }

    if (period === 'pekan') {
      // 8 Pekan Terakhir
      const weeks: {
        label: string;
        start: Date;
        end: Date;
        baca: number;
        murojaah: number;
        hafalan: number;
        total: number;
        memberIdsSet: Set<string>;
        namesSet: Set<string>;
      }[] = [];

      for (let i = 7; i >= 0; i--) {
        const end = new Date(now);
        end.setDate(now.getDate() - i * 7);
        const start = new Date(end);
        start.setDate(end.getDate() - 6);
        const label = `Pkn ${8 - i}`;
        weeks.push({
          label,
          start,
          end,
          baca: 0,
          murojaah: 0,
          hafalan: 0,
          total: 0,
          memberIdsSet: new Set<string>(),
          namesSet: new Set<string>()
        });
      }

      filteredActivities.forEach((act) => {
        const d = new Date(act.tanggal);
        if (isNaN(d.getTime())) return;
        weeks.forEach((w) => {
          if (d >= w.start && d <= w.end) {
            if (act.jenis_aktivitas === 'BACA_QURAN') w.baca += 1;
            else if (act.jenis_aktivitas === 'MUROJAAH') w.murojaah += 1;
            else if (act.jenis_aktivitas === 'HAFALAN') w.hafalan += 1;
            w.total += 1;

            const memberId = act.anggota_id || act.nama_anggota;
            if (memberId) w.memberIdsSet.add(memberId);
            if (act.nama_anggota) w.namesSet.add(act.nama_anggota);
          }
        });
      });

      return weeks.map((w) => ({
        label: w.label,
        baca: w.baca,
        murojaah: w.murojaah,
        hafalan: w.hafalan,
        total: w.total,
        anggotaSetor: w.memberIdsSet.size,
        anggotaNames: Array.from(w.namesSet)
      }));
    }

    // period === 'bulanan': 6 Bulan Terakhir
    const months: {
      label: string;
      yearMonth: string;
      baca: number;
      murojaah: number;
      hafalan: number;
      total: number;
      memberIdsSet: Set<string>;
      namesSet: Set<string>;
    }[] = [];

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        label: `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`,
        yearMonth: ym,
        baca: 0,
        murojaah: 0,
        hafalan: 0,
        total: 0,
        memberIdsSet: new Set<string>(),
        namesSet: new Set<string>()
      });
    }

    filteredActivities.forEach((act) => {
      const ym = (act.tanggal || '').slice(0, 7);
      const found = months.find((m) => m.yearMonth === ym);
      if (found) {
        if (act.jenis_aktivitas === 'BACA_QURAN') found.baca += 1;
        else if (act.jenis_aktivitas === 'MUROJAAH') found.murojaah += 1;
        else if (act.jenis_aktivitas === 'HAFALAN') found.hafalan += 1;
        found.total += 1;

        const memberId = act.anggota_id || act.nama_anggota;
        if (memberId) found.memberIdsSet.add(memberId);
        if (act.nama_anggota) found.namesSet.add(act.nama_anggota);
      }
    });

    return months.map((m) => ({
      label: m.label,
      baca: m.baca,
      murojaah: m.murojaah,
      hafalan: m.hafalan,
      total: m.total,
      anggotaSetor: m.memberIdsSet.size,
      anggotaNames: Array.from(m.namesSet)
    }));
  }, [filteredActivities, period]);

  // Target Analysis (Comparing either unique members deposited or total activities vs target)
  const dailyTargetAnalysis = useMemo(() => {
    if (period !== 'harian') return null;

    const safeChart = chartData || [];
    if (safeChart.length === 0) return null;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayItem = safeChart.find((d) => d.dateStr === todayStr) || safeChart[safeChart.length - 1];

    // When isTargetAnggota, the primary target tracked is unique members who setor
    const todayAchieved = isTargetAnggota && metricView === 'anggota'
      ? (todayItem?.anggotaSetor || 0)
      : (todayItem?.total || 0);

    const isAboveTarget = todayAchieved >= targetHarian;
    const diff = Math.abs(todayAchieved - targetHarian);
    const percent = targetHarian > 0 ? Math.round((todayAchieved / targetHarian) * 100) : 0;

    const daysAbove = safeChart.filter((d) => {
      const val = isTargetAnggota && metricView === 'anggota' ? d.anggotaSetor : d.total;
      return val >= targetHarian;
    }).length;
    const daysBelow = safeChart.length - daysAbove;

    return {
      todayAchieved,
      isAboveTarget,
      diff,
      percent,
      daysAbove,
      daysBelow,
      todayLabel: todayItem ? todayItem.label : 'Hari Ini',
      todayNames: todayItem ? todayItem.anggotaNames : []
    };
  }, [chartData, period, targetHarian, isTargetAnggota, metricView]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
      {/* Header controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Admin Naqib Selector */}
          {role === 'admin' && naqibList && naqibList.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/90 border border-slate-200/80 rounded-xl text-xs">
              <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-slate-500 font-medium hidden sm:inline">Naqib:</span>
              <select
                value={selectedNaqibId}
                onChange={(e) => setSelectedNaqibId(e.target.value)}
                className="bg-white border border-slate-200 font-semibold text-slate-800 rounded-lg px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="ALL">Semua Naqib (Target: {totalAnggotaSemua} orang)</option>
                {naqibList.map((nq) => (
                  <option key={nq.naqib_id} value={nq.naqib_id}>
                    {nq.nama} (Target: {nq.jumlah_anggota} orang)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Metric View Toggle: Anggota Setor vs Rincian Setoran (for Naqib & Admin) */}
          {isTargetAnggota && (
            <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setMetricView('anggota')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  metricView === 'anggota'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3 h-3 text-emerald-600" />
                <span>Jumlah Anggota Setor</span>
              </button>
              <button
                type="button"
                onClick={() => setMetricView('rincian')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  metricView === 'rincian'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3 h-3 text-teal-600" />
                <span>Rincian Tilawah</span>
              </button>
            </div>
          )}

          {/* Period Tabs: Harian / Pekan / Bulanan */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setPeriod('harian')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                period === 'harian'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Harian
            </button>
            <button
              type="button"
              onClick={() => setPeriod('pekan')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                period === 'pekan'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pekan
            </button>
            <button
              type="button"
              onClick={() => setPeriod('bulanan')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                period === 'bulanan'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulanan
            </button>
          </div>

          {/* Chart Type Toggle: Bar vs Line */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              title="Tampilkan Grafik Batang"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              title="Tampilkan Grafik Garis"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'line'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LineChartIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Target Harian Control & Capaian Alert (Khusus Mode Harian) */}
      {period === 'harian' && dailyTargetAnalysis && (
        <div className="space-y-3">
          {/* Target Adjuster & Summary Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Target className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {isTargetAnggota
                    ? activeNaqibObj
                      ? `Target Harian ${activeNaqibObj.nama}:`
                      : 'Target Jumlah Anggota Setor:'
                    : 'Garis Target Harian:'}
                </span>
              </span>
              <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setTargetHarian(Math.max(1, targetHarian - 1))}
                  className="p-1 text-slate-500 hover:bg-slate-100 rounded cursor-pointer"
                  title="Kurangi target"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="px-2 font-mono font-bold text-amber-700">
                  {targetHarian}
                </span>
                <button
                  type="button"
                  onClick={() => setTargetHarian(targetHarian + 1)}
                  className="p-1 text-slate-500 hover:bg-slate-100 rounded cursor-pointer"
                  title="Tambah target"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <span className="text-[11px] text-slate-500">
                {isTargetAnggota ? 'orang anggota yang setor/hari' : 'setoran/hari'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ <strong>{dailyTargetAnalysis.daysAbove}</strong> hari tercapai
              </span>
              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                ⚠ <strong>{dailyTargetAnalysis.daysBelow}</strong> hari di bawah
              </span>
            </div>
          </div>

          {/* Notifikasi Status Capaian Harian vs Target */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
              dailyTargetAnalysis.isAboveTarget
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                  dailyTargetAnalysis.isAboveTarget
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {dailyTargetAnalysis.isAboveTarget ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs">
                    {isTargetAnggota
                      ? dailyTargetAnalysis.isAboveTarget
                        ? 'Target Kehadiran Setoran Anggota Tercapai!'
                        : 'Belum Semua Anggota Menyetor Hari Ini'
                      : dailyTargetAnalysis.isAboveTarget
                        ? 'Capaian Harian DI ATAS Target Harian'
                        : 'Capaian Harian DI BAWAH Target Harian'}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      dailyTargetAnalysis.isAboveTarget
                        ? 'bg-emerald-200/70 text-emerald-800'
                        : 'bg-amber-200/70 text-amber-800'
                    }`}
                  >
                    {dailyTargetAnalysis.isAboveTarget ? 'Target Tercapai' : 'Perlu Diingatkan'}
                  </span>
                </div>

                <p className="text-[11px] opacity-90 mt-1 leading-relaxed">
                  {isTargetAnggota ? (
                    <>
                      {activeNaqibObj ? `Binaan ${activeNaqibObj.nama}` : 'Anggota'} setor hari ini ({dailyTargetAnalysis.todayLabel}):{' '}
                      <strong>{dailyTargetAnalysis.todayAchieved} dari {targetHarian} orang</strong> ({dailyTargetAnalysis.percent}%).{' '}
                      {dailyTargetAnalysis.isAboveTarget
                        ? `Alhamdulillah, target kehadiran seluruh ${targetHarian} orang anggota binaan yang setor telah terpenuhi hari ini!`
                        : `Masih ada ${dailyTargetAnalysis.diff} orang lagi yang belum menyetor hari ini dari target harian ${targetHarian} orang.`}
                    </>
                  ) : (
                    <>
                      Setoran hari ini ({dailyTargetAnalysis.todayLabel}):{' '}
                      <strong>{dailyTargetAnalysis.todayAchieved} setoran</strong> (Target:{' '}
                      <strong>{targetHarian} setoran</strong>).{' '}
                      {dailyTargetAnalysis.isAboveTarget
                        ? `Alhamdulillah, melampaui target harian sebesar +${dailyTargetAnalysis.diff} setoran.`
                        : `Kurang ${dailyTargetAnalysis.diff} setoran lagi untuk memenuhi target harian (${targetHarian} setoran).`}
                    </>
                  )}
                </p>

                {/* Badges nama yang sudah setor hari ini jika ada */}
                {dailyTargetAnalysis.todayNames && dailyTargetAnalysis.todayNames.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    <span className="text-[10px] font-semibold text-slate-600">Sudah setor hari ini:</span>
                    {dailyTargetAnalysis.todayNames.slice(0, 6).map((nm, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/90 border border-slate-200/70 text-slate-800"
                      >
                        {nm}
                      </span>
                    ))}
                    {dailyTargetAnalysis.todayNames.length > 6 && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        +{dailyTargetAnalysis.todayNames.length - 6} lainnya
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="self-end sm:self-auto shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs text-slate-700">
                <span className="w-3.5 border-t-2 border-dashed border-rose-500 inline-block"></span>
                Garis Target = {targetHarian} {isTargetAnggota ? 'Orang' : 'Setoran'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dataItem = chartData.find((d) => d.label === label);
                    const anggotaCount = dataItem?.anggotaSetor || 0;
                    const totalActs = dataItem?.total || 0;
                    const isAbove = isTargetAnggota && metricView === 'anggota'
                      ? anggotaCount >= targetHarian
                      : totalActs >= targetHarian;

                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[190px]">
                        <div className="flex justify-between items-center border-b border-slate-700 pb-1">
                          <span className="font-bold text-slate-200">{label}</span>
                          <span className="font-bold text-emerald-400">
                            {isTargetAnggota && metricView === 'anggota'
                              ? `${anggotaCount} Orang Setor`
                              : `Total: ${totalActs}`}
                          </span>
                        </div>

                        {/* If showing anggota_setor */}
                        {isTargetAnggota && metricView === 'anggota' ? (
                          <div className="space-y-1 text-[11px] text-slate-300">
                            <div className="flex justify-between">
                              <span className="text-emerald-400 font-semibold">Anggota Setor:</span>
                              <span className="font-bold text-white">
                                {anggotaCount} / {targetHarian} orang
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-400 text-[10px]">
                              <span>Total Tilawah:</span>
                              <span>{totalActs} aktivitas</span>
                            </div>
                            {dataItem?.anggotaNames && dataItem.anggotaNames.length > 0 && (
                              <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-300">
                                <span className="text-slate-400 block mb-0.5">Nama anggota:</span>
                                <span className="text-emerald-300">
                                  {dataItem.anggotaNames.slice(0, 4).join(', ')}
                                  {dataItem.anggotaNames.length > 4 ? ` +${dataItem.anggotaNames.length - 4}` : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          payload.map((entry, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-slate-300">
                              <span style={{ color: entry.color }}>{entry.name}:</span>
                              <span className="font-semibold">{entry.value}</span>
                            </div>
                          ))
                        )}

                        {period === 'harian' && (
                          <div className="pt-1 border-t border-slate-700 text-[10px] flex items-center justify-between">
                            <span className="text-slate-400">
                              Target ({targetHarian} {isTargetAnggota ? 'orang' : 'setoran'}):
                            </span>
                            <span className={isAbove ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                              {isAbove ? '✓ Tercapai' : '⚠ Belum Tercapai'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
              />

              {period === 'harian' && (
                <ReferenceLine
                  y={targetHarian}
                  stroke="#e11d48"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `Target: ${targetHarian} ${isTargetAnggota ? 'Orang' : 'Setoran'}`,
                    position: 'insideTopRight',
                    fill: '#be123c',
                    fontSize: 10,
                    fontWeight: 700
                  }}
                />
              )}

              {/* Render either Anggota Setor bar or Breakdown bars */}
              {isTargetAnggota && metricView === 'anggota' ? (
                <Bar
                  dataKey="anggotaSetor"
                  name="Jumlah Anggota yang Setor"
                  fill="#059669"
                  radius={[4, 4, 0, 0]}
                />
              ) : (
                <>
                  <Bar dataKey="baca" name="Baca Qur'an" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="murojaah" name="Muroja'ah" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hafalan" name="Hafalan" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </>
              )}
            </BarChart>
          ) : (
            <LineChart
              data={chartData}
              margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dataItem = chartData.find((d) => d.label === label);
                    const anggotaCount = dataItem?.anggotaSetor || 0;
                    const totalActs = dataItem?.total || 0;
                    const isAbove = isTargetAnggota && metricView === 'anggota'
                      ? anggotaCount >= targetHarian
                      : totalActs >= targetHarian;

                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[190px]">
                        <div className="flex justify-between items-center border-b border-slate-700 pb-1">
                          <span className="font-bold text-slate-200">{label}</span>
                          <span className="font-bold text-emerald-400">
                            {isTargetAnggota && metricView === 'anggota'
                              ? `${anggotaCount} Orang Setor`
                              : `Total: ${totalActs}`}
                          </span>
                        </div>

                        {isTargetAnggota && metricView === 'anggota' ? (
                          <div className="space-y-1 text-[11px] text-slate-300">
                            <div className="flex justify-between">
                              <span className="text-emerald-400 font-semibold">Anggota Setor:</span>
                              <span className="font-bold text-white">
                                {anggotaCount} / {targetHarian} orang
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-400 text-[10px]">
                              <span>Total Tilawah:</span>
                              <span>{totalActs} aktivitas</span>
                            </div>
                            {dataItem?.anggotaNames && dataItem.anggotaNames.length > 0 && (
                              <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-300">
                                <span className="text-slate-400 block mb-0.5">Nama anggota:</span>
                                <span className="text-emerald-300">
                                  {dataItem.anggotaNames.slice(0, 4).join(', ')}
                                  {dataItem.anggotaNames.length > 4 ? ` +${dataItem.anggotaNames.length - 4}` : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          payload.map((entry, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-slate-300">
                              <span style={{ color: entry.color }}>{entry.name}:</span>
                              <span className="font-semibold">{entry.value}</span>
                            </div>
                          ))
                        )}

                        {period === 'harian' && (
                          <div className="pt-1 border-t border-slate-700 text-[10px] flex items-center justify-between">
                            <span className="text-slate-400">
                              Target ({targetHarian} {isTargetAnggota ? 'orang' : 'setoran'}):
                            </span>
                            <span className={isAbove ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                              {isAbove ? '✓ Tercapai' : '⚠ Belum Tercapai'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
              />

              {period === 'harian' && (
                <ReferenceLine
                  y={targetHarian}
                  stroke="#e11d48"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `Target: ${targetHarian} ${isTargetAnggota ? 'Orang' : 'Setoran'}`,
                    position: 'insideTopRight',
                    fill: '#be123c',
                    fontSize: 10,
                    fontWeight: 700
                  }}
                />
              )}

              {isTargetAnggota && metricView === 'anggota' ? (
                <Line
                  type="monotone"
                  dataKey="anggotaSetor"
                  name="Jumlah Anggota yang Setor"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="baca"
                    name="Baca Qur'an"
                    stroke="#059669"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="murojaah"
                    name="Muroja'ah"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hafalan"
                    name="Hafalan"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </>
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
