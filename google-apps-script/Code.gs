/**
 * NGajiTrack — Backend Google Apps Script Web App
 * Single Source of Truth: Google Spreadsheet
 * 
 * Deployment:
 * 1. Buka Google Spreadsheet baru (atau yang sudah ada).
 * 2. Klik menu Extensions > Apps Script.
 * 3. Hapus kode default, lalu tempelkan seluruh kode ini.
 * 4. Jalankan fungsi setupDatabase() atau seedSampleData() sekali untuk membuat struktur tabel dan data awal.
 * 5. Klik Deploy > New Deployment.
 * 6. Pilih type: "Web App".
 * 7. Set:
 *    - Description: NGajiTrack API v1
 *    - Execute as: "Me" (email Google Anda)
 *    - Who has access: "Anyone" (Siapa saja)
 * 8. Klik Deploy dan salin URL Web App yang berakhiran /exec.
 * 9. Masukkan URL tersebut ke environment variable VITE_API_URL di Vercel atau file .env.local
 */

// =================================================================================
// [KONFIGURASI DEVELOPER] ID GOOGLE SPREADSHEET (DATABASE SINGLE SOURCE OF TRUTH)
// =================================================================================
// DEVELOPER: Masukkan ID Google Spreadsheet Anda pada variabel SPREADSHEET_ID di bawah ini!
//
// Cara mendapatkan ID Spreadsheet:
// 1. Buka spreadsheet database Anda di browser (Google Sheets).
// 2. URL spreadsheet memiliki format:
//    https://docs.google.com/spreadsheets/d/[ID_SPREADSHEET_DI_SINI]/edit
// 3. Salin deretan karakter ID di antara "/d/" dan "/edit".
// 4. Masukkan / paste ID tersebut di dalam tanda kutip pada variabel SPREADSHEET_ID di bawah ini:
//
// 👇 DEVELOPER: INSERT / GANTI ID SPREADSHEET ANDA DI SINI 👇
const SPREADSHEET_ID = "1-WcoLYkF6J0LjaPvfwk85bK7ABhXGvGMxbJoRKZ1Weg";
// 👆 DEVELOPER: INSERT / GANTI ID SPREADSHEET ANDA DI SINI 👆
//
// Catatan: Jika variabel di atas dibiarkan string kosong (""), sistem secara otomatis
// akan menggunakan Spreadsheet aktif tempat script ini terpasang (SpreadsheetApp.getActiveSpreadsheet()).
// =================================================================================

// Nama Sheet
const SHEET_USERS = "USERS";
const SHEET_NAQIB = "NAQIB";
const SHEET_ANGGOTA = "ANGGOTA";
const SHEET_AKTIVITAS = "AKTIVITAS";
const SHEET_SETTINGS = "SETTINGS";

/**
 * Handle GET requests
 */
function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || "ping";
    return handleRequest(action, params);
  } catch (err) {
    return createJsonResponse(false, "Terjadi kesalahan server: " + err.toString(), null);
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    let body = {};
    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        body = e.parameter || {};
      }
    } else if (e && e.parameter) {
      body = e.parameter;
    }

    const action = body.action || "ping";
    return handleRequest(action, body);
  } catch (err) {
    return createJsonResponse(false, "Terjadi kesalahan server: " + err.toString(), null);
  }
}

/**
 * Main Router
 */
function handleRequest(action, payload) {
  const ss = getSpreadsheet();
  
  // Public action: ping & login
  if (action === "ping") {
    return createJsonResponse(true, "NGajiTrack API Aktif & Siap Digunakan", { timestamp: new Date().toISOString() });
  }

  if (action === "login") {
    return handleLogin(ss, payload);
  }

  // Authorize User for protected actions
  const authUser = authenticateRequest(ss, payload);
  if (!authUser) {
    return createJsonResponse(false, "Sesi tidak valid atau belum login", null);
  }

  switch (action) {
    case "getCurrentUser":
      return createJsonResponse(true, "Data user berhasil diambil", sanitizeUser(authUser));

    // NAQIB
    case "getNaqib":
      return handleGetNaqib(ss, authUser);
    case "createNaqib":
      return handleCreateNaqib(ss, authUser, payload);
    case "updateNaqib":
      return handleUpdateNaqib(ss, authUser, payload);

    // ANGGOTA
    case "getAnggota":
      return handleGetAnggota(ss, authUser, payload);
    case "getAnggotaById":
      return handleGetAnggotaById(ss, authUser, payload);
    case "createAnggota":
      return handleCreateAnggota(ss, authUser, payload);
    case "updateAnggota":
      return handleUpdateAnggota(ss, authUser, payload);
    case "resetPasswordAnggota":
      return handleResetPasswordAnggota(ss, authUser, payload);

    // AKTIVITAS
    case "getAktivitas":
      return handleGetAktivitas(ss, authUser, payload);
    case "getAktivitasByAnggota":
      return handleGetAktivitasByAnggota(ss, authUser, payload);
    case "getAktivitasByNaqib":
      return handleGetAktivitasByNaqib(ss, authUser, payload);
    case "createAktivitas":
      return handleCreateAktivitas(ss, authUser, payload);
    case "updateAktivitas":
      return handleUpdateAktivitas(ss, authUser, payload);
    case "deleteAktivitas":
      return handleDeleteAktivitas(ss, authUser, payload);

    // DASHBOARD
    case "getAdminDashboard":
      return handleGetAdminDashboard(ss, authUser);
    case "getNaqibDashboard":
      return handleGetNaqibDashboard(ss, authUser);
    case "getAnggotaDashboard":
      return handleGetAnggotaDashboard(ss, authUser);

    // SETTINGS
    case "getSettings":
      return handleGetSettings(ss);
    case "updateSettings":
      return handleUpdateSettings(ss, authUser, payload);

    default:
      return createJsonResponse(false, "Action '" + action + "' tidak dikenali", null);
  }
}

// ---------------------------------------------------------------------------------
// AUTHENTICATION & AUTHORIZATION
// ---------------------------------------------------------------------------------

function handleLogin(ss, payload) {
  const username = (payload.username || "").trim().toLowerCase();
  const password = payload.password || "";

  if (!username || !password) {
    return createJsonResponse(false, "Username dan password wajib diisi", null);
  }

  const usersSheet = ss.getSheetByName(SHEET_USERS);
  if (!usersSheet) {
    return createJsonResponse(false, "Sheet USERS belum dibuat. Jalankan setupDatabase() terlebih dahulu.", null);
  }

  const data = usersSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return createJsonResponse(false, "Database user kosong. Silakan inisialisasi admin.", null);
  }

  const headers = data[0];
  const uIdx = headers.indexOf("username");
  const pIdx = headers.indexOf("password_hash");
  const statusIdx = headers.indexOf("status");
  const lastLoginIdx = headers.indexOf("last_login");

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowUsername = String(row[uIdx] || "").trim().toLowerCase();
    const rowPassword = String(row[pIdx] || "");
    const rowStatus = String(row[statusIdx] || "").toLowerCase();

    if (rowUsername === username) {
      if (rowStatus !== "aktif") {
        return createJsonResponse(false, "Akun Anda telah dinonaktifkan. Hubungi admin.", null);
      }

      // Sederhana: cocokkan plain password atau SHA-256
      const isValid = (rowPassword === password) || (hashPassword(password) === rowPassword);
      if (isValid) {
        // Update last_login
        if (lastLoginIdx !== -1) {
          usersSheet.getRange(i + 1, lastLoginIdx + 1).setValue(new Date().toISOString());
        }

        const userObj = rowToObject(headers, row);
        return createJsonResponse(true, "Login berhasil", sanitizeUser(userObj));
      } else {
        return createJsonResponse(false, "Username atau password salah.", null);
      }
    }
  }

  return createJsonResponse(false, "Username atau password salah.", null);
}

