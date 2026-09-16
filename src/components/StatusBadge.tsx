import React from 'react';

interface StatusBadgeProps {
  status: 'Aktif' | 'Perlu Perhatian' | 'Tidak Aktif' | 'aktif' | 'nonaktif' | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const norm = String(status).trim().toLowerCase();

  if (norm === 'aktif') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Aktif
      </span>
    );
  }

  if (norm === 'perlu perhatian') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        Perlu Perhatian
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
      {status === 'nonaktif' ? 'Nonaktif' : 'Tidak Aktif'}
    </span>
  );
};
