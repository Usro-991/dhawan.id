/* Menu navigasi bersama untuk semua halaman.
   Cukup panggil <script src="/nav.js" defer></script> di tiap halaman.
   Tombol di pojok kanan atas membuka panel gelap berisi tautan ke semua halaman.
   Nama, label, dan domain diambil dari config.js (window.TOKO). */
(function () {
  var IC = {
    menu:    "<svg viewBox='0 0 24 24'><path d='M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z'/><path d='M17 10h2a2 2 0 0 1 0 4h-2'/><path d='M8 4v2M11 3v3'/></svg>",
    kopi:    "<svg viewBox='0 0 24 24'><path d='M12 21c4-3 8-6.5 8-11a8 8 0 0 0-16 0c0 4.5 4 8 8 11z'/><path d='M12 3c-2 4-2 12 0 18'/></svg>",
    poin:    "<svg viewBox='0 0 24 24'><path d='M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z'/></svg>",
    tentang: "<svg viewBox='0 0 24 24'><path d='M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z'/><circle cx='12' cy='10' r='2.5'/></svg>",
    wa:      "<svg viewBox='0 0 24 24'><path d='M21 12a9 9 0 0 1-13.3 7.9L3 21l1.1-4.7A9 9 0 1 1 21 12z'/></svg>",
    kasir:   "<svg viewBox='0 0 24 24'><rect x='6' y='3' width='12' height='18' rx='2'/><path d='M10 18h4'/></svg>",
    arrow:   "<svg viewBox='0 0 24 24'><path d='M5 12h14M13 6l6 6-6 6'/></svg>"
  };
  var HALAMAN = [
    { url: "/",        ikon: "menu",    judul: "Menu & Pesan",   ket: "Pilih, pesan, nikmati" },
    { url: "/poin",    ikon: "poin",    judul: "Cek Poin",       ket: "Sisa poin & cara menukarnya" },
    { url: "/tentang", ikon: "tentang", judul: "Tentang Kami",   ket: "Cerita, alamat, jam buka" },
    { url: "/wa",      ikon: "wa",      judul: "Chat WhatsApp",  ket: "Tanya langsung ke kami" },
    { url: "/kasir",   ikon: "kasir",   judul: "Aplikasi Kasir", ket: "Untuk pemilik usaha" }
  ];

  var css = ""
    + ".nvb{position:fixed;top:14px;right:14px;z-index:60;width:46px;height:46px;border:1px solid rgba(255,255,255,.14);border-radius:50%;"
    + "background:rgba(20,17,15,.82);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 6px 20px rgba(0,0,0,.28);cursor:pointer;"
    + "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4.5px;padding:0;transition:transform .25s}"
    + ".nvb:hover{transform:scale(1.05)}"
    + ".nvb i{display:block;width:18px;height:1.8px;border-radius:2px;background:#D9B26F;transition:transform .3s ease,opacity .2s ease,width .3s ease}"
    + ".nvb i:nth-child(2){width:12px;align-self:flex-end;margin-right:14px}"
    + ".nvb.on i:nth-child(1){transform:translateY(6.3px) rotate(45deg)}"
    + ".nvb.on i:nth-child(2){opacity:0}"
    + ".nvb.on i:nth-child(3){transform:translateY(-6.3px) rotate(-45deg)}"
    + ".nvo{position:fixed;inset:0;z-index:59;background:rgba(10,8,7,.55);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);opacity:0;visibility:hidden;"
    + "transition:opacity .3s ease,visibility .3s ease}"
    + ".nvo.on{opacity:1;visibility:visible}"
    + ".nvp{position:fixed;top:0;right:0;bottom:0;z-index:60;width:min(360px,88vw);background:#14110F;color:#F7F1E8;"
    + "box-shadow:-20px 0 60px rgba(0,0,0,.45);transform:translateX(102%);transition:transform .38s cubic-bezier(.2,.7,.2,1);"
    + "padding:84px 22px 26px;overflow-y:auto;display:flex;flex-direction:column;"
    + "font-family:'Plus Jakarta Sans',system-ui,sans-serif}"
    + ".nvp::before{content:'';position:absolute;inset:0;pointer-events:none;opacity:.08;"
    + "background:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Cg fill='none' stroke='%23D9B26F' stroke-width='1'%3E%3Cellipse cx='48' cy='24' rx='11' ry='20'/%3E%3Cellipse cx='48' cy='72' rx='11' ry='20'/%3E%3Cellipse cx='24' cy='48' rx='20' ry='11'/%3E%3Cellipse cx='72' cy='48' rx='20' ry='11'/%3E%3C/g%3E%3C/svg%3E\") center/96px 96px}"
    + ".nvp.on{transform:none}"
    + ".nvlogo{display:flex;align-items:center;gap:13px;padding-bottom:20px;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,.1);position:relative}"
    + ".nvlogo img{width:46px;height:46px;flex:0 0 46px;object-fit:contain}"
    + ".nvlogo img.boxed{background:#fff;border-radius:14px;padding:3px}"
    + ".nvlogo b{display:block;font-family:'Bricolage Grotesque','Plus Jakarta Sans',sans-serif;font-size:17px;letter-spacing:.06em;text-transform:uppercase;line-height:1.05}"
    + ".nvlogo span{display:block;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#D9B26F;margin-top:5px;font-weight:700}"
    + ".nvh{font-size:9.5px;letter-spacing:2.6px;text-transform:uppercase;color:rgba(247,241,232,.45);font-weight:700;margin:16px 0 6px;padding-left:2px;position:relative}"
    + ".nvp a.nvi{display:flex;gap:14px;align-items:center;text-decoration:none;color:#F7F1E8;position:relative;"
    + "padding:13px 6px 13px 2px;border-bottom:1px solid rgba(255,255,255,.07);transition:padding .25s cubic-bezier(.2,.7,.2,1)}"
    + ".nvp a.nvi:hover{padding-left:8px}"
    + ".nvp a.nvi .nvic{width:40px;height:40px;flex:0 0 40px;border-radius:13px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);"
    + "display:flex;align-items:center;justify-content:center;color:#D9B26F}"
    + ".nvp a.nvi.nvnow .nvic{background:#D9B26F;color:#14110F;border-color:#D9B26F}"
    + ".nvp svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}"
    + ".nvp a.nvi b{display:block;font-size:15px;font-weight:700;letter-spacing:-.01em}"
    + ".nvp a.nvi.nvnow b{color:#F0D9A8}"
    + ".nvp a.nvi span.nvk{display:block;font-size:11.5px;color:rgba(247,241,232,.5);margin-top:2px;line-height:1.35}"
    + ".nvp a.nvi .nvar{margin-left:auto;color:rgba(247,241,232,.3);width:16px;height:16px}"
    + ".nvp a.nvi .nvar svg{width:16px;height:16px}"
    + ".nvp a.nvi.nvnow .nvar{color:#D9B26F}"
    + ".nvf{margin-top:auto;padding-top:22px;position:relative;display:flex;flex-direction:column;gap:12px}"
    + ".nvwa{display:flex;align-items:center;justify-content:center;gap:9px;text-decoration:none;background:#D9B26F;color:#14110F;"
    + "font-weight:800;font-size:13.5px;letter-spacing:.3px;border-radius:999px;padding:14px 18px}"
    + ".nvwa svg{width:18px;height:18px;stroke-width:2}"
    + ".nvd{text-align:center;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:rgba(247,241,232,.4);font-weight:700}"
    + ".nvd b{color:#D9B26F}";

  function pasang() {
    var T = window.TOKO || {};
    // Halaman edukasi hanya muncul kalau config.js menyalakannya (edukasi: true).
    if (T.edukasi) {
      HALAMAN.splice(1, 0, { url: "/kopi", ikon: "kopi", judul: "Belajar Kopi", ket: "Arabika, robusta, proses, sangrai" });
    }

    // Font judul panel (dipakai juga di halaman depan); aman kalau sudah ada.
    if (!document.querySelector("link[href*='Bricolage+Grotesque']")) {
      var f = document.createElement("link");
      f.rel = "stylesheet";
      f.href = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700&display=swap";
      document.head.appendChild(f);
    }

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

    var html = "<div class='nvlogo'><img src='/icon-light.png' alt='' onerror=\"this.onerror=null;this.src='/icon.png';this.classList.add('boxed')\">"
             + "<div><b>" + (T.nama || "Toko") + "</b><span>" + (T.label || "") + "</span></div></div>";
    html += "<div class='nvh'>Jelajahi</div>";
    for (var i = 0; i < HALAMAN.length; i++) {
      var h = HALAMAN[i];
      var aktif = (h.url === "/" ? path === "/" : path === h.url);
      html += "<a class='nvi" + (aktif ? " nvnow" : "") + "' href='" + h.url + "'>"
            + "<span class='nvic'>" + IC[h.ikon] + "</span>"
            + "<span><b>" + h.judul + "</b><span class='nvk'>" + h.ket + "</span></span>"
            + "<span class='nvar'>" + IC.arrow + "</span></a>";
    }
    html += "<div class='nvf'>";
    if (T.waToko) html += "<a class='nvwa' href='https://wa.me/" + T.waToko + "' target='_blank' rel='noopener'>" + IC.wa + " Hubungi kami</a>";
    html += "<div class='nvd'><b>" + (T.domain || location.host) + "</b></div></div>";
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
