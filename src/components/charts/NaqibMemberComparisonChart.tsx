import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { Users, UserCheck, Award, BarChart2 } from 'lucide-react';

export interface NaqibMemberStat {
  naqib_id: string;
  nama: string;
  jumlah_anggota: number;
  anggota_aktif?: number;
  jumlah_aktivitas?: number;
}

interface NaqibMemberComparisonChartProps {
  data: NaqibMemberStat[];
  title?: string;
  subtitle?: string;
}

export const NaqibMemberComparisonChart: React.FC<NaqibMemberComparisonChartProps> = ({
  data = [],
  title = 'Perbandingan Jumlah Anggota per Naqib',
  subtitle = 'Distribusi dan rasio anggota binaan di bawah bimbingan masing-masing Naqib'
}) => {
  const safeData = useMemo(() => data || [], [data]);

  const chartData = useMemo(() => {
    return safeData.map((item) => ({
      name: item.nama,
      anggota: item.jumlah_anggota || 0,
      aktif: item.anggota_aktif ?? 0,
      setoran: item.jumlah_aktivitas ?? 0,
    })).sort((a, b) => b.anggota - a.anggota);
  }, [safeData]);

  const summary = useMemo(() => {
    const totalNaqib = safeData.length;
    const totalAnggota = safeData.reduce((acc, curr) => acc + (curr.jumlah_anggota || 0), 0);
    const avgAnggota = totalNaqib > 0 ? (totalAnggota / totalNaqib).toFixed(1) : '0';
    const topNaqib = safeData.slice().sort((a, b) => (b.jumlah_anggota || 0) - (a.jumlah_anggota || 0))[0];

    return {
      totalNaqib,
      totalAnggota,
      avgAnggota,
      topNaqib: topNaqib ? topNaqib.nama : '-'
    };
  }, [safeData]);

  const barColors = [
    '#059669', // emerald
    '#0d9488', // teal
    '#0284c7', // sky
    '#2563eb', // blue
    '#4f46e5', // indigo
    '#7c3aed', // violet
    '#9333ea', // purple
    '#d97706', // amber
  ];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>

        {/* Quick Highlights */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-medium">
            Rata-rata: <strong>{summary.avgAnggota}</strong> org/Naqib
          </span>
          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-medium">
            Total: <strong>{summary.totalAnggota}</strong> Anggota
          </span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Belum ada data Naqib dan anggota untuk dibandingkan.
        </div>
      ) : (
        <>
          {/* Chart Canvas */}
          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 20, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  allowDecimals={false}
                  label={{
                    value: 'Jumlah Anggota',
                    angle: -90,
                    position: 'insideLeft',
                    fontSize: 10,
                    fill: '#94a3b8',
                    offset: 15
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[170px]">
                          <p className="font-bold text-slate-100 border-b border-slate-700 pb-1">
                            {d.name}
                          </p>
                          <div className="flex justify-between items-center text-slate-300">
                            <span>Total Anggota:</span>
                            <span className="font-bold text-emerald-400">{d.anggota} orang</span>
                          </div>
                          {d.aktif !== undefined && (
                            <div className="flex justify-between items-center text-slate-300">
                              <span>Anggota Aktif:</span>
                              <span className="font-bold text-blue-400">{d.aktif} orang</span>
                            </div>
                          )}
                          {d.setoran !== undefined && (
                            <div className="flex justify-between items-center text-slate-300">
                              <span>Total Setoran:</span>
                              <span className="font-bold text-amber-400">{d.setoran} kali</span>
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
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                />
                <Bar
                  dataKey="anggota"
                  name="Jumlah Anggota"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={barColors[index % barColors.length]}
                    />
                  ))}
                </Bar>
                {chartData.some(d => d.aktif > 0) && (
                  <Bar
                    dataKey="aktif"
                    name="Anggota Aktif"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ranking Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-600">Total Binaan:</span>
              </div>
              <span className="font-bold text-slate-900">{summary.totalAnggota} orang</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span className="text-slate-600">Binaan Terbanyak:</span>
              </div>
              <span className="font-bold text-slate-900 truncate max-w-[120px]" title={summary.topNaqib}>
                {summary.topNaqib}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span className="text-slate-600">Rata-rata/Halaqah:</span>
              </div>
              <span className="font-bold text-slate-900">{summary.avgAnggota} orang</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