function authenticateRequest(ss, payload) {
  const userId = payload.auth_user_id || payload.user_id;
  if (!userId) return null;

  const usersSheet = ss.getSheetByName(SHEET_USERS);
  if (!usersSheet) return null;

  const data = usersSheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf("user_id");

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === userId) {
      return rowToObject(headers, data[i]);
    }
  }
  return null;
}

function sanitizeUser(user) {
  if (!user) return null;
  const safe = Object.assign({}, user);
  delete safe.password_hash;
  return safe;
}

// ---------------------------------------------------------------------------------
// HANDLERS: NAQIB
// ---------------------------------------------------------------------------------

function handleGetNaqib(ss, authUser) {
  if (authUser.role !== "admin") {
    return createJsonResponse(false, "Akses ditolak: Hanya Admin yang dapat melihat seluruh Naqib", null);
  }

  const sheet = ss.getSheetByName(SHEET_NAQIB);
  const data = sheet.getDataRange().getValues();
  const naqibList = getRowsAsObjects(data);

  // Hitung jumlah anggota real-time dari sheet ANGGOTA
  const anggotaSheet = ss.getSheetByName(SHEET_ANGGOTA);
  const anggotaData = getRowsAsObjects(anggotaSheet.getDataRange().getValues());

  const countMap = {};
  anggotaData.forEach(function(agt) {
    if (agt.status === "aktif" && agt.naqib_id) {
      countMap[agt.naqib_id] = (countMap[agt.naqib_id] || 0) + 1;
    }
  });

  naqibList.forEach(function(n) {
    n.jumlah_anggota = countMap[n.naqib_id] || 0;
  });

  return createJsonResponse(true, "Data Naqib berhasil diambil", naqibList);
}

function handleCreateNaqib(ss, authUser, payload) {
  if (authUser.role !== "admin") {
    return createJsonResponse(false, "Hanya admin yang berwenang menambah Naqib", null);
  }

  const nama = (payload.nama || "").trim();
  const email = (payload.email || "").trim();
  const no_hp = (payload.no_hp || "").trim();
  const wilayah = (payload.wilayah || "").trim();
  const username = (payload.username || "").trim().toLowerCase();
  const password = payload.password || "Naqib123!";

  if (!nama || !username) {
    return createJsonResponse(false, "Nama dan Username wajib diisi", null);
  }

  // Cek duplikasi username
  const usersSheet = ss.getSheetByName(SHEET_USERS);
  const users = getRowsAsObjects(usersSheet.getDataRange().getValues());
  if (users.some(function(u) { return u.username.toLowerCase() === username; })) {
    return createJsonResponse(false, "Username sudah digunakan oleh akun lain", null);
  }

  // Generate ID
  const naqibSheet = ss.getSheetByName(SHEET_NAQIB);
  const naqibList = getRowsAsObjects(naqibSheet.getDataRange().getValues());
  const nextNum = naqibList.length + 1;
  const naqib_id = "NQB" + String(nextNum).padStart(3, "0");
  const user_id = "USR" + String(users.length + 1).padStart(3, "0");
  const now = new Date().toISOString();

  // 1. Tambah ke NAQIB
  naqibSheet.appendRow([
    naqib_id,
    nama,
    email,
    no_hp,
    wilayah,
    0,
    "aktif",
    now,
    now
  ]);

  // 2. Tambah ke USERS
  usersSheet.appendRow([
    user_id,
    username,
    hashPassword(password),
    nama,
    email,
    "naqib",
    naqib_id,
    "aktif",
    now,
    now,
    ""
  ]);

  return createJsonResponse(true, "Data Naqib dan akun berhasil dibuat", {
    naqib_id: naqib_id,
    user_id: user_id,
    username: username,
    nama: nama
  });
}

function handleUpdateNaqib(ss, authUser, payload) {
  if (authUser.role !== "admin") {
    return createJsonResponse(false, "Hanya admin yang berwenang mengubah Naqib", null);
  }

  const naqib_id = payload.naqib_id;
  if (!naqib_id) return createJsonResponse(false, "naqib_id wajib disertakan", null);

  const sheet = ss.getSheetByName(SHEET_NAQIB);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf("naqib_id");

  let rowFound = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === naqib_id) {
      rowFound = i + 1;
      break;
    }
  }

  if (rowFound === -1) {
    return createJsonResponse(false, "Data Naqib tidak ditemukan", null);
  }

  if (payload.nama !== undefined) sheet.getRange(rowFound, headers.indexOf("nama") + 1).setValue(payload.nama);
  if (payload.email !== undefined) sheet.getRange(rowFound, headers.indexOf("email") + 1).setValue(payload.email);
  if (payload.no_hp !== undefined) sheet.getRange(rowFound, headers.indexOf("no_hp") + 1).setValue(payload.no_hp);
  if (payload.wilayah !== undefined) sheet.getRange(rowFound, headers.indexOf("wilayah") + 1).setValue(payload.wilayah);
  if (payload.status !== undefined) sheet.getRange(rowFound, headers.indexOf("status") + 1).setValue(payload.status);
  sheet.getRange(rowFound, headers.indexOf("updated_at") + 1).setValue(new Date().toISOString());

  // Sinkronkan status di USERS jika status diubah
  if (payload.status !== undefined || payload.nama !== undefined) {
    const usersSheet = ss.getSheetByName(SHEET_USERS);
    const uData = usersSheet.getDataRange().getValues();
    const uHeaders = uData[0];
    const refIdx = uHeaders.indexOf("reference_id");
    for (let u = 1; u < uData.length; u++) {
      if (uData[u][refIdx] === naqib_id) {
        if (payload.status !== undefined) {
          usersSheet.getRange(u + 1, uHeaders.indexOf("status") + 1).setValue(payload.status);
        }
        if (payload.nama !== undefined) {
          usersSheet.getRange(u + 1, uHeaders.indexOf("nama") + 1).setValue(payload.nama);
        }
      }
    }
  }

  return createJsonResponse(true, "Data Naqib berhasil diperbarui", null);
}

// ---------------------------------------------------------------------------------
// HANDLERS: ANGGOTA
// ---------------------------------------------------------------------------------

