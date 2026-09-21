/* ============================================================
   PENGATURAN SITUS — satu-satunya file yang perlu diubah
   saat aplikasi ini dipasang untuk toko lain.
   Setelah diubah, upload ulang file ini saja.
   ============================================================ */
window.TOKO = {
  // Nama usaha persis seperti yang ingin ditampilkan
  nama:   "Dhawan Coffe",
  // Label kecil di bawah nama (jenis usaha)
  label:  "Coffee Shop",
  // Slogan (boleh dikosongkan: "")
  slogan: "Roso Ningrat, Rego Rakyat",

  // URL Apps Script /exec dari aplikasi kasir (Pengaturan > Google Sheets)
  apiUrl: "https://script.google.com/macros/s/AKfycbzQzh7Bz-5XfiFqtZT0j-M7HE9qzzv0o4OrpffxXI8nsKcWimqkIAXYelJJhYprZjJk/exec",

  // Nomor WhatsApp TOKO untuk halaman /wa. Format 62..., tanpa + dan tanpa 0 di depan.
  waToko: "6281324542217",
  // Nomor WhatsApp PENJUAL APLIKASI untuk halaman /kasir (boleh sama dengan waToko)
  waPenjualApp: "6287778199518",

  // Tautan Google Maps lokasi toko (tautan "Bagikan" dari Google Maps)
  mapsUrl: "https://share.google/gqZSAQZHaYAiK8Dmm",

  // Domain situs ini (untuk tampilan di footer)
  domain: "dhawan.my.id",

  // Sertifikat halal: kosongkan halalId ("") kalau belum punya, bagian halal otomatis disembunyikan
  halalId: "ID32110077837970726"
};
