import React, { useMemo } from 'react';
import { Aktivitas } from '../../types/aktivitas';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { BookMarked } from 'lucide-react';

interface PopularSurahDonutChartProps {
  activities: Aktivitas[];
  title?: string;
  subtitle?: string;
}

const DONUT_COLORS = [
  '#059669', // Emerald
  '#0d9488', // Teal
  '#0284c7', // Sky
  '#6366f1', // Indigo
  '#d97706', // Amber
  '#e11d48', // Rose
  '#64748b'  // Slate (Lainnya)
];

export const PopularSurahDonutChart: React.FC<PopularSurahDonutChartProps> = ({
  activities = [],
  title = 'Surat Al-Qur\'an Terpopuler',
  subtitle = 'Distribusi surat yang paling sering disetorkan'
}) => {
  const { data, totalSetoran } = useMemo(() => {
    const safeActs = activities || [];
    const counts: { [surah: string]: number } = {};

    safeActs.forEach((act) => {
      const s = act.surah?.trim();
      if (!s) return;
      counts[s] = (counts[s] || 0) + 1;
    });

    const sorted = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const total = sorted.reduce((acc, curr) => acc + curr.value, 0);

    if (sorted.length <= 6) {
      return { data: sorted, totalSetoran: total };
    }

    const top5 = sorted.slice(0, 5);
    const othersCount = sorted.slice(5).reduce((acc, curr) => acc + curr.value, 0);
    top5.push({ name: 'Lainnya', value: othersCount });

    return { data: top5, totalSetoran: total };
  }, [activities]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
      <div className="border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      {data.length === 0 ? (
        <div className="h-60 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
          <BookMarked className="w-8 h-8 mb-2 opacity-40" />
          <span>Belum ada data setoran surat untuk ditampilkan</span>
        </div>
      ) : (
        <div className="h-60 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any) => [
                  `${value} setoran (${Math.round((Number(value) / totalSetoran) * 100)}%)`,
                  name
                ]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '11px',
                  color: '#ffffff'
                }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Statistic Label in Donut Hole */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
            <span className="text-xl font-bold text-slate-900">{totalSetoran}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Setoran
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