function handleGetAnggota(ss, authUser, payload) {
  const anggotaSheet = ss.getSheetByName(SHEET_ANGGOTA);
  const allAnggota = getRowsAsObjects(anggotaSheet.getDataRange().getValues());

  const naqibSheet = ss.getSheetByName(SHEET_NAQIB);
  const naqibMap = {};
  getRowsAsObjects(naqibSheet.getDataRange().getValues()).forEach(function(n) {
    naqibMap[n.naqib_id] = n.nama;
  });

  // Hitung keaktifan dan aktivitas terakhir dari sheet AKTIVITAS
  const actSheet = ss.getSheetByName(SHEET_AKTIVITAS);
  const acts = getRowsAsObjects(actSheet.getDataRange().getValues());

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const statsMap = {};
  acts.forEach(function(a) {
    if (!statsMap[a.anggota_id]) {
      statsMap[a.anggota_id] = { countMonth: 0, lastDate: null };
    }
    const aDate = new Date(a.tanggal);
    if (!isNaN(aDate.getTime())) {
      if (aDate.getMonth() === currentMonth && aDate.getFullYear() === currentYear) {
        statsMap[a.anggota_id].countMonth++;
      }
      if (!statsMap[a.anggota_id].lastDate || aDate > statsMap[a.anggota_id].lastDate) {
        statsMap[a.anggota_id].lastDate = aDate;
      }
    }
  });

  // Role Filtering Authorization
  let filtered = [];
  if (authUser.role === "admin") {
    // Admin dapat melihat seluruh anggota atau filter berdasarkan naqib_id
    if (payload && payload.naqib_id) {
      filtered = allAnggota.filter(function(a) { return a.naqib_id === payload.naqib_id; });
    } else {
      filtered = allAnggota;
    }
  } else if (authUser.role === "naqib") {
    // Naqib HANYA boleh melihat anggota binaannya
    filtered = allAnggota.filter(function(a) { return a.naqib_id === authUser.reference_id; });
  } else if (authUser.role === "anggota") {
    // Anggota HANYA boleh melihat data dirinya
    filtered = allAnggota.filter(function(a) { return a.anggota_id === authUser.reference_id; });
  }

  // Populate computed info
  filtered.forEach(function(a) {
    a.nama_naqib = naqibMap[a.naqib_id] || "-";
    const st = statsMap[a.anggota_id] || { countMonth: 0, lastDate: null };
    a.aktivitas_bulan_ini = st.countMonth;
    a.aktivitas_terakhir = st.lastDate ? st.lastDate.toISOString().split("T")[0] : null;

    if (!st.lastDate) {
      a.hari_tidak_aktif = 999;
      a.status_keaktifan = "Tidak Aktif";
    } else {
      const diffDays = Math.floor((now.getTime() - st.lastDate.getTime()) / (1000 * 60 * 60 * 24));
      a.hari_tidak_aktif = diffDays;
      if (diffDays <= 3) {
        a.status_keaktifan = "Aktif";
      } else if (diffDays <= 7) {
        a.status_keaktifan = "Perlu Perhatian";
      } else {
        a.status_keaktifan = "Tidak Aktif";
      }
    }
  });

  return createJsonResponse(true, "Data anggota berhasil diambil", filtered);
}

function handleGetAnggotaById(ss, authUser, payload) {
  const anggota_id = payload.anggota_id;
  if (!anggota_id) return createJsonResponse(false, "anggota_id wajib disertakan", null);

  const anggotaSheet = ss.getSheetByName(SHEET_ANGGOTA);
  const list = getRowsAsObjects(anggotaSheet.getDataRange().getValues());
  const found = list.find(function(a) { return a.anggota_id === anggota_id; });

  if (!found) {
    return createJsonResponse(false, "Anggota tidak ditemukan", null);
  }

  // Authorization check
  if (authUser.role === "naqib" && found.naqib_id !== authUser.reference_id) {
    return createJsonResponse(false, "Akses ditolak: Anggota bukan di bawah binaan Anda", null);
  }
  if (authUser.role === "anggota" && found.anggota_id !== authUser.reference_id) {
    return createJsonResponse(false, "Akses ditolak: Anda hanya dapat melihat data pribadi", null);
  }

  const naqibSheet = ss.getSheetByName(SHEET_NAQIB);
  const naqibList = getRowsAsObjects(naqibSheet.getDataRange().getValues());
  const myNaqib = naqibList.find(function(n) { return n.naqib_id === found.naqib_id; });
  found.nama_naqib = myNaqib ? myNaqib.nama : "-";

  return createJsonResponse(true, "Detail anggota berhasil diambil", found);
}

function handleCreateAnggota(ss, authUser, payload) {
  if (authUser.role !== "admin") {
    return createJsonResponse(false, "Hanya admin yang berwenang menambah anggota", null);
  }

  const nama = (payload.nama || "").trim();
  const email = (payload.email || "").trim();
  const no_hp = (payload.no_hp || "").trim();
  const naqib_id = payload.naqib_id;
  const username = (payload.username || "").trim().toLowerCase();
  const password = payload.password || "Anggota123!";

  if (!nama || !naqib_id || !username) {
    return createJsonResponse(false, "Nama, Naqib, dan Username wajib diisi", null);
  }

  // Cek duplikasi username
  const usersSheet = ss.getSheetByName(SHEET_USERS);
  const users = getRowsAsObjects(usersSheet.getDataRange().getValues());
  if (users.some(function(u) { return u.username.toLowerCase() === username; })) {
    return createJsonResponse(false, "Username sudah digunakan", null);
  }

  const anggotaSheet = ss.getSheetByName(SHEET_ANGGOTA);
  const anggotaList = getRowsAsObjects(anggotaSheet.getDataRange().getValues());
  const nextNum = anggotaList.length + 1;
  const anggota_id = "AGT" + String(nextNum).padStart(3, "0");
  const nomor_anggota = payload.nomor_anggota || String(nextNum).padStart(3, "0");
  const user_id = "USR" + String(users.length + 1).padStart(3, "0");
  const now = new Date().toISOString();

  // 1. Tambah ke ANGGOTA
  anggotaSheet.appendRow([
    anggota_id,
    nomor_anggota,
    nama,
    email,
    no_hp,
    payload.jenis_kelamin || "L",
    payload.tanggal_lahir || "",
    naqib_id,
    payload.target_baca_harian || "2 halaman",
    payload.target_murojaah || "1 surat",
    payload.target_hafalan || "5 ayat",
    "aktif",
    now,
    now
  ]);

  // 2. Tambah ke USERS
  usersSheet.appendRow([
    user_id,
    username,
    hashPassword(password),
    nama,
    email,
    "anggota",
    anggota_id,
    "aktif",
    now,
    now,
    ""
  ]);

  return createJsonResponse(true, "Data anggota dan akun berhasil dibuat", {
    anggota_id: anggota_id,
    user_id: user_id,
    nama: nama,
    username: username
  });
}

