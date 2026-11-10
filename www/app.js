(function () {
  "use strict";

  const PASSING = 80;          // CSC passing rate for the Professional level
  const MOCK_SIZE = 30;
  const ROUND_SIZE = 10;       // questions per subject round
  const COOLDOWN_DAYS = 30;    // an answered question won't come back for this long
  const DAY = 86400000;
  const LETTERS = "ABCDEFGH";
  const app = document.getElementById("app");
  const backBtn = document.getElementById("backBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const tabbar = document.getElementById("tabbar");
  const I = window.I18N;
  const t = (k, v) => I.t(k, v);
  const sn = s => I.subj(s);   // translated subject name/desc/tips

  // ---------- storage (safe: may be unavailable in some web views) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  };
  let profile = store.get("cscoach.profile", null);           // { name, instant, examDate, pet, lang }
  let best = store.get("cscoach.best", {});                    // { key: pct }
  let starred = new Set(store.get("cscoach.starred", []));     // question ids
  let stats = store.get("cscoach.stats", {});                  // { qid: { n, c, last } }
  let history = store.get("cscoach.history", []);              // past sessions
  let lessonsRead = new Set(store.get("cscoach.lessonsRead", []));
  const saveStars = () => store.set("cscoach.starred", [...starred]);
  const pet = () => window.Pet || { cheer() {}, cry() {}, say() {}, hop() {}, setVisible() {} };
  if (profile && profile.lang) I.setLang(profile.lang);

  // ---------- helpers ----------
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // Give every question a stable id and subject reference
  const byId = new Map();
  SUBJECTS.forEach(s => s.questions.forEach((q, i) => { q.id = s.id + "-" + i; q.sid = s.id; byId.set(q.id, q); }));
  const allQuestions = () => SUBJECTS.flatMap(s => s.questions);
  const subjectOf = q => SUBJECTS.find(s => s.id === q.sid);
  const LESSONS = window.LESSONS || {};
  const lessonById = new Map();
  SUBJECTS.forEach(s => (LESSONS[s.id] || []).forEach(l => {
    l.sid = s.id; lessonById.set(l.id, l);
    l.qs.forEach(i => { const q = byId.get(s.id + "-" + i); if (q) q.lid = l.id; });
  }));
  const lessonQs = (sid, l) => SUBJECTS.find(x => x.id === sid).questions.filter(q => q.lid === l.id);
  const impOf = q => (q.lid && lessonById.get(q.lid) ? lessonById.get(q.lid).imp : 2);
  const impLabel = imp => t(imp >= 3 ? "impHigh" : imp === 2 ? "impMid" : "impLow");

  // AI-generated questions are saved on the device and join the bank
  let aiBank = store.get("cscoach.aiq", []);
  function addToBank(q) {
    const s = SUBJECTS.find(x => x.id === q.sid);
    if (!s || byId.has(q.id)) return;
    s.questions.push(q); byId.set(q.id, q);
  }
  aiBank.forEach(addToBank);

  // Rotation: a question you answered won't come back for COOLDOWN_DAYS.
  // Fresh questions are ordered: never seen first (high-yield topics first),
  // then old mistakes, then the rest. If there aren't enough fresh ones,
  // the ones seen longest ago fill the round.
  const isFresh = q => { const st = stats[q.id]; return !st || !st.t || Date.now() - st.t >= COOLDOWN_DAYS * DAY; };
  let lastRecycled = 0;
  function smartPick(qs, n) {
    const rank = q => {
      const st = stats[q.id], imp = impOf(q) * 0.15;
      if (!st) return Math.random() - imp;
      if (!st.last) return 1 + Math.random() - imp;
      return 2 + st.c / st.n + Math.random() * 0.5 - imp;
    };
    const fresh = qs.filter(isFresh).map(q => [rank(q), q]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    const picked = fresh.slice(0, n);
    lastRecycled = 0;
    if (picked.length < n) {
      const old = qs.filter(q => !isFresh(q)).sort((a, b) => (stats[a.id].t || 0) - (stats[b.id].t || 0));
      const fill = old.slice(0, n - picked.length);
      lastRecycled = fill.length;
      picked.push(...fill);
    }
    return picked;
  }
  const freshCount = qs => qs.filter(isFresh).length;

  // Mistakes (last attempt wrong) + starred, compiled into one review set
  const mistakeIds = () => Object.keys(stats).filter(id => stats[id].last === 0 && byId.has(id));
  function reviewQs() {
    const ids = new Set([...mistakeIds(), ...starred]);
    return [...ids].map(id => byId.get(id)).filter(Boolean);
  }

  // Shuffle the choice order while tracking the correct answer
  function prepare(q) {
    const order = shuffle(q.c.map((_, i) => i));
    return { ...q, c: order.map(i => q.c[i]), a: order.indexOf(q.a) };
  }

  function accOf(qs) {
    let n = 0, c = 0, seen = 0;
    qs.forEach(q => { const st = stats[q.id]; if (st) { seen++; n += st.n; c += st.c; } });
    return { n, c, seen, acc: n ? Math.round(c / n * 100) : null };
  }

  const goal = () => (profile && +profile.dailyGoal) || 20;
  const dayKey = ts => new Date(ts).toDateString();
  function answeredOn(key) { return history.filter(h => dayKey(h.t) === key).reduce((n, h) => n + (h.answered != null ? h.answered : h.total), 0); }

  // Analytics used by the Analytics tab and the AI coach
  function analytics() {
    const subjects = SUBJECTS.map(s => {
      let seen = 0, attempts = 0, correct = 0, wrongNow = 0;
      s.questions.forEach(q => { const st = stats[q.id]; if (st) { seen++; attempts += st.n; correct += st.c; if (!st.last) wrongNow++; } });
      return { id: s.id, name: sn(s).name, total: s.questions.length, seen, attempts, correct, wrongNow, acc: attempts ? Math.round(correct / attempts * 100) : null };
    });
    const topics = [];
    SUBJECTS.forEach(s => (LESSONS[s.id] || []).forEach(l => { const a = accOf(lessonQs(s.id, l)); topics.push({ sid: s.id, id: l.id, title: l.title, importance: l.imp, attempts: a.n, acc: a.acc }); }));
    const attempts = subjects.reduce((a, x) => a + x.attempts, 0), correct = subjects.reduce((a, x) => a + x.correct, 0);
    const days = [...new Set(history.map(h => new Date(h.t).toDateString()))];
    let streak = 0; const d = new Date();
    if (!days.includes(d.toDateString())) d.setDate(d.getDate() - 1);
    while (days.includes(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
    const examDate = profile && profile.examDate ? profile.examDate : null;
    const daysLeft = examDate ? Math.ceil((new Date(examDate + "T08:00:00") - new Date()) / 86400000) : null;
    return {
      name: profile && profile.name || "", mode: profile && profile.instant ? "practice" : "exam", language: I.names[I.lang],
      overall: { attempts, correct, acc: attempts ? Math.round(correct / attempts * 100) : null },
      subjects, weakTopics: topics.filter(x => x.attempts >= 2).sort((a, b) => (a.acc - b.acc) || (b.importance - a.importance)).slice(0, 5),
      mistakes: mistakeIds().length, aiQuestions: aiBank.length, dailyGoal: goal(),
      answeredToday: answeredOn(new Date().toDateString()),
      sessions: history.length, recent: history.slice(-5).map(h => ({ title: h.title, pct: h.pct, date: new Date(h.t).toLocaleDateString() })),
      lessonsRead: lessonsRead.size, daysActive: days.length, streak, examDate, daysLeft, starred: starred.size, passing: PASSING
    };
  }

  function recordSession(S) {
    S.items.forEach((q, i) => {
      const ans = S.answers[i]; if (ans === null) return;
      const ok = ans === q.a ? 1 : 0;
      const st = stats[q.id] || (stats[q.id] = { n: 0, c: 0, last: 0 });
      st.n++; st.c += ok; st.last = ok; st.t = Date.now();
    });
    const correct = S.items.filter((q, i) => S.answers[i] === q.a).length;
    const answered = S.answers.filter(a => a !== null).length;
    history.push({ t: Date.now(), key: S.key, title: S.title, total: S.items.length, answered, correct, pct: Math.round(correct / S.items.length * 100) });
    history = history.slice(-100);
    store.set("cscoach.stats", stats); store.set("cscoach.history", history);
  }

  // ---------- navigation ----------
  let onBack = null;
  let tab = "learn";
  function setBack(fn) { onBack = fn; backBtn.classList.toggle("hidden", !fn); }
  backBtn.addEventListener("click", () => onBack && onBack());
  settingsBtn.addEventListener("click", () => {
    if (session && !session.done) return confirmBox(t("leaveForSettings"), t("leave"), () => { session = null; renderSettings(false); });
    renderSettings(false);
  });
  function showTabbar(on) {
    tabbar.classList.toggle("hidden", !on);
    document.body.classList.toggle("has-tabbar", on);
  }
  function paintTabbar() {
    tabbar.querySelectorAll("[data-tab]").forEach(b => {
      b.classList.toggle("active", b.dataset.tab === tab);
      b.querySelector(".tab-label").textContent = t({ learn: "tabLearn", practice: "tabPractice", calendar: "tabCalendar", analytics: "tabAnalytics" }[b.dataset.tab]);
    });
  }
  tabbar.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => openTab(b.dataset.tab)));
  function openTab(name) {
    tab = name || tab;
    session = null;
    paintTabbar(); showTabbar(true);
    settingsBtn.classList.remove("hidden");
    if (tab === "learn") renderLearn();
    else if (tab === "analytics") renderAnalytics();
    else if (tab === "calendar") renderCalendar();
    else renderPractice();
  }
  const goHome = () => openTab();

  // ---------- modal ----------
  function modal(html, bind) {
    const wrap = document.createElement("div");
    wrap.className = "modal-bg";
    wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(wrap);
    const close = () => wrap.remove();
    wrap.addEventListener("click", e => { if (e.target === wrap) close(); });
    bind(wrap, close);
    return close;
  }
  function confirmBox(msg, yesLabel, onYes) {
    modal(`<p class="modal-text">${esc(msg)}</p>
      <div class="actions"><button class="btn secondary" data-n>${t("cancel")}</button><button class="btn" data-y>${esc(yesLabel)}</button></div>`,
      (w, close) => { w.querySelector("[data-n]").onclick = close; w.querySelector("[data-y]").onclick = () => { close(); onYes(); }; });
  }

  // ---------- setup / settings ----------
  function renderSettings(firstRun, draft) {
    setBack(firstRun ? null : goHome);
    showTabbar(false);
    settingsBtn.classList.toggle("hidden", !!firstRun);
    const p = draft || profile || { name: "", instant: false, examDate: "", pet: true, lang: "en", dailyGoal: 20 };
    I.setLang(p.lang || "en");
    const langOpt = (v, flag, label, sample) => `
      <label class="lang-opt">
        <input type="radio" name="lang" value="${v}" ${(p.lang || "en") === v ? "checked" : ""} />
        <span class="lang-flag">${flag}</span><b>${label}</b><span>${sample}</span>
      </label>`;
    app.innerHTML = `
      <h2>${firstRun ? t("welcome") : t("settings")}</h2>
      <p class="sub">${firstRun ? t("setupSub") : t("settingsSub")}</p>
      <form id="setupForm" class="panel">
        <div class="field-label">${t("language")}</div>
        <div class="lang-row">
          ${langOpt("en", "🇺🇸", "English", "Let's review!")}
          ${langOpt("tl", "🇵🇭", "Tagalog", "Magrebyu tayo!")}
          ${langOpt("tg", "💬", "Taglish", "Review na tayo!")}
        </div>
        <p class="muted small" style="margin:6px 0 0">${t("languageNote")}</p>

        <label class="field-label" for="name" style="margin-top:18px">${t("yourName")}</label>
        <input id="name" class="input" type="text" maxlength="40" placeholder="${t("namePh")}" value="${esc(p.name || "")}" autocomplete="given-name" />

        <div class="field-label" style="margin-top:18px">${t("revealQ")}</div>
        <label class="mode-opt">
          <input type="radio" name="mode" value="exam" ${!p.instant ? "checked" : ""} />
          <div><b>📝 ${t("examMode")} <span class="badge">${t("recommended")}</span></b>
          <span>${t("examModeDesc")}</span></div>
        </label>
        <label class="mode-opt">
          <input type="radio" name="mode" value="instant" ${p.instant ? "checked" : ""} />
          <div><b>⚡ ${t("practiceMode")}</b>
          <span>${t("practiceModeDesc")}</span></div>
        </label>

        <label class="field-label" for="examDate" style="margin-top:18px">${t("examDate")}</label>
        <input id="examDate" class="input" type="date" value="${esc(p.examDate || "")}" />
        <p class="muted small" style="margin:6px 0 0">${t("examDateNote")}</p>

        <label class="field-label" for="dailyGoal" style="margin-top:18px">${t("dailyGoal")}</label>
        <input id="dailyGoal" class="input" type="number" min="5" max="200" step="5" value="${esc(p.dailyGoal || 20)}" />

        <label class="check-row"><input type="checkbox" id="petOn" ${p.pet !== false ? "checked" : ""} /> ${t("showPet")}</label>

        <div class="actions"><button class="btn" type="submit">${firstRun ? t("startReviewing") : t("saveSettings")}</button></div>
      </form>
      ${firstRun ? "" : `
        <div class="panel danger-zone">
          <b>${t("resetProgress")}</b>
          <p class="sub" style="margin:4px 0 12px">${t("resetDesc")}</p>
          <button class="btn secondary" id="resetBtn">${t("resetProgress")}</button>
        </div>`}
      <p class="note">${t("profileNote")}</p>
    `;
    const read = () => ({
      name: document.getElementById("name").value.trim(),
      instant: app.querySelector("input[name=mode]:checked").value === "instant",
      examDate: document.getElementById("examDate").value,
      pet: document.getElementById("petOn").checked,
      lang: app.querySelector("input[name=lang]:checked").value,
      dailyGoal: Math.max(5, Math.min(200, +document.getElementById("dailyGoal").value || 20)),
      created: (profile && profile.created) || (draft && draft.created) || Date.now()
    });
    // Re-render immediately in the chosen language
    app.querySelectorAll("input[name=lang]").forEach(r => r.addEventListener("change", () => renderSettings(firstRun, read())));
    document.getElementById("setupForm").addEventListener("submit", e => {
      e.preventDefault();
      profile = read();
      I.setLang(profile.lang);
      pet().setVisible(profile.pet);
      store.set("cscoach.profile", profile);
      document.dispatchEvent(new CustomEvent("cscoach:lang"));
      openTab(firstRun ? "learn" : tab);
      if (firstRun) setTimeout(() => pet().say(t("petHi", { name: profile.name ? " " + profile.name : "" }), 3200), 400);
    });
    const reset = document.getElementById("resetBtn");
    if (reset) reset.addEventListener("click", () => confirmBox(t("resetConfirm"), t("reset"), () => {
      best = {}; starred = new Set(); stats = {}; history = []; lessonsRead = new Set();
      ["best", "stats", "history"].forEach(k => store.set("cscoach." + k, k === "history" ? [] : {}));
      store.set("cscoach.lessonsRead", []); saveStars(); goHome();
    }));
    window.scrollTo(0, 0);
  }

  // ---------- LEARN tab: lectures + questions ----------
  const sortedLessons = sid => (LESSONS[sid] || []).map((l, i) => ({ l, i })).sort((x, y) => (y.l.imp - x.l.imp) || (x.i - y.i));
  function recommendedLesson() {
    // High-yield first: unread lessons, then lessons below 80%
    const all = SUBJECTS.flatMap(s => sortedLessons(s.id).map(x => x.l));
    const byImp = all.slice().sort((a, b) => b.imp - a.imp);
    return byImp.find(l => !lessonsRead.has(l.id)) || byImp.find(l => { const a = accOf(lessonQs(l.sid, l)); return a.acc != null && a.acc < PASSING; }) || null;
  }

  function renderLearn() {
    setBack(null);
    const rec = recommendedLesson();
    app.innerHTML = `
      <h2>📖 ${t("learnTitle")}</h2>
      <p class="sub">${t("learnSub")}</p>
      ${rec ? `
        <button class="rec-card" id="recLesson">
          <span class="rec-kicker">${t("recommendedLesson")} · ${impLabel(rec.imp)}</span>
          <b>${SUBJECTS.find(x => x.id === rec.sid).icon} ${esc(rec.title)}</b>
          <span>⏱ ${t("minRead", { n: rec.mins })} · ${t("qCount", { n: lessonQs(rec.sid, rec).length })}</span>
        </button>` : ""}
      <div class="grid">
        ${SUBJECTS.map(s => {
          const L = LESSONS[s.id] || [], read = L.filter(l => lessonsRead.has(l.id)).length, a = accOf(s.questions), tr = sn(s);
          const high = L.filter(l => l.imp >= 3).length;
          return `
          <button class="card" data-sid="${s.id}">
            <span class="ico">${s.icon}</span>
            <h3>${esc(tr.name)}</h3>
            <p>${esc(tr.desc)}</p>
            <div class="mini-bar"><div style="width:${L.length ? Math.round(read / L.length * 100) : 0}%"></div></div>
            <div class="meta">
              <span class="badge blue">${t("lessonsN", { a: read, b: L.length })}</span>
              <span>${a.acc != null ? `<span class="badge ${a.acc >= PASSING ? "" : "blue"}">${t("accuracy", { p: a.acc })}</span>` : `<span class="imp-chip imp3">${impLabel(3)} ×${high}</span>`}</span>
            </div>
          </button>`;
        }).join("")}
      </div>
    `;
    const rc = document.getElementById("recLesson");
    if (rc) rc.addEventListener("click", () => renderLesson(rec.sid, LESSONS[rec.sid].indexOf(rec)));
    app.querySelectorAll("[data-sid]").forEach(b => b.addEventListener("click", () => renderLessonList(b.dataset.sid)));
    window.scrollTo(0, 0);
  }

  function renderLessonList(sid) {
    const s = SUBJECTS.find(x => x.id === sid), tr = sn(s);
    setBack(() => openTab("learn"));
    showTabbar(true);
    const list = sortedLessons(sid);
    app.innerHTML = `
      <h2>${s.icon} ${esc(tr.name)}</h2>
      <p class="sub">${esc(tr.desc)}</p>
      <p class="muted small" style="margin:-8px 0 14px">${t("impNote")}${sid !== "filipino" && t("lessonsLangNote") ? " " + t("lessonsLangNote") : ""}</p>
      <div class="set-list">
        ${list.map(({ l, i }, n) => {
          const qs = lessonQs(sid, l), a = accOf(qs), read = lessonsRead.has(l.id);
          return `
          <button class="set-item imp-border${l.imp}" data-l="${i}">
            <div class="set-num ${read ? "read" : ""}">${read ? "✓" : n + 1}</div>
            <div class="set-info"><b>${esc(l.title)}</b><span><span class="imp-chip imp${l.imp}">${impLabel(l.imp)}</span> ⏱ ${t("minRead", { n: l.mins })} · ${t("qCount", { n: qs.length })}</span></div>
            <div class="set-score">${a.acc != null ? `<span class="badge ${a.acc >= PASSING ? "" : "blue"}">${a.acc}%</span>` : `<span class="muted">→</span>`}</div>
          </button>`;
        }).join("")}
      </div>
    `;
    app.querySelectorAll("[data-l]").forEach(b => b.addEventListener("click", () => renderLesson(sid, +b.dataset.l)));
    window.scrollTo(0, 0);
  }

  const ytSearch = q => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q) + "&sp=CAM%253D";
  const inArtifact = () => !!(window.claude && typeof window.claude.use === "function");

  // Step-by-step lesson: intro → one key point per step → example → quick check → wrap-up
  function renderLesson(sid, i, step) {
    const s = SUBJECTS.find(x => x.id === sid), L = LESSONS[sid], l = L[i];
    const qs = lessonQs(sid, l);
    step = step || 0;
    const steps = ["intro", ...l.points.map((_, k) => "p" + k), "example", "check", "done"];
    const kind = steps[step];
    if (kind === "done") { lessonsRead.add(l.id); store.set("cscoach.lessonsRead", [...lessonsRead]); }
    setBack(() => renderLessonList(sid));
    showTabbar(true);
    const go = n => renderLesson(sid, i, n);
    const order = sortedLessons(sid), pos = order.findIndex(x => x.i === i), nextL = order[pos + 1];
    const video = l.video ? (inArtifact()
      ? `<a class="video-card" href="https://www.youtube.com/watch?v=${esc(l.video.id)}" target="_blank" rel="noopener"><span class="vc-play">▶</span><span><small>${t("featuredVideo")}</small><b>${esc(l.video.title)}</b></span></a>`
      : `<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/${esc(l.video.id)}" title="${esc(l.video.title)}" allowfullscreen loading="lazy"></iframe></div>`) : "";
    const ytBtn = `<a class="yt-btn" href="${ytSearch(l.yt)}" target="_blank" rel="noopener">${t("watchVideos")}</a><p class="muted small center">${t("watchVideosNote")}</p>`;

    let body = "";
    if (kind === "intro") {
      body = `
        <div class="step-card intro">
          <div class="step-emoji">${s.icon}</div>
          <span class="imp-chip imp${l.imp}">${impLabel(l.imp)}</span>
          <h2>${esc(l.title)}</h2>
          <p class="lesson-intro">${esc(l.intro)}</p>
          <div class="lesson-h">🗺️ ${t("whatYouLearn")}</div>
          <ol class="mini-outline">${l.points.map(p => `<li>${esc(p.split(/[.:]/)[0])}</li>`).join("")}</ol>
          ${video}${ytBtn}
        </div>`;
    } else if (kind[0] === "p") {
      const k = +kind.slice(1);
      body = `
        <div class="step-card point">
          <div class="point-num">${k + 1}</div>
          <div class="lesson-h">📌 ${t("pointN", { i: k + 1 })} / ${l.points.length}</div>
          <p class="point-text">${esc(l.points[k])}</p>
        </div>`;
    } else if (kind === "example") {
      body = `
        <div class="step-card example">
          <div class="lesson-h">✏️ ${t("tryExample")}</div>
          <p class="point-text">${esc(l.example.q)}</p>
          <p class="muted small">${t("thinkFirst")}</p>
          <button class="btn secondary" id="showEx">${t("showAnswer")}</button>
          <p class="ex-answer hidden" id="exAns">✅ ${esc(l.example.a)}</p>
        </div>`;
    } else if (kind === "check") {
      const cq = prepare(qs[(Date.now() / DAY | 0) % qs.length]);
      body = `
        <div class="step-card check">
          <div class="lesson-h">🧠 ${t("quickCheck")}</div>
          <p class="muted small" style="margin-top:0">${t("quickCheckSub")}</p>
          <p class="point-text">${esc(cq.q)}</p>
          <div class="choices">${cq.c.map((c, n) => `<button class="choice" data-ci="${n}"><span class="letter">${LETTERS[n]}</span><span>${esc(c)}</span></button>`).join("")}</div>
          <div id="checkFb"></div>
        </div>`;
      setTimeout(() => app.querySelectorAll("[data-ci]").forEach(b => b.addEventListener("click", () => {
        const n = +b.dataset.ci;
        app.querySelectorAll("[data-ci]").forEach((x, m) => { x.disabled = true; if (m === cq.a) x.classList.add("correct"); else if (m === n) x.classList.add("wrong"); });
        n === cq.a ? pet().cheer() : pet().cry();
        document.getElementById("checkFb").innerHTML = `<div class="feedback ${n === cq.a ? "ok" : "no"}"><b>${n === cq.a ? t("correctFb") : t("wrongFb", { x: LETTERS[cq.a] + ": " + esc(cq.c[cq.a]) })}</b>${esc(cq.e)}</div>`;
      })), 0);
    } else {
      const a = accOf(qs);
      body = `
        <div class="step-card done">
          <div class="step-emoji">🎉</div>
          <h2>${t("wellDone")}</h2>
          <div class="lesson-remember"><b>💡 ${t("remember")}:</b> ${esc(l.remember)}</div>
          <p class="muted small center">${t("freshLeft", { n: freshCount(qs) })}${a.acc != null ? " · " + t("accuracy", { p: a.acc }) : ""}</p>
          <div class="actions col">
            <button class="btn" id="practiceTopic">${t("practiceTopic", { n: Math.min(10, qs.length) })}</button>
            ${aiReady() ? `<button class="btn blue" id="aiTopic">${t("aiGenTopic")}</button>` : ""}
            ${nextL ? `<button class="btn secondary" id="nextLesson">${t("nextLesson")}: ${esc(nextL.l.title)} →</button>` : ""}
          </div>
          ${ytBtn}
        </div>`;
      pet().cheer(t("wellDone"));
    }

    app.innerHTML = `
      <div class="lesson-kicker">${s.icon} ${esc(sn(s).name)}</div>
      <div class="stepper">
        <div class="step-count">${t("stepOf", { i: step + 1, n: steps.length })}</div>
        <div class="step-dots">${steps.map((_, n) => `<span class="${n < step ? "done" : n === step ? "on" : ""}"></span>`).join("")}</div>
      </div>
      ${body}
      ${kind !== "done" ? `
      <div class="nav step-nav">
        <button class="btn secondary" id="stepBack" ${step === 0 ? "disabled" : ""}>← ${t("back")}</button>
        <button class="btn" id="stepNext">${step === 0 ? t("letsStart") : kind === "check" ? t("finishLesson") : t("continue")} →</button>
      </div>` : ""}
    `;
    const sb = document.getElementById("stepBack"); if (sb) sb.onclick = () => go(step - 1);
    const sx = document.getElementById("stepNext"); if (sx) sx.onclick = () => go(step + 1);
    const ex = document.getElementById("showEx");
    if (ex) ex.addEventListener("click", () => { ex.remove(); document.getElementById("exAns").classList.remove("hidden"); pet().hop(); });
    const pt = document.getElementById("practiceTopic");
    if (pt) pt.addEventListener("click", () => {
      const picked = smartPick(qs, 10);
      startSession("lesson:" + l.id, l.title, picked, () => renderLesson(sid, i, steps.length - 1));
    });
    const at = document.getElementById("aiTopic");
    if (at) at.addEventListener("click", () => generateAI(sid, l, 5, () => renderLesson(sid, i, steps.length - 1)));
    const nl = document.getElementById("nextLesson");
    if (nl) nl.addEventListener("click", () => renderLesson(sid, nextL.i, 0));
    window.scrollTo(0, 0);
  }

  // ---------- PRACTICE tab ----------
  function renderPractice() {
    setBack(null);
    const a = analytics();
    app.innerHTML = `
      <h2>${profile && profile.name ? t("hi", { name: esc(profile.name) }) : ""}${t("chooseSubject")}</h2>
      <p class="sub">${t("homeSub", { n: ROUND_SIZE, p: PASSING })}</p>
      <div class="mode-chip">${profile.instant ? t("modePracticeChip") : t("modeExamChip")} · <button class="link" id="changeMode">${t("change")}</button></div>
      <div class="grid">
        <button class="card mock" data-id="mock">
          <span class="ico">📝</span>
          <h3>${t("mockTitle")}</h3>
          <p>${t("mockDesc", { n: MOCK_SIZE })}</p>
          <div class="meta"><span class="badge">${t("items", { n: MOCK_SIZE })}</span><span>${best.mock != null ? t("best", { p: best.mock }) : t("notTaken")}</span></div>
        </button>
        ${reviewQs().length ? `
          <button class="card starred-card" data-id="review">
            <span class="ico">🎯</span>
            <h3>${t("reviewTitle")}</h3>
            <p>${t("reviewDesc")}</p>
            <div class="meta"><span class="badge blue">${t("reviewCounts", { m: mistakeIds().length, s: starred.size })}</span></div>
          </button>` : ""}
        ${aiReady() ? `
          <button class="card ai-card" data-id="ai">
            <span class="ico">✨</span>
            <h3>${t("aiTitle")}</h3>
            <p>${t("aiDesc")}</p>
            <div class="meta"><span class="badge">${t("aiCount", { n: aiBank.length })}</span></div>
          </button>` : ""}
        ${a.subjects.map(x => {
          const s = SUBJECTS.find(y => y.id === x.id), tr = sn(s);
          return `
          <button class="card" data-id="${s.id}">
            <span class="ico">${s.icon}</span>
            <h3>${esc(tr.name)}</h3>
            <p>${esc(tr.desc)}</p>
            <div class="mini-bar"><div style="width:${Math.round(x.seen / x.total * 100)}%"></div></div>
            <div class="meta">
              <span class="badge blue">${t("freshLeft", { n: freshCount(s.questions) })}</span>
              <span>${x.acc != null ? `<span class="badge ${x.acc >= PASSING ? "" : "blue"}">${t("accuracy", { p: x.acc })}</span>` : t("notStarted")}</span>
            </div>
          </button>`;
        }).join("")}
      </div>
      <p class="note">🔄 ${t("rotationNote")}</p>
      <p class="note">${t("disclaimer")}</p>
    `;
    document.getElementById("changeMode").addEventListener("click", () => renderSettings(false));
    app.querySelectorAll(".card").forEach(btn => btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (id === "mock") return startMock();
      if (id === "review") return startReview();
      if (id === "ai") return pickAISubject();
      startSubject(id);
    }));
    window.scrollTo(0, 0);
  }

  function notifyRecycled() { if (lastRecycled) setTimeout(() => toast(t("recycled")), 300); }
  function startMock() {
    // one fresh question per subject in turn, so the mock stays balanced
    const per = Math.ceil(MOCK_SIZE / SUBJECTS.length);
    const picked = []; let rec = 0;
    SUBJECTS.forEach(s => { picked.push(...smartPick(s.questions, per)); rec += lastRecycled; });
    lastRecycled = rec;
    startSession("mock", t("mockTitle"), shuffle(picked).slice(0, MOCK_SIZE), () => openTab("practice"));
    notifyRecycled();
  }
  function startStarred() { if (starred.size) startSession("starred", t("starredTitle"), [...starred].map(i => byId.get(i)).filter(Boolean), () => openTab("practice")); }
  function startReview(exit) {
    const qs = reviewQs();
    if (!qs.length) return toast(t("reviewEmpty"));
    startSession("review", t("reviewTitle"), qs.slice(0, 30), exit || (() => openTab(tab)));
  }
  function startSubject(id) {
    const s = SUBJECTS.find(x => x.id === id);
    startSession(s.id, sn(s).name, smartPick(s.questions, ROUND_SIZE), () => openTab("practice"));
    notifyRecycled();
  }

  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast"; el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("out"), 3800);
    setTimeout(() => el.remove(), 4300);
  }

  // ---------- AI-generated questions (Claude via the artifact "sample" capability) ----------
  let sampleFn = null;
  if (inArtifact()) window.claude.use("sample").then(fn => { sampleFn = fn; if (session == null && tab === "practice" && !document.querySelector(".modal-bg")) openTab("practice"); }).catch(() => {});
  function aiReady() { return !!sampleFn; }

  function weakestLesson(sid) {
    return sortedLessons(sid).map(x => x.l)
      .map(l => ({ l, a: accOf(lessonQs(sid, l)) }))
      .sort((x, y) => ((x.a.acc == null ? 50 : x.a.acc) - x.l.imp * 5) - ((y.a.acc == null ? 50 : y.a.acc) - y.l.imp * 5))[0].l;
  }

  function pickAISubject() {
    modal(`
      <div class="modal-title">${t("aiTitle")}</div>
      <p class="modal-text">${t("aiPick")}</p>
      <div class="set-list">${SUBJECTS.map(s => `<button class="set-item" data-ai="${s.id}"><div class="set-num">${s.icon}</div><div class="set-info"><b>${esc(sn(s).name)}</b><span>${esc(t("aiTopicAuto", { t: weakestLesson(s.id).title }))}</span></div></button>`).join("")}</div>
      <div class="actions"><button class="btn secondary" data-x>${t("cancel")}</button></div>
    `, (w, close) => {
      w.querySelector("[data-x]").onclick = close;
      w.querySelectorAll("[data-ai]").forEach(b => b.onclick = () => { close(); const sid = b.dataset.ai; generateAI(sid, weakestLesson(sid), 10, () => openTab("practice")); });
    });
  }

  async function generateAI(sid, lesson, n, exitTo) {
    if (!sampleFn) return toast(t("aiUnavailable"));
    const s = SUBJECTS.find(x => x.id === sid);
    const close = modal(`<div class="ai-loading"><div class="spinner"></div><b>${t("aiGenerating")}</b><span class="muted small">${esc(sn(s).name)} · ${esc(lesson.title)}</span></div>`, () => {});
    const examples = lessonQs(sid, lesson).filter(q => !q.ai).slice(0, 3).map(q => ({ q: q.q, c: q.c, a: q.a, e: q.e, h: q.h }));
    const avoid = s.questions.filter(q => q.lid === lesson.id).map(q => q.q.slice(0, 90));
    const explainLang = { en: "English", tl: "Tagalog (Filipino)", tg: "Taglish (casual mix of Tagalog and English)" }[I.lang];
    const prompt = `You write practice questions for the Philippine Civil Service Exam (Professional level).
Subject: ${s.name}. Topic: ${lesson.title}.
Topic notes: ${lesson.points.join(" | ")}
Write ${n} NEW multiple-choice questions on this topic, in the same style and difficulty as the real exam.
Rules:
- Question and choices language: ${sid === "filipino" ? "Filipino" : "English"} (as in the real exam).
- Explanation "e" and coaching hint "h" language: ${explainLang}.
- Exactly 4 choices, one clearly correct answer; "a" is the 0-based index of the correct choice. Vary the position of the correct answer.
- Facts (laws, RA numbers, constitutional provisions, dates) must be accurate. If unsure of a fact, choose a different question.
- Math must be correct; double-check every computation.
- "h" coaches HOW to approach the question without giving away the answer.
- Do not copy or closely paraphrase these existing questions: ${JSON.stringify(avoid)}
Style examples: ${JSON.stringify(examples)}
Return JSON only: {"questions":[{"q":"...","c":["...","...","...","..."],"a":0,"e":"...","h":"..."}]}`;
    try {
      const out = await sampleFn.json(prompt, { modelTier: "default", cache: false });
      const list = (out && out.questions) || [];
      const now = Date.now();
      const valid = list.filter(q => q && typeof q.q === "string" && Array.isArray(q.c) && q.c.length === 4 && q.c.every(c => typeof c === "string" && c.trim())
        && new Set(q.c).size === 4 && Number.isInteger(q.a) && q.a >= 0 && q.a < 4 && typeof q.e === "string")
        .map((q, k) => ({ id: `ai-${sid}-${now}-${k}`, sid, lid: lesson.id, ai: true, created: now, q: q.q.trim(), c: q.c.map(c => c.trim()), a: q.a, e: q.e, h: q.h || lesson.remember }));
      close();
      if (!valid.length) return toast(t("aiFail"));
      aiBank = aiBank.concat(valid).slice(-300);
      store.set("cscoach.aiq", aiBank);
      valid.forEach(addToBank);
      startSession("ai:" + sid, "✨ " + lesson.title, valid, exitTo || (() => openTab("practice")), true);
    } catch (e) {
      close();
      toast(t("aiFail"));
    }
  }

  // ---------- CALENDAR tab ----------
  let calMonth = null, calSel = null;
  function dayStats() {
    const m = new Map();
    history.forEach(h => {
      const k = dayKey(h.t), d = m.get(k) || { n: 0, c: 0, sessions: [] };
      d.n += h.answered != null ? h.answered : h.total; d.c += h.correct; d.sessions.push(h);
      m.set(k, d);
    });
    return m;
  }
  function renderCalendar() {
    setBack(null);
    const ds = dayStats(), g = goal(), today = new Date(); today.setHours(0, 0, 0, 0);
    if (!calMonth) calMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const exam = profile && profile.examDate ? new Date(profile.examDate + "T00:00:00") : null;
    const daysLeft = exam ? Math.round((exam - today) / DAY) : null;
    const startTs = Math.min(profile && profile.created || Date.now(), history.length ? history[0].t : Date.now());
    const start = new Date(startTs); start.setHours(0, 0, 0, 0);
    const totalDays = exam ? Math.max(1, Math.round((exam - start) / DAY)) : null;
    const dayNum = exam ? Math.min(totalDays, Math.round((today - start) / DAY) + 1) : null;
    const todayN = (ds.get(today.toDateString()) || { n: 0 }).n;
    const lvl = n => n === 0 ? 0 : n < g / 2 ? 1 : n < g ? 2 : 3;

    // month grid
    const y = calMonth.getFullYear(), mo = calMonth.getMonth();
    const first = new Date(y, mo, 1).getDay(), dim = new Date(y, mo + 1, 0).getDate();
    let monthN = 0, monthActive = 0;
    const cells = [];
    for (let k = 0; k < first; k++) cells.push(`<div class="cal-cell empty"></div>`);
    for (let d = 1; d <= dim; d++) {
      const date = new Date(y, mo, d), key = date.toDateString(), st = ds.get(key);
      const n = st ? st.n : 0; monthN += n; if (n) monthActive++;
      const isToday = date.getTime() === today.getTime(), isExam = exam && date.getTime() === exam.getTime();
      cells.push(`<button class="cal-cell l${lvl(n)} ${isToday ? "today" : ""} ${isExam ? "exam" : ""} ${calSel === key ? "sel" : ""}" data-day="${key}" aria-label="${date.toLocaleDateString()}: ${n}">
        <span class="cal-d">${d}${isExam ? " 🎯" : ""}</span>${n ? `<span class="cal-n">${n}${n >= g ? "✓" : ""}</span>` : ""}</button>`);
    }
    // best streak overall
    const keys = [...ds.keys()].map(k => new Date(k).getTime()).sort((a, b) => a - b);
    let bestStreak = 0, run = 0;
    keys.forEach((k, i) => { run = i && Math.round((k - keys[i - 1]) / DAY) === 1 ? run + 1 : 1; bestStreak = Math.max(bestStreak, run); });
    const sel = calSel && ds.get(calSel);

    app.innerHTML = `
      <h2>📅 ${t("calTitle")}</h2>
      <p class="sub">${t("calSub")}</p>
      ${exam ? `
        <div class="countdown">
          <div class="cd-num">${Math.max(0, daysLeft)}</div>
          <div class="cd-info"><b>${t("daysToGo")}</b><span>${t("examOn", { d: exam.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) })}</span></div>
        </div>
        <div class="panel">
          <div class="prep-row"><b>${t("prepDay", { i: Math.max(1, dayNum), n: totalDays })}</b><span class="muted small">${t("prepPct", { p: Math.min(100, Math.round(dayNum / totalDays * 100)) })}</span></div>
          <div class="progress big"><div style="width:${Math.min(100, Math.round(dayNum / totalDays * 100))}%"></div></div>
        </div>` : `
        <button class="panel set-exam" id="setExam"><b>🎯 ${t("setExamDate")}</b><span class="muted small">${t("setExamDateNote")}</span></button>`}

      <div class="panel goal-panel">
        <div class="prep-row"><b>${t("todayGoal")}</b><span>${todayN >= g ? t("goalMet") : t("todayCount", { a: todayN, g })}</span></div>
        <div class="progress big"><div style="width:${Math.min(100, Math.round(todayN / g * 100))}%"></div></div>
        ${todayN < g ? `<div class="actions"><button class="btn" id="goalStart">${t("startNow")} →</button></div>` : ""}
      </div>

      <div class="panel">
        <div class="cal-head">
          <button class="arrow" id="calPrev" aria-label="${t("prev")}">‹</button>
          <b>${calMonth.toLocaleDateString(I.lang === "en" ? "en-US" : "fil-PH", { month: "long", year: "numeric" })}</b>
          <button class="arrow" id="calNext" aria-label="${t("next")}">›</button>
        </div>
        <div class="cal-grid">
          ${t("weekdays").map(w => `<div class="cal-wd">${w}</div>`).join("")}
          ${cells.join("")}
        </div>
        <div class="cal-legend">
          <span>${t("less")}</span><i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><span>${t("more")}</span>
          <span class="muted">· ${t("goalMark")} · ${t("examDayMark")}</span>
        </div>
        ${calSel ? `<div class="day-detail"><b>${new Date(calSel).toLocaleDateString()}</b>
          ${sel ? `<span>${t("dayDetail", { n: sel.n, p: sel.n ? Math.round(sel.c / sel.n * 100) : 0 })}</span>
            <ul>${sel.sessions.map(h => `<li>${esc(h.title)}: ${h.pct}%</li>`).join("")}</ul>` : `<span class="muted">${t("noActivity")}</span>`}</div>` : ""}
      </div>

      <div class="tiles">
        <div class="tile"><b>${monthN}</b><span>${t("monthTotal")}</span></div>
        <div class="tile"><b>${monthActive}</b><span>${t("activeDays")}</span></div>
        <div class="tile"><b>🔥 ${bestStreak}</b><span>${t("bestStreak")}</span></div>
      </div>
    `;
    document.getElementById("calPrev").onclick = () => { calMonth = new Date(y, mo - 1, 1); renderCalendar(); };
    document.getElementById("calNext").onclick = () => { calMonth = new Date(y, mo + 1, 1); renderCalendar(); };
    app.querySelectorAll("[data-day]").forEach(b => b.addEventListener("click", () => { calSel = calSel === b.dataset.day ? null : b.dataset.day; const yy = window.scrollY; renderCalendar(); window.scrollTo(0, yy); }));
    const se = document.getElementById("setExam"); if (se) se.onclick = () => renderSettings(false);
    const gs = document.getElementById("goalStart");
    if (gs) gs.onclick = () => { const a = analytics(); const w = a.subjects.slice().sort((p, q) => (p.acc == null ? -1 : p.acc) - (q.acc == null ? -1 : q.acc))[0]; startSubject(w.id); session.exitTo = () => openTab("calendar"); };
  }

  // ---------- ANALYTICS tab ----------
  function renderAnalytics() {
    setBack(null);
    const a = analytics();
    if (!a.overall.attempts) {
      app.innerHTML = `<h2>📊 ${t("analyticsTitle")}</h2><p class="sub">${t("analyticsSub")}</p>
        <div class="panel empty-state"><div class="empty-ico">📈</div><p>${t("noAnalytics")}</p>
        <div class="actions"><button class="btn" id="goLearn">📖 ${t("tabLearn")}</button><button class="btn blue" id="goPractice">✏️ ${t("tabPractice")}</button></div></div>`;
      document.getElementById("goLearn").onclick = () => openTab("learn");
      document.getElementById("goPractice").onclick = () => openTab("practice");
      return;
    }
    const passingCount = a.subjects.filter(x => x.acc != null && x.acc >= PASSING).length;
    const tiles = [
      [a.overall.attempts, t("answeredQ")],
      [a.overall.acc + "%", t("accuracyL")],
      ["🔥 " + a.streak, t("streakL")],
      [passingCount + "/" + a.subjects.length, t("subjectsPassing")]
    ];
    if (a.daysLeft != null && a.daysLeft >= 0) tiles.push([a.daysLeft, t("daysToExam")]);
    const recent = history.slice(-15);

    app.innerHTML = `
      <h2>📊 ${t("analyticsTitle")}</h2>
      <p class="sub">${t("analyticsSub")}</p>
      <div class="tiles">${tiles.map(([v, l]) => `<div class="tile"><b>${v}</b><span>${l}</span></div>`).join("")}</div>
      ${reviewQs().length ? `<button class="review-banner" id="reviewTop"><span>🎯</span><span><b>${t("reviewBtn", { n: reviewQs().length }).replace(/^🎯 /, "")}</b><small>${t("reviewCounts", { m: mistakeIds().length, s: starred.size })}</small></span><span>→</span></button>` : ""}

      <div class="panel chart-panel">
        <div class="chart-title">${t("accBySubject")}</div>
        <div class="chart-legend"><span><i class="lg-bar pass"></i>${t("passingTag")} (≥80%)</span><span><i class="lg-bar below"></i>${t("belowTag")}</span><span><i class="lg-line"></i>${t("target")}</span></div>
        <div class="hbar-chart" id="subjChart">
          ${a.subjects.map(x => {
            const s = SUBJECTS.find(y => y.id === x.id);
            const cls = x.acc == null ? "none" : x.acc >= PASSING ? "pass" : "below";
            return `
            <div class="hbar-row" tabindex="0" data-tip="${esc(x.name)}|${x.acc == null ? t("notYet") : x.acc + "%"}|${x.correct}/${x.attempts} · ${t("practiced", { a: x.seen, b: x.total })}">
              <div class="hbar-label">${s.icon} ${esc(sn(s).short)}</div>
              <div class="hbar-track">
                <div class="hbar-fill ${cls}" style="width:${x.acc || 0}%"></div>
                <div class="hbar-target" style="left:${PASSING}%"></div>
              </div>
              <div class="hbar-val">${x.acc == null ? "–" : x.acc + "%"}</div>
            </div>`;
          }).join("")}
        </div>
      </div>

      ${recent.length >= 2 ? `
      <div class="panel chart-panel">
        <div class="chart-title">${t("scoreTrend")}</div>
        <div class="chart-sub">${t("scoreTrendSub", { n: recent.length })}</div>
        <div class="line-chart" id="trendChart"></div>
      </div>` : ""}

      <div class="panel">
        <div class="chart-title">${t("weakTopics")}</div>
        <div class="chart-sub">${t("weakTopicsSub")}</div>
        ${a.weakTopics.length ? `<div class="topic-list">${a.weakTopics.map(w => {
          const s = SUBJECTS.find(y => y.id === w.sid);
          return `<div class="topic-row">
            <span class="topic-name">${s.icon} ${esc(w.title)}<br><span class="imp-chip imp${w.importance}">${impLabel(w.importance)}</span></span>
            <span class="badge ${w.acc >= PASSING ? "" : "blue"}">${w.acc}%</span>
            <button class="btn-mini" data-study="${w.sid}|${w.id}">${t("studyLesson")} →</button>
          </div>`;
        }).join("")}</div>` : `<p class="muted small">${t("noTopicData")}</p>`}
      </div>

      <details class="panel table-view">
        <summary>${t("tableView")}</summary>
        <table class="data-table">
          <thead><tr><th>${t("subjectCol")}</th><th>${t("accuracyL")}</th><th>${t("practicedCol")}</th><th>${t("attemptsCol")}</th></tr></thead>
          <tbody>${a.subjects.map(x => `<tr><td>${esc(x.name)}</td><td>${x.acc == null ? "–" : x.acc + "%"}</td><td>${x.seen}/${x.total}</td><td>${x.attempts}</td></tr>`).join("")}</tbody>
        </table>
        <div class="chart-title" style="margin-top:14px">${t("recentSessions")}</div>
        <table class="data-table">
          <thead><tr><th>${t("dateCol")}</th><th>${t("sessionCol")}</th><th>${t("scoreCol")}</th></tr></thead>
          <tbody>${history.slice(-10).reverse().map(h => `<tr><td>${new Date(h.t).toLocaleDateString()}</td><td>${esc(h.title)}</td><td>${h.pct}%</td></tr>`).join("")}</tbody>
        </table>
      </details>

      <div class="actions col">
        <button class="btn" id="practiceReview" ${reviewQs().length ? "" : "disabled"}>${t("reviewBtn", { n: reviewQs().length })}</button>
        <button class="btn blue" id="askCoach">${t("askCoachPlan")}</button>
      </div>
      <div class="chart-tip hidden" id="chartTip"></div>
    `;

    // tooltips for bars
    const tip = document.getElementById("chartTip");
    const showTip = (el, html) => {
      tip.innerHTML = html; tip.classList.remove("hidden");
      const r = el.getBoundingClientRect();
      tip.style.left = Math.min(window.innerWidth - tip.offsetWidth - 8, Math.max(8, r.left + r.width / 2 - tip.offsetWidth / 2)) + "px";
      tip.style.top = (r.top + window.scrollY - tip.offsetHeight - 8) + "px";
    };
    const hideTip = () => tip.classList.add("hidden");
    app.querySelectorAll(".hbar-row").forEach(row => {
      const [name, val, sub] = row.dataset.tip.split("|");
      const html = `<b>${val}</b><span>${name}</span><span class="muted">${sub}</span>`;
      ["pointerenter", "focus"].forEach(ev => row.addEventListener(ev, () => showTip(row.querySelector(".hbar-track"), html)));
      ["pointerleave", "blur"].forEach(ev => row.addEventListener(ev, hideTip));
    });
    if (recent.length >= 2) drawTrend(document.getElementById("trendChart"), recent, showTip, hideTip);
    app.querySelectorAll("[data-study]").forEach(b => b.addEventListener("click", () => {
      const [sid, lid] = b.dataset.study.split("|");
      tab = "learn"; paintTabbar();
      renderLesson(sid, LESSONS[sid].findIndex(l => l.id === lid));
    }));
    document.getElementById("askCoach").addEventListener("click", () => window.CoachUI && window.CoachUI.open("plan"));
    const rt = document.getElementById("reviewTop");
    if (rt) rt.addEventListener("click", () => startReview(() => openTab("analytics")));
    document.getElementById("practiceReview").addEventListener("click", () => startReview(() => openTab("analytics")));
    window.scrollTo(0, 0);
  }

  // Line chart of session scores with an 80% reference line, crosshair and tooltip
  function drawTrend(el, data, showTip, hideTip) {
    const W = 640, H = 220, L = 36, R = 12, T = 12, B = 26;
    const x = i => L + (data.length === 1 ? 0 : i * (W - L - R) / (data.length - 1));
    const y = v => T + (100 - v) * (H - T - B) / 100;
    const pts = data.map((d, i) => [x(i), y(d.pct)]);
    const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    el.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" class="trend-svg" role="img" aria-label="${esc(t("scoreTrend"))}">
        ${[0, 25, 50, 75, 100].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid-line"/><text x="${L - 6}" y="${y(v) + 4}" class="axis-text" text-anchor="end">${v}%</text>`).join("")}
        <line x1="${L}" x2="${W - R}" y1="${y(PASSING)}" y2="${y(PASSING)}" class="target-line"/>
        <text x="${W - R}" y="${y(PASSING) - 5}" class="axis-text target-text" text-anchor="end">${t("target")}</text>
        <path d="${path}" class="trend-line"/>
        <line class="crosshair hidden" y1="${T}" y2="${H - B}"/>
        ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" class="trend-dot ${data[i].pct >= PASSING ? "pass" : ""}"/>`).join("")}
        ${data.map((_, i) => `<text x="${x(i)}" y="${H - 8}" class="axis-text" text-anchor="middle">${data.length > 10 && i % 2 ? "" : i + 1}</text>`).join("")}
        <rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" fill="transparent" class="hit"/>
      </svg>`;
    const svg = el.querySelector("svg"), hit = el.querySelector(".hit"), ch = el.querySelector(".crosshair");
    const dots = el.querySelectorAll(".trend-dot");
    const move = e => {
      const r = svg.getBoundingClientRect();
      const px = (e.clientX - r.left) * W / r.width;
      let i = Math.round((px - L) / ((W - L - R) / Math.max(1, data.length - 1)));
      i = Math.max(0, Math.min(data.length - 1, i));
      ch.setAttribute("x1", x(i)); ch.setAttribute("x2", x(i)); ch.classList.remove("hidden");
      dots.forEach((d, j) => d.classList.toggle("hover", j === i));
      const h = data[i];
      showTip(dots[i], `<b>${h.pct}%</b><span>${esc(h.title)}</span><span class="muted">${new Date(h.t).toLocaleDateString()} · ${h.correct}/${h.total}</span>`);
    };
    hit.addEventListener("pointermove", move);
    hit.addEventListener("pointerdown", move);
    hit.addEventListener("pointerleave", () => { ch.classList.add("hidden"); dots.forEach(d => d.classList.remove("hover")); hideTip(); });
  }

  // ---------- quiz session ----------
  let session = null;

  function startSession(key, title, questions, exitTo, keepOrder) {
    const list = keepOrder ? questions : shuffle(questions);
    session = {
      key, title, exitTo,
      items: list.map(prepare),
      idx: 0,
      answers: new Array(list.length).fill(null),
      unsure: new Set(),
      instant: !!(profile && profile.instant),
      showPalette: true,
      done: false
    };
    showTabbar(false);
    renderQuestion(true);
  }

  function leaveSession() {
    const answered = session.answers.some(a => a !== null);
    const exit = session.exitTo || goHome;
    if (!answered) { session = null; return exit(); }
    confirmBox(t("leaveQuiz"), t("leave"), () => { session = null; exit(); });
  }

  function qState(i) {
    const S = session, q = S.items[i], ans = S.answers[i];
    if (S.instant && ans !== null) return ans === q.a ? "correct" : "wrong";
    if (S.unsure.has(i)) return "unsure";
    return ans !== null ? "answered" : "";
  }

  const ARROW_L = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ARROW_R = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function goTo(i) {
    if (!session || session.done) return;
    if (i < 0 || i >= session.items.length) return;
    session.idx = i; renderQuestion(true);
  }
  function goNext() {
    if (session.idx === session.items.length - 1) openSubmit(); else goTo(session.idx + 1);
  }

  function renderQuestion(scrollTop) {
    setBack(leaveSession);
    const S = session, { items, idx } = S, q = items[idx];
    const ans = S.answers[idx];
    const locked = S.instant && ans !== null;
    const answeredCount = S.answers.filter(a => a !== null).length;
    const isStar = starred.has(q.id);
    const isUnsure = S.unsure.has(idx);
    const last = idx === items.length - 1;

    app.innerHTML = `
      <div class="quiz-sticky" id="quizSticky">
      <div class="quiz-head">
        <div>
          <div class="quiz-title">${esc(S.title)}</div>
          <div class="quiz-count">${t("quizCount", { i: idx + 1, n: items.length, a: answeredCount })}</div>
        </div>
        <button class="link" id="togglePal">${S.showPalette ? t("hideOverview") : t("showOverview")}</button>
      </div>
      <div class="progress"><div style="width:${Math.round(answeredCount / items.length * 100)}%"></div></div>
      ${S.showPalette ? `
        <div class="palette" id="palette">
          ${items.map((it, i) => `<button class="pal ${qState(i)} ${i === idx ? "current" : ""}" data-go="${i}" aria-label="${i + 1}">${i + 1}${starred.has(it.id) ? '<i class="pal-star">★</i>' : ""}</button>`).join("")}
        </div>
        <div class="legend">
          ${S.instant
            ? `<span><i class="dot correct"></i>${t("correct")}</span><span><i class="dot wrong"></i>${t("wrong")}</span>`
            : `<span><i class="dot answered"></i>${t("answered")}</span><span><i class="dot unsure"></i>${t("notSure")}</span>`}
          <span><i class="dot"></i>${t("unanswered")}</span><span>★ ${t("starred")}</span>
        </div>` : ""}

      <div class="qcard qcard-top">
        <div class="qrow">
          <span class="qsubject">${esc(sn(subjectOf(q)).name)}${q.ai ? ` <span class="ai-badge" title="${esc(t("aiCaution"))}">✨ ${t("aiBadge")}</span>` : ""}</span>
          <div class="qnav">
            <button class="arrow" id="prevBtn" ${idx === 0 ? "disabled" : ""} aria-label="${t("prev")}" title="${t("prev")}">${ARROW_L}</button>
            <button class="arrow ${last ? "submit" : ""} ${locked && !last ? "pulse" : ""}" id="nextBtn" aria-label="${last ? t("reviewSubmit") : t("next")}" title="${last ? t("reviewSubmit") : t("next")}">${ARROW_R}</button>
          </div>
        </div>
        <div class="qtools">
          <button class="tool ${isStar ? "on" : ""}" id="starBtn" aria-pressed="${isStar}" title="${t("starTitle")}">${isStar ? "★" : "☆"} <span>${t("star")}</span></button>
          <button class="tool help" id="helpBtn" title="${t("helpTitle")}">💡 <span>${t("helpMe")}</span></button>
        </div>
        <div class="qtext">${esc(q.q)}</div>
      </div>
      </div>
      <div class="qcard qcard-bottom">
        <div class="choices">
          ${q.c.map((c, i) => {
            let cls = "";
            if (locked) cls = i === q.a ? "correct" : (i === ans ? "wrong" : "");
            else if (i === ans) cls = "selected";
            return `<button class="choice ${cls}" data-i="${i}" ${locked ? "disabled" : ""}><span class="letter">${LETTERS[i]}</span><span>${esc(c)}</span></button>`;
          }).join("")}
        </div>
        ${locked ? `
          <div class="feedback ${ans === q.a ? "ok" : "no"}">
            <b>${ans === q.a ? t("correctFb") : t("wrongFb", { x: LETTERS[q.a] + ": " + esc(q.c[q.a]) })}</b>
            ${esc(q.e)}
          </div>` : `
          <button class="unsure-toggle ${isUnsure ? "on" : ""}" id="unsureBtn" aria-pressed="${isUnsure}">
            <span class="box">${isUnsure ? "✓" : ""}</span>
            <span>${t("unsureToggle")}</span>
          </button>`}
      </div>
      ${last
        ? `<div class="actions"><button class="btn" id="submitBtn">${t("reviewSubmit")}</button></div>`
        : `<div class="submit-row"><button class="link" id="submitEarly">${t("finishSubmit")}</button></div>`}
    `;

    app.querySelectorAll(".pal").forEach(b => b.addEventListener("click", () => goTo(+b.dataset.go)));
    document.getElementById("togglePal").addEventListener("click", () => { S.showPalette = !S.showPalette; renderQuestion(false); });
    app.querySelectorAll(".choice").forEach(b => b.addEventListener("click", () => {
      const i = +b.dataset.i;
      if (locked) return;
      const was = S.answers[idx];
      S.answers[idx] = (!S.instant && was === i) ? null : i;   // tap again to clear (exam mode)
      if (S.instant) {
        S.unsure.delete(idx);
        i === q.a ? pet().cheer() : pet().cry();
      } else if (S.answers[idx] !== null) pet().hop();
      renderQuestion(false);
    }));
    document.getElementById("starBtn").addEventListener("click", () => {
      const on = !starred.has(q.id);
      on ? starred.add(q.id) : starred.delete(q.id);
      if (on) pet().say(t("petStarred"));
      saveStars(); renderQuestion(false);
    });
    document.getElementById("helpBtn").addEventListener("click", () => showHelp(q));
    const ub = document.getElementById("unsureBtn");
    if (ub) ub.addEventListener("click", () => {
      S.unsure.has(idx) ? S.unsure.delete(idx) : (S.unsure.add(idx), pet().say(t("petUnsure")));
      renderQuestion(false);
    });
    document.getElementById("prevBtn").addEventListener("click", () => goTo(idx - 1));
    document.getElementById("nextBtn").addEventListener("click", goNext);
    const sb = document.getElementById("submitBtn");
    if (sb) sb.addEventListener("click", openSubmit);
    const se = document.getElementById("submitEarly");
    if (se) se.addEventListener("click", openSubmit);

    // Swipe left/right on the question card to navigate
    let sx = 0, sy = 0;
    app.querySelectorAll(".qcard").forEach(card => {
      card.addEventListener("touchstart", e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
      card.addEventListener("touchend", e => {
        const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) > 70 && Math.abs(dy) < 45) dx < 0 ? goNext() : goTo(idx - 1);
      }, { passive: true });
    });
    fitSticky();

    // Keep the current number visible in the one-line overview
    const pal = document.getElementById("palette");
    if (pal) {
      const cur = pal.children[idx];
      pal.scrollLeft = cur.offsetLeft - pal.clientWidth / 2 + cur.clientWidth / 2;
    }
    if (scrollTop) window.scrollTo(0, 0);
  }

  // Freeze the question header under the top bar, unless it would take up
  // too much of the screen (e.g. a long reading passage on a small phone)
  function fitSticky() {
    const st = document.getElementById("quizSticky");
    if (!st) return;
    document.documentElement.style.setProperty("--topbar-h", document.querySelector(".topbar").offsetHeight + "px");
    st.classList.remove("unstick");
    if (st.offsetHeight > window.innerHeight * 0.6) st.classList.add("unstick");
  }
  window.addEventListener("resize", fitSticky);

  document.addEventListener("keydown", e => {
    if (!session || session.done || document.querySelector(".modal-bg") || /input|textarea/i.test(e.target.tagName)) return;
    if (e.key === "ArrowRight") goNext();
    if (e.key === "ArrowLeft") goTo(session.idx - 1);
  });

  function showHelp(q) {
    const tr = sn(subjectOf(q));
    modal(`
      <div class="modal-title">💡 ${t("coach")}</div>
      <div class="coach-block">
        <div class="coach-label">${t("howApproach")}</div>
        <p>${esc(q.h)}</p>
      </div>
      <div class="coach-block">
        <div class="coach-label">${t("generalStrategy", { s: esc(tr.name) })}</div>
        <ul>${tr.tips.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      </div>
      <p class="muted small">${t("coachNote")}</p>
      <div class="actions"><button class="btn" data-close>${t("gotIt")}</button></div>
    `, (w, close) => { w.querySelector("[data-close]").onclick = close; });
  }

  function openSubmit() {
    const S = session;
    const unanswered = S.answers.map((a, i) => a === null ? i : -1).filter(i => i >= 0);
    const unsure = [...S.unsure].filter(i => !(S.instant && S.answers[i] !== null)).sort((a, b) => a - b);
    const starIdx = S.items.map((q, i) => starred.has(q.id) ? i : -1).filter(i => i >= 0);
    const chips = (list, cls) => list.map(i => `<button class="chip ${cls}" data-go="${i}">${i + 1}</button>`).join("");
    const clean = !unanswered.length && !unsure.length;

    modal(`
      <div class="modal-title">${clean ? t("readySubmit") : t("beforeSubmit")}</div>
      ${clean ? `<p class="modal-text">${t("allAnswered", { n: S.items.length })}</p>` : ""}
      ${unanswered.length ? `
        <div class="sum-block">
          <div class="sum-label">⭕ ${t("unanswered")} (${unanswered.length})</div>
          <div class="chips">${chips(unanswered, "")}</div>
        </div>` : ""}
      ${unsure.length ? `
        <div class="sum-block">
          <div class="sum-label">✓ ${t("markedNotSure")} (${unsure.length})</div>
          <div class="chips">${chips(unsure, "unsure")}</div>
        </div>` : ""}
      ${starIdx.length ? `
        <div class="sum-block">
          <div class="sum-label">★ ${t("starred")} (${starIdx.length})</div>
          <div class="chips">${chips(starIdx, "star")}</div>
        </div>` : ""}
      ${!clean ? `<p class="muted small">${t("tapNumber")}${unanswered.length ? t("countWrong") : ""}</p>` : ""}
      <div class="actions">
        <button class="btn secondary" data-back>${t("keepReviewing")}</button>
        <button class="btn" data-submit>${unanswered.length ? t("submitAnyway") : t("submit")}</button>
      </div>
    `, (w, close) => {
      w.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { close(); S.idx = +b.dataset.go; renderQuestion(true); });
      w.querySelector("[data-back]").onclick = close;
      w.querySelector("[data-submit]").onclick = () => { close(); renderResults(); };
    });
  }

  // ---------- results & review ----------
  function renderResults(filter) {
    const S = session;
    S.done = true;
    setBack(S.exitTo || goHome);
    const rows = S.items.map((q, i) => {
      const ans = S.answers[i];
      return { i, q, ans, status: ans === null ? "unanswered" : (ans === q.a ? "correct" : "wrong"), unsure: S.unsure.has(i) };
    });
    const score = rows.filter(r => r.status === "correct").length;
    const pct = Math.round(score / rows.length * 100);
    const counts = {
      all: rows.length,
      correct: score,
      wrong: rows.filter(r => r.status === "wrong").length,
      unanswered: rows.filter(r => r.status === "unanswered").length,
      unsure: rows.filter(r => r.unsure).length,
      starred: rows.filter(r => starred.has(r.q.id)).length
    };
    const missed = rows.filter(r => r.status !== "correct");

    if (!S.saved) {
      S.saved = true;
      recordSession(S);
      setTimeout(() => pct >= PASSING
        ? pet().cheer(pct === 100 ? t("petPerfect") : t("petPass", { p: pct }))
        : pet().cry(pct >= 60 ? t("petNear", { p: pct }) : t("petLow", { p: pct })), 300);
      const saveable = !S.key.endsWith(":retry") && !["starred", "review"].includes(S.key) && !S.key.startsWith("ai:");
      if (saveable && (best[S.key] == null || pct > best[S.key])) { best[S.key] = pct; store.set("cscoach.best", best); }
    }

    filter = filter || "all";
    const shown = rows.filter(r =>
      filter === "all" ? true :
      filter === "unsure" ? r.unsure :
      filter === "starred" ? starred.has(r.q.id) :
      r.status === filter);

    const tabBtn = (id, label) => counts[id] || id === "all"
      ? `<button class="tab ${filter === id ? "active" : ""}" data-f="${id}">${label} <span>${counts[id]}</span></button>` : "";
    const statusLabel = { correct: "✅ " + t("correct"), wrong: "❌ " + t("wrong"), unanswered: "⭕ " + t("unanswered") };
    const isSubjectRound = SUBJECTS.some(x => x.id === S.key);

    app.innerHTML = `
      <div class="result-head">
        <h2>${esc(S.title)}</h2>
        <div class="ring" style="--p:${pct}"><div>${pct}%</div></div>
        <div class="verdict ${pct >= PASSING ? "pass" : "fail"}">
          ${pct >= PASSING ? t("passed", { name: profile && profile.name ? ", " + esc(profile.name) : "" }) : t("keepGoing", { p: PASSING })}
        </div>
        <div class="result-stats">
          <span class="ok">✅ ${t("nCorrect", { n: counts.correct })}</span>
          <span class="no">❌ ${t("nWrong", { n: counts.wrong })}</span>
          ${counts.unanswered ? `<span>⭕ ${t("nUnanswered", { n: counts.unanswered })}</span>` : ""}
        </div>
        <div class="actions">
          ${missed.length ? `<button class="btn" id="retryWrong">${t("retryMissed", { n: missed.length })}</button>` : ""}
          <button class="btn blue" id="again">${isSubjectRound ? t("nextRound") : t("takeAgain")}</button>
          <button class="btn secondary" id="exit">${t("done")}</button>
        </div>
      </div>

      <h3 class="review-title">${t("reviewAll")}</h3>
      <div class="tabs">
        ${tabBtn("all", t("all"))}${tabBtn("correct", t("correct"))}${tabBtn("wrong", t("wrong"))}${tabBtn("unanswered", t("unanswered"))}${tabBtn("unsure", t("notSure"))}${tabBtn("starred", "★ " + t("starred"))}
      </div>
      ${shown.length ? shown.map(r => `
        <div class="review-item ${r.status}">
          <div class="review-top">
            <span class="review-status">Q${r.i + 1} · ${statusLabel[r.status]}${r.unsure ? ` <span class="badge unsure-badge">${t("notSure")}</span>` : ""}</span>
            <button class="tool small-tool ${starred.has(r.q.id) ? "on" : ""}" data-star="${r.q.id}" title="${t("star")}">${starred.has(r.q.id) ? "★" : "☆"}</button>
          </div>
          <div class="q">${esc(r.q.q)}</div>
          ${r.status === "correct"
            ? `<div class="row right">${t("yourAnswer")}: ${LETTERS[r.ans]}. ${esc(r.q.c[r.ans])}</div>`
            : `<div class="row yours">${t("yourAnswer")}: ${r.ans === null ? t("noAnswer") : LETTERS[r.ans] + ". " + esc(r.q.c[r.ans])}</div>
               <div class="row right">${t("correctAnswer")}: ${LETTERS[r.q.a]}. ${esc(r.q.c[r.q.a])}</div>`}
          <div class="why">💡 ${esc(r.q.e)}</div>
        </div>`).join("") : `<div class="perfect">${t("nothingHere")}</div>`}
    `;

    app.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => {
      renderResults(b.dataset.f);
      document.querySelector(".review-title").scrollIntoView({ block: "start" });
    }));
    app.querySelectorAll("[data-star]").forEach(b => b.addEventListener("click", () => {
      const id = b.dataset.star; starred.has(id) ? starred.delete(id) : starred.add(id); saveStars();
      const y = window.scrollY; renderResults(filter); window.scrollTo(0, y);
    }));
    document.getElementById("exit").addEventListener("click", () => { const ex = S.exitTo || goHome; session = null; showTabbar(true); ex(); });
    document.getElementById("again").addEventListener("click", () => {
      const base = S.key.replace(/:retry$/, "");
      if (base === "mock") return startMock();
      if (SUBJECTS.some(x => x.id === base)) return startSubject(base);
      startSession(base, S.title.replace(/ \(.+\)$/, ""), S.items.map(q => byId.get(q.id)), S.exitTo, false);
    });
    const rw = document.getElementById("retryWrong");
    if (rw) rw.addEventListener("click", () => {
      const base = S.key.replace(/:retry$/, "");
      startSession(base + ":retry", S.title.replace(/ \(.+\)$/, "") + " (" + t("retry") + ")", missed.map(r => byId.get(r.q.id)), S.exitTo, false);
    });
    if (!filter || filter === "all") window.scrollTo(0, 0);
  }

  // Offline support when installed as a PWA (ignored where not allowed)
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    try { navigator.serviceWorker.register("sw.js").catch(() => {}); } catch (_) {}
  }

  // Shared with coach.js (AI chat) and pet.js
  window.CSApp = {
    analytics, subjects: SUBJECTS, passing: PASSING,
    subjName: id => sn(SUBJECTS.find(s => s.id === id)),
    profile: () => profile,
    startSubject, startMock, startStarred, startReview,
    // Current question for the coach. The answer key is included only after it's revealed.
    current: () => {
      if (!session || session.done) return null;
      const q = session.items[session.idx], ans = session.answers[session.idx];
      const revealed = session.instant && ans !== null;
      return { subject: sn(subjectOf(q)).name, sid: q.sid, question: q.q, choices: q.c, hint: q.h, revealed, answer: revealed ? q.c[q.a] : null, explanation: revealed ? q.e : null };
    }
  };

  if (!profile) renderSettings(true);
  else {
    openTab("learn");
    pet().setVisible(profile.pet !== false);
    setTimeout(() => pet().say(t("petHi", { name: profile.name ? " " + profile.name : "" }), 3200), 700);
  }
})();
