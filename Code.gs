// ===== VERSI LENGKAP - Rzq Kasir + halaman web sendiri (v2.5: kolom tier) =====
// Cara pakai: buka editor Apps Script, Ctrl+A (pilih semua kode lama), Delete,
// lalu tempel SELURUH isi file ini. Simpan (Ctrl+S).
// Terakhir: Deploy > Manage deployments > Edit (pensil) > Version: New version > Deploy.
// Endpoint: ?menu=1 (halaman lama), ?data=1 (data menu + tier), ?info=1 (info toko + aturan poin),
//           ?cek=08xx (cek poin member), ?action=order, ?action=member

// Rzq Kasir - sinkron ke Google Sheets + halaman menu QR untuk pelanggan.
// Tempel di Extensions > Apps Script, Deploy > New deployment > Web app >
// Execute as: Me, Who has access: Anyone > Deploy. Salin URL /exec ke aplikasi.
// Setiap ganti skrip: Deploy > Manage deployments > Edit > Version: New version > Deploy.
var NAMA = {settings:'Setting', outlets:'Outlet', users:'Pengguna', categories:'Kategori', menus:'Menu',
  ingredients:'Bahan', recipes:'Resep', customers:'Pelanggan', transactions:'Transaksi',
  transaction_items:'Item Transaksi', payments:'Pembayaran', receivables:'Piutang', assets:'Aset',
  asset_services:'Servis Aset', adjustments:'Adjustment', audit_log:'Audit Log', shifts:'Shift',
  expenses:'Biaya', stock_moves:'Stok Masuk Keluar', stock_opnames:'Stok Opname', stock_opname_items:'Item Opname',
  toppings:'Topping', promos:'Promo', menu_images:'Gambar Menu', qris_image:'Gambar QRIS'};
var ORDERS = 'Pesanan';
var ORDER_COLS = ['id','time','name','table','items','note','total','status','payment','paid','phone'];

function sheetRows(name) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) return [];
  var v = sh.getDataRange().getValues();
  if (v.length < 2) return [];
  var cols = v[0];
  return v.slice(1).filter(function(r){ return r.join('') !== ''; }).map(function(r){
    var o = {}; cols.forEach(function(c, i){ o[c] = r[i]; }); return o;
  });
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (data.action === 'order') return saveOrderJson(data);
  if (data.action === 'member') return saveMemberJson(data);
  if (data.action === 'order_status') {
    setOrderStatus(data.id, data.status);
    return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
  }
  var total = 0;
  for (var t in data.tables) {
    var rows = data.tables[t];
    var sh = ss.getSheetByName(NAMA[t] || t) || ss.insertSheet(NAMA[t] || t);
    sh.clearContents();
    if (!rows.length) continue;
    var cols = Object.keys(rows[0]);
    var out = [cols];
    rows.forEach(function(r){ out.push(cols.map(function(c){ return r[c] === null ? '' : r[c]; })); });
    sh.getRange(1, 1, out.length, cols.length).setValues(out);
    sh.setFrozenRows(1);
    total += rows.length;
  }
  var info = ss.getSheetByName('Info') || ss.insertSheet('Info');
  info.getRange('A1:B2').setValues([['Sinkron terakhir', new Date()], ['Baris', total]]);
  CacheService.getScriptCache().removeAll(['menu_data', 'store_name']);
  return ContentService.createTextOutput(JSON.stringify({ok:true, rows:total})).setMimeType(ContentService.MimeType.JSON);
}

