/* customs.iradgov.org: site script. Header, footer, language and the data-driven parts. */
(function () {
  "use strict";
  var SITE = {"store": "cu_lang", "nav": [["home", "/"], ["tariff", "/tariff.html"], ["crossings", "/crossings.html"], ["terminal", "/terminal.html"], ["travel", "/travellers.html"]], "navAlias": {}, "links": [["gov", "https://iradgov.org/"], ["eirad", "https://e-irad.org/"], ["bank", "https://bank.iradgov.org/"], ["arch", "https://archives.iradgov.org/"], ["post", "https://post.iradgov.org/"], ["elections", "https://elections.iradgov.org/"], ["court", "https://court.iradgov.org/"], ["stats", "https://stats.iradgov.org/"], ["mejlis", "https://mejlis.iradgov.org/"], ["gidromet", "https://gidromet.iradgov.org/"], ["jandarm", "https://jandarm.iradgov.org/"], ["railways", "https://railways.iradgov.org/"], ["avia", "https://avia.iradgov.org/"], ["loto", "https://loto.iradgov.org/"], ["tender", "https://tender.e-irad.org/"]], "mastBtn": "/travellers.html"};
  var EXTRA = function () {
    var G = [{"b": 0, "n": {"en": "Flour, grain and rice", "ir": "Un, dan jana kürüch", "ru": "Мука, зерно и рис"}}, {"b": 0, "n": {"en": "Cooking oil, sugar and salt", "ir": "Ösümdük mayı, kant jana tuz", "ru": "Растительное масло, сахар и соль"}}, {"b": 0, "n": {"en": "Medicines", "ir": "Dary-darmek", "ru": "Лекарства"}}, {"b": 0, "n": {"en": "Coal and fuel for heating", "ir": "Jılıtuu üchün kömür jana küyüüchü may", "ru": "Уголь и топливо для отопления"}}, {"b": 0, "n": {"en": "Machinery for industry in the Zone", "ir": "Zonanın önör jayı üchün mashinalar", "ru": "Оборудование для промышленности Зоны"}}, {"b": 5, "n": {"en": "Cement, timber and building materials", "ir": "Tsement, jıgach jana kurulush materialdarı", "ru": "Цемент, лес и стройматериалы"}}, {"b": 5, "n": {"en": "Raw cotton, wool and hides", "ir": "Chiyki pakta, jün jana teri", "ru": "Хлопок-сырец, шерсть и кожи"}}, {"b": 5, "n": {"en": "Cars, lorries and tractors", "ir": "Jeñil unaa, jük unaa jana traktor", "ru": "Легковые, грузовые автомобили и тракторы"}}, {"b": 5, "n": {"en": "Vehicle parts and tyres", "ir": "Unaa tetikteri jana döñgölöktör", "ru": "Автозапчасти и шины"}}, {"b": 10, "n": {"en": "Clothing and shoes", "ir": "Kiyim jana but kiyim", "ru": "Одежда и обувь"}}, {"b": 10, "n": {"en": "Phones, computers and electronics", "ir": "Telefon, kompyuter jana elektronika", "ru": "Телефоны, компьютеры и электроника"}}, {"b": 10, "n": {"en": "Cigarettes and tobacco", "ir": "Sigaret jana tameki", "ru": "Сигареты и табак"}}, {"b": 10, "n": {"en": "Wine, vodka and beer", "ir": "Sharap, araq jana sıra", "ru": "Вино, водка и пиво"}}, {"b": 10, "n": {"en": "Furniture and household goods", "ir": "Ömür-tirichilik buyumdarı jana emerek", "ru": "Мебель и товары для дома"}}, {"b": 10, "n": {"en": "Other goods", "ir": "Bashka tovarlar", "ru": "Прочие товары"}}];
    var ids = ["calc", "rates", "rateNow"];
    if (!ids.some(function (i) { return document.getElementById(i); })) return;
    function n(x, dp) {
      var s = x.toFixed(dp == null ? 2 : dp), p = s.split("."), i = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, LANG === "en" ? "," : " ");
      return p[1] ? i + (LANG === "en" ? "." : ",") + p[1] : i;
    }
    todayData().then(function (d) {
      var R = d.rates.official, el, day = fmtDate(d.date);
      if ((el = $("#rateNow"))) { var u = R[0]; el.textContent = t("hmRate", { u: u.units, c: u.code, s: n(u.som) }); }
      if ((el = $("#rates"))) el.innerHTML = '<p class="small"><span class="live">' + esc(t("lnLive")) + "</span> " + esc(t("rtToday", { d: day })) + "</p>" +
        '<div class="tbl-wrap"><table class="facts"><thead><tr><th>' + esc(t("rtCur")) + '</th><th class="num">' + esc(t("rtUnits")) + '</th><th class="num">' + esc(t("rtSom")) + "</th></tr></thead><tbody>" +
        R.map(function (r) { return "<tr><td>" + esc(t("cu" + r.code)) + ' <span class="muted">' + r.code + '</span></td><td class="num">' + r.units.toLocaleString("en").replace(",", LANG === "en" ? "," : " ") + '</td><td class="num">' + n(r.som, r.som < 1 ? 4 : 2) + "</td></tr>"; }).join("") +
        "</tbody></table></div>";
      if ((el = $("#calc"))) {
        var opts = [0, 5, 10].map(function (b) {
          return '<optgroup label="' + esc(t("caB" + b)) + '">' + G.map(function (x, i) { return x.b === b ? '<option value="' + i + '">' + esc(tri(x.n)) + "</option>" : ""; }).join("") + "</optgroup>";
        }).join("");
        el.innerHTML = "<form><label for=\"caG\">" + esc(t("caCat")) + '</label><select id="caG">' + opts + "</select>" +
          '<div class="row2"><div><label for="caV">' + esc(t("caVal")) + '</label><input id="caV" type="number" min="0" step="any" inputmode="decimal" value="1000"></div>' +
          '<div><label for="caC">' + esc(t("caCur")) + '</label><select id="caC">' + R.map(function (r, i) { return '<option value="' + i + '">' + r.code + " · " + esc(t("cu" + r.code)) + "</option>"; }).join("") + '<option value="som">SOM · ' + esc(t("cuSOM")) + "</option></select></div></div>" +
          '<div class="out" id="caOut" aria-live="polite"></div></form>';
        var f = el.querySelector("form");
        function go() {
          var x = G[+$("#caG").value], v = parseFloat($("#caV").value), c = $("#caC").value, o = $("#caOut");
          if (!(v > 0)) { o.innerHTML = '<p class="muted">' + esc(t("caNeed")) + "</p>"; return; }
          var r = c === "som" ? null : R[+c], som = r ? v * r.som / r.units : v, duty = som * x.b / 100;
          o.innerHTML = "<table><tbody><tr><td>" + esc(t("caCv")) + '</td><td class="num">' + esc(t("caSom", { v: n(som) })) + "</td></tr>" +
            "<tr><td>" + esc(t("caDuty", { b: x.b })) + '</td><td class="num">' + esc(t("caSom", { v: n(duty) })) + "</td></tr>" +
            '<tr class="tot"><td>' + esc(t("caPay")) + '</td><td class="num">' + esc(t("caSom", { v: n(duty) })) + "</td></tr></tbody></table>" +
            (r ? '<p class="small muted">' + esc(t("caRate", { u: r.units, c: r.code, s: n(r.som, r.som < 1 ? 4 : 2), d: day })) + "</p>" : "") +
            '<p class="small muted">' + esc(t("caSales", { v: n((som + duty) * 0.12) })) + "</p>";
        }
        $("#caG").value = String(G.map(function (x) { return x.n.en; }).indexOf("Phones, computers and electronics"));
        f.addEventListener("input", go); f.addEventListener("change", go); f.addEventListener("submit", function (e) { e.preventDefault(); go(); }); go();
      }
    }).catch(function () { ids.forEach(function (i) { var e = document.getElementById(i); if (e) failBox(e); }); });
  };
  var I = window.SITE_I18N;
  var LANGS = ["en", "ir", "ru"];
  var PAGE = document.body.getAttribute("data-page") || "";
  var LANG = (function () {
    var q = (location.search.match(/[?&]lang=(en|ir|ru)\b/) || [])[1];
    if (q) { try { localStorage.setItem(SITE.store, q); } catch (e) {} return q; }
    try { var s = localStorage.getItem(SITE.store); if (LANGS.indexOf(s) >= 0) return s; } catch (e) {}
    return "en";
  })();
  var cache = {};

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fill(s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v && v[k] != null ? v[k] : m; }); }
  function t(k, v) { var d = I.ui[LANG] || {}; var s = d[k] != null ? d[k] : I.ui.en[k]; return s == null ? k : (v ? fill(s, v) : s); }
  function tri(o) { if (o == null) return ""; if (typeof o === "string") return o; return o[LANG] || o.en || ""; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function iradNow() { var n = new Date(); return new Date(n.getTime() + n.getTimezoneOffset() * 60000 + 6 * 3600000); }
  function iradToday() { var d = iradNow(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function fmtDate(s) {
    var p = String(s).split("-"), M = t("months");
    if (p.length < 3) return t("monthsNom")[+p[1] - 1] + " " + p[0];
    if (LANG === "ir") return (+p[2]) + "-" + M[+p[1] - 1] + " " + p[0];
    return (+p[2]) + " " + M[+p[1] - 1] + " " + p[0];
  }
  function getJSON(url) {
    if (!cache[url]) cache[url] = fetch(url, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
    return cache[url];
  }
  function sortByDate(a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; }
  /* today's numbers: the public file (iradgov.org/data/today.json) nests its lists; flatten them once */
  function todayData() {
    return getJSON("https://iradgov.org/data/today.json").then(function (d) {
      if (d.weather && d.weather.places) d.weather = d.weather.places;
      if (d.air && d.air.places) d.air = d.air.places;
      if (d.water && d.water.toktogul && !d.toktogul) d.toktogul = d.water.toktogul;
      if (d.rates && d.rates.official && d.rates.official.rows) d.rates.official = d.rates.official.rows;
      if (d.prices && !Array.isArray(d.prices)) {
        var a = [];
        ["food", "fuel", "transport", "rent"].forEach(function (g) {
          (d.prices[g] || []).forEach(function (p) { if (!p.group) p.group = p.id === "hay" ? "farm" : g; a.push(p); });
        });
        d.prices = a;
      }
      if (!d.computed) d.computed = d.updated;
      return d;
    });
  }
  function failBox(el) { if (el) el.innerHTML = '<p class="muted">' + esc(t("loadFail")) + "</p>"; }

  /* ---------- chrome ---------- */
  function navHTML() {
    return SITE.nav.map(function (n) {
      var cur = n[0] === PAGE || (SITE.navAlias[PAGE] === n[0]);
      return '<li><a href="' + n[1] + '"' + (cur ? ' aria-current="page"' : "") + ">" + esc(t("nav_" + n[0])) + "</a></li>";
    }).join("");
  }
  function chrome() {
    var top = $("#top"), bottom = $("#bottom");
    if (top) {
      top.innerHTML =
        '<a class="skip" href="#main">' + esc(t("skip")) + "</a>" +
        '<div class="util"><div class="wrap"><div class="left"><span>' + esc(t("utilGov")) + '</span><span class="clock" id="clock"></span></div>' +
        '<div class="right"><a class="gov-link" href="https://iradgov.org/">iradgov.org</a>' +
        '<div class="langs" role="group" aria-label="' + esc(t("langLabel")) + '">' +
        LANGS.map(function (l) { return '<button type="button" data-lang="' + l + '" aria-pressed="' + (l === LANG) + '" lang="' + I.htmlLang[l] + '">' + esc(I.langs[l]) + "</button>"; }).join("") +
        "</div></div></div></div>" +
        '<div class="mast"><div class="wrap"><a class="home-link" href="/"><img class="emb" src="/assets/state-emblem-160.png" alt="' + esc(t("embAlt")) + '" width="76" height="76">' +
        '<div class="ttl"><div class="k">' + esc(t("mastK")) + '</div><div class="n">' + esc(t("mastN")) + '</div><div class="s">' + esc(t("mastS")) + "</div></div></a>" +
        (SITE.mastBtn ? '<a class="eirad" href="' + SITE.mastBtn + '">' + t("mastBtn") + "</a>" : "") + "</div></div>" +
        '<nav class="nav" aria-label="' + esc(t("navLabel")) + '"><div class="wrap"><button class="burger" type="button" aria-expanded="false"><span class="bars"></span>' + esc(t("menu")) + '</button><ul class="menu">' + navHTML() +
        '</ul></div></nav><div class="orn" aria-hidden="true"></div>';
      $(".burger", top).addEventListener("click", function () {
        var nav = $(".nav", top), open = !nav.classList.contains("open");
        nav.classList.toggle("open", open); this.setAttribute("aria-expanded", open);
      });
      $$("[data-lang]", top).forEach(function (b) { b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); }); });
      tick();
    }
    if (bottom) {
      bottom.innerHTML =
        '<footer class="foot"><div class="wrap"><div class="cols">' +
        '<div><div class="femb"><img src="/assets/state-emblem-160.png" alt="" width="42" height="42"><strong style="color:#fff">' + esc(t("mastN")) + "</strong></div>" +
        '<address class="addrbox" style="font-style:normal">' + t("footAddr") + "</address></div>" +
        "<div><h4>" + esc(t("footSite")) + "</h4><ul>" +
        SITE.nav.map(function (n) { return '<li><a href="' + n[1] + '">' + esc(t("nav_" + n[0])) + "</a></li>"; }).join("") +
        "</ul></div>" +
        "<div><h4>" + esc(t("footGov")) + "</h4><ul>" +
        SITE.links.map(function (l) { return '<li><a href="' + l[1] + '">' + esc(t("link_" + l[0])) + "</a></li>"; }).join("") +
        "</ul></div></div>" +
        '<div class="fine"><span>' + esc(t("footCopy", { y: iradNow().getFullYear() })) + "</span><span>" + esc(t("footTime")) + "</span></div></div></footer>";
    }
  }
  var tickTimer;
  function tick() {
    var el = $("#clock"); if (!el) return;
    var d = iradNow();
    el.textContent = t("clock", { d: fmtDate(iradToday()), t: pad(d.getHours()) + ":" + pad(d.getMinutes()) });
    clearTimeout(tickTimer); tickTimer = setTimeout(tick, 30000);
  }

  /* ---------- static text ---------- */
  function staticText() {
    var P = (I.pages || {})[LANG] || {};
    $$("[data-i18n]").forEach(function (el) {
      if (!el.hasAttribute("data-en")) el.setAttribute("data-en", el.innerHTML);
      var k = el.getAttribute("data-i18n");
      el.innerHTML = LANG === "en" ? el.getAttribute("data-en") : (P[k] != null ? P[k] : el.getAttribute("data-en"));
    });
    var tk = document.body.getAttribute("data-title");
    var dt = (tk && P["title_" + tk] && LANG !== "en" ? P["title_" + tk] : (document.body.getAttribute("data-title-en") || document.title.split(" | ")[0]));
    document.title = dt === t("mastN") ? dt : dt + " | " + t("mastN");
    document.documentElement.lang = I.htmlLang[LANG];
  }
  function setLang(l) {
    LANG = l;
    try { localStorage.setItem(SITE.store, l); } catch (e) {}
    render();
  }

  /* ---------- data-driven parts ---------- */
  function countdowns() {
    $$("[data-countdown]").forEach(function (el) {
      var to = el.getAttribute("data-countdown").split("-"), now = iradNow();
      var days = Math.ceil((Date.UTC(+to[0], +to[1] - 1, +to[2]) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
      el.innerHTML = days > 0 ? '<b class="cd-n">' + days + "</b> " + esc(t("cdDays")) : esc(t("cdToday"));
    });
  }
  function dates() {
    $$("[data-date]").forEach(function (el) { el.textContent = fmtDate(el.getAttribute("data-date")); });
  }
  function notices() {
    var el = $("#notices"); if (!el) return;
    var n = +(el.getAttribute("data-n") || 99);
    getJSON("/data/notices.json").then(function (d) {
      var items = (d.notices || []).slice().sort(sortByDate).slice(0, n);
      el.innerHTML = items.map(function (x) {
        return '<div class="notice"><div class="meta">' + esc(fmtDate(x.date)) + (x.number ? " · " + esc(tri(x.number)) : "") + '</div><div class="t">' + esc(tri(x.title)) + "</div>" +
          (x.text ? "<p>" + tri(x.text) + "</p>" : "") + (x.signed ? '<p class="small muted">' + esc(tri(x.signed)) + "</p>" : "") + "</div>";
      }).join("");
    }).catch(function () { failBox(el); });
  }
  var regFilter = "all", regQuery = "";
  function register() {
    var el = $("#register"); if (!el) return;
    getJSON("/data/cases.json").then(function (d) {
      var cases = (d.cases || []).slice().sort(function (a, b) { return a.filed < b.filed ? 1 : -1; });
      var courts = ["all"].concat(d.courts.map(function (c) { return c.id; }));
      var cname = {}; d.courts.forEach(function (c) { cname[c.id] = tri(c.name); });
      var bar = $("#regFilter");
      if (bar) {
        bar.innerHTML = courts.map(function (c) { return '<button type="button" data-court="' + c + '" aria-pressed="' + (c === regFilter) + '">' + esc(c === "all" ? t("regAll") : cname[c]) + "</button>"; }).join("") +
          '<input type="search" id="regQ" placeholder="' + esc(t("regSearch")) + '" value="' + esc(regQuery) + '">';
        $$("button", bar).forEach(function (b) { b.addEventListener("click", function () { regFilter = b.getAttribute("data-court"); register(); }); });
        $("#regQ").addEventListener("input", function () { regQuery = this.value; draw(); });
      }
      function draw() {
        var q = regQuery.toLowerCase();
        var rows = cases.filter(function (c) {
          if (regFilter !== "all" && c.court !== regFilter) return false;
          if (!q) return true;
          return (c.no + " " + tri(c.title) + " " + tri(c.kind) + " " + tri(c.counsel || "")).toLowerCase().indexOf(q) >= 0;
        });
        el.innerHTML = rows.length ? '<div class="tbl-wrap"><table class="facts reg"><thead><tr><th>' + esc(t("regNo")) + "</th><th>" + esc(t("regCase")) + "</th><th>" + esc(t("regCourt")) + "</th><th>" + esc(t("regFiled")) + "</th><th>" + esc(t("regStatus")) + "</th></tr></thead><tbody>" +
          rows.map(function (c) {
            return '<tr><td class="nw">' + esc(c.no) + "</td><td><b>" + esc(tri(c.title)) + '</b><br><span class="small muted">' + esc(tri(c.kind)) + (c.counsel ? " · " + esc(tri(c.counsel)) : "") + (c.judge ? " · " + esc(tri(c.judge)) : "") + "</span></td><td>" + esc(cname[c.court]) +
              '</td><td class="nw">' + esc(fmtDate(c.filed)) + "</td><td>" + esc(tri(c.status)) + (c.next ? '<br><span class="small">' + esc(t("regNext")) + ": " + esc(fmtDate(c.next)) + "</span>" : "") + "</td></tr>";
          }).join("") + "</tbody></table></div>" : '<p class="muted">' + esc(t("regNone")) + "</p>";
        var upd = $("#regUpd"); if (upd) upd.textContent = t("regUpdated", { d: fmtDate(d.updated) });
      }
      draw();
    }).catch(function () { failBox(el); });
  }

  /* ---------- forms and online services; "In the news" ---------- */
  var SVC = {"home": [[{"en": "Passenger customs declaration", "ir": "Jolovchunun bajı deklaratsiyası", "ru": "Пассажирская таможенная декларация"}, "https://e-irad.org/forms/CS-1.pdf", "CS-1 · PDF"], [{"en": "Application for temporary import of a motor vehicle", "ir": "Unaanı ubaktıluu alıp kirüü arızı", "ru": "Заявление на временный ввоз транспортного средства"}, "https://e-irad.org/forms/CS-14.pdf", "CS-14 · PDF"], [{"en": "Calculate customs duty", "ir": "Bajını eseptöö", "ru": "Рассчитать таможенную пошлину"}, "https://e-irad.org/service.html?id=duty", "e-Irad"], [{"en": "Pay duties and fees online", "ir": "Bajılardı jana alımdardı onlayn tölöö", "ru": "Оплатить пошлины и сборы онлайн"}, "https://pay.e-irad.org/", "pay.e-irad.org"]], "travel": [[{"en": "Passenger customs declaration", "ir": "Jolovchunun bajı deklaratsiyası", "ru": "Пассажирская таможенная декларация"}, "https://e-irad.org/forms/CS-1.pdf", "CS-1 · PDF"], [{"en": "Customs declaration for postal items sent abroad", "ir": "Chet elge jönötülgön pochta jönötmölörü üchün bajı deklaratsiyası", "ru": "Таможенная декларация на международные почтовые отправления"}, "https://post.iradgov.org/forms/P-2.pdf", "P-2 · PDF"], [{"en": "Bring a pet dog or cat from abroad", "ir": "Chet elden it je mıshık alıp kelüü", "ru": "Ввоз собаки или кошки из-за рубежа"}, "https://e-irad.org/procedure.html?id=a-import-pet", {"en": "step by step", "ir": "baskıchma-baskıch", "ru": "пошагово"}], [{"en": "Import spare parts by post", "ir": "Pochta menen tetikter alıp kelüü", "ru": "Ввоз запчастей по почте"}, "https://e-irad.org/procedure.html?id=import-parts", {"en": "step by step", "ir": "baskıchma-baskıch", "ru": "пошагово"}]], "tariff": [[{"en": "Calculate customs duty", "ir": "Bajını eseptöö", "ru": "Рассчитать таможенную пошлину"}, "https://e-irad.org/service.html?id=duty", "e-Irad"], [{"en": "Payment order for state duty", "ir": "Mamlekettik bajı üchün tölöm tapshırması", "ru": "Платёжное поручение на уплату государственной пошлины"}, "https://e-irad.org/forms/BI-0401.pdf", "BI-0401 · PDF"], [{"en": "Pay duties and fees online", "ir": "Bajılardı jana alımdardı onlayn tölöö", "ru": "Оплатить пошлины и сборы онлайн"}, "https://pay.e-irad.org/", "pay.e-irad.org"]], "terminal": [[{"en": "Registration card of a foreign trade participant", "ir": "Tashkı sooda katıshuuchusunun kattoo kartochkası", "ru": "Регистрационная карточка участника внешнеторговой деятельности"}, "https://e-irad.org/forms/FTE-2.pdf", "FTE-2 · PDF"], [{"en": "Application for temporary import of a motor vehicle", "ir": "Unaanı ubaktıluu alıp kirüü arızı", "ru": "Заявление на временный ввоз транспортного средства"}, "https://e-irad.org/forms/CS-14.pdf", "CS-14 · PDF"], [{"en": "Import table eggs", "ir": "Tamak jumurtka alıp kelüü", "ru": "Ввоз пищевых яиц"}, "https://e-irad.org/procedure.html?id=import-eggs", {"en": "step by step", "ir": "baskıchma-baskıch", "ru": "пошагово"}], [{"en": "Carry diesel in transit", "ir": "Dizeldi tranzit menen tashuu", "ru": "Транзит дизельного топлива"}, "https://e-irad.org/procedure.html?id=transit-diesel", {"en": "step by step", "ir": "baskıchma-baskıch", "ru": "пошагово"}], [{"en": "Import a used car", "ir": "Koldonulgan unaa alıp kelüü", "ru": "Ввоз подержанного автомобиля"}, "https://e-irad.org/procedure.html?id=import-cars", {"en": "step by step", "ir": "baskıchma-baskıch", "ru": "пошагово"}], [{"en": "Public tenders", "ir": "Mamlekettik satıp aluular", "ru": "Государственные закупки"}, "https://tender.e-irad.org/", "tender.e-irad.org"]], "crossings": [[{"en": "Passenger customs declaration", "ir": "Jolovchunun bajı deklaratsiyası", "ru": "Пассажирская таможенная декларация"}, "https://e-irad.org/forms/CS-1.pdf", "CS-1 · PDF"], [{"en": "Application for temporary import of a motor vehicle", "ir": "Unaanı ubaktıluu alıp kirüü arızı", "ru": "Заявление на временный ввоз транспортного средства"}, "https://e-irad.org/forms/CS-14.pdf", "CS-14 · PDF"], [{"en": "Application for a Qara-Chik line crossing pass", "ir": "Kara-Chik liniyasınan ötüü ötkörmösünö arız", "ru": "Заявление на пропуск через линию Кара-Чик"}, "https://e-irad.org/forms/RG-9.pdf", "RG-9 · PDF"], [{"en": "Application for passage of dangerous goods through the Otmek tunnel", "ir": "Ötmök tunneli arkıluu kooptuu jük ötkörüü arızı", "ru": "Заявление на проезд с опасным грузом через тоннель Отмёк"}, "https://e-irad.org/forms/HPC-20.pdf", "HPC-20 · PDF"]]};
  var SVC_L = {"svcH": {"en": "Forms and online services", "ir": "Formalar jana onlayn kızmattar", "ru": "Бланки и онлайн-услуги"}, "svcAll": {"en": "All forms on e-Irad", "ir": "e-Iraddagı bardık formalar", "ru": "Все бланки на e-Irad"}, "newsH": {"en": "In the news", "ir": "Jañılıktarda", "ru": "В новостях"}}, NEWS_HOST = "customs.iradgov.org", newsP;
  function linkBoxes() {
    var wrap = $("main .wrap"); if (!wrap) return;
    $$("#svc-box, #news-box").forEach(function (b) { b.parentNode.removeChild(b); });
    var host = $("aside", wrap) || wrap, L = SVC[PAGE];
    if (L && L.length) {
      var box = document.createElement("div");
      box.id = "svc-box"; box.className = "card tone"; box.style.marginTop = "16px";
      box.innerHTML = "<h3>" + esc(tri(SVC_L.svcH)) + '</h3><ul style="margin:0;padding-left:18px">' + L.map(function (x) {
        return '<li style="margin:4px 0"><a href="' + x[1] + '">' + esc(tri(x[0])) + "</a>" + (x[2] ? ' <span class="small muted">' + esc(tri(x[2])) + "</span>" : "") + "</li>";
      }).join("") + '</ul><p class="small" style="margin-bottom:0"><a href="https://e-irad.org/forms.html">' + esc(tri(SVC_L.svcAll)) + "</a></p>";
      host.appendChild(box);
    }
    if (PAGE !== "home") return;
    newsP = newsP || Promise.all(["https://iradone.com/data/sitelinks.json", "https://talasherald.com/data/sitelinks.json"].map(function (u) {
      return fetch(u).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    }));
    newsP.then(function (feeds) {
      var items = [];
      feeds.forEach(function (f) { if (f && f.sites && f.sites[NEWS_HOST]) f.sites[NEWS_HOST].forEach(function (s) { items.push({ title: s.title, url: s.url, date: s.date, outlet: f.outlet }); }); });
      if (!items.length || $("#news-box")) return;
      items.sort(sortByDate);
      var box = document.createElement("div");
      box.id = "news-box"; box.className = "card"; box.style.marginTop = "16px";
      box.innerHTML = "<h3>" + esc(tri(SVC_L.newsH)) + '</h3><ul style="margin:0;padding-left:18px">' + items.slice(0, 5).map(function (s) {
        return '<li style="margin:6px 0"><a href="' + esc(s.url) + '">' + esc(s.title) + '</a><br><span class="small muted">' + esc(s.outlet) + " · " + esc(fmtDate(s.date)) + "</span></li>";
      }).join("") + "</ul>";
      host.appendChild(box);
    });
  }

  function render() {
    chrome();
    staticText();
    dates();
    countdowns();
    notices();
    register();
    if (EXTRA) EXTRA();
    linkBoxes();
  }
  render();
})();

/* holiday, half-mast, pass and power notices shared by the state sites (iradgov.org/assets/irad-bar.js) */
(function () {
  var s = document.createElement("script");
  s.src = "https://iradgov.org/assets/irad-bar.js"; s.defer = true; s.setAttribute("data-kind", "gov");
  document.head.appendChild(s);
})();