function handleUpdateAnggota(ss, authUser, payload) {
  if (authUser.role !== "admin") {
    return createJsonResponse(false, "Hanya admin yang berwenang mengubah data anggota", null);
  }

  const anggota_id = payload.anggota_id;
  if (!anggota_id) return createJsonResponse(false, "anggota_id wajib disertakan", null);

  const sheet = ss.getSheetByName(SHEET_ANGGOTA);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf("anggota_id");

  let rowFound = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === anggota_id) {
      rowFound = i + 1;
      break;
    }
  }

  if (rowFound === -1) {
    return createJsonResponse(false, "Data anggota tidak ditemukan", null);
  }

  const updateFields = [
    "nomor_anggota", "nama", "email", "no_hp", "jenis_kelamin",
    "tanggal_lahir", "naqib_id", "target_baca_harian", "target_murojaah",
    "target_hafalan", "status"
  ];

  updateFields.forEach(function(field) {
    if (payload[field] !== undefined) {
      sheet.getRange(rowFound, headers.indexOf(field) + 1).setValue(payload[field]);
    }
  });
  sheet.getRange(rowFound, headers.indexOf("updated_at") + 1).setValue(new Date().toISOString());

  // Sinkronkan ke USERS jika status / nama diubah
  if (payload.status !== undefined || payload.nama !== undefined) {
    const usersSheet = ss.getSheetByName(SHEET_USERS);
    const uData = usersSheet.getDataRange().getValues();
    const uHeaders = uData[0];
    const refIdx = uHeaders.indexOf("reference_id");
    for (let u = 1; u < uData.length; u++) {
      if (uData[u][refIdx] === anggota_id) {
        if (payload.status !== undefined) {
          usersSheet.getRange(u + 1, uHeaders.indexOf("status") + 1).setValue(payload.status);
        }
        if (payload.nama !== undefined) {
          usersSheet.getRange(u + 1, uHeaders.indexOf("nama") + 1).setValue(payload.nama);
        }
      }
    }
  }

  return createJsonResponse(true, "Data anggota berhasil diperbarui", null);
}

function handleResetPasswordAnggota(ss, authUser, payload) {
  if (authUser.role !== "admin") {
    return createJsonResponse(false, "Hanya admin yang berwenang me-reset password anggota", null);
  }

  const anggota_id = payload.anggota_id;
  const new_password = payload.new_password;

  if (!anggota_id || !new_password) {
    return createJsonResponse(false, "anggota_id dan new_password wajib disertakan", null);
  }

  const usersSheet = ss.getSheetByName(SHEET_USERS);
  const uData = usersSheet.getDataRange().getValues();
  const uHeaders = uData[0];
  const refIdx = uHeaders.indexOf("reference_id");
  const passIdx = uHeaders.indexOf("password_hash");

  let userFound = false;
  for (let u = 1; u < uData.length; u++) {
    if (uData[u][refIdx] === anggota_id) {
      usersSheet.getRange(u + 1, passIdx + 1).setValue(hashPassword(new_password));
      usersSheet.getRange(u + 1, uHeaders.indexOf("updated_at") + 1).setValue(new Date().toISOString());
      userFound = true;
      break;
    }
  }

  if (!userFound) {
    return createJsonResponse(false, "Akun user untuk anggota ini tidak ditemukan", null);
  }

  return createJsonResponse(true, "Password anggota berhasil di-reset menjadi: " + new_password, {
    password: new_password
  });
}

// ---------------------------------------------------------------------------------
// HANDLERS: AKTIVITAS
// ---------------------------------------------------------------------------------

function handleGetAktivitas(ss, authUser, payload) {
  const actSheet = ss.getSheetByName(SHEET_AKTIVITAS);
  const acts = getRowsAsObjects(actSheet.getDataRange().getValues());

  const agtSheet = ss.getSheetByName(SHEET_ANGGOTA);
  const agtMap = {};
  getRowsAsObjects(agtSheet.getDataRange().getValues()).forEach(function(a) {
    agtMap[a.anggota_id] = a.nama;
  });

  const nqbSheet = ss.getSheetByName(SHEET_NAQIB);
  const nqbMap = {};
  getRowsAsObjects(nqbSheet.getDataRange().getValues()).forEach(function(n) {
    nqbMap[n.naqib_id] = n.nama;
  });

  // Authorization filter
  let filtered = acts;
  if (authUser.role === "naqib") {
    filtered = acts.filter(function(a) { return a.naqib_id === authUser.reference_id; });
  } else if (authUser.role === "anggota") {
    filtered = acts.filter(function(a) { return a.anggota_id === authUser.reference_id; });
  } else if (authUser.role === "admin") {
    if (payload && payload.naqib_id) {
      filtered = filtered.filter(function(a) { return a.naqib_id === payload.naqib_id; });
    }
    if (payload && payload.anggota_id) {
      filtered = filtered.filter(function(a) { return a.anggota_id === payload.anggota_id; });
    }
  }

  if (payload && payload.jenis_aktivitas) {
    filtered = filtered.filter(function(a) { return a.jenis_aktivitas === payload.jenis_aktivitas; });
  }
  if (payload && payload.start_date) {
    filtered = filtered.filter(function(a) { return a.tanggal >= payload.start_date; });
  }
  if (payload && payload.end_date) {
    filtered = filtered.filter(function(a) { return a.tanggal <= payload.end_date; });
  }

  // Enrich with names
  filtered.forEach(function(a) {
    a.nama_anggota = agtMap[a.anggota_id] || "-";
    a.nama_naqib = nqbMap[a.naqib_id] || "-";
  });

  // Sort descending by tanggal
  filtered.sort(function(x, y) {
    return new Date(y.tanggal) - new Date(x.tanggal);
  });

  return createJsonResponse(true, "Data aktivitas berhasil diambil", filtered);
}

function handleGetAktivitasByAnggota(ss, authUser, payload) {
  const anggota_id = payload.anggota_id || (authUser.role === "anggota" ? authUser.reference_id : null);
  if (!anggota_id) return createJsonResponse(false, "anggota_id wajib disertakan", null);

  // Authorize
  if (authUser.role === "anggota" && anggota_id !== authUser.reference_id) {
    return createJsonResponse(false, "Akses ditolak: Anda hanya dapat melihat aktivitas sendiri", null);
  }

  if (authUser.role === "naqib") {
    const agtSheet = ss.getSheetByName(SHEET_ANGGOTA);
    const agts = getRowsAsObjects(agtSheet.getDataRange().getValues());
    const match = agts.find(function(a) { return a.anggota_id === anggota_id; });
    if (!match || match.naqib_id !== authUser.reference_id) {
      return createJsonResponse(false, "Akses ditolak: Anggota bukan di bawah binaan Anda", null);
    }
  }

  return handleGetAktivitas(ss, authUser, { anggota_id: anggota_id });
}

function handleGetAktivitasByNaqib(ss, authUser, payload) {
  const naqib_id = payload.naqib_id || (authUser.role === "naqib" ? authUser.reference_id : null);
  if (!naqib_id) return createJsonResponse(false, "naqib_id wajib disertakan", null);

  if (authUser.role === "naqib" && naqib_id !== authUser.reference_id) {
    return createJsonResponse(false, "Akses ditolak", null);
  }

  return handleGetAktivitas(ss, authUser, { naqib_id: naqib_id });
}