function _jsonp(e, obj) {
  var cb = (e.parameter && e.parameter.callback) ? e.parameter.callback : "";
  var s = JSON.stringify(obj);
  if (cb) return ContentService.createTextOutput(cb + "(" + s + ")").setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var p = e.parameter || {};
  if (p.menu) return menuPage();
  // Endpoint JSONP untuk halaman statis (GitHub Pages) — hindari blokir CORS.
  if (p.data) return _jsonp(e, menuData());
  if (p.action === 'order' && p.payload) { var oid = saveOrder(JSON.parse(p.payload)); return _jsonp(e, {ok:true, id:oid}); }
  if (p.action === 'member' && p.payload) { var mid = saveMember(JSON.parse(p.payload)); return _jsonp(e, {ok:true, id:mid}); }
  if (p.info) return _jsonp(e, storeInfo());
  if (p.cek) return _jsonp(e, memberInfo(p.cek));
  if (p.action === 'orders') {
    var orders = sheetRows(ORDERS).filter(function(o){ var st=String(o.status); return st==='baru'||st==='hold'; });
    return ContentService.createTextOutput(JSON.stringify({orders: orders})).setMimeType(ContentService.MimeType.JSON);
  }
  var out = {};
  var tarik = {categories:'Kategori', ingredients:'Bahan', menus:'Menu', customers:'Pelanggan', toppings:'Topping'};
  for (var t in tarik) out[t] = sheetRows(tarik[t]);
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- pesanan ----------
function ordersSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(ORDERS);
  if (!sh) { sh = ss.insertSheet(ORDERS); sh.appendRow(ORDER_COLS); sh.setFrozenRows(1); return sh; }
  // Auto-perbaiki header lama (mis. sebelum ada kolom payment/paid/phone) supaya data tidak nyasar.
  var header = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0];
  var need = false;
  for (var i = 0; i < ORDER_COLS.length; i++) { if (String(header[i] || '') !== ORDER_COLS[i]) { need = true; break; } }
  if (need) { sh.getRange(1, 1, 1, ORDER_COLS.length).setValues([ORDER_COLS]); sh.setFrozenRows(1); }
  return sh;
}

function saveOrder(order) {
  var sh = ordersSheet();
  var id = 'ORD' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyMMddHHmmss') + Math.floor(Math.random()*90+10);
  sh.appendRow([id, new Date().toISOString(), order.name || '', order.table || '', JSON.stringify(order.items || []), order.note || '', order.total || 0, 'baru', order.payment || 'tunai', order.paid ? 'ya' : '', order.phone || '']);
  return id;
}

function saveOrderJson(data) {
  var id = saveOrder(data.order || data);
  return ContentService.createTextOutput(JSON.stringify({ok:true, id:id})).setMimeType(ContentService.MimeType.JSON);
}

function membersSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Pelanggan');
  if (!sh) { sh = ss.insertSheet('Pelanggan'); sh.appendRow(['id','name','phone','points','notes','created']); sh.setFrozenRows(1); }
  if (sh.getLastRow() === 0) sh.appendRow(['id','name','phone','points','notes','created']);
  return sh;
}

function saveMember(m) {
  var sh = membersSheet();
  var header = sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getValues()[0];
  var col = {}; header.forEach(function(h,i){ col[String(h).toLowerCase()] = i; });
  var vals = sh.getDataRange().getValues();
  var phone = (m.phone||'').replace(/\D/g,'');
  // Cegah duplikat: nomor WA sama = perbarui baris lama.
  var rowIdx = -1;
  for (var i=1;i<vals.length;i++){ if (col.phone!=null && String(vals[i][col.phone]).replace(/\D/g,'')===phone && phone) { rowIdx=i; break; } }
  var maxId = 0; for (var j=1;j<vals.length;j++){ var v=Number(vals[j][col.id||0])||0; if(v>maxId)maxId=v; }
  var notes = [];
  if (m.birthday) notes.push('ultah:'+m.birthday);
  if (m.anniversary) notes.push('nikah:'+m.anniversary);
  notes.push('member web');
  var row = header.map(function(h){ return ''; });
  function setc(name,val){ if(col[name]!=null) row[col[name]]=val; }
  if (rowIdx<0) { setc('id', maxId+1); setc('points', 0); setc('created', new Date().toISOString()); }
  else { row = vals[rowIdx].slice(); }
  setc('name', m.name||''); setc('phone', m.phone||''); setc('notes', notes.join('|'));
  if (rowIdx<0) sh.appendRow(row); else sh.getRange(rowIdx+1,1,1,row.length).setValues([row]);
  CacheService.getScriptCache().remove('members_count');
  return maxId+1;
}

function saveMemberJson(data) {
  var id = saveMember(data.member || data);
  return ContentService.createTextOutput(JSON.stringify({ok:true, id:id})).setMimeType(ContentService.MimeType.JSON);
}

function setOrderStatus(id, status) {
  var sh = ordersSheet();
  var v = sh.getDataRange().getValues();
  for (var i = 1; i < v.length; i++) {
    if (String(v[i][0]) === String(id)) { sh.getRange(i+1, 8).setValue(status); return true; }
  }
  return false;
}

