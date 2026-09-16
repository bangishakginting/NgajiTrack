/**
 * Utility untuk manajemen pengguna dan autentikasi
 */

/**
 * Membuat password reset otomatis sesuai aturan:
 * Format password: 3 huruf kapital pertama dari nama dan angka 123
 * Contoh:
 * - RADIMIN -> RAD123
 * - Ahmad Fauzi -> AHM123
 * - Siti Aminah -> SIT123
 * - Ali -> ALI123
 */
export function generateResetPassword(nama: string): string {
  if (!nama) return 'AGT123';
  // Hapus karakter selain huruf alfabet (spasi, tanda baca, angka)
  const lettersOnly = nama.replace(/[^a-zA-Z]/g, '').toUpperCase();
  // Ambil 3 huruf pertama, jika nama sangat pendek (< 3 huruf) pad dengan huruf 'A'
  const prefix = (lettersOnly.slice(0, 3) || 'AGT').padEnd(3, 'A');
  return `${prefix}123`;
}
