import React, { useMemo } from 'react';
import { Aktivitas } from '../../types/aktivitas';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip
} from 'recharts';
import { Target, Users, Award } from 'lucide-react';

export interface NaqibItem {
  naqib_id: string;
  nama: string;
  jumlah_anggota: number;
  jumlah_aktivitas: number;
  anggota_aktif: number;
}

interface NaqibSpiderChartProps {
  activities?: Aktivitas[];
  naqibList?: NaqibItem[];
  title?: string;
  subtitle?: string;
}

// Distinct high-contrast palette for comparing each Naqib
export const NAQIB_COLORS = [
  '#059669', // Emerald
  '#2563eb', // Blue
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#e11d48', // Rose
  '#0891b2', // Cyan
  '#ea580c', // Orange
  '#4f46e5', // Indigo
  '#0d9488', // Teal
  '#be185d'  // Pink
];

export const NaqibSpiderChart: React.FC<NaqibSpiderChartProps> = ({
  activities = [],
  naqibList = [],
  title = 'Perbandingan Capaian Antar Naqib',
  subtitle = 'Komparasi performansi halaqah binaan tiap Naqib dalam 5 dimensi tilawah & keaktifan'
}) => {
  const safeActivities = useMemo(() => activities || [], [activities]);
  const safeNaqibList = useMemo(() => naqibList || [], [naqibList]);

  // Calculate normalized score (0 - 100) for each Naqib
  const naqibScores = useMemo(() => {
    return safeNaqibList.map((nq) => {
      const nqActs = safeActivities.filter((a) => a.naqib_id === nq.naqib_id);
      const memberCount = Math.max(1, nq.jumlah_anggota || 1);

      const bacaCount = nqActs.filter((a) => a.jenis_aktivitas === 'BACA_QURAN').length;
      const murojaahCount = nqActs.filter((a) => a.jenis_aktivitas === 'MUROJAAH').length;
      const hafalanCount = nqActs.filter((a) => a.jenis_aktivitas === 'HAFALAN').length;
      const totalAyat = nqActs.reduce((acc, a) => acc + (a.jumlah_ayat || 0), 0);

      // Unique active days across halaqah
      const activeDays = new Set(nqActs.map((a) => a.tanggal)).size;

      // 1. Baca Qur'an score: benchmark ~10 baca per member
      const scoreBaca = Math.min(100, Math.round(((bacaCount / memberCount) / 10) * 100));

      // 2. Muroja'ah score: benchmark ~8 muroja'ah per member
      const scoreMurojaah = Math.min(100, Math.round(((murojaahCount / memberCount) / 8) * 100));

      // 3. Hafalan score: benchmark ~5 hafalan per member
      const scoreHafalan = Math.min(100, Math.round(((hafalanCount / memberCount) / 5) * 100));

      // 4. Konsistensi / Rasio Keaktifan: persentase anggota aktif di halaqah
      const keaktifanRatio = nq.jumlah_anggota > 0
        ? Math.round((nq.anggota_aktif / nq.jumlah_anggota) * 100)
        : Math.min(100, Math.round((activeDays / 15) * 100));
      const scoreKonsistensi = Math.min(100, Math.max(keaktifanRatio, Math.round((activeDays / 20) * 100)));

      // 5. Volume Ayat score: benchmark ~200 ayat per member
      const scoreVolumeAyat = Math.min(100, Math.round(((totalAyat / memberCount) / 200) * 100));

      const avgScore = Math.round(
        (Math.max(scoreBaca, 15) +
          Math.max(scoreMurojaah, 15) +
          Math.max(scoreHafalan, 15) +
          Math.max(scoreKonsistensi, 15) +
          Math.max(scoreVolumeAyat, 15)) /
          5
      );

      return {
        naqib_id: nq.naqib_id,
        nama: nq.nama,
        jumlah_anggota: nq.jumlah_anggota,
        anggota_aktif: nq.anggota_aktif,
        total_aktivitas: nq.jumlah_aktivitas || nqActs.length,
        scoreBaca: Math.max(scoreBaca, 15),
        scoreMurojaah: Math.max(scoreMurojaah, 15),
        scoreHafalan: Math.max(scoreHafalan, 15),
        scoreKonsistensi: Math.max(scoreKonsistensi, 15),
        scoreVolumeAyat: Math.max(scoreVolumeAyat, 15),
        avgScore
      };
    });
  }, [safeActivities, safeNaqibList]);

  // Radar dataset with 5 dimensions
  const radarData = useMemo(() => {
    const dimensions = [
      { subject: "Baca Qur'an", key: 'scoreBaca' as const },
      { subject: "Muroja'ah", key: 'scoreMurojaah' as const },
      { subject: 'Hafalan Baru', key: 'scoreHafalan' as const },
      { subject: 'Konsistensi', key: 'scoreKonsistensi' as const },
      { subject: 'Volume Ayat', key: 'scoreVolumeAyat' as const }
    ];

    return dimensions.map((dim) => {
      const row: Record<string, any> = { subject: dim.subject };
      naqibScores.forEach((nq) => {
        row[nq.nama] = nq[dim.key];
      });
      return row;
    });
  }, [naqibScores]);

  if (safeNaqibList.length === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Target className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        </div>
        <div className="py-12 text-center text-xs text-slate-400">
          Belum ada data Naqib untuk ditampilkan.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
      {/* Header tanpa dropdown menu, langsung perbandingan semua Naqib */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Badge informasi total Naqib yang dibandingkan */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 font-medium self-start sm:self-auto">
          <Users className="w-3.5 h-3.5 text-emerald-600" />
          <span>Perbandingan <strong>{safeNaqibList.length} Naqib</strong></span>
        </div>
      </div>

      {/* Spider / Radar Chart Canvas */}
      <div className="h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="subject"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              stroke="#cbd5e1"
              fontSize={9}
            />
            {/* Render radar untuk tiap Naqib dengan warna berbeda */}
            {naqibScores.map((nq, idx) => {
              const color = NAQIB_COLORS[idx % NAQIB_COLORS.length];
              return (
                <Radar
                  key={nq.naqib_id}
                  name={nq.nama}
                  dataKey={nq.nama}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
              );
            })}
            <Tooltip
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
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Kartu Rincian Capaian Antar Naqib */}
      <div className="pt-2 border-t border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {naqibScores.map((nq, idx) => {
            const color = NAQIB_COLORS[idx % NAQIB_COLORS.length];
            return (
              <div
                key={nq.naqib_id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                      {nq.nama}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                    Skor {nq.avgScore}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>{nq.jumlah_anggota} binaan ({nq.anggota_aktif} aktif)</span>
                  <span className="font-semibold text-slate-700">{nq.total_aktivitas} setoran</span>
                </div>

                {/* Mini progress bar capaian naqib */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(5, nq.avgScore))}%`,
                      backgroundColor: color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