// ---------- halaman menu untuk pelanggan ----------
// Data menu di-cache 10 menit (CacheService) supaya tiap scan tidak membaca 5 sheet.
// Cache dihapus otomatis setiap aplikasi kasir melakukan sinkron (doPost push).
function menuData() {
  var settings = {};
  sheetRows('Setting').forEach(function(r){ settings[r.key] = r.value; });
  var images = {};
  sheetRows('Gambar Menu').forEach(function(r){ images[String(r.menu_id)] = r.data; });
  var cats = sheetRows('Kategori').sort(function(a,b){ return (a.sort||0)-(b.sort||0); });
  var menus = sheetRows('Menu').filter(function(m){ return String(m.active) === '1'; }).map(function(m){
    return {id: m.id, name: m.name, category_id: m.category_id, price: Number(m.price)||0, description: m.description || '',
            favorite: String(m.favorite) === '1', has_toppings: String(m.has_toppings) !== '0', image: images[String(m.id)] || '',
            tier: String(m.tier || 'regular')};
  });
  var toppings = sheetRows('Topping').filter(function(t){ return String(t.active) === '1'; }).map(function(t){
    return {id: t.id, name: t.name, price: Number(t.price)||0};
  });
  var promoRows = sheetRows('Promo').filter(function(p){ return String(p.active) === '1'; });
  var promoNames = promoRows.map(function(p){ return p.name; });
  if (settings.promo_text) promoNames = String(settings.promo_text).split('|').filter(Boolean).concat(promoNames);
  var promo = promoNames.join('|');
  var qris = '';
  var qr = sheetRows('Gambar QRIS'); if (qr.length && qr[0].data) qris = qr[0].data;
  var d = {store: settings.store_name || 'Menu', address: settings.store_address || '', hours: settings.store_hours || '',
          currency: settings.currency_symbol || 'Rp ', cats: cats, menus: menus, toppings: toppings, qris: qris, promo: promo, perks: String(settings.member_perks||'').split(String.fromCharCode(10)).map(function(x){return x.trim()}).filter(Boolean)};
  return d;
}

function getMenuData() { return menuData(); }

// ---------- endpoint ringan untuk halaman profil & cek poin ----------
// Tidak membawa gambar, jadi jauh lebih kecil daripada menuData().
function storeInfo() {
  var s = {};
  sheetRows('Setting').forEach(function(r){ s[r.key] = r.value; });
  return {store: s.store_name || '', address: s.store_address || '', hours: s.store_hours || '',
          phone: s.store_phone || '', menu_url: s.web_menu_url || '',
          redeem_points: Number(s.loyalty_redeem_points) || 0,
          redeem_amount: Number(s.loyalty_redeem_amount) || 0,
          perks: String(s.member_perks || '').split(String.fromCharCode(10)).map(function(x){ return x.trim(); }).filter(Boolean)};
}

function _normPhone(v) {
  var d = String(v || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.indexOf('62') === 0) d = '0' + d.substring(2);
  if (d.charAt(0) !== '0') d = '0' + d;
  return d;
}

// Cek poin member by nomor WhatsApp.
// Sengaja hanya mengembalikan nama depan, poin, dan jumlah kunjungan —
// total belanja tidak dibuka supaya data pelanggan tidak bocor ke sembarang orang.
function memberInfo(phone) {
  var d = _normPhone(phone);
  if (d.length < 9) return {ok: false, reason: 'Nomor tidak valid'};
  var rows = sheetRows('Pelanggan');
  var found = null;
  for (var i = 0; i < rows.length; i++) {
    if (_normPhone(rows[i].phone) === d) { found = rows[i]; break; }
  }
  if (!found) return {ok: false, reason: 'Nomor belum terdaftar sebagai member'};
  var visits = 0;
  var tx = sheetRows('Transaksi');
  for (var j = 0; j < tx.length; j++) {
    if (String(tx[j].customer_id) === String(found.id) && String(tx[j].status) !== 'void') visits++;
  }
  return {ok: true, name: String(found.name || '').split(' ')[0], points: Number(found.points) || 0, visits: visits};
}

function clearMenuCache() { CacheService.getScriptCache().remove('menu_data'); }

