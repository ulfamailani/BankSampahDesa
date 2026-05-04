/* ─── CONFIG ─── */
const ADMIN_PIN = "1234";
const NAMA_DESA = "Bank Sampah Desa"; // Ganti nama desa di sini

/* ─── UTILS ─── */
function formatRupiah(angka) {
  return "Rp " + angka.toLocaleString("id-ID");
}
function formatTanggal(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) +
    ", " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/* ─── TOAST NOTIFIKASI ─── */
function showToast(msg, type = "success") {
  // Hapus toast lama kalau ada
  document.getElementById("toast-container")?.remove();

  const colors = {
    success: "linear-gradient(135deg,#2e8b44,#1a5c2a)",
    error:   "linear-gradient(135deg,#e8394c,#b5202f)",
    info:    "linear-gradient(135deg,#3a7bd5,#1a4fa0)",
  };

  const el = document.createElement("div");
  el.id = "toast-container";
  el.style.cssText = `
    position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
    background:${colors[type]}; color:white;
    padding:12px 22px; border-radius:30px;
    font-family:'Nunito',sans-serif; font-size:0.88rem; font-weight:700;
    box-shadow:0 6px 24px rgba(0,0,0,0.25); z-index:9999;
    animation:toastIn 0.3s cubic-bezier(.34,1.56,.64,1);
    white-space:nowrap; max-width:90vw;
  `;
  el.textContent = msg;

  const style = document.createElement("style");
  style.textContent = `
    @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(16px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
    @keyframes toastOut { from{opacity:1;transform:translateX(-50%) translateY(0)} to{opacity:0;transform:translateX(-50%) translateY(16px)} }
  `;
  document.head.appendChild(style);
  document.body.appendChild(el);

  setTimeout(() => {
    el.style.animation = "toastOut 0.3s ease forwards";
    setTimeout(() => el.remove(), 300);
  }, 2800);
}

/* ─── OFFLINE DETECTION ─── */
function initOfflineDetection() {
  const banner = document.createElement("div");
  banner.id = "offline-banner";
  banner.style.cssText = `
    display:none; position:fixed; top:52px; left:0; right:0;
    background:#f7c948; color:#3a2600;
    text-align:center; padding:7px 16px;
    font-family:'Nunito',sans-serif; font-size:0.82rem; font-weight:700;
    z-index:99;
  `;
  banner.textContent = "⚠️ Tidak ada koneksi internet — data tersimpan lokal saja";
  document.body.appendChild(banner);

  function updateStatus() {
    banner.style.display = navigator.onLine ? "none" : "block";
  }
  window.addEventListener("online", updateStatus);
  window.addEventListener("offline", () => {
    updateStatus();
    showToast("⚠️ Koneksi terputus", "error");
  });
  updateStatus();
}

/* ─── STORAGE ─── */
function getRiwayat() { return JSON.parse(localStorage.getItem("riwayat")) || []; }
function saveRiwayat(data) { localStorage.setItem("riwayat", JSON.stringify(data)); }
function getTarikTunai() { return JSON.parse(localStorage.getItem("tarikTunai")) || []; }
function saveTarikTunai(data) { localStorage.setItem("tarikTunai", JSON.stringify(data)); }
function getTarget() { return JSON.parse(localStorage.getItem("targets")) || {}; }
function saveTarget(t) { localStorage.setItem("targets", JSON.stringify(t)); }

/* ─── SALDO ─── */
function getSaldoMap() {
  const map = {};
  getRiwayat().forEach(item => { map[item.nama] = (map[item.nama] || 0) + item.total; });
  getTarikTunai().forEach(item => { map[item.nama] = (map[item.nama] || 0) - item.jumlah; });
  return map;
}
function getSaldo(nama) { return getSaldoMap()[nama] || 0; }

/* ─── ADMIN / PIN ─── */
function isAdmin() { return sessionStorage.getItem("adminUnlocked") === "1"; }