function handleCreateAktivitas(ss, authUser, payload) {
  // Hanya anggota (atau admin) yang input aktivitas
  let anggota_id = payload.anggota_id;
  if (authUser.role === "anggota") {
    anggota_id = authUser.reference_id;
  } else if (authUser.role !== "admin") {
    return createJsonResponse(false, "Akses ditolak: Hanya anggota yang dapat mencatat aktivitas", null);
  }

  if (!anggota_id) {
    return createJsonResponse(false, "anggota_id tidak ditemukan", null);
  }

  // Cari naqib_id dari sheet ANGGOTA
  const agtSheet = ss.getSheetByName(SHEET_ANGGOTA);
  const agts = getRowsAsObjects(agtSheet.getDataRange().getValues());
  const agt = agts.find(function(a) { return a.anggota_id === anggota_id; });
  if (!agt) {
    return createJsonResponse(false, "Data anggota tidak ditemukan di database", null);
  }

  const naqib_id = agt.naqib_id;
  const jenis = payload.jenis_aktivitas;
  if (!["BACA_QURAN", "MUROJAAH", "HAFALAN"].includes(jenis)) {
    return createJsonResponse(false, "Jenis aktivitas tidak valid", null);
  }

  const tanggal = payload.tanggal || new Date().toISOString().split("T")[0];
  const actSheet = ss.getSheetByName(SHEET_AKTIVITAS);
  const allActs = getRowsAsObjects(actSheet.getDataRange().getValues());
  const nextNum = allActs.length + 1;
  const aktivitas_id = "AKT" + String(nextNum).padStart(4, "0");
  const now = new Date().toISOString();

  // Kolom:
  // aktivitas_id, tanggal, anggota_id, naqib_id, jenis_aktivitas, surah, ayat_mulai, ayat_selesai, juz, halaman, jumlah_ayat, jumlah_halaman, jumlah_hafalan, nilai, status, catatan, created_at, updated_at
  actSheet.appendRow([
    aktivitas_id,
    tanggal,
    anggota_id,
    naqib_id,
    jenis,
    payload.surah || "",
    payload.ayat_mulai || "",
    payload.ayat_selesai || "",
    payload.juz || "",
    payload.halaman || "",
    payload.jumlah_ayat || "",
    payload.jumlah_halaman || "",
    payload.jumlah_hafalan || "",
    payload.nilai || "",
    payload.status || "selesai",
    payload.catatan || "",
    now,
    now
  ]);

  return createJsonResponse(true, "Aktivitas berhasil dicatat ke Google Sheets", {
    aktivitas_id: aktivitas_id,
    tanggal: tanggal,
    jenis_aktivitas: jenis
  });
}

function handleUpdateAktivitas(ss, authUser, payload) {
  const aktivitas_id = payload.aktivitas_id;
  if (!aktivitas_id) return createJsonResponse(false, "aktivitas_id wajib disertakan", null);

  const sheet = ss.getSheetByName(SHEET_AKTIVITAS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf("aktivitas_id");
  const agtIdx = headers.indexOf("anggota_id");

  let rowFound = -1;
  let targetAnggotaId = "";
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === aktivitas_id) {
      rowFound = i + 1;
      targetAnggotaId = data[i][agtIdx];
      break;
    }
  }

  if (rowFound === -1) {
    return createJsonResponse(false, "Aktivitas tidak ditemukan", null);
  }

  // Authorize: Admin atau pemilik aktivitas
  if (authUser.role === "anggota" && targetAnggotaId !== authUser.reference_id) {
    return createJsonResponse(false, "Akses ditolak: Anda hanya dapat mengubah aktivitas sendiri", null);
  }

  const fields = [
    "tanggal", "jenis_aktivitas", "surah", "ayat_mulai", "ayat_selesai",
    "juz", "halaman", "jumlah_ayat", "jumlah_halaman", "jumlah_hafalan", "nilai", "status", "catatan"
  ];

  fields.forEach(function(f) {
    if (payload[f] !== undefined) {
      sheet.getRange(rowFound, headers.indexOf(f) + 1).setValue(payload[f]);
    }
  });
  sheet.getRange(rowFound, headers.indexOf("updated_at") + 1).setValue(new Date().toISOString());

  return createJsonResponse(true, "Aktivitas berhasil diperbarui", null);
}

function handleDeleteAktivitas(ss, authUser, payload) {
  const aktivitas_id = payload.aktivitas_id;
  if (!aktivitas_id) return createJsonResponse(false, "aktivitas_id wajib disertakan", null);

  const sheet = ss.getSheetByName(SHEET_AKTIVITAS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf("aktivitas_id");
  const agtIdx = headers.indexOf("anggota_id");

  let rowFound = -1;
  let targetAnggotaId = "";
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === aktivitas_id) {
      rowFound = i + 1;
      targetAnggotaId = data[i][agtIdx];
      break;
    }
  }

  if (rowFound === -1) {
    return createJsonResponse(false, "Aktivitas tidak ditemukan", null);
  }

  if (authUser.role === "anggota" && targetAnggotaId !== authUser.reference_id) {
    return createJsonResponse(false, "Akses ditolak: Anda hanya dapat menghapus aktivitas sendiri", null);
  }

  sheet.deleteRow(rowFound);
  return createJsonResponse(true, "Aktivitas berhasil dihapus", null);
}

// ---------------------------------------------------------------------------------
// HANDLERS: DASHBOARDS
// ---------------------------------------------------------------------------------

function handleGetAdminDashboard(ss, authUser) {
  if (authUser.role !== "admin") {
    return createJsonResponse(false, "Akses ditolak: Khusus Admin", null);
  }

  const nqbSheet = ss.getSheetByName(SHEET_NAQIB);
  const agtSheet = ss.getSheetByName(SHEET_ANGGOTA);
  const actSheet = ss.getSheetByName(SHEET_AKTIVITAS);

  const naqibs = getRowsAsObjects(nqbSheet.getDataRange().getValues());
  const anggotas = getRowsAsObjects(agtSheet.getDataRange().getValues());
  const acts = getRowsAsObjects(actSheet.getDataRange().getValues());

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let totalBulanIni = 0;
  let totalBaca = 0;
  let totalMurojaah = 0;
  let totalHafalan = 0;

  // 30 hari terakhir array map
  const dailyCountMap = {};
  for (let d = 29; d >= 0; d--) {
    const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
    const key = dt.toISOString().split("T")[0];
    dailyCountMap[key] = 0;
  }

  // Hitung per naqib
  const naqibStatsMap = {};
  naqibs.forEach(function(n) {
    naqibStatsMap[n.naqib_id] = {
      naqib_id: n.naqib_id,
      nama: n.nama,
      jumlah_anggota: 0,
      jumlah_aktivitas: 0,
      anggota_aktif: 0
    };
  });

  anggotas.forEach(function(a) {
    if (naqibStatsMap[a.naqib_id]) {
      naqibStatsMap[a.naqib_id].jumlah_anggota++;
    }
  });

  const anggotaActiveSet = new Set();
  const threeDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3);

  acts.forEach(function(a) {
    const aDate = new Date(a.tanggal);
    if (!isNaN(aDate.getTime())) {
      if (aDate.getMonth() === currentMonth && aDate.getFullYear() === currentYear) {
        totalBulanIni++;
        if (a.jenis_aktivitas === "BACA_QURAN") totalBaca++;
        else if (a.jenis_aktivitas === "MUROJAAH") totalMurojaah++;
        else if (a.jenis_aktivitas === "HAFALAN") totalHafalan++;
      }

      const dateKey = a.tanggal.split("T")[0];
      if (dailyCountMap[dateKey] !== undefined) {
        dailyCountMap[dateKey]++;
      }

      if (naqibStatsMap[a.naqib_id]) {
        naqibStatsMap[a.naqib_id].jumlah_aktivitas++;
      }

      if (aDate >= threeDaysAgo) {
        anggotaActiveSet.add(a.anggota_id);
      }
    }
  });

  // Calculate active members per naqib
  anggotas.forEach(function(a) {
    if (anggotaActiveSet.has(a.anggota_id) && naqibStatsMap[a.naqib_id]) {
      naqibStatsMap[a.naqib_id].anggota_aktif++;
    }
  });

  const dailyChart = Object.keys(dailyCountMap).sort().map(function(k) {
    return { tanggal: k, jumlah: dailyCountMap[k] };
  });

  return createJsonResponse(true, "Dashboard admin berhasil dimuat", {
    total_naqib: naqibs.filter(function(n) { return n.status === "aktif"; }).length,
    total_anggota: anggotas.filter(function(a) { return a.status === "aktif"; }).length,
    total_aktivitas_bulan_ini: totalBulanIni,
    total_baca_quran: totalBaca,
    total_murojaah: totalMurojaah,
    total_hafalan: totalHafalan,
    aktivitas_30_hari: dailyChart,
    aktivitas_per_jenis: [
      { jenis: "Baca Qur'an", jumlah: totalBaca },
      { jenis: "Muroja'ah", jumlah: totalMurojaah },
      { jenis: "Hafalan", jumlah: totalHafalan }
    ],
    aktivitas_per_naqib: Object.values(naqibStatsMap),
    aktivitas_terbaru: acts.slice(0, 5)
  });
}

