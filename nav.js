/* Menu navigasi bersama untuk semua halaman dhawan.my.id.
   Cukup panggil <script src="/nav.js" defer></script> di tiap halaman.
   Tombol tiga garis muncul di pojok kanan atas, isinya tautan ke semua halaman. */
(function () {
  var HALAMAN = [
    { url: "/",        ikon: "☕", judul: "Menu & Pesan",   ket: "Lihat menu, pesan dari meja" },
    { url: "/poin",    ikon: "⭐", judul: "Cek Poin",       ket: "Sisa poin & cara menukarnya" },
    { url: "/tentang", ikon: "📍", judul: "Tentang Kami", ket: "Alamat, jam buka, lokasi" },
    { url: "/wa",      ikon: "💬", judul: "Chat WhatsApp", ket: "Tanya langsung ke kami" },
    { url: "/kasir",   ikon: "📱", judul: "Aplikasi Kasir", ket: "Untuk pemilik usaha" }
  ];

  var css = ""
    + ".nvb{position:fixed;top:14px;right:14px;z-index:60;width:46px;height:46px;border:0;border-radius:15px;"
    + "background:rgba(255,255,255,.92);box-shadow:0 3px 14px rgba(60,40,20,.22);cursor:pointer;"
    + "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4.5px;padding:0}"
    + ".nvb i{display:block;width:19px;height:2.2px;border-radius:2px;background:#6B4226;transition:transform .25s ease,opacity .2s ease}"
    + ".nvb.on i:nth-child(1){transform:translateY(6.7px) rotate(45deg)}"
    + ".nvb.on i:nth-child(2){opacity:0}"
    + ".nvb.on i:nth-child(3){transform:translateY(-6.7px) rotate(-45deg)}"
    + ".nvo{position:fixed;inset:0;z-index:59;background:rgba(43,33,28,.5);opacity:0;visibility:hidden;"
    + "transition:opacity .25s ease,visibility .25s ease}"
    + ".nvo.on{opacity:1;visibility:visible}"
    + ".nvp{position:fixed;top:0;right:0;bottom:0;z-index:60;width:min(320px,86vw);background:#FAF6F1;"
    + "box-shadow:-8px 0 30px rgba(60,40,20,.2);transform:translateX(102%);transition:transform .28s ease;"
    + "padding:76px 18px 24px;overflow-y:auto;"
    + "font-family:'Plus Jakarta Sans',system-ui,sans-serif}"
    + ".nvp.on{transform:none}"
    + ".nvp h4{margin:0 0 4px;font-size:11px;letter-spacing:1.2px;color:#7A6B62;text-transform:uppercase;padding-left:4px}"
    + ".nvp a{display:flex;gap:13px;align-items:center;text-decoration:none;color:#2B211C;"
    + "background:#fff;border:1px solid #E9E0D6;border-radius:16px;padding:13px 14px;margin-top:9px}"
    + ".nvp a.now{border-color:#6B4226;background:#F6EDE4}"
    + ".nvp a .ic{font-size:19px;width:34px;height:34px;flex:0 0 34px;border-radius:11px;background:#F5EDE4;"
    + "display:flex;align-items:center;justify-content:center}"
    + ".nvp a b{display:block;font-size:14px;font-weight:700}"
    + ".nvp a span{display:block;font-size:11.5px;color:#7A6B62;margin-top:1px;line-height:1.35}"
    + ".nvf{margin-top:22px;text-align:center;font-size:11.5px;color:#7A6B62}"
    + ".nvf b{color:#6B4226}";

  function pasang() {
    var s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);

    var btn = document.createElement("button");
    btn.className = "nvb";
    btn.setAttribute("aria-label", "Buka menu");
    btn.innerHTML = "<i></i><i></i><i></i>";

    var ov = document.createElement("div");
    ov.className = "nvo";

    var panel = document.createElement("nav");
    panel.className = "nvp";

    // Halaman yang sedang dibuka, supaya bisa ditandai.
    var path = location.pathname.replace(/\/index\.html$/, "/").replace(/\/+$/, "");
    if (path === "") path = "/";

    var html = "<h4>Dhawan Coffe</h4>";
    for (var i = 0; i < HALAMAN.length; i++) {
      var h = HALAMAN[i];
      var aktif = (h.url === "/" ? path === "/" : path === h.url);
      html += "<a href='" + h.url + "'" + (aktif ? " class='now'" : "") + ">"
            + "<span class='ic'>" + h.ikon + "</span>"
            + "<span><b>" + h.judul + "</b><span>" + h.ket + "</span></span></a>";
    }
    html += "<div class='nvf'><b>dhawan.my.id</b></div>";
    panel.innerHTML = html;

    document.body.appendChild(ov);
    document.body.appendChild(panel);
    document.body.appendChild(btn);

    function buka(v) {
      btn.classList.toggle("on", v);
      ov.classList.toggle("on", v);
      panel.classList.toggle("on", v);
      btn.setAttribute("aria-label", v ? "Tutup menu" : "Buka menu");
    }
    btn.addEventListener("click", function () { buka(!panel.classList.contains("on")); });
    ov.addEventListener("click", function () { buka(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") buka(false); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", pasang);
  } else {
    pasang();
  }
})();