function applyAdminState() {
  const admin = isAdmin();
  document.body.classList.toggle("is-admin", admin);

  const badge = document.getElementById("adminBadge");
  if (badge) {
    badge.style.display = "flex";
    badge.textContent = admin ? "👑 Keluar Admin" : "🔑 Admin";
    badge.style.background = admin
      ? "linear-gradient(135deg,#e8394c,#b5202f)"
      : "linear-gradient(135deg,#f7c948,#f0a800)";
    badge.style.color = admin ? "white" : "#3a2600";
  }

  document.querySelectorAll(".admin-only").forEach(el => {
    el.style.display = admin ? "inline-flex" : "none";
  });
}

function toggleAdmin() {
  if (isAdmin()) {
    if (confirm("Keluar dari mode Admin?")) {
      sessionStorage.removeItem("adminUnlocked");
      applyAdminState();
      tampilRiwayat();
    }
  } else {
    bukaModalPIN();
  }
}

/* ─── PIN MODAL ─── */
let pinBuffer = "";

function bukaModalPIN() {
  pinBuffer = "";
  updatePinDots();
  document.getElementById("pin-error").textContent = "";
  document.getElementById("pin-modal").classList.add("show");
}
function tutupModalPIN() {
  pinBuffer = "";
  document.getElementById("pin-modal").classList.remove("show");
}
function updatePinDots() {
  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById("dot-" + i);
    if (dot) dot.classList.toggle("filled", i < pinBuffer.length);
  }
}
function pinInput(val) {
  if (pinBuffer.length >= 4) return;
  pinBuffer += val;
  updatePinDots();
  if (pinBuffer.length === 4) setTimeout(checkPIN, 150);
}
function pinDel() {
  pinBuffer = pinBuffer.slice(0, -1);
  updatePinDots();
}
function checkPIN() {
  if (pinBuffer === ADMIN_PIN) {
    sessionStorage.setItem("adminUnlocked", "1");
    tutupModalPIN();
    applyAdminState();
    tampilRiwayat();
    showToast("👑 Selamat datang, Admin!");
  } else {
    const err = document.getElementById("pin-error");
    err.textContent = "PIN salah, coba lagi";
    err.style.animation = "none";
    err.offsetHeight;
    err.style.animation = "";
    pinBuffer = "";
    updatePinDots();
  }
}
function handlePinKey(e) {
  const modal = document.getElementById("pin-modal");
  if (!modal?.classList.contains("show")) return;
  if (e.key >= "0" && e.key <= "9") pinInput(e.key);
  if (e.key === "Backspace") pinDel();
  if (e.key === "Escape") tutupModalPIN();
}

/* ─── DARK MODE ─── */
function applyDarkMode() {
  if (localStorage.getItem("darkMode") === "1") document.body.classList.add("dark");
}
function initDarkMode() {
  const btn = document.getElementById("darkModeBtn");
  if (!btn) return;
  btn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  btn.onclick = () => {
    const nowDark = document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", nowDark ? "1" : "0");
    btn.textContent = nowDark ? "☀️" : "🌙";
  };
}

/* ─── NAMA DESA ─── */
function applyNamaDesa() {
  document.querySelectorAll(".topbar-logo, .nama-desa").forEach(el => {
    el.textContent = NAMA_DESA;
  });
  const titleEl = document.querySelector("title");
  if (titleEl && titleEl.textContent.includes("Bank Sampah")) {
    titleEl.textContent = NAMA_DESA;
  }
}

/* ─── FORM INPUT ─── */
function getInput() {
  return {
    nama: document.getElementById("nama").value.trim(),
    harga: parseFloat(document.getElementById("jenis").value),
    berat: parseFloat(document.getElementById("berat").value),
    jenisLabel: document.getElementById("jenis").selectedOptions[0]?.text || ""
  };
}
function isValid({ nama, harga, berat }) {
  return nama !== "" && !isNaN(harga) && !isNaN(berat) && berat > 0;
}