function handleGetNaqibDashboard(ss, authUser) {
  if (authUser.role !== "naqib") {
    return createJsonResponse(false, "Akses ditolak: Khusus Naqib", null);
  }

  const naqib_id = authUser.reference_id;
  const agtSheet = ss.getSheetByName(SHEET_ANGGOTA);
  const actSheet = ss.getSheetByName(SHEET_AKTIVITAS);

  const myAnggotas = getRowsAsObjects(agtSheet.getDataRange().getValues())
    .filter(function(a) { return a.naqib_id === naqib_id && a.status === "aktif"; });

  const acts = getRowsAsObjects(actSheet.getDataRange().getValues())
    .filter(function(a) { return a.naqib_id === naqib_id; });

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let totalBulanIni = 0;
  const todayActiveAnggotaSet = new Set();
  const memberStats = {};

  myAnggotas.forEach(function(a) {
    memberStats[a.anggota_id] = {
      anggota_id: a.anggota_id,
      nama: a.nama,
      total_baca: 0,
      total_murojaah: 0,
      total_hafalan: 0,
      total_aktivitas: 0,
      aktivitas_terakhir: null,
      hari_tidak_aktif: 999,
      status_keaktifan: "Tidak Aktif"
    };
  });

  acts.forEach(function(a) {
    const aDate = new Date(a.tanggal);
    const dateStr = a.tanggal.split("T")[0];

    if (dateStr === todayStr) {
      todayActiveAnggotaSet.add(a.anggota_id);
    }

    if (aDate.getMonth() === currentMonth && aDate.getFullYear() === currentYear) {
      totalBulanIni++;
    }

    if (memberStats[a.anggota_id]) {
      const st = memberStats[a.anggota_id];
      st.total_aktivitas++;
      if (a.jenis_aktivitas === "BACA_QURAN") st.total_baca++;
      else if (a.jenis_aktivitas === "MUROJAAH") st.total_murojaah++;
      else if (a.jenis_aktivitas === "HAFALAN") st.total_hafalan++;

      if (!st.aktivitas_terakhir || aDate > new Date(st.aktivitas_terakhir)) {
        st.aktivitas_terakhir = dateStr;
      }
    }
  });

  // Calculate inactivity and status
  const anggotaList = Object.values(memberStats);
  const perhatianList = [];

  anggotaList.forEach(function(m) {
    if (!m.aktivitas_terakhir) {
      m.hari_tidak_aktif = 999;
      m.status_keaktifan = "Tidak Aktif";
      perhatianList.push({
        anggota_id: m.anggota_id,
        nama: m.nama,
        aktivitas_terakhir: "Belum pernah",
        hari_tidak_aktif: 999
      });
    } else {
      const lastDate = new Date(m.aktivitas_terakhir);
      const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      m.hari_tidak_aktif = diffDays;
      if (diffDays <= 3) {
        m.status_keaktifan = "Aktif";
      } else if (diffDays <= 7) {
        m.status_keaktifan = "Perlu Perhatian";
      } else {
        m.status_keaktifan = "Tidak Aktif";
      }

      // Kriteria perhatian: tidak memiliki aktivitas >= 7 hari
      if (diffDays >= 7) {
        perhatianList.push({
          anggota_id: m.anggota_id,
          nama: m.nama,
          aktivitas_terakhir: m.aktivitas_terakhir,
          hari_tidak_aktif: diffDays
        });
      }
    }
  });

  // Ranking teraktif
  const ranking = anggotaList.slice().sort(function(a, b) {
    return b.total_aktivitas - a.total_aktivitas;
  });

  return createJsonResponse(true, "Dashboard Naqib berhasil dimuat", {
    jumlah_anggota: myAnggotas.length,
    anggota_aktif_hari_ini: todayActiveAnggotaSet.size,
    total_aktivitas_bulan_ini: totalBulanIni,
    anggota_belum_setor: myAnggotas.length - todayActiveAnggotaSet.size,
    anggota_list: anggotaList,
    anggota_teraktif: ranking.slice(0, 5),
    anggota_perlu_perhatian: perhatianList
  });
}

function handleGetAnggotaDashboard(ss, authUser) {
  if (authUser.role !== "anggota") {
    return createJsonResponse(false, "Akses ditolak: Khusus Anggota", null);
  }

  const anggota_id = authUser.reference_id;
  const agtSheet = ss.getSheetByName(SHEET_ANGGOTA);
  const actSheet = ss.getSheetByName(SHEET_AKTIVITAS);

  const agts = getRowsAsObjects(agtSheet.getDataRange().getValues());
  const me = agts.find(function(a) { return a.anggota_id === anggota_id; }) || {};

  const acts = getRowsAsObjects(actSheet.getDataRange().getValues())
    .filter(function(a) { return a.anggota_id === anggota_id; });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let totalBulanIni = 0;
  let totalBaca = 0;
  let totalMurojaah = 0;
  let totalHafalan = 0;

  const activeDaysSet = new Set();

  // 7 hari terakhir
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const last7DaysMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    last7DaysMap[dateStr] = {
      hari: dayNames[d.getDay()],
      tanggal: dateStr,
      jumlah: 0
    };
  }

  acts.forEach(function(a) {
    const aDate = new Date(a.tanggal);
    const dateStr = a.tanggal.split("T")[0];

    if (aDate.getMonth() === currentMonth && aDate.getFullYear() === currentYear) {
      totalBulanIni++;
      activeDaysSet.add(dateStr);
      if (a.jenis_aktivitas === "BACA_QURAN") totalBaca++;
      else if (a.jenis_aktivitas === "MUROJAAH") totalMurojaah++;
      else if (a.jenis_aktivitas === "HAFALAN") totalHafalan++;
    }

    if (last7DaysMap[dateStr]) {
      last7DaysMap[dateStr].jumlah++;
    }
  });

  acts.sort(function(x, y) {
    return new Date(y.tanggal) - new Date(x.tanggal);
  });

  return createJsonResponse(true, "Dashboard Anggota berhasil dimuat", {
    total_aktivitas_bulan_ini: totalBulanIni,
    total_baca_quran: totalBaca,
    total_murojaah: totalMurojaah,
    total_hafalan: totalHafalan,
    jumlah_hari_aktif: activeDaysSet.size,
    progress_bulan_ini: Math.min(100, Math.round((totalBulanIni / 30) * 100)),
    target_baca_harian: me.target_baca_harian || "2 halaman",
    target_murojaah: me.target_murojaah || "1 surat",
    target_hafalan: me.target_hafalan || "5 ayat",
    aktivitas_7_hari: Object.values(last7DaysMap),
    aktivitas_terakhir: acts.slice(0, 5)
  });
}

