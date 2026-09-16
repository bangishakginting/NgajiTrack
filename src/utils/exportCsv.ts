import { Aktivitas } from '../types/aktivitas';

export function exportToCSV(filename: string, rows: Record<string, any>[], headers: { key: string; label: string }[]) {
  if (!rows || !rows.length) {
    return;
  }

  const headerLabels = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(',');
  const rowData = rows.map(row => {
    return headers.map(h => {
      const val = row[h.key] !== undefined && row[h.key] !== null ? String(row[h.key]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  }).join('\r\n');

  const csvContent = '\uFEFF' + headerLabels + '\r\n' + rowData;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Spesifik export aktivitas sesuai Section 19:
 * 1. Tanggal
 * 2. Nama Anggota
 * 3. Naqib
 * 4. Jenis Aktivitas
 * 5. Surah
 * 6. Ayat
 * 7. Jumlah Ayat
 * 8. Jumlah Halaman
 * 9. Nilai
 * 10. Catatan
 */
export function exportAktivitasToCsv(aktivitasList: Aktivitas[], filename = 'Laporan_Aktivitas.csv') {
  const headers = [
    { key: 'tanggal', label: 'Tanggal' },
    { key: 'nama_anggota', label: 'Nama Anggota' },
    { key: 'nama_naqib', label: 'Naqib' },
    { key: 'jenis_aktivitas', label: 'Jenis Aktivitas' },
    { key: 'surah', label: 'Surah' },
    { key: 'ayat', label: 'Ayat' },
    { key: 'jumlah_ayat', label: 'Jumlah Ayat' },
    { key: 'jumlah_halaman', label: 'Jumlah Halaman' },
    { key: 'nilai', label: 'Nilai' },
    { key: 'catatan', label: 'Catatan' },
  ];

  const rows = aktivitasList.map(a => {
    let jenisFormatted: string = a.jenis_aktivitas;
    if (a.jenis_aktivitas === 'BACA_QURAN') jenisFormatted = "Baca Qur'an";
    else if (a.jenis_aktivitas === 'MUROJAAH') jenisFormatted = "Muroja'ah";
    else if (a.jenis_aktivitas === 'HAFALAN') jenisFormatted = "Hafalan";

    const ayatRange = a.ayat_mulai && a.ayat_selesai ? `${a.ayat_mulai}-${a.ayat_selesai}` : '';

    return {
      tanggal: a.tanggal,
      nama_anggota: a.nama_anggota || a.anggota_id,
      nama_naqib: a.nama_naqib || a.naqib_id,
      jenis_aktivitas: jenisFormatted,
      surah: a.surah || '',
      ayat: ayatRange,
      jumlah_ayat: a.jumlah_ayat !== undefined ? a.jumlah_ayat : '',
      jumlah_halaman: a.jumlah_halaman !== undefined ? a.jumlah_halaman : a.halaman || '',
      nilai: a.nilai !== undefined ? a.nilai : '',
      catatan: a.catatan || '',
    };
  });

  exportToCSV(filename, rows, headers);
}