/* ─── HITUNG SETORAN ─── */
function hitungOtomatis() {
  const input = getInput();
  const hasilBox = document.getElementById("hasil");
  if (!isValid(input)) {
    showToast("⚠️ Lengkapi semua kolom dulu", "error");
    hasilBox.classList.remove("show");
    return;
  }

  const total = input.harga * input.berat;
  document.getElementById("hasil-nama").textContent = `Halo, ${input.nama}! 👋`;
  document.getElementById("hasil-jumlah").textContent = formatRupiah(total);
  document.getElementById("hasil-detail").textContent =
    `${input.berat} kg × ${formatRupiah(input.harga)} per kg`;
  hasilBox.classList.add("show");

  const riwayat = getRiwayat();
  riwayat.push({ id: generateId(), nama: input.nama, total, timestamp: Date.now(), jenis: input.jenisLabel, berat: input.berat });
  saveRiwayat(riwayat);
  tampilRiwayat();

  showToast(`✅ Setoran ${input.nama} berhasil disimpan!`);

  document.getElementById("nama").value = "";
  document.getElementById("jenis").value = "";
  document.getElementById("berat").value = "";
}

/* ─── RIWAYAT ─── */
let filterNama = "";

function tampilRiwayat() {
  const list = document.getElementById("riwayat");
  if (!list) return;
  let riwayat = getRiwayat();
  if (filterNama) riwayat = riwayat.filter(i => i.nama.toLowerCase().includes(filterNama.toLowerCase()));
  list.innerHTML = "";

  if (riwayat.length === 0) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">📭</span>${filterNama ? `Tidak ada hasil untuk "${filterNama}"` : "Belum ada riwayat setoran"}</div>`;
    return;
  }

  [...riwayat].reverse().forEach((item, i) => {
    const li = document.createElement("li");
    li.className = "riwayat-item";
    li.style.animationDelay = `${i * 0.04}s`;
    const delBtn = isAdmin()
      ? `<button class="btn-icon btn-del" onclick="hapusItem('${item.id}')" title="Hapus">🗑</button>`
      : "";
    li.innerHTML = `
      <div class="ri-info">
        <span class="ri-name">${item.nama}</span>
        <span class="ri-date">${formatTanggal(item.timestamp)}</span>
      </div>
      <div class="ri-right">
        <span class="ri-amount">${formatRupiah(item.total)}</span>
        ${delBtn}
      </div>`;
    list.appendChild(li);
  });
}

function hapusItem(id) {
  if (!isAdmin()) return;
  if (!confirm("Hapus transaksi ini?")) return;
  saveRiwayat(getRiwayat().filter(item => item.id !== id));
  tampilRiwayat();
  showToast("🗑 Transaksi dihapus", "info");
}
function hapusRiwayat() {
  if (!isAdmin()) return;
  if (confirm("Hapus semua riwayat setoran?")) {
    localStorage.removeItem("riwayat");
    tampilRiwayat();
    document.getElementById("hasil")?.classList.remove("show");
    showToast("🗑 Semua riwayat dihapus", "info");
  }
}
function setFilter(val) { filterNama = val; tampilRiwayat(); }

/* ─── TARIK TUNAI (admin only) ─── */
function tampilTarikTunai() {
  const container = document.getElementById("tarik-list");
  if (!container) return;

  if (!isAdmin()) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">🔒</span>Fitur ini hanya untuk Admin</div>`;
    document.getElementById("riwayat-tarik").innerHTML = "";
    return;
  }

  const saldoMap = getSaldoMap();
  const namaList = Object.keys(saldoMap);

  if (namaList.length === 0) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">💸</span>Belum ada warga dengan saldo</div>`;
    return;
  }

  container.innerHTML = namaList.map(nama => {
    const saldo = saldoMap[nama];
    return `
      <div class="saldo-item">
        <div class="saldo-header">
          <span class="saldo-nama">${nama}</span>
          <span class="saldo-val ${saldo <= 0 ? "saldo-zero" : ""}">${formatRupiah(saldo)}</span>
        </div>
        <div class="tarik-row">
          <input type="number" id="tarik-${CSS.escape(nama)}" placeholder="Jumlah tarik (Rp)" min="1" max="${saldo}" ${saldo <= 0 ? "disabled" : ""}>
          <button class="btn btn-danger btn-sm" onclick="prosessTarik('${nama.replace(/'/g,"\\'")}')">💸 Tarik</button>
        </div>
      </div>`;
  }).join("");

  tampilRiwayatTarik();
}