// ---------------------------------------------------------------------------------
// HANDLERS: SETTINGS
// ---------------------------------------------------------------------------------

function handleGetSettings(ss) {
  const sheet = ss.getSheetByName(SHEET_SETTINGS);
  const data = getRowsAsObjects(sheet.getDataRange().getValues());
  const map = {};
  data.forEach(function(r) {
    map[r.key] = r.value;
  });
  return createJsonResponse(true, "Settings berhasil diambil", map);
}

function handleUpdateSettings(ss, authUser, payload) {
  if (authUser.role !== "admin") {
    return createJsonResponse(false, "Hanya admin yang dapat mengubah pengaturan", null);
  }

  const sheet = ss.getSheetByName(SHEET_SETTINGS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const keyIdx = headers.indexOf("key");
  const valIdx = headers.indexOf("value");
  const upIdx = headers.indexOf("updated_at");

  const entries = Object.entries(payload.settings || {});
  const now = new Date().toISOString();

  entries.forEach(function([k, v]) {
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][keyIdx] === k) {
        sheet.getRange(i + 1, valIdx + 1).setValue(v);
        sheet.getRange(i + 1, upIdx + 1).setValue(now);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([k, v, now]);
    }
  });

  return createJsonResponse(true, "Pengaturan berhasil disimpan", null);
}

// ---------------------------------------------------------------------------------
// SETUP & SEED FUNCTIONS
// ---------------------------------------------------------------------------------

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. USERS
  let usersSheet = ss.getSheetByName(SHEET_USERS);
  if (!usersSheet) usersSheet = ss.insertSheet(SHEET_USERS);
  usersSheet.clear();
  usersSheet.appendRow([
    "user_id", "username", "password_hash", "nama", "email", "role", "reference_id", "status", "created_at", "updated_at", "last_login"
  ]);
  usersSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");

  // 2. NAQIB
  let naqibSheet = ss.getSheetByName(SHEET_NAQIB);
  if (!naqibSheet) naqibSheet = ss.insertSheet(SHEET_NAQIB);
  naqibSheet.clear();
  naqibSheet.appendRow([
    "naqib_id", "nama", "email", "no_hp", "wilayah", "jumlah_anggota", "status", "created_at", "updated_at"
  ]);
  naqibSheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");

  // 3. ANGGOTA
  let anggotaSheet = ss.getSheetByName(SHEET_ANGGOTA);
  if (!anggotaSheet) anggotaSheet = ss.insertSheet(SHEET_ANGGOTA);
  anggotaSheet.clear();
  anggotaSheet.appendRow([
    "anggota_id", "nomor_anggota", "nama", "email", "no_hp", "jenis_kelamin", "tanggal_lahir",
    "naqib_id", "target_baca_harian", "target_murojaah", "target_hafalan", "status", "created_at", "updated_at"
  ]);
  anggotaSheet.getRange(1, 1, 1, 14).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");

  // 4. AKTIVITAS
  let actSheet = ss.getSheetByName(SHEET_AKTIVITAS);
  if (!actSheet) actSheet = ss.insertSheet(SHEET_AKTIVITAS);
  actSheet.clear();
  actSheet.appendRow([
    "aktivitas_id", "tanggal", "anggota_id", "naqib_id", "jenis_aktivitas", "surah",
    "ayat_mulai", "ayat_selesai", "juz", "halaman", "jumlah_ayat", "jumlah_halaman",
    "jumlah_hafalan", "nilai", "status", "catatan", "created_at", "updated_at"
  ]);
  actSheet.getRange(1, 1, 1, 18).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");

  // 5. SETTINGS
  let setSheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!setSheet) setSheet = ss.insertSheet(SHEET_SETTINGS);
  setSheet.clear();
  setSheet.appendRow(["key", "value", "updated_at"]);
  setSheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");

  const now = new Date().toISOString();
  setSheet.appendRow(["app_name", "NGajiTrack", now]);
  setSheet.appendRow(["app_tagline", "Catat, Monitor, dan Tingkatkan Tilawah Al-Qur'an", now]);
  setSheet.appendRow(["default_target_baca", "2 halaman", now]);

  createInitialAdmin();
  Logger.log("Database NGajiTrack berhasil dibuat!");
}

function createInitialAdmin() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName(SHEET_USERS);
  const now = new Date().toISOString();

  // Bersihkan dan buat user admin awal
  usersSheet.appendRow([
    "USR001",
    "admin",
    hashPassword("Admin123!"),
    "Administrator NGajiTrack",
    "admin@ngajitrack.id",
    "admin",
    "",
    "aktif",
    now,
    now,
    ""
  ]);
  Logger.log("Admin awal berhasil dibuat: username=admin, password=Admin123! (Harap ganti setelah login pertama)");
}

