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
  halalId: "ID32110077837970726",


  // Kota (tampil di pil kecil hero). Boleh dikosongkan.
  kota: "Bandung",

  // ---- Teks halaman depan. Hapus/kosongkan bagian ini kalau mau memakai teks bawaan. ----
  hero: {
    judul1: "Roso Ningrat.",          // baris 1 judul besar (putih)
    judul2: "Rego Rakyat.",           // baris 2 judul besar (emas)
    teks:   "Rasa bangsawan, harga rakyat. Espresso premium, single origin Puntang, cokelat dan matcha — diracik dengan takaran yang dikunci, disajikan untuk siapa saja yang lewat.",
    cincin: "SINGLE ORIGIN PUNTANG • HALAL • ROSO NINGRAT REGO RAKYAT • "  // tulisan melingkar di foto
  },
  cerita: {
    judul: "Rasa bangsawan,\n*harga rakyat.*",   // *teks* = warna emas, \n = baris baru
    teks:  "Secangkir dengan mutu yang biasanya hanya ditemui di kedai mahal, tapi tetap bisa dibeli siapa saja yang lewat. Itu yang kami pegang sejak hari pertama.",
    teks2: "Karena itu setiap menu kami bernama gelar Jawa: Ningrat, Keraton, Adipati, Senopati, Panglima, Permaisuri. Bukan sekadar nama — pengingat bahwa siapa pun yang duduk di sini berhak diperlakukan istimewa. Dan nama kami ditulis *Coffe*, satu ‘e’, disengaja: satu ‘e’ untuk satu esensi."
  },
  // Empat kartu keunggulan di samping cerita
  nilai: [
    { tag: "Biji kopi",     judul: "Grade 1 / premium",  teks: "Hanya biji kelas satu. Tanpa campuran kelas bawah untuk menekan harga." },
    { tag: "Single origin", judul: "Puntang Wine Bean",  teks: "Dari dataran tinggi Puntang, Jawa Barat. Proses wine, manis dan berbuah." },
    { tag: "Racikan",       judul: "House blend 50 : 50", teks: "Perbandingan yang kami kunci sendiri supaya rasa tetap sama tiap hari." },
    { tag: "Ekstraksi",     judul: "Minimal 9 bar",      teks: "Standar espresso sesungguhnya, basket presisi agar aliran merata." }
  ],

  // Halaman "Belajar Kopi" (/kopi). true = tampil di menu navigasi.
  edukasi: true
};