function prosessTarik(nama) {
  if (!isAdmin()) return;
  const input = document.getElementById(`tarik-${CSS.escape(nama)}`);
  const jumlah = parseFloat(input.value);
  const saldo = getSaldo(nama);
  if (isNaN(jumlah) || jumlah <= 0) { showToast("⚠️ Masukkan jumlah yang valid", "error"); return; }
  if (jumlah > saldo) { showToast(`❌ Saldo ${nama} tidak cukup`, "error"); return; }
  if (!confirm(`Konfirmasi tarik tunai:\n${nama} — ${formatRupiah(jumlah)}`)) return;

  const data = getTarikTunai();
  data.push({ id: generateId(), nama, jumlah, timestamp: Date.now() });
  saveTarikTunai(data);
  input.value = "";
  tampilTarikTunai();
  showToast(`💸 Penarikan ${formatRupiah(jumlah)} berhasil`);
}

function tampilRiwayatTarik() {
  const list = document.getElementById("riwayat-tarik");
  if (!list) return;
  const data = getTarikTunai();
  if (data.length === 0) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">📋</span>Belum ada penarikan</div>`;
    return;
  }
  list.innerHTML = [...data].reverse().map((item, i) => `
    <div class="riwayat-item" style="animation-delay:${i*0.04}s">
      <div class="ri-info">
        <span class="ri-name">${item.nama}</span>
        <span class="ri-date">${formatTanggal(item.timestamp)}</span>
      </div>
      <div class="ri-right">
        <span class="ri-amount" style="color:var(--red)">−${formatRupiah(item.jumlah)}</span>
        <button class="btn-icon btn-del" onclick="hapusTarik('${item.id}')">🗑</button>
      </div>
    </div>`).join("");
}

function hapusTarik(id) {
  if (!isAdmin()) return;
  if (!confirm("Hapus riwayat penarikan ini?")) return;
  saveTarikTunai(getTarikTunai().filter(i => i.id !== id));
  tampilTarikTunai();
  showToast("🗑 Penarikan dihapus", "info");
}

/* ─── RANKING ─── */
function tampilHalamanRanking() {
  const container = document.getElementById("ranking-list");
  if (!container) return;
  const riwayat = getRiwayat();
  if (riwayat.length === 0) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">🗃️</span>Belum ada data setoran</div>`;
    return;
  }
  const map = {};
  riwayat.forEach(item => { map[item.nama] = (map[item.nama] || 0) + item.total; });
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const medals = ["🥇", "🥈", "🥉"];
  container.innerHTML = sorted.map(([nama, total], i) => `
    <div class="rank-item" style="animation-delay:${i * 0.06}s">
      <div class="rank-badge">${medals[i] || (i + 1)}</div>
      <div class="rank-name">${nama}</div>
      <div class="rank-amount">${formatRupiah(total)}</div>
    </div>`).join("");
}