// Halaman dikirim langsung (tanpa membaca sheet); data menu diambil setelah halaman tampil.
function menuPage() {
  var cache = CacheService.getScriptCache();
  var store = cache.get('store_name');
  if (!store) {
    store = 'Menu';
    sheetRows('Setting').forEach(function(r){ if (r.key === 'store_name') store = r.value; });
    cache.put('store_name', store, 600);
  }
  var html = MENU_HTML.replace(/__STORE__/g, store);
  return HtmlService.createHtmlOutput(html).setTitle(store + ' - Menu')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

var MENU_HTML = '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>__STORE__</title>' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" media="print" onload="this.media=\'all\'">' +
'<style>' +
':root{--p:#6B4226;--p2:#3E2419;--cream:#FAF6F1;--card:#fff;--txt:#2B211C;--muted:#7A6B62;--accent:#DDB878;--ok:#2E7D4F}' +
'*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}body{margin:0;font-family:"Plus Jakarta Sans",system-ui,sans-serif;background:var(--cream);color:var(--txt)}' +
'.hero{background:linear-gradient(135deg,var(--p2),var(--p));color:#fff;padding:26px 20px 22px;border-radius:0 0 28px 28px}' +
'.hero h1{margin:0;font-size:24px;font-weight:800;letter-spacing:-.3px}.hero p{margin:6px 0 0;opacity:.85;font-size:13px}' +
'.chips{display:flex;gap:8px;overflow-x:auto;padding:14px 16px 4px;scrollbar-width:none}.chips::-webkit-scrollbar{display:none}' +
'.chip{flex:0 0 auto;padding:9px 16px;border-radius:999px;background:#fff;border:1px solid #E6DDD4;font-weight:600;font-size:13px;color:var(--txt);cursor:pointer}' +
'.chip.on{background:var(--p);color:#fff;border-color:var(--p)}' +
'.search{margin:10px 16px 0;display:flex;align-items:center;gap:8px;background:#fff;border-radius:16px;padding:11px 14px;border:1px solid #E6DDD4}.search input{border:0;outline:0;flex:1;font:inherit;font-size:14px;background:transparent}' +
'.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:14px 16px 120px}@media(min-width:640px){.grid{grid-template-columns:repeat(3,1fr)}}' +
'.card{background:var(--card);border-radius:20px;overflow:hidden;box-shadow:0 2px 10px rgba(60,40,20,.06);display:flex;flex-direction:column}' +
'.img{aspect-ratio:1/1;background:#EFE6DC;position:relative;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:800;color:var(--p)}.img img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0}' +
'.fav{position:absolute;top:8px;left:8px;background:rgba(255,255,255,.92);border-radius:10px;padding:3px 8px;font-size:11px;font-weight:700}' +
'.body{padding:10px 12px 12px;display:flex;flex-direction:column;gap:4px;flex:1}.name{font-weight:700;font-size:14px;line-height:1.2}.desc{font-size:11.5px;color:var(--muted);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
'.row{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:6px}.price{font-weight:800;color:var(--p);font-size:14px}' +
'.add{width:34px;height:34px;border-radius:12px;border:0;background:var(--p);color:#fff;font-size:20px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center}' +
'.qty{display:flex;align-items:center;gap:6px}.qty button{width:30px;height:30px;border-radius:10px;border:1px solid var(--p);background:#fff;color:var(--p);font-size:18px;cursor:pointer}.qty b{min-width:18px;text-align:center}' +
'.bar{position:fixed;left:16px;right:16px;bottom:16px;background:var(--p);color:#fff;border-radius:20px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 8px 24px rgba(107,66,38,.35);cursor:pointer;font-weight:700}' +
'.sheet{position:fixed;inset:0;background:rgba(0,0,0,.45);display:none;align-items:flex-end;z-index:9}.sheet.on{display:flex}' +
'.panel{background:#fff;width:100%;max-height:92vh;overflow:auto;border-radius:24px 24px 0 0;padding:18px 18px 28px}' +
'.panel h2{margin:0 0 10px;font-size:18px}.line{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F0E8E0;font-size:14px;gap:8px}.line small{color:var(--muted);display:block;font-size:12px}' +
'label{display:block;font-size:12px;font-weight:600;color:var(--muted);margin:12px 0 4px}input.f,textarea.f{width:100%;border:1px solid #E6DDD4;border-radius:14px;padding:12px;font:inherit;font-size:14px}' +
'.btn{width:100%;border:0;background:var(--p);color:#fff;border-radius:16px;padding:15px;font:inherit;font-weight:700;font-size:16px;margin-top:14px;cursor:pointer}.btn.sec{background:#F1EAE2;color:var(--txt)}.btn:disabled{opacity:.6}' +
'.top{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #F0E8E0;font-size:14px}.top input{width:20px;height:20px}' +
'.done{text-align:center;padding:30px 10px}.done .ic{width:72px;height:72px;border-radius:50%;background:#E6F4EA;color:var(--ok);font-size:38px;line-height:72px;margin:0 auto 12px}' +
'.muted{color:var(--muted);font-size:13px}' +
'.promo{display:flex;gap:8px;overflow-x:auto;padding:10px 16px 0;scrollbar-width:none}.promo::-webkit-scrollbar{display:none}' +
'.pchip{flex:0 0 auto;background:linear-gradient(135deg,#F3E4CE,#E7C9A0);color:#5A3A1E;border-radius:14px;padding:8px 12px;font-size:12px;font-weight:700;white-space:nowrap}' +
'.member{margin:12px 16px 0;background:linear-gradient(135deg,var(--p2),var(--p));color:#fff;border-radius:18px;padding:14px 16px;display:flex;align-items:center;gap:12px}' +
'.member b{font-size:15px}.member p{margin:2px 0 0;font-size:12px;opacity:.85}.member button{margin-left:auto;background:#fff;color:var(--p);border:0;border-radius:12px;padding:10px 14px;font:inherit;font-weight:700;white-space:nowrap;cursor:pointer}' +
'.perk{display:flex;gap:10px;padding:8px 0;font-size:13px;border-bottom:1px solid #F0E8E0}.perk .i{font-size:18px}' +
'.sk{background:linear-gradient(90deg,#EFE6DC 25%,#F7F1EA 50%,#EFE6DC 75%);background-size:200% 100%;animation:sk 1.2s infinite;border-radius:20px;aspect-ratio:1/1.35}@keyframes sk{0%{background-position:200% 0}100%{background-position:-200% 0}}' +
'</style></head><body>' +
'<div class="hero"><h1>__STORE__</h1><p id="sub"></p></div>' +
'<div class="promo" id="promo"></div>' +
'<div class="member"><div><b>&#127942; Jadi Member Dhawan</b><p>Diskon tiap hari + hadiah ulang tahun</p></div><button onclick="openMember()">Daftar</button></div>' +
'<div class="search">&#128269;<input id="q" placeholder="Cari menu..." oninput="render()"></div>' +
'<div class="chips" id="chips"></div><div class="grid" id="grid"><div class="sk"></div><div class="sk"></div><div class="sk"></div><div class="sk"></div></div>' +
'<div class="bar" id="bar" style="display:none" onclick="openCart()"><span id="barL"></span><span id="barR"></span></div>' +
'<div class="sheet" id="sheet" onclick="if(event.target===this)closeSheet()"><div class="panel" id="panel"></div></div>' +
'<script>' +
'var D={cats:[],menus:[],toppings:[],currency:"Rp "};var cart=[];var cat="all";var CUR="Rp ";var loaded=false;' +
'function money(v){return CUR+Math.round(v).toLocaleString("id-ID")}' +
'document.getElementById("sub").textContent="Memuat menu...";' +
'function init(d){D=d;CUR=d.currency||"Rp ";loaded=true;document.getElementById("sub").textContent=[d.address,d.hours].filter(Boolean).join(" · ");renderPromo();chips();render()}' +
'var PROMOS=["🌟 Daftar member, dapat harga spesial"];' +
'function renderPromo(){var el=document.getElementById("promo");if(!el)return;var extra=(D.promo||"").split("|").filter(Boolean);var all=extra.length?extra:PROMOS;el.innerHTML=all.map(function(p){return "<div class=\'pchip\'>&#127991; "+p+"</div>"}).join("")}' +
'var DEFAULT_PERKS=["Diskon member 10% tiap transaksi","Hadiah ulang tahun: 1 kopi gratis di bulan lahir","Harga spesial acara: wedding, lamaran, arisan, gathering","Kartu stempel: beli 9 gratis 1"];' +
'function openMember(){var perks=(D.perks&&D.perks.length)?D.perks:DEFAULT_PERKS;var html="<h2>Daftar Member</h2><p class=\'muted\'>Gratis. Dapat promo & harga spesial event.</p><div style=\'margin:10px 0\'>";' +
'perks.forEach(function(p){html+="<div class=\'perk\'><span class=\'i\'>&#127942;</span><div>"+p+"</div></div>"});html+="</div>";' +
'html+="<label>Nama *</label><input class=\'f\' id=\'mname\' placeholder=\'Nama lengkap\'>";' +
'html+="<label>No. WhatsApp *</label><input class=\'f\' id=\'mphone\' type=\'tel\' inputmode=\'numeric\' placeholder=\'08xxxxxxxxxx\'>";' +
'html+="<label>Tanggal lahir</label><input class=\'f\' id=\'mbirth\' type=\'date\'>";' +
'html+="<label>Tanggal pernikahan / anniversary (opsional)</label><input class=\'f\' id=\'mwed\' type=\'date\'>";' +
'html+="<button class=\'btn\' id=\'msend\' onclick=\'submitMember()\'>Daftar sekarang</button><button class=\'btn sec\' onclick=\'closeSheet()\'>Nanti saja</button>";openSheet(html)}' +
'function submitMember(){var name=document.getElementById("mname").value.trim();var phone=document.getElementById("mphone").value.trim();if(!name||phone.replace(/\D/g,"").length<8){alert("Isi nama & no. WhatsApp yang benar");return}var b=document.getElementById("msend");b.disabled=true;b.textContent="Mendaftar...";' +
'var m={name:name,phone:phone,birthday:document.getElementById("mbirth").value,anniversary:document.getElementById("mwed").value};' +
'google.script.run.withSuccessHandler(function(id){openSheet("<div class=\'done\'><div class=\'ic\'>&#10003;</div><h2>Selamat datang, "+name+"!</h2><p class=\'muted\'>Anda resmi member Dhawan. Sebut nama / no. WA saat pesan untuk diskon & hadiah ulang tahun.</p><button class=\'btn\' onclick=\'closeSheet()\'>Mulai pesan</button></div>")})' +
'.withFailureHandler(function(e){alert("Gagal daftar: "+e);b.disabled=false;b.textContent="Daftar sekarang"}).saveMember(m)}' +
'function load(){google.script.run.withSuccessHandler(init).withFailureHandler(function(e){document.getElementById("sub").textContent="Gagal memuat: "+e+". Tarik untuk muat ulang.";setTimeout(load,4000)}).getMenuData()}' +
'function chips(){var el=document.getElementById("chips");var html="<div class=\'chip"+(cat=="all"?" on":"")+"\' onclick=\'setCat(\\"all\\")\'>Semua</div>";' +
'D.cats.forEach(function(c){html+="<div class=\'chip"+(cat==String(c.id)?" on":"")+"\' onclick=\'setCat(\\""+c.id+"\\")\'>"+c.name+"</div>"});el.innerHTML=html}' +
'function setCat(c){cat=c;chips();render()}' +
'function inCart(id){return cart.filter(function(x){return x.menu_id==id}).reduce(function(a,x){return a+x.qty},0)}' +
'function render(){var q=document.getElementById("q").value.toLowerCase();var g=document.getElementById("grid");var html="";' +
'D.menus.filter(function(m){return (cat=="all"||String(m.category_id)==cat)&&(!q||m.name.toLowerCase().indexOf(q)>=0)}).forEach(function(m){' +
'var n=inCart(m.id);html+="<div class=\'card\'><div class=\'img\'>"+(m.image?"<img src=\'"+m.image+"\' loading=\'lazy\'>":m.name.charAt(0))+(m.favorite?"<span class=\'fav\'>&#11088; Favorit</span>":"")+"</div>"+' +
'"<div class=\'body\'><div class=\'name\'>"+m.name+"</div><div class=\'desc\'>"+(m.description||"")+"</div><div class=\'row\'><span class=\'price\'>"+money(m.price)+"</span>"+' +
'(n?"<div class=\'qty\'><button onclick=\'dec("+m.id+")\'>&minus;</button><b>"+n+"</b><button onclick=\'add("+m.id+")\'>+</button></div>":"<button class=\'add\' onclick=\'add("+m.id+")\'>+</button>")+"</div></div></div>"});' +
'g.innerHTML=html||"<p class=\'muted\' style=\'grid-column:1/-1;text-align:center\'>Menu tidak ditemukan</p>";bar()}' +
'function menu(id){return D.menus.filter(function(m){return m.id==id})[0]}' +
'function add(id){var m=menu(id);if(m.has_toppings&&D.toppings.length){toppingSheet(m);return}push(m,[],"")}' +
'function push(m,tops,note){var key=m.id+"|"+tops.map(function(t){return t.id}).join(",")+"|"+note;var ex=cart.filter(function(x){return x.key==key})[0];' +
'if(ex){ex.qty++}else{cart.push({key:key,menu_id:m.id,name:m.name,price:m.price,toppings:tops,note:note,qty:1})}render()}' +
'function dec(id){for(var i=cart.length-1;i>=0;i--){if(cart[i].menu_id==id){cart[i].qty--;if(cart[i].qty<=0)cart.splice(i,1);break}}render()}' +
'function unit(x){return x.price+x.toppings.reduce(function(a,t){return a+t.price},0)}' +
'function total(){return cart.reduce(function(a,x){return a+unit(x)*x.qty},0)}' +
'function bar(){var b=document.getElementById("bar");var n=cart.reduce(function(a,x){return a+x.qty},0);b.style.display=n?"flex":"none";' +
'document.getElementById("barL").textContent=n+" item · Lihat pesanan";document.getElementById("barR").textContent=money(total())}' +
'function openSheet(html){document.getElementById("panel").innerHTML=html;document.getElementById("sheet").classList.add("on")}' +
'function closeSheet(){document.getElementById("sheet").classList.remove("on")}' +
'function toppingSheet(m){var html="<h2>"+m.name+"</h2><p class=\'muted\'>"+(m.description||"")+"</p><b>Topping / tambahan</b>";' +
'D.toppings.forEach(function(t){html+="<div class=\'top\'><label style=\'margin:0;color:var(--txt);font-size:14px;font-weight:600\'>"+t.name+"<small class=\'muted\' style=\'display:block;font-weight:400\'>"+(t.price?"+"+money(t.price):"Gratis")+"</small></label><input type=\'checkbox\' data-id=\'"+t.id+"\'></div>"});' +
'html+="<label>Catatan</label><input class=\'f\' id=\'tnote\' placeholder=\'less ice, tanpa gula...\'><button class=\'btn\' onclick=\'confirmTop("+m.id+")\'>Tambah ke pesanan</button>";openSheet(html)}' +
'function confirmTop(id){var m=menu(id);var tops=[];document.querySelectorAll("#panel input[type=checkbox]:checked").forEach(function(c){var t=D.toppings.filter(function(x){return x.id==c.dataset.id})[0];tops.push({id:t.id,name:t.name,price:t.price})});' +
'push(m,tops,document.getElementById("tnote").value.trim());closeSheet()}' +
'function openCart(){var html="<h2>Pesanan Anda</h2>";cart.forEach(function(x,i){html+="<div class=\'line\'><div><b>"+x.qty+"x "+x.name+"</b>"+(x.toppings.length?"<small>+ "+x.toppings.map(function(t){return t.name}).join(", ")+"</small>":"")+(x.note?"<small>&#128221; "+x.note+"</small>":"")+"</div><div style=\'text-align:right\'>"+money(unit(x)*x.qty)+"<br><a href=\'#\' onclick=\'rm("+i+");return false\' style=\'color:#B3382C;font-size:12px\'>hapus</a></div></div>"});' +
'html+="<div class=\'line\'><b>Total</b><b>"+money(total())+"</b></div><label>Nama</label><input class=\'f\' id=\'cname\' placeholder=\'Nama Anda\'><label>No. WhatsApp (untuk poin member)</label><input class=\'f\' id=\'cphone\' type=\'tel\' inputmode=\'numeric\' placeholder=\'08xxxxxxxxxx\'><label>No. meja / ambil sendiri</label><input class=\'f\' id=\'ctable\' placeholder=\'mis. Meja 4\'><label>Catatan</label><textarea class=\'f\' id=\'cnote\' rows=\'2\'></textarea>' +
'<button class=\'btn\' onclick=\'payStep()\'>Lanjut ke pembayaran</button><button class=\'btn sec\' onclick=\'closeSheet()\'>Tambah menu lagi</button>";openSheet(html)}' +
'function rm(i){cart.splice(i,1);render();if(cart.length)openCart();else closeSheet()}' +
'var buyer={};' +
'function payStep(){var name=document.getElementById("cname").value.trim();if(!name){alert("Isi nama dulu ya");return}buyer={name:name,phone:document.getElementById("cphone").value.trim(),table:document.getElementById("ctable").value.trim(),note:document.getElementById("cnote").value.trim()};pay="tunai";paidClaim=false;renderPay()}' +
'var pay="tunai";var paidClaim=false;' +
'function setPay(p){pay=p;paidClaim=false;renderPay()}' +
'function payTunai(){setPay("tunai")}' +
'function payQris(){setPay("qris")}' +
'function renderPay(){var html="<h2>Pembayaran</h2><div class=\'line\'><b>Total</b><b>"+money(total())+"</b></div>";' +
'html+="<div style=\'display:flex;gap:10px;margin:14px 0\'>";' +
'html+="<button onclick=\'payTunai()\' style=\'flex:1;padding:14px;border-radius:14px;border:2px solid "+(pay==\'tunai\'?\'var(--p)\':\'#E6DDD4\')+";background:"+(pay==\'tunai\'?\'var(--cream)\':\'#fff\')+";font:inherit;font-weight:700\'>&#128181; Tunai</button>";' +
'html+="<button onclick=\'payQris()\' style=\'flex:1;padding:14px;border-radius:14px;border:2px solid "+(pay==\'qris\'?\'var(--p)\':\'#E6DDD4\')+";background:"+(pay==\'qris\'?\'var(--cream)\':\'#fff\')+";font:inherit;font-weight:700\'>QRIS</button></div>";' +
'if(pay==\'tunai\'){html+="<p class=\'muted\'>Bayar tunai di kasir setelah pesanan diterima.</p><button class=\'btn\' id=\'send\' onclick=\'send()\'>Kirim pesanan</button>";}' +
'else{if(D.qris){html+="<p class=\'muted\' style=\'text-align:center\'>Scan QRIS ini, bayar sejumlah <b>"+money(total())+"</b></p><img src=\'"+D.qris+"\' style=\'width:100%;max-width:320px;display:block;margin:8px auto;border-radius:12px\'>";}' +
'else{html+="<p class=\'muted\'>QRIS belum tersedia. Minta QRIS ke kasir, lalu tandai sudah bayar.</p>";}' +
'html+="<label style=\'display:flex;gap:10px;align-items:center;margin:12px 0;font-size:14px;font-weight:600;color:var(--txt)\'><input type=\'checkbox\' id=\'paidchk\' onchange=\'paidClaim=this.checked\' style=\'width:22px;height:22px\'> Saya sudah transfer / bayar QRIS</label>";' +
'html+="<button class=\'btn\' id=\'send\' onclick=\'send()\'>Kirim pesanan</button>";}' +
'html+="<button class=\'btn sec\' onclick=\'openCart()\'>Kembali</button>";openSheet(html)}' +
'function send(){var b=document.getElementById("send");b.disabled=true;b.textContent="Mengirim...";' +
'var order={name:buyer.name,phone:buyer.phone,table:buyer.table,note:buyer.note,total:total(),payment:pay,paid:(pay==\'qris\'&&paidClaim),items:cart.map(function(x){return {menu_id:x.menu_id,name:x.name,qty:x.qty,price:x.price,toppings:x.toppings,note:x.note}})};' +
'google.script.run.withSuccessHandler(function(id){cart=[];render();var pmsg=order.payment==\'qris\'?(order.paid?"Anda menandai sudah bayar QRIS. Kasir akan cek & konfirmasi.":"Bayar QRIS lalu tunjukkan bukti ke kasir."):"Bayar tunai di kasir.";openSheet("<div class=\'done\'><div class=\'ic\'>&#10003;</div><h2>Pesanan terkirim</h2><p class=\'muted\'>Nomor <b>"+id+"</b><br>"+pmsg+"</p><button class=\'btn\' onclick=\'closeSheet()\'>Tutup</button></div>")})' +
'.withFailureHandler(function(e){alert("Gagal kirim: "+e);b.disabled=false;b.textContent="Kirim pesanan"}).saveOrder(order)}' +
'chips();load();' +
'</script></body></html>';
