export function formatIndonesianDate(dateStr?: string | Date): string {
  if (!dateStr) return '-';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return String(dateStr);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

export function formatRelativeTime(dateStr?: string | Date): string {
  if (!dateStr) return 'Belum ada';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return String(dateStr);

  const now = new Date();
  // reset time to midnight for fair calendar day calculation
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  
  const diffDays = Math.floor((startOfNow - startOfDate) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 30) return `${diffDays} hari lalu`;
  return formatIndonesianDate(date);
}

export function calculateInactiveDays(dateStr?: string | Date): number {
  if (!dateStr) return 999;
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return 999;

  const now = new Date();
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  
  const diffDays = Math.floor((startOfNow - startOfDate) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function determineActivityStatus(lastActivityDateStr?: string): 'Aktif' | 'Perlu Perhatian' | 'Tidak Aktif' {
  if (!lastActivityDateStr) return 'Tidak Aktif';
  const days = calculateInactiveDays(lastActivityDateStr);
  if (days <= 3) return 'Aktif';
  if (days <= 7) return 'Perlu Perhatian';
  return 'Tidak Aktif';
}

export function getTodayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
