/* What can I bring in? Checker and test, both read /data/bring.json. */
(function (root) {
  "use strict";

  /* ---------- rules engine (no DOM) ---------- */
  var E = {};
  E.routeOf = function (R, id) { for (var i = 0; i < R.routes.length; i++) if (R.routes[i].id === id) return R.routes[i]; return null; };
  E.itemOf = function (R, id) { for (var i = 0; i < R.items.length; i++) if (R.items[i].id === id) return R.items[i]; return null; };
  E.inRoutes = function (R, list, route) {
    return list.some(function (k) { return k === route || (R.groups[k] || []).indexOf(route) >= 0; });
  };
  E.pick = function (R, spec, ctx) {
    var guard = 0;
    while (spec && typeof spec === "object" && guard++ < 10) {
      if (spec.$route) {
        var m = spec.$route, keys = [ctx.route], v;
        Object.keys(R.groups).forEach(function (g) { if (R.groups[g].indexOf(ctx.route) >= 0) keys.push(g); });
        keys.push("*");
        for (var i = 0; i < keys.length; i++) if (m[keys[i]] !== undefined) { v = m[keys[i]]; break; }
        spec = v;
      } else if (spec.$stay) spec = spec.$stay[ctx.stay];
      else if (spec.$period) spec = spec.$period[ctx.period];
      else break;
    }
    return spec;
  };
  E.period = function (R, date) {
    var p = R.periods[0].id;
    R.periods.forEach(function (x) { if (date >= x.from) p = x.id; });
    return p;
  };
  E.inSeason = function (R, name, date) {
    var s = R.seasons[name], md = date.slice(5);
    return md >= s.from && md <= s.to;
  };
  E.pooled = function (R, item, clause, ctx) {
    var pool = clause.pool != null ? clause.pool : item.pool !== false;
    var route = E.routeOf(R, ctx.route);
    return !!(pool && ctx.same && route && route.vehicle && ctx.adults + ctx.children > 1);
  };
  E.persons = function (R, item, clause, ctx) {
    var mode = clause.count || item.count || "full";
    if (mode === "total" || !E.pooled(R, item, clause, ctx)) return 1;
    if (mode === "adult") return ctx.adults;
    if (mode === "half") return ctx.adults + ctx.children / 2;
    return ctx.adults + ctx.children;
  };
  E.answers = function (item, ans) {
    var a = {};
    (item.asks || []).forEach(function (q) { a[q.id] = ans && ans[q.id] != null ? !!ans[q.id] : !!q.def; });
    return a;
  };
  E.matches = function (R, item, c, ctx, qty, ans) {
    var w = c.when || {};
    if (w.route && !E.inRoutes(R, w.route, ctx.route)) return false;
    if (w.stay && w.stay !== ctx.stay) return false;
    if (w.period && w.period !== ctx.period) return false;
    if (w.season) for (var s in w.season) if (E.inSeason(R, s, ctx.date) !== w.season[s]) return false;
    if (w.ask) for (var k in w.ask) if (ans[k] !== w.ask[k]) return false;
    if (w.over != null) {
      var thr = E.pick(R, w.over, ctx) * E.persons(R, item, c, ctx);
      if (!(qty > thr + 1e-9)) return false;
    }
    return true;
  };
  /* one item: the first clause that matches decides */
  E.item = function (R, ctx, id, qty, ans, rate) {
    var item = E.itemOf(R, id); if (!item) return null;
    var a = E.answers(item, ans), c = null;
    for (var i = 0; i < item.clauses.length; i++) if (E.matches(R, item, item.clauses[i], ctx, qty, a)) { c = item.clauses[i]; break; }
    if (!c) c = { out: "ok", ref: "" };
    var O = R.outcomes[c.out], persons = E.persons(R, item, c, ctx), duty = 0, free = null;
    if (c.duty) {
      var f = c.free != null ? c.free : (c.when || {}).over;
      free = (f != null ? E.pick(R, f, ctx) : 0) * persons;
      var excess = Math.max(0, qty - free), d = c.duty;
      if (d.som != null) duty = E.pick(R, d.som, ctx) * excess;
      else if (d.usd != null) duty = E.pick(R, d.usd, ctx) * excess * rate;
      else if (d.pct != null) duty = E.pick(R, d.pct, ctx) / 100 * excess * rate;
      duty = Math.ceil(duty - 1e-9);
    }
    var poster = item.poster && E.inRoutes(R, item.poster.route, ctx.route) ? item.poster.note : null;
    return {
      id: id, item: item, qty: qty, ans: a, out: c.out, rank: O.rank, duty: duty, free: free, persons: persons,
      pooled: E.pooled(R, item, c, ctx), ref: c.ref, note: c.note || null, poster: poster,
      form: c.form || O.form || null, window: c.window != null ? c.window : O.window
    };
  };
  /* the whole bag */
  E.check = function (R, ctx, lines, rate) {
    var res = lines.map(function (l) { return E.item(R, ctx, l.id, l.qty, l.ans, rate); }).filter(Boolean);
    var worst = "ok", duty = 0, forms = [], wins = [], minutes = 0, seen = {};
    res.forEach(function (r) {
      if (r.rank > R.outcomes[worst].rank) worst = r.out;
      duty += r.duty;
      if (r.form && forms.indexOf(r.form) < 0) forms.push(r.form);
      if (r.window && wins.indexOf(r.window) < 0) wins.push(r.window);
      if (r.out === "duty" && wins.indexOf(1) < 0) wins.push(1);
      if (!seen[r.out]) { minutes += R.outcomes[r.out].minutes; seen[r.out] = 1; }
    });
    if (duty > 0 && forms.indexOf("CS-1") < 0) forms.unshift("CS-1");
    var fee = duty > 0 ? E.pick(R, R.fee.som, ctx) : 0;
    wins.sort(function (x, y) { return R.window_order.indexOf(x) - R.window_order.indexOf(y); });
    return { lines: res, worst: worst, duty: duty, fee: fee, total: duty + fee, forms: forms, windows: wins, minutes: minutes };
  };

  /* ---------- the test: ten scenarios from the same rules ---------- */
  E.rng = function (seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
  E.scenarios = function (R, date, n, rnd) {
    var pool = R.items.filter(function (i) { return i.quiz && i.quiz.length; }).slice(), out = [];
    var routes = R.routes.map(function (r) { return r.id; });
    while (out.length < n && pool.length) {
      var it = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
      var route = routes[Math.floor(rnd() * routes.length)], rt = E.routeOf(R, route);
      var x = rnd(), party = route === "rail" || x < 0.55 ? "alone" : "family";
      var ctx = { route: route, date: date, period: E.period(R, date), stay: rnd() < 0.5 ? "short" : "long",
                  adults: party === "alone" ? 1 : 2, children: party === "alone" ? 0 : 2, same: party === "family" && rt.vehicle };
      var ans = {};
      (it.asks || []).forEach(function (q) { ans[q.id] = rnd() < 0.5; });
      out.push({ id: it.id, qty: it.quiz[Math.floor(rnd() * it.quiz.length)], ans: ans, ctx: ctx, party: party });
    }
    return out;
  };

  if (typeof module !== "undefined" && module.exports) { module.exports = E; return; }
  root.BRING = E;

  /* ---------- page ---------- */
  var box = document.getElementById("bring");
  if (!box) return;
  var R = null, RATE = null, RATE_LIVE = false, TODAY = iradToday();
  var state = { route: "kz", date: TODAY, stay: "long", adults: 1, children: 0, same: false, lines: [{ id: "cigarettes", qty: 200, ans: {} }, { id: "honey", qty: 2, ans: {} }, { id: "phone", qty: 2, ans: {} }], tab: "check" };
  var quiz = null;

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function iradToday() { var n = new Date(), d = new Date(n.getTime() + n.getTimezoneOffset() * 60000 + 6 * 3600000); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function lang() {
    var q = (location.search.match(/[?&]lang=(en|ir|ru)\b/) || [])[1]; if (q) return q;
    var h = document.documentElement.lang, I = window.SITE_I18N;
    if (I && I.htmlLang) for (var k in I.htmlLang) if (I.htmlLang[k] === h) return k;
    try { var s = localStorage.getItem("cu_lang"); if (s === "ir" || s === "ru") return s; } catch (e) {}
    return "en";
  }
  var L = lang();
  function tr(o) { return o == null ? "" : typeof o === "string" ? o : (o[L] || o.en || ""); }
  function u(k, v) { var s = tr(R.ui[k]); return v ? s.replace(/\{(\w+)\}/g, function (m, x) { return v[x] != null ? v[x] : m; }) : s; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function num(x, dp) {
    var s = (+x).toFixed(dp || 0), p = s.split("."), g = L === "en" ? "," : " ";
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, g);
    return p.join(L === "en" ? "." : ",");
  }
  function qtyTxt(q) { return num(q, q % 1 ? (q * 10 % 1 ? 2 : 1) : 0); }
  function fmtDate(s) {
    var m = s.split("-"), M = tr(R.ui.months).split(",");
    return L === "en" ? (+m[2]) + " " + M[+m[1] - 1] + " " + m[0] : (+m[2]) + " " + M[+m[1] - 1] + " " + m[0];
  }
  function mins(m) {
    var h = Math.floor(m / 60), r = m % 60;
    return h ? (r ? u("hm", { h: h, m: r }) : u("h", { h: h })) : u("m", { m: r });
  }
  function orderTxt(ref) {
    if (!ref) return "";
    var p = ref.split(" "), o = R.orders[p[0]];
    if (!o) return ref;
    var no = p[0].split("/")[0];
    return u("orderRef", { n: no, y: p[0].split("/")[1], p: p[1] ? " " + p[1] : "" });
  }
  function orderTitle(ref) { var o = ref && R.orders[ref.split(" ")[0]]; return o ? tr(o.title) + " (" + fmtDate(o.date) + ")" : ""; }
  function tag(out) {
    var cls = { ok: "st ok", declare: "tag blue", duty: "tag gold", permit: "tag", refer: "tag grey", forbidden: "tag" }[out];
    return '<span class="b-v b-' + out + " " + cls + '">' + esc(tr(R.outcomes[out].label)) + "</span>";
  }
  function formHTML(id) {
    var f = R.forms[id]; if (!f) return esc(id);
    var label = (/^[A-Z]+-\d|^\d-VET$|^PQ-/.test(id) ? id + " · " : "") + tr(f.name);
    return f.url ? '<a href="' + esc(f.url) + '">' + esc(label) + "</a>" : esc(label);
  }
  function ctx() {
    return { route: state.route, date: state.date, period: E.period(R, state.date), stay: state.stay,
             adults: Math.max(1, state.adults | 0), children: Math.max(0, state.children | 0), same: !!state.same };
  }

  /* ---------- checker ---------- */
  function drawCheck() {
    var c = ctx(), rt = E.routeOf(R, c.route);
    var opts = R.groups_items.map(function (g) {
      return '<optgroup label="' + esc(tr(g[1])) + '">' + R.items.filter(function (i) { return i.group === g[0]; }).map(function (i) {
        return '<option value="' + i.id + '">' + esc(tr(i.name)) + "</option>";
      }).join("") + "</optgroup>";
    }).join("");
    var per = R.periods.filter(function (p) { return p.id === c.period; })[0];
    var h = '<form class="b-form" autocomplete="off">' +
      '<label for="bRoute">' + esc(u("route")) + '</label><select id="bRoute">' + R.routes.map(function (r) {
        return '<option value="' + r.id + '"' + (r.id === c.route ? " selected" : "") + ">" + esc(tr(r.name)) + "</option>";
      }).join("") + "</select>" +
      '<div class="row2"><div><label for="bDate">' + esc(u("date")) + '</label><input id="bDate" type="date" min="' + TODAY + '" value="' + esc(state.date) + '"></div>' +
      '<div><label for="bStay">' + esc(u("stay")) + '</label><select id="bStay"><option value="long"' + (c.stay === "long" ? " selected" : "") + ">" + esc(tr(R.stays.long)) + '</option><option value="short"' + (c.stay === "short" ? " selected" : "") + ">" + esc(tr(R.stays.short)) + "</option></select></div></div>" +
      '<p class="small muted b-per">' + esc(u("rulesOf", { p: tr(per.label) })) + (state.date >= R.unpublished_from ? " " + esc(tr(R.notes.unpublished)) : "") + "</p>" +
      '<div class="row2"><div><label for="bAd">' + esc(u("adults")) + '</label><input id="bAd" type="number" min="1" max="9" value="' + c.adults + '"></div>' +
      '<div><label for="bCh">' + esc(u("children")) + '</label><input id="bCh" type="number" min="0" max="9" value="' + c.children + '"></div></div>' +
      '<label class="b-chk"><input id="bSame" type="checkbox"' + (state.same ? " checked" : "") + (rt.vehicle ? "" : " disabled") + "> " + esc(u("same")) + "</label>" +
      (rt.vehicle ? "" : '<p class="small muted">' + esc(u("noVehicle")) + "</p>") +
      '<h3 class="b-h">' + esc(u("bag")) + "</h3>" +
      '<div class="b-lines">' + state.lines.map(function (l, i) {
        var it = E.itemOf(R, l.id), a = E.answers(it, l.ans);
        return '<div class="b-line" data-i="' + i + '"><div class="b-ln"><b>' + esc(tr(it.name)) + '</b> <button type="button" class="b-x" data-del="' + i + '" aria-label="' + esc(u("remove")) + '">×</button></div>' +
          '<label class="b-q">' + esc(u("qty")) + ' <input type="number" min="0" step="any" data-q="' + i + '" value="' + l.qty + '"> ' + esc(tr(R.units[it.unit])) + "</label>" +
          (it.asks || []).map(function (q) { return '<label class="b-chk small"><input type="checkbox" data-a="' + i + '" data-k="' + q.id + '"' + (a[q.id] ? " checked" : "") + "> " + esc(tr(q.q)) + "</label>"; }).join("") +
          "</div>";
      }).join("") + "</div>" +
      '<div class="row2 b-add"><div><label for="bItem">' + esc(u("addItem")) + '</label><select id="bItem">' + opts + '</select></div><div class="b-addb"><button type="button" id="bAdd">' + esc(u("add")) + "</button></div></div>" +
      '<div class="out" id="bOut" aria-live="polite"></div></form>';
    box.querySelector(".b-body").innerHTML = h;
    bindCheck();
    drawResult();
  }
  function bindCheck() {
    var f = box.querySelector(".b-form");
    f.addEventListener("submit", function (e) { e.preventDefault(); });
    f.querySelector("#bRoute").addEventListener("change", function () { state.route = this.value; drawCheck(); });
    f.querySelector("#bDate").addEventListener("change", function () { if (/^\d{4}-\d\d-\d\d$/.test(this.value)) { state.date = this.value < TODAY ? TODAY : this.value; drawCheck(); } });
    f.querySelector("#bStay").addEventListener("change", function () { state.stay = this.value; drawResult(); });
    f.querySelector("#bAd").addEventListener("input", function () { state.adults = Math.min(9, Math.max(1, parseInt(this.value, 10) || 1)); drawResult(); });
    f.querySelector("#bCh").addEventListener("input", function () { state.children = Math.min(9, Math.max(0, parseInt(this.value, 10) || 0)); drawResult(); });
    f.querySelector("#bSame").addEventListener("change", function () { state.same = this.checked; drawResult(); });
    f.querySelector("#bAdd").addEventListener("click", function () {
      var id = f.querySelector("#bItem").value, it = E.itemOf(R, id);
      state.lines.push({ id: id, qty: it.qty, ans: {} }); drawCheck();
    });
    Array.prototype.forEach.call(f.querySelectorAll("[data-del]"), function (b) { b.addEventListener("click", function () { state.lines.splice(+b.getAttribute("data-del"), 1); drawCheck(); }); });
    Array.prototype.forEach.call(f.querySelectorAll("[data-q]"), function (x) { x.addEventListener("input", function () { var v = parseFloat(this.value); state.lines[+x.getAttribute("data-q")].qty = v > 0 ? v : 0; drawResult(); }); });
    Array.prototype.forEach.call(f.querySelectorAll("[data-a]"), function (x) { x.addEventListener("change", function () { var l = state.lines[+x.getAttribute("data-a")]; l.ans = l.ans || {}; l.ans[x.getAttribute("data-k")] = this.checked; drawResult(); }); });
  }
  function drawResult() {
    var o = box.querySelector("#bOut"); if (!o) return;
    var c = ctx(), lines = state.lines.filter(function (l) { return l.qty > 0; });
    if (!lines.length) { o.innerHTML = '<p class="muted">' + esc(u("empty")) + "</p>"; return; }
    var r = E.check(R, c, lines, RATE), other = null, rt = E.routeOf(R, c.route);
    if (c.period !== R.periods[R.periods.length - 1].id) {
      var c2 = {}; for (var k in c) c2[k] = c[k];
      c2.period = R.periods[R.periods.length - 1].id;
      other = E.check(R, c2, lines, RATE);
    }
    var h = '<div class="b-sum b-sum-' + r.worst + '"><div class="small muted">' + esc(u("verdict")) + "</div>" + tag(r.worst) +
      (r.total ? ' <b class="b-tot">' + esc(u("pay", { s: num(r.total) })) + "</b>" : "") + "</div>";
    h += '<div class="tbl-wrap"><table class="facts b-tbl"><thead><tr><th>' + esc(u("thItem")) + "</th><th>" + esc(u("thVerdict")) + '</th><th class="num">' + esc(u("thDuty")) + "</th><th>" + esc(u("thWin")) + "</th></tr></thead><tbody>";
    r.lines.forEach(function (x, i) {
      var later = other && other.lines[i], diff = later && (later.out !== x.out || later.duty !== x.duty);
      h += "<tr><td><b>" + esc(tr(x.item.name)) + '</b><br><span class="small">' + esc(qtyTxt(x.qty) + " " + tr(R.units[x.item.unit])) + "</span></td>" +
        "<td>" + tag(x.out) + '</td><td class="num">' + (x.duty ? esc(num(x.duty)) : "–") + "</td><td>" + (x.window ? esc(x.window) : "–") + "</td></tr>" +
        '<tr class="b-sub"><td colspan="4"><span class="small">' + esc(tr(x.note)) +
        (x.form ? " " + esc(u("form")) + ": " + formHTML(x.form) + "." : "") +
        ' <span class="muted" title="' + esc(orderTitle(x.ref)) + '">' + esc(orderTxt(x.ref)) + "</span>" +
        (x.poster ? '<br><span class="b-poster">' + esc(tr(x.poster)) + "</span>" : "") +
        (diff ? '<br><span class="b-later">' + esc(u("later", { p: tr(R.periods[R.periods.length - 1].label) })) + " " + esc(tr(R.outcomes[later.out].label)) + (later.duty ? ", " + esc(u("som", { s: num(later.duty) })) : "") + ". " + '<span class="muted">' + esc(orderTxt(R.periods[R.periods.length - 1].ref)) + "</span></span>" : "") +
        "</span></td></tr>";
    });
    h += "</tbody></table></div>";
    if (r.duty) h += '<table class="b-money"><tbody><tr><td>' + esc(u("dutyTot")) + '</td><td class="num">' + esc(u("som", { s: num(r.duty) })) + "</td></tr><tr><td>" + esc(tr(R.fee.label)) + ' <span class="small muted">' + esc(orderTxt(R.fee.ref)) + '</span></td><td class="num">' + esc(u("som", { s: num(r.fee) })) + '</td></tr><tr class="tot"><td>' + esc(u("payTot")) + '</td><td class="num">' + esc(u("som", { s: num(r.total) })) + "</td></tr></tbody></table>";
    h += '<p class="small muted">' + esc(RATE_LIVE ? u("rateLive", { s: num(RATE, 2) }) : u("rateOff", { s: num(RATE, 2) })) + " " + esc(tr(R.notes.rate)) + "</p>";
    if (r.forms.length) h += "<h4>" + esc(u("forms")) + "</h4><ul>" + r.forms.map(function (f) { return "<li>" + formHTML(f) + "</li>"; }).join("") + "</ul>";
    if (r.windows.length) {
      h += "<h4>" + esc(u("windows")) + "</h4><ol>" + r.windows.map(function (w) { return "<li>" + esc(tr(R.windows[String(w)])) + "</li>"; }).join("") + "</ol>" +
        '<p class="small">' + esc(tr(rt.windows)) + " " + (r.windows.indexOf(4) >= 0 && r.windows.indexOf(3) >= 0 ? esc(tr(R.window_order_note)) : "") + "</p>" +
        '<p class="small">' + esc(u("time", { t: mins(r.minutes) })) + "</p>";
    } else h += '<p class="small">' + esc(u("green")) + "</p>";
    var pooled = r.lines.some(function (x) { return x.pooled; });
    h += '<div class="b-notes small">' +
      (c.adults + c.children > 1 ? "<p>" + esc(pooled ? u("pooledYes") : u("pooledNo")) + " " + esc(tr(R.notes.pool)) + "</p>" : "") +
      (c.children ? "<p>" + esc(tr(R.notes.child)) + "</p>" : "") +
      "<p>" + esc(tr(R.notes.split)) + "</p><p><b>" + esc(tr(R.notes.hotline)) + "</b></p></div>";
    o.innerHTML = h;
  }

  /* ---------- test ---------- */
  function newQuiz() {
    var seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
    quiz = { seed: seed, list: E.scenarios(R, TODAY, 10, E.rng(seed)), i: 0, score: 0, lost: 0, worstPlace: null, worstMin: -1, picked: null };
  }
  function scenarioText(s) {
    var it = E.itemOf(R, s.id), rt = E.routeOf(R, s.ctx.route);
    var party = s.party === "alone" ? u("qAlone") : rt.vehicle ? u("qFamilyCar") : u("qFamily");
    var asks = (it.asks || []).map(function (q) { return tr(s.ans[q.id] ? q.yes : q.no); }).join(" ");
    return tr(rt.q) + ", " + u(s.ctx.stay === "short" ? "qShort" : "qLong") + ". " + party + " " +
      u("qBag", { q: qtyTxt(s.qty) + " " + tr(R.units[it.unit]), n: tr(it.name) }) + (asks ? " " + asks : "");
  }
  function drawQuiz() {
    var b = box.querySelector(".b-body");
    if (!quiz) newQuiz();
    if (quiz.i >= quiz.list.length) return drawCert(b);
    var s = quiz.list[quiz.i], res = E.item(R, s.ctx, s.id, s.qty, s.ans, RATE);
    var h = '<div class="b-quiz"><p class="small muted">' + esc(u("qOf", { i: quiz.i + 1, n: quiz.list.length, s: quiz.score })) + "</p>" +
      '<p class="b-scn">' + esc(scenarioText(s)) + "</p><p><b>" + esc(u("qAsk")) + '</b></p><div class="b-opts">' +
      ["ok", "declare", "duty", "permit", "forbidden"].map(function (k) {
        var cls = quiz.picked == null ? "" : (k === res.out ? " right" : k === quiz.picked ? " wrong" : "");
        return '<button type="button" data-o="' + k + '" class="b-opt' + cls + '"' + (quiz.picked == null ? "" : " disabled") + ">" + esc(tr(R.outcomes[k].label)) + "</button>";
      }).join("") + "</div>";
    if (quiz.picked != null) {
      var ok = quiz.picked === res.out;
      h += '<div class="b-fb ' + (ok ? "ok" : "no") + '"><p><b>' + esc(ok ? u("qRight") : res.out === "refer" ? u("qNobody") : u("qWrong")) + "</b> " + tag(res.out) +
        (res.duty ? " " + esc(u("som", { s: num(res.duty) })) : "") + "</p><p class=\"small\">" + esc(tr(res.note)) + (res.form ? " " + esc(u("form")) + ": " + formHTML(res.form) + "." : "") +
        ' <span class="muted">' + esc(orderTxt(res.ref)) + "</span>" + (res.poster ? '<br><span class="b-poster">' + esc(tr(res.poster)) + "</span>" : "") + "</p>" +
        '<button type="button" id="bNext">' + esc(quiz.i + 1 < quiz.list.length ? u("qNext") : u("qDone")) + "</button></div>";
    }
    b.innerHTML = h + "</div>";
    Array.prototype.forEach.call(b.querySelectorAll("[data-o]"), function (x) {
      x.addEventListener("click", function () {
        quiz.picked = x.getAttribute("data-o");
        if (quiz.picked === res.out) quiz.score++;
        else {
          var m = Math.max(R.outcomes[res.out].minutes, 15) + 20;
          quiz.lost += m;
          if (m > quiz.worstMin) { quiz.worstMin = m; quiz.worstPlace = s.ctx.route; }
        }
        drawQuiz();
      });
    });
    var nx = b.querySelector("#bNext");
    if (nx) nx.addEventListener("click", function () { quiz.i++; quiz.picked = null; drawQuiz(); });
  }
  function drawCert(b) {
    var sc = quiz.score, n = quiz.list.length;
    var grade = sc === n ? "g4" : sc >= 7 ? "g3" : sc >= 4 ? "g2" : "g1";
    var no = "CS-T/" + TODAY.replace(/-/g, "") + "/" + ("000" + (quiz.seed % 10000)).slice(-4);
    var rt = quiz.worstPlace && E.routeOf(R, quiz.worstPlace);
    b.innerHTML = '<div class="b-cert"><div class="b-c-h">' + esc(u("cHead")) + '</div><div class="b-c-t">' + esc(u("cTitle")) + '</div><div class="small">№ ' + esc(no) + "</div>" +
      "<p>" + esc(u("cScore", { s: sc, n: n })) + "</p><p class=\"b-c-g\">" + esc(u(grade)) + "</p>" +
      "<p>" + esc(rt ? u("cSpent", { t: mins(quiz.lost), p: tr(rt.place) }) : u("cGreen")) + "</p>" +
      '<p class="small muted">' + esc(u("cSign", { d: fmtDate(TODAY) })) + '</p><p class="small muted">' + esc(u("cNote")) + "</p></div>" +
      '<p class="b-c-b"><button type="button" id="bAgain">' + esc(u("qAgain")) + '</button> <button type="button" id="bPrint">' + esc(u("print")) + "</button></p>";
    b.querySelector("#bAgain").addEventListener("click", function () { quiz = null; drawQuiz(); });
    b.querySelector("#bPrint").addEventListener("click", function () { window.print(); });
  }

  /* ---------- frame ---------- */
  function draw() {
    L = lang();
    box.innerHTML = '<div class="b-tabs" role="tablist">' +
      '<button type="button" role="tab" data-t="check" aria-selected="' + (state.tab === "check") + '">' + esc(u("tabCheck")) + "</button>" +
      '<button type="button" role="tab" data-t="quiz" aria-selected="' + (state.tab === "quiz") + '">' + esc(u("tabQuiz")) + "</button></div>" +
      '<div class="b-body"></div>';
    Array.prototype.forEach.call(box.querySelectorAll("[data-t]"), function (x) {
      x.addEventListener("click", function () { state.tab = x.getAttribute("data-t"); try { history.replaceState(null, "", state.tab === "quiz" ? "#test" : "#check"); } catch (e) {} draw(); });
    });
    if (state.tab === "quiz") drawQuiz(); else drawCheck();
  }
  if (location.hash === "#test") state.tab = "quiz";
  box.innerHTML = '<p class="muted">…</p>';
  fetch("/data/bring.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
    R = d; RATE = d.rate_fallback;
    draw();
    new MutationObserver(function () { if (lang() !== L) draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    return fetch("https://iradgov.org/data/today.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (t) {
      var usd = t && t.rates && t.rates.official && t.rates.official.filter(function (x) { return x.code === "USD"; })[0];
      if (usd && usd.som > 0) { RATE = usd.som / (usd.units || 1); RATE_LIVE = true; if (state.tab === "check") drawResult(); }
    }).catch(function () {});
  }).catch(function () { box.innerHTML = '<p class="muted">The checker could not be loaded. Please try again later.</p>'; });
})(this);