/* ─── TOTAL ─── */
function hitungTotal() {
  const riwayat = getRiwayat();
  const totalUangEl = document.getElementById("total-uang");
  if (!totalUangEl) return;
  if (riwayat.length === 0) {
    totalUangEl.textContent = "Rp 0";
    document.getElementById("total-sub").textContent = "Belum ada transaksi";
    return;
  }
  const grandTotal = riwayat.reduce((s, i) => s + i.total, 0);
  const totalTarik = getTarikTunai().reduce((s, i) => s + i.jumlah, 0);
  const map = {};
  riwayat.forEach(item => { map[item.nama] = (map[item.nama] || 0) + item.total; });
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const rataRata = Math.round(grandTotal / sorted.length);
  const last = riwayat[riwayat.length - 1];

  totalUangEl.textContent = formatRupiah(grandTotal);
  document.getElementById("total-sub").textContent = `Dari ${riwayat.length} transaksi · ${sorted.length} warga`;
  document.getElementById("stat-transaksi").textContent = riwayat.length;
  document.getElementById("stat-warga").textContent = sorted.length;
  document.getElementById("stat-terbesar").textContent = sorted[0][0];
  document.getElementById("stat-rata").textContent = formatRupiah(rataRata);
  if (document.getElementById("stat-terakhir"))
    document.getElementById("stat-terakhir").textContent = formatTanggal(last.timestamp);
  if (document.getElementById("stat-saldo"))
    document.getElementById("stat-saldo").textContent = formatRupiah(grandTotal - totalTarik);
  if (document.getElementById("stat-tarik"))
    document.getElementById("stat-tarik").textContent = formatRupiah(totalTarik);

  const top3Card = document.getElementById("top3-card");
  const top3List = document.getElementById("top3-list");
  if (top3Card && top3List) {
    top3Card.style.display = "";
    const medals = ["🥇", "🥈", "🥉"];
    top3List.innerHTML = sorted.slice(0, 3).map(([nama, total], i) => `
      <div class="rank-item" style="animation-delay:${i * 0.06}s">
        <div class="rank-badge">${medals[i] || i + 1}</div>
        <div class="rank-name">${nama}</div>
        <div class="rank-amount">${formatRupiah(total)}</div>
      </div>`).join("");
  }
}

/* ─── TARGET (admin only untuk edit) ─── */
function tampilTarget() {
  const container = document.getElementById("target-list");
  if (!container) return;
  const saldoMap = getSaldoMap();
  const targets = getTarget();
  const allNames = [...new Set([...Object.keys(saldoMap), ...Object.keys(targets)])];
  const admin = isAdmin();

  if (allNames.length === 0) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">🎯</span>Belum ada warga terdaftar</div>`;
    return;
  }

  container.innerHTML = allNames.map(nama => {
    const saldo = saldoMap[nama] || 0;
    const target = targets[nama] || 0;
    const pct = target > 0 ? Math.min(100, Math.round((saldo / target) * 100)) : 0;
    const done = target > 0 && saldo >= target;
    return `
      <div class="target-item">
        <div class="target-header">
          <span class="target-name">${nama}${done ? " ✅" : ""}</span>
          <span class="target-pct">${target > 0 ? pct + "%" : "—"}</span>
        </div>
        <div class="target-amounts">
          <span>${formatRupiah(saldo)}</span>
          ${target > 0 ? `<span class="target-of">/ ${formatRupiah(target)}</span>` : `<span class="target-of">belum ada target</span>`}
        </div>
        ${target > 0 ? `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>` : ""}
        ${admin ? `
        <div class="target-input-row">
          <input type="number" class="target-input" id="target-${CSS.escape(nama)}" placeholder="Set target (Rp)" value="${target || ""}">
          <button class="btn btn-primary btn-sm" onclick="simpanTarget('${nama.replace(/'/g,"\\'")}')">Simpan</button>
        </div>` : ""}
      </div>`;
  }).join("");

  if (!admin) {
    const info = document.getElementById("target-admin-info");
    if (info) info.style.display = "flex";
  }
}

function simpanTarget(nama) {
  if (!isAdmin()) return;
  const input = document.getElementById(`target-${CSS.escape(nama)}`);
  const val = parseFloat(input.value);
  if (isNaN(val) || val < 0) { showToast("⚠️ Masukkan angka yang valid", "error"); return; }
  const targets = getTarget();
  targets[nama] = val;
  saveTarget(targets);
  tampilTarget();
  showToast(`🎯 Target ${nama} disimpan`);
}

/* ─── QR ─── */
function generateQR(nama) {
  const base = window.location.href.split("?")[0].replace(/[^/]*$/, "index.html");
  const url = base + `?nama=${encodeURIComponent(nama)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
  document.getElementById("qr-nama").textContent = nama;
  document.getElementById("qr-img").src = qrUrl;
  document.getElementById("qr-modal").classList.add("show");
}
function tutupQR() { document.getElementById("qr-modal")?.classList.remove("show"); }
function tampilDaftarQR() {
  const container = document.getElementById("qr-list");
  if (!container) return;
  const namaList = [...new Set(getRiwayat().map(r => r.nama))];
  if (namaList.length === 0) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">📱</span>Belum ada warga terdaftar</div>`;
    return;
  }
  container.innerHTML = namaList.map(nama => `
    <div class="qr-item">
      <span class="qr-name">${nama}</span>
      <button class="btn btn-primary btn-sm" onclick="generateQR('${nama.replace(/'/g,"\\'")}')">📱 QR</button>
    </div>`).join("");
}

