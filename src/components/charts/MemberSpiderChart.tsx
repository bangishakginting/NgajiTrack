import React, { useState, useMemo } from 'react';
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
import { Target, Users } from 'lucide-react';

export interface MemberOption {
  id: string;
  name: string;
}

interface MemberSpiderChartProps {
  activities: Aktivitas[];
  membersList?: MemberOption[];
  isSelfView?: boolean;
  compareAll?: boolean;
  currentUserName?: string;
  title?: string;
  subtitle?: string;
}

export const MEMBER_COLORS = [
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

export const MemberSpiderChart: React.FC<MemberSpiderChartProps> = ({
  activities = [],
  membersList = [],
  isSelfView = false,
  compareAll = true,
  currentUserName = 'Saya',
  title = 'Perbandingan Performansi Anggota',
  subtitle = 'Evaluasi 5 dimensi tilawah, muroja\'ah, hafalan, dan konsistensi'
}) => {
  const safeActivities = useMemo(() => activities || [], [activities]);

  // Extract unique members from activities or use provided membersList
  const allMembers: MemberOption[] = useMemo(() => {
    if (membersList && membersList.length > 0) return membersList;
    const map = new Map<string, string>();
    safeActivities.forEach((a) => {
      if (a.anggota_id && a.nama_anggota) {
        map.set(a.anggota_id, a.nama_anggota);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [safeActivities, membersList]);

  // Selected members for fallback 2-member comparison if compareAll is false
  const [memberAId, setMemberAId] = useState<string>(allMembers[0]?.id || '');
  const [memberBId, setMemberBId] = useState<string>(allMembers[1]?.id || '');

  // Keep state updated if allMembers change
  React.useEffect(() => {
    if (allMembers.length > 0 && !memberAId) {
      setMemberAId(allMembers[0].id);
    }
    if (allMembers.length > 1 && !memberBId) {
      setMemberBId(allMembers[1].id);
    }
  }, [allMembers]);

  // Calculate scores for a given set of activities (0 - 100)
  const calculateScore = (memberActs: Aktivitas[]) => {
    const acts = memberActs || [];
    const bacaCount = acts.filter((a) => a.jenis_aktivitas === 'BACA_QURAN').length;
    const murojaahCount = acts.filter((a) => a.jenis_aktivitas === 'MUROJAAH').length;
    const hafalanCount = acts.filter((a) => a.jenis_aktivitas === 'HAFALAN').length;

    // Unique active days
    const activeDays = new Set(acts.map((a) => a.tanggal)).size;

    // Total verses recited
    const totalAyat = acts.reduce((acc, a) => acc + (a.jumlah_ayat || 0), 0);

    // Normalize to 0 - 100 benchmark
    const scoreBaca = Math.min(100, Math.round((bacaCount / 15) * 100));
    const scoreMurojaah = Math.min(100, Math.round((murojaahCount / 10) * 100));
    const scoreHafalan = Math.min(100, Math.round((hafalanCount / 8) * 100));
    const scoreKonsistensi = Math.min(100, Math.round((activeDays / 20) * 100));
    const scoreVolumeAyat = Math.min(100, Math.round((totalAyat / 250) * 100));

    const avgScore = Math.round(
      (Math.max(scoreBaca, 10) +
        Math.max(scoreMurojaah, 10) +
        Math.max(scoreHafalan, 10) +
        Math.max(scoreKonsistensi, 10) +
        Math.max(scoreVolumeAyat, 10)) /
        5
    );

    return {
      scoreBaca: Math.max(scoreBaca, 10),
      scoreMurojaah: Math.max(scoreMurojaah, 10),
      scoreHafalan: Math.max(scoreHafalan, 10),
      scoreKonsistensi: Math.max(scoreKonsistensi, 10),
      scoreVolumeAyat: Math.max(scoreVolumeAyat, 10),
      avgScore,
      totalAktivitas: acts.length,
      activeDays
    };
  };

  // Pre-calculate scores for all members
  const memberScoresMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateScore>>();
    allMembers.forEach((m) => {
      const acts = safeActivities.filter((a) => a.anggota_id === m.id);
      map.set(m.id, calculateScore(acts));
    });
    return map;
  }, [allMembers, safeActivities]);

  // Group average score
  const groupAverageScore = useMemo(() => {
    if (safeActivities.length === 0) {
      return {
        scoreBaca: 50,
        scoreMurojaah: 45,
        scoreHafalan: 40,
        scoreKonsistensi: 55,
        scoreVolumeAyat: 50
      };
    }
    const memberGroups = new Map<string, Aktivitas[]>();
    safeActivities.forEach((a) => {
      const key = a.anggota_id || 'default';
      const arr = memberGroups.get(key) || [];
      arr.push(a);
      memberGroups.set(key, arr);
    });

    let totalB = 0;
    let totalM = 0;
    let totalH = 0;
    let totalK = 0;
    let totalV = 0;
    const count = Math.max(memberGroups.size, 1);

    memberGroups.forEach((acts) => {
      const sc = calculateScore(acts);
      totalB += sc.scoreBaca;
      totalM += sc.scoreMurojaah;
      totalH += sc.scoreHafalan;
      totalK += sc.scoreKonsistensi;
      totalV += sc.scoreVolumeAyat;
    });

    return {
      scoreBaca: Math.round(totalB / count),
      scoreMurojaah: Math.round(totalM / count),
      scoreHafalan: Math.round(totalH / count),
      scoreKonsistensi: Math.round(totalK / count),
      scoreVolumeAyat: Math.round(totalV / count)
    };
  }, [safeActivities]);

  // Scores for single member (self view)
  const selfScores = useMemo(() => {
    return calculateScore(safeActivities);
  }, [safeActivities]);

  // Scores for selected members (legacy 2-member comparison if compareAll=false)
  const memberAName = allMembers.find((m) => m.id === memberAId)?.name || 'Anggota A';
  const memberBName = allMembers.find((m) => m.id === memberBId)?.name || 'Anggota B';
  const memberAScores = memberScoresMap.get(memberAId) || calculateScore([]);
  const memberBScores = memberScoresMap.get(memberBId) || calculateScore([]);

  const radarData = useMemo(() => {
    if (isSelfView) {
      return [
        { subject: "Baca Qur'an", [currentUserName]: selfScores.scoreBaca, 'Rata-rata Kelompok': groupAverageScore.scoreBaca },
        { subject: "Muroja'ah", [currentUserName]: selfScores.scoreMurojaah, 'Rata-rata Kelompok': groupAverageScore.scoreMurojaah },
        { subject: 'Hafalan Baru', [currentUserName]: selfScores.scoreHafalan, 'Rata-rata Kelompok': groupAverageScore.scoreHafalan },
        { subject: 'Konsistensi', [currentUserName]: selfScores.scoreKonsistensi, 'Rata-rata Kelompok': groupAverageScore.scoreKonsistensi },
        { subject: 'Volume Ayat', [currentUserName]: selfScores.scoreVolumeAyat, 'Rata-rata Kelompok': groupAverageScore.scoreVolumeAyat }
      ];
    }

    if (compareAll) {
      const dimensions = [
        { subject: "Baca Qur'an", key: 'scoreBaca' as const },
        { subject: "Muroja'ah", key: 'scoreMurojaah' as const },
        { subject: 'Hafalan Baru', key: 'scoreHafalan' as const },
        { subject: 'Konsistensi', key: 'scoreKonsistensi' as const },
        { subject: 'Volume Ayat', key: 'scoreVolumeAyat' as const }
      ];

      return dimensions.map((dim) => {
        const row: Record<string, any> = { subject: dim.subject };
        allMembers.forEach((m) => {
          const sc = memberScoresMap.get(m.id);
          row[m.name] = sc ? sc[dim.key] : 10;
        });
        return row;
      });
    }

    // Fallback: 2 members comparison
    return [
      { subject: "Baca Qur'an", [memberAName]: memberAScores.scoreBaca, [memberBName]: memberBScores.scoreBaca, 'Target Standar': 75 },
      { subject: "Muroja'ah", [memberAName]: memberAScores.scoreMurojaah, [memberBName]: memberBScores.scoreMurojaah, 'Target Standar': 75 },
      { subject: 'Hafalan Baru', [memberAName]: memberAScores.scoreHafalan, [memberBName]: memberBScores.scoreHafalan, 'Target Standar': 75 },
      { subject: 'Konsistensi', [memberAName]: memberAScores.scoreKonsistensi, [memberBName]: memberBScores.scoreKonsistensi, 'Target Standar': 75 },
      { subject: 'Volume Ayat', [memberAName]: memberAScores.scoreVolumeAyat, [memberBName]: memberBScores.scoreVolumeAyat, 'Target Standar': 75 }
    ];
  }, [
    isSelfView,
    compareAll,
    allMembers,
    memberScoresMap,
    currentUserName,
    selfScores,
    groupAverageScore,
    memberAName,
    memberBName,
    memberAScores,
    memberBScores
  ]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Member indicator when comparing all (NO dropdown menus) */}
        {!isSelfView && compareAll && allMembers.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 font-medium self-start sm:self-auto">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Semua <strong>{allMembers.length} Anggota Binaan</strong></span>
          </div>
        )}

        {/* Member Selectors (Only if compareAll is explicitly set to false) */}
        {!isSelfView && !compareAll && allMembers.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <select
                value={memberAId}
                onChange={(e) => setMemberAId(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {allMembers.map((m) => (
                  <option key={`a-${m.id}`} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-400 text-xs font-bold">vs</span>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              <select
                value={memberBId}
                onChange={(e) => setMemberBId(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {allMembers.map((m) => (
                  <option key={`b-${m.id}`} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
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
            {isSelfView ? (
              <>
                <Radar
                  name={currentUserName}
                  dataKey={currentUserName}
                  stroke="#059669"
                  fill="#10b981"
                  fillOpacity={0.45}
                />
                <Radar
                  name="Rata-rata Kelompok"
                  dataKey="Rata-rata Kelompok"
                  stroke="#6366f1"
                  fill="#818cf8"
                  fillOpacity={0.2}
                />
              </>
            ) : compareAll ? (
              allMembers.map((m, idx) => {
                const color = MEMBER_COLORS[idx % MEMBER_COLORS.length];
                return (
                  <Radar
                    key={m.id}
                    name={m.name}
                    dataKey={m.name}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                );
              })
            ) : (
              <>
                <Radar
                  name={memberAName}
                  dataKey={memberAName}
                  stroke="#059669"
                  fill="#10b981"
                  fillOpacity={0.4}
                />
                <Radar
                  name={memberBName}
                  dataKey={memberBName}
                  stroke="#2563eb"
                  fill="#3b82f6"
                  fillOpacity={0.35}
                />
              </>
            )}
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

      {/* Kartu Rincian Performa Semua Anggota (Bila compareAll aktif) */}
      {!isSelfView && compareAll && allMembers.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {allMembers.map((m, idx) => {
              const color = MEMBER_COLORS[idx % MEMBER_COLORS.length];
              const score = memberScoresMap.get(m.id);
              const avg = score ? score.avgScore : 0;
              return (
                <div
                  key={m.id}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-semibold text-slate-800 truncate">
                      {m.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {score?.totalAktivitas || 0} setoran
                    </span>
                    <span className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-white text-slate-700 border border-slate-200">
                      {avg}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