function seedSampleData() {
  setupDatabase();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const now = new Date().toISOString();

  const naqibSheet = ss.getSheetByName(SHEET_NAQIB);
  const usersSheet = ss.getSheetByName(SHEET_USERS);
  const anggotaSheet = ss.getSheetByName(SHEET_ANGGOTA);
  const actSheet = ss.getSheetByName(SHEET_AKTIVITAS);

  // 2 Naqib
  naqibSheet.appendRow(["NQB001", "Ahmad Fauzi", "ahmad@ngajitrack.id", "081234567890", "Bandung", 3, "aktif", now, now]);
  naqibSheet.appendRow(["NQB002", "Ustadz Hasan", "hasan@ngajitrack.id", "081298765432", "Jakarta", 3, "aktif", now, now]);

  usersSheet.appendRow(["USR002", "naqib01", hashPassword("Naqib123!"), "Ahmad Fauzi", "ahmad@ngajitrack.id", "naqib", "NQB001", "aktif", now, now, ""]);
  usersSheet.appendRow(["USR003", "naqib02", hashPassword("Naqib123!"), "Ustadz Hasan", "hasan@ngajitrack.id", "naqib", "NQB002", "aktif", now, now, ""]);

  // 6 Anggota
  const anggotaData = [
    ["AGT001", "001", "Muhammad Ali", "ali@email.com", "0811111111", "L", "2000-01-01", "NQB001", "2 halaman", "1 surat", "5 ayat", "aktif", now, now],
    ["AGT002", "002", "Zaid bin Tsabit", "zaid@email.com", "0811111112", "L", "2001-03-15", "NQB001", "3 halaman", "1 juz", "10 ayat", "aktif", now, now],
    ["AGT003", "003", "Budi Santoso", "budi@email.com", "0811111113", "L", "1999-07-20", "NQB001", "1 halaman", "1 maqra", "3 ayat", "aktif", now, now],
    ["AGT004", "004", "Bilal Al-Habasyi", "bilal@email.com", "0811111114", "L", "2002-11-10", "NQB002", "2 halaman", "1 surat", "7 ayat", "aktif", now, now],
    ["AGT005", "005", "Abdullah bin Mas'ud", "abdullah@email.com", "0811111115", "L", "2000-05-25", "NQB002", "4 halaman", "2 surat", "10 ayat", "aktif", now, now],
    ["AGT006", "006", "Salman Al-Farisi", "salman@email.com", "0811111116", "L", "1998-09-08", "NQB002", "1 halaman", "1 surat", "5 ayat", "aktif", now, now],
  ];

  anggotaData.forEach(function(row) {
    anggotaSheet.appendRow(row);
  });

  usersSheet.appendRow(["USR004", "anggota01", hashPassword("Anggota123!"), "Muhammad Ali", "ali@email.com", "anggota", "AGT001", "aktif", now, now, ""]);
  usersSheet.appendRow(["USR005", "anggota02", hashPassword("Anggota123!"), "Zaid bin Tsabit", "zaid@email.com", "anggota", "AGT002", "aktif", now, now, ""]);
  usersSheet.appendRow(["USR006", "anggota03", hashPassword("Anggota123!"), "Budi Santoso", "budi@email.com", "anggota", "AGT003", "aktif", now, now, ""]);
  usersSheet.appendRow(["USR007", "anggota04", hashPassword("Anggota123!"), "Bilal Al-Habasyi", "bilal@email.com", "anggota", "AGT004", "aktif", now, now, ""]);
  usersSheet.appendRow(["USR008", "anggota05", hashPassword("Anggota123!"), "Abdullah bin Mas'ud", "abdullah@email.com", "anggota", "AGT005", "aktif", now, now, ""]);
  usersSheet.appendRow(["USR009", "anggota06", hashPassword("Anggota123!"), "Salman Al-Farisi", "salman@email.com", "anggota", "AGT006", "aktif", now, now, ""]);

  // Sample Aktivitas (Hari ini, kemarin, dan beberapa hari lalu)
  const today = new Date();
  const getPastDateStr = function(offsetDays) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offsetDays);
    return d.toISOString().split("T")[0];
  };

  const sampleAktivitas = [
    // Muhammad Ali (Sangat aktif - Hari ini)
    ["AKT0001", getPastDateStr(0), "AGT001", "NQB001", "BACA_QURAN", "Al-Baqarah", 1, 10, 1, 1, 10, 1, "", "", "selesai", "Membaca ba'da Shubuh", now, now],
    ["AKT0002", getPastDateStr(0), "AGT001", "NQB001", "MUROJAAH", "Al-Mulk", 1, 15, 29, "", 15, "", "", "", "selesai", "Lancar dan tartil", now, now],
    ["AKT0003", getPastDateStr(0), "AGT001", "NQB001", "HAFALAN", "An-Naba'", 1, 10, 30, "", 10, "", "10 ayat", 88, "selesai", "Perbaiki tajwid ayat 6-8", now, now],
    ["AKT0004", getPastDateStr(1), "AGT001", "NQB001", "BACA_QURAN", "Al-Baqarah", 11, 25, 1, 2, 15, 1, "", "", "selesai", "Lancar", now, now],

    // Zaid bin Tsabit (Aktif - 2 hari lalu)
    ["AKT0005", getPastDateStr(2), "AGT002", "NQB001", "BACA_QURAN", "Ali 'Imran", 1, 20, 3, 50, 20, 2, "", "", "selesai", "Tilawah rutin", now, now],
    ["AKT0006", getPastDateStr(2), "AGT002", "NQB001", "HAFALAN", "An-Nazi'at", 1, 15, 30, "", 15, "", "15 ayat", 92, "selesai", "Sangat lancar", now, now],

    // Budi Santoso (Tidak aktif > 8 hari lalu untuk demo Perlu Perhatian)
    ["AKT0007", getPastDateStr(9), "AGT003", "NQB001", "BACA_QURAN", "Al-Kahf", 1, 10, 15, 293, 10, 1, "", "", "selesai", "Tilawah Jumat", now, now],

    // Bilal Al-Habasyi (Naqib 2 - Hari ini)
    ["AKT0008", getPastDateStr(0), "AGT004", "NQB002", "BACA_QURAN", "Yasin", 1, 30, 22, 440, 30, 2, "", "", "selesai", "Ba'da Maghrib", now, now],
    ["AKT0009", getPastDateStr(1), "AGT004", "NQB002", "MUROJAAH", "Ar-Rahman", 1, 40, 27, "", 40, "", "", "", "selesai", "Lancar", now, now],

    // Abdullah bin Mas'ud (Naqib 2 - 1 hari lalu)
    ["AKT0010", getPastDateStr(1), "AGT005", "NQB002", "HAFALAN", "Al-Waqi'ah", 1, 25, 27, "", 25, "", "25 ayat", 95, "selesai", "Mumtaz", now, now],

    // Salman Al-Farisi (Naqib 2 - 5 hari lalu -> Perlu Perhatian)
    ["AKT0011", getPastDateStr(5), "AGT006", "NQB002", "BACA_QURAN", "Al-Mulk", 1, 30, 29, 562, 30, 2, "", "", "selesai", "Murojaah malam", now, now]
  ];

  sampleAktivitas.forEach(function(row) {
    actSheet.appendRow(row);
  });

  Logger.log("Seed data berhasil dimasukkan!");
}

// ---------------------------------------------------------------------------------
// UTILITIES
// ---------------------------------------------------------------------------------

function getSpreadsheet() {
  if (typeof SPREADSHEET_ID !== "undefined" && SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
    } catch (e) {
      Logger.log("Peringatan: Gagal membuka spreadsheet dengan ID '" + SPREADSHEET_ID + "': " + e.toString());
    }
  }
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error("Spreadsheet ID belum diisi. Masukkan SPREADSHEET_ID pada bagian atas file Code.gs");
}

function createJsonResponse(success, message, data) {
  const output = {
    success: success,
    message: message,
    data: data
  };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function hashPassword(pass) {
  if (!pass) return "";
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pass, Utilities.Charset.UTF_8);
  let hashStr = "";
  for (let i = 0; i < rawHash.length; i++) {
    let byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    let byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = "0" + byteHex;
    hashStr += byteHex;
  }
  return hashStr;
}

function getRowsAsObjects(data) {
  if (!data || data.length <= 1) return [];
  const headers = data[0];
  const list = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // skip completely empty rows
    if (row.join("").trim() === "") continue;
    list.push(rowToObject(headers, row));
  }
  return list;
}

function rowToObject(headers, row) {
  const obj = {};
  for (let j = 0; j < headers.length; j++) {
    const val = row[j];
    if (val instanceof Date) {
      obj[headers[j]] = val.toISOString();
    } else {
      obj[headers[j]] = val;
    }
  }
  return obj;
}