/* ─── EXPORT (admin only) ─── */
function exportRiwayat() {
  if (!isAdmin()) { showToast("🔒 Fitur ini hanya untuk Admin", "error"); return; }
  const riwayat = getRiwayat();
  if (riwayat.length === 0) { showToast("⚠️ Belum ada data untuk dicetak", "error"); return; }
  const grandTotal = riwayat.reduce((s, i) => s + i.total, 0);
  const totalTarik = getTarikTunai().reduce((s, i) => s + i.jumlah, 0);
  const rows = [...riwayat].reverse().map((item, i) => `
    <tr><td>${i+1}</td><td>${item.nama}</td><td>${item.jenis||"-"}</td><td>${item.berat||"-"} kg</td><td>${formatRupiah(item.total)}</td><td>${formatTanggal(item.timestamp)}</td></tr>`).join("");
  const tarikRows = [...getTarikTunai()].reverse().map((item, i) => `
    <tr><td>${i+1}</td><td>${item.nama}</td><td>${formatRupiah(item.jumlah)}</td><td>${formatTanggal(item.timestamp)}</td></tr>`).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Laporan ${NAMA_DESA}</title>
  <style>body{font-family:Arial,sans-serif;padding:30px;color:#1c2b1e}h2,h3{color:#1a5c2a}table{width:100%;border-collapse:collapse;margin-top:12px;margin-bottom:28px}th{background:#1a5c2a;color:#fff;padding:10px 12px;text-align:left;font-size:13px}td{padding:9px 12px;border-bottom:1px solid #e0e0e0;font-size:13px}tr:nth-child(even) td{background:#f5faf6}.tr-total td{font-weight:bold;background:#d4edda!important}.meta{color:#6b8a72;font-size:13px;margin-top:4px}@media print{button{display:none}}</style>
  </head><body>
  <h2>🌱 Laporan ${NAMA_DESA}</h2>
  <p class="meta">Dicetak: ${formatTanggal(Date.now())}</p>
  <h3>Riwayat Setoran</h3>
  <table><thead><tr><th>#</th><th>Nama</th><th>Jenis</th><th>Berat</th><th>Tabungan</th><th>Tanggal</th></tr></thead>
  <tbody>${rows}<tr class="tr-total"><td colspan="4">TOTAL SETORAN</td><td>${formatRupiah(grandTotal)}</td><td></td></tr></tbody></table>
  <h3>Riwayat Tarik Tunai</h3>
  <table><thead><tr><th>#</th><th>Nama</th><th>Jumlah</th><th>Tanggal</th></tr></thead>
  <tbody>${tarikRows}<tr class="tr-total"><td colspan="2">TOTAL TARIK</td><td>${formatRupiah(totalTarik)}</td><td></td></tr></tbody></table>
  <p style="font-weight:bold;color:#1a5c2a">Saldo Aktif: ${formatRupiah(grandTotal - totalTarik)}</p>
  <br><button onclick="window.print()">🖨 Cetak</button></body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}

/* ─── AUTO-FILL ─── */
function autoFillFromURL() {
  const nama = new URLSearchParams(window.location.search).get("nama");
  const el = document.getElementById("nama");
  if (nama && el) el.value = decodeURIComponent(nama);
}

/* ─── INIT ─── */
window.onload = function () {
  applyDarkMode();
  initDarkMode();
  applyAdminState();
  applyNamaDesa();
  initOfflineDetection();
  autoFillFromURL();
  document.addEventListener("keydown", handlePinKey);
  tampilRiwayat();
  tampilHalamanRanking();
  hitungTotal();
  tampilTarget();
  tampilDaftarQR();
  tampilTarikTunai();
};