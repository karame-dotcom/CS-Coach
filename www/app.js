(function () {
  "use strict";

  const PASSING = 80;          // CSC passing rate for the Professional level
  const MOCK_SIZE = 30;
  const ROUND_SIZE = 10;       // questions per subject round
  const LETTERS = "ABCDEFGH";
  const app = document.getElementById("app");
  const backBtn = document.getElementById("backBtn");
  const settingsBtn = document.getElementById("settingsBtn");

  // ---------- storage (safe: may be unavailable in some web views) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  };
  let profile = store.get("cscoach.profile", null);           // { name, instant }
  let best = store.get("cscoach.best", {});                    // { key: pct }
  let starred = new Set(store.get("cscoach.starred", []));     // question ids
  const saveStars = () => store.set("cscoach.starred", [...starred]);
  let stats = store.get("cscoach.stats", {});                  // { qid: { n, c, last } }
  let history = store.get("cscoach.history", []);              // past sessions
  const pet = () => window.Pet || { cheer() {}, cry() {}, say() {}, hop() {}, setVisible() {} };

  // ---------- helpers ----------
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // Give every question a stable id and subject reference
  const byId = new Map();
  SUBJECTS.forEach(s => s.questions.forEach((q, i) => { q.id = s.id + "-" + i; q.sid = s.id; q.subject = s.name; byId.set(q.id, q); }));
  const allQuestions = () => SUBJECTS.flatMap(s => s.questions);
  const subjectOf = q => SUBJECTS.find(s => s.id === q.sid);

  // Pick questions for a round: unseen first, then ones you got wrong, then weakest
  function smartPick(qs, n) {
    const rank = q => {
      const st = stats[q.id];
      if (!st) return Math.random();
      if (!st.last) return 1 + Math.random();
      return 2 + st.c / st.n + Math.random() * 0.5;
    };
    return qs.map(q => [rank(q), q]).sort((a, b) => a[0] - b[0]).slice(0, n).map(x => x[1]);
  }

  // Analytics used by the home screen and the AI coach
  function analytics() {
    const subjects = SUBJECTS.map(s => {
      let seen = 0, attempts = 0, correct = 0, wrongNow = 0;
      s.questions.forEach(q => { const st = stats[q.id]; if (st) { seen++; attempts += st.n; correct += st.c; if (!st.last) wrongNow++; } });
      return { id: s.id, name: s.name, total: s.questions.length, seen, attempts, correct, wrongNow, acc: attempts ? Math.round(correct / attempts * 100) : null };
    });
    const attempts = subjects.reduce((a, x) => a + x.attempts, 0), correct = subjects.reduce((a, x) => a + x.correct, 0);
    const days = [...new Set(history.map(h => new Date(h.t).toDateString()))];
    let streak = 0; const d = new Date();
    if (!days.includes(d.toDateString())) d.setDate(d.getDate() - 1);
    while (days.includes(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
    const examDate = profile && profile.examDate ? profile.examDate : null;
    const daysLeft = examDate ? Math.ceil((new Date(examDate + "T08:00:00") - new Date()) / 86400000) : null;
    return {
      name: profile && profile.name || "", mode: profile && profile.instant ? "practice" : "exam",
      overall: { attempts, correct, acc: attempts ? Math.round(correct / attempts * 100) : null },
      subjects, sessions: history.length, recent: history.slice(-5).map(h => ({ title: h.title, pct: h.pct, date: new Date(h.t).toLocaleDateString() })),
      daysActive: days.length, streak, examDate, daysLeft, starred: starred.size, passing: PASSING
    };
  }

  function recordSession(S) {
    const by = {};
    S.items.forEach((q, i) => {
      const ans = S.answers[i]; if (ans === null) return;
      const ok = ans === q.a ? 1 : 0;
      const st = stats[q.id] || (stats[q.id] = { n: 0, c: 0, last: 0 });
      st.n++; st.c += ok; st.last = ok;
      const b = by[q.sid] || (by[q.sid] = { n: 0, c: 0 }); b.n++; b.c += ok;
    });
    const correct = S.items.filter((q, i) => S.answers[i] === q.a).length;
    history.push({ t: Date.now(), key: S.key, title: S.title, total: S.items.length, correct, pct: Math.round(correct / S.items.length * 100), by });
    history = history.slice(-100);
    store.set("cscoach.stats", stats); store.set("cscoach.history", history);
  }

  // Shuffle the choice order while tracking the correct answer
  function prepare(q) {
    const order = shuffle(q.c.map((_, i) => i));
    return { ...q, c: order.map(i => q.c[i]), a: order.indexOf(q.a) };
  }

  // ---------- navigation ----------
  let onBack = null;
  function setBack(fn) { onBack = fn; backBtn.classList.toggle("hidden", !fn); }
  backBtn.addEventListener("click", () => onBack && onBack());
  settingsBtn.addEventListener("click", () => {
    if (session && !session.done) return confirmBox("Leave this quiz to open Settings? Your answers in this session will be lost.", "Leave", () => { session = null; renderSettings(false); });
    renderSettings(false);
  });

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
      <div class="actions"><button class="btn secondary" data-n>Cancel</button><button class="btn" data-y>${esc(yesLabel)}</button></div>`,
      (w, close) => { w.querySelector("[data-n]").onclick = close; w.querySelector("[data-y]").onclick = () => { close(); onYes(); }; });
  }

  // ---------- setup / settings ----------
  function renderSettings(firstRun) {
    setBack(firstRun ? null : renderHome);
    settingsBtn.classList.toggle("hidden", firstRun);
    const p = profile || { name: "", instant: false, examDate: "", pet: true };
    app.innerHTML = `
      <h2>${firstRun ? "Welcome to CS Coach! 👋" : "Settings"}</h2>
      <p class="sub">${firstRun ? "Let's set up your reviewer. You can change these anytime in Settings (⚙️)." : "Your profile and how quizzes behave."}</p>
      <form id="setupForm" class="panel">
        <label class="field-label" for="name">Your name</label>
        <input id="name" class="input" type="text" maxlength="40" placeholder="e.g. Juan" value="${esc(p.name)}" autocomplete="given-name" />

        <div class="field-label" style="margin-top:18px">When should answers be revealed?</div>
        <label class="mode-opt">
          <input type="radio" name="mode" value="exam" ${!p.instant ? "checked" : ""} />
          <div><b>📝 Exam mode <span class="badge">Recommended</span></b>
          <span>Answer all questions first, like the real exam. You can change answers, flag questions you're unsure of, and see results only after you submit.</span></div>
        </label>
        <label class="mode-opt">
          <input type="radio" name="mode" value="instant" ${p.instant ? "checked" : ""} />
          <div><b>⚡ Practice mode</b>
          <span>See right away if each answer is correct, with an explanation. Answers lock once chosen.</span></div>
        </label>

        <label class="field-label" for="examDate" style="margin-top:18px">Exam date (optional)</label>
        <input id="examDate" class="input" type="date" value="${esc(p.examDate || "")}" />
        <p class="muted small" style="margin:6px 0 0">The AI coach uses this to plan your review schedule.</p>

        <label class="check-row"><input type="checkbox" id="petOn" ${p.pet !== false ? "checked" : ""} /> Show Kiko, my study buddy 🌱</label>

        <div class="actions"><button class="btn" type="submit">${firstRun ? "Start reviewing →" : "Save settings"}</button></div>
      </form>
      ${firstRun ? "" : `
        <div class="panel danger-zone">
          <b>Reset progress</b>
          <p class="sub" style="margin:4px 0 12px">Clears your scores, analytics and starred questions on this device.</p>
          <button class="btn secondary" id="resetBtn">Reset progress</button>
        </div>`}
      <p class="note">Your profile is saved only on this device.</p>
    `;
    document.getElementById("setupForm").addEventListener("submit", e => {
      e.preventDefault();
      profile = {
        name: document.getElementById("name").value.trim(),
        instant: app.querySelector("input[name=mode]:checked").value === "instant",
        examDate: document.getElementById("examDate").value,
        pet: document.getElementById("petOn").checked
      };
      pet().setVisible(profile.pet);
      store.set("cscoach.profile", profile);
      renderHome();
    });
    const reset = document.getElementById("resetBtn");
    if (reset) reset.addEventListener("click", () => confirmBox("Reset all scores, analytics and starred questions?", "Reset", () => {
      best = {}; starred = new Set(); stats = {}; history = [];
      store.set("cscoach.best", best); store.set("cscoach.stats", stats); store.set("cscoach.history", history); saveStars(); renderHome();
    }));
    window.scrollTo(0, 0);
  }

  // ---------- home ----------
  function renderHome() {
    session = null;
    setBack(null);
    settingsBtn.classList.remove("hidden");
    const total = allQuestions().length;
    const scores = Object.values(best);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    app.innerHTML = `
      <h2>${profile && profile.name ? `Hi, ${esc(profile.name)}! ` : ""}Choose a subject</h2>
      <p class="sub">Tap a subject to start a ${ROUND_SIZE}-question round. New and missed questions come first. Passing rate: ${PASSING}%.</p>
      <div class="hero">
        <div class="stat"><b>${total}</b><span>Questions</span></div>
        <div class="stat"><b>${starred.size}</b><span>Starred</span></div>
        <div class="stat"><b>${avg != null ? avg + "%" : "–"}</b><span>Avg. best score</span></div>
      </div>
      <div class="mode-chip">${profile.instant ? "⚡ Practice mode: answers shown right away" : "📝 Exam mode: answers shown after you submit"} · <button class="link" id="changeMode">Change</button></div>
      <div class="grid">
        <button class="card mock" data-id="mock">
          <span class="ico">📝</span>
          <h3>Full Mock Exam</h3>
          <p>${MOCK_SIZE} random questions from all subjects, like the real Professional exam.</p>
          <div class="meta"><span class="badge">${MOCK_SIZE} items</span><span>${best.mock != null ? "Best: " + best.mock + "%" : "Not taken yet"}</span></div>
        </button>
        ${starred.size ? `
          <button class="card starred-card" data-id="starred">
            <span class="ico">⭐</span>
            <h3>Starred Questions</h3>
            <p>Practice the questions you starred to come back to.</p>
            <div class="meta"><span class="badge blue">${starred.size} items</span></div>
          </button>` : ""}
        ${analytics().subjects.map(a => {
          const s = SUBJECTS.find(x => x.id === a.id);
          return `
          <button class="card" data-id="${s.id}">
            <span class="ico">${s.icon}</span>
            <h3>${esc(s.name)}</h3>
            <p>${esc(s.desc)}</p>
            <div class="mini-bar"><div style="width:${Math.round(a.seen / a.total * 100)}%"></div></div>
            <div class="meta">
              <span class="badge blue">${a.seen}/${a.total} practiced</span>
              <span>${a.acc != null ? `<span class="badge ${a.acc >= PASSING ? "" : "blue"}">${a.acc}% accuracy</span>` : "Not started"}</span>
            </div>
          </button>`;
        }).join("")}
      </div>
      <p class="note">ℹ️ These are practice questions written to match the coverage and format of the CSC Professional exam. The Civil Service Commission does not publish actual exam questions.</p>
    `;
    document.getElementById("changeMode").addEventListener("click", () => renderSettings(false));
    app.querySelectorAll(".card").forEach(btn => btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (id === "mock") return startMock();
      if (id === "starred") return startSession("starred", "Starred Questions", [...starred].map(i => byId.get(i)).filter(Boolean), renderHome);
      startSubject(id);
    }));
    window.scrollTo(0, 0);
  }

  function startMock() { startSession("mock", "Full Mock Exam", shuffle(allQuestions()).slice(0, MOCK_SIZE), renderHome); }

  function startSubject(id) {
    const s = SUBJECTS.find(x => x.id === id);
    startSession(s.id, s.name, smartPick(s.questions, ROUND_SIZE), renderHome);
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
    renderQuestion(true);
  }

  function leaveSession() {
    const answered = session.answers.some(a => a !== null);
    const exit = session.exitTo || renderHome;
    if (!answered) { session = null; return exit(); }
    confirmBox("Leave this quiz? Your answers in this session will be lost.", "Leave", () => { session = null; exit(); });
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
      <div class="quiz-head">
        <div>
          <div class="quiz-title">${esc(S.title)}</div>
          <div class="quiz-count">Question ${idx + 1} of ${items.length} · ${answeredCount} answered</div>
        </div>
        <button class="link" id="togglePal">${S.showPalette ? "Hide" : "Show"} overview</button>
      </div>
      <div class="progress"><div style="width:${Math.round(answeredCount / items.length * 100)}%"></div></div>
      ${S.showPalette ? `
        <div class="palette" id="palette">
          ${items.map((it, i) => `<button class="pal ${qState(i)} ${i === idx ? "current" : ""}" data-go="${i}" aria-label="Question ${i + 1}">${i + 1}${starred.has(it.id) ? '<i class="pal-star">★</i>' : ""}</button>`).join("")}
        </div>
        <div class="legend">
          ${S.instant
            ? `<span><i class="dot correct"></i>Correct</span><span><i class="dot wrong"></i>Wrong</span>`
            : `<span><i class="dot answered"></i>Answered</span><span><i class="dot unsure"></i>Not sure</span>`}
          <span><i class="dot"></i>Unanswered</span><span>★ Starred</span>
        </div>` : ""}

      <div class="qcard" id="qcard">
        <div class="qrow">
          <span class="qsubject">${esc(q.subject)}</span>
          <div class="qnav">
            <button class="arrow" id="prevBtn" ${idx === 0 ? "disabled" : ""} aria-label="Previous question" title="Previous">${ARROW_L}</button>
            <button class="arrow ${last ? "submit" : ""} ${locked && !last ? "pulse" : ""}" id="nextBtn" aria-label="${last ? "Review and submit" : "Next question"}" title="${last ? "Review & submit" : "Next"}">${ARROW_R}</button>
          </div>
        </div>
        <div class="qtools">
          <button class="tool ${isStar ? "on" : ""}" id="starBtn" aria-pressed="${isStar}" title="Star this question to come back to it">${isStar ? "★" : "☆"} <span>Star</span></button>
          <button class="tool help" id="helpBtn" title="Get coaching on how to answer">💡 <span>Help me</span></button>
        </div>
        <div class="qtext">${esc(q.q)}</div>
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
            <b>${ans === q.a ? "✅ Correct!" : "❌ Not quite. The answer is " + LETTERS[q.a] + ": " + esc(q.c[q.a])}</b>
            ${esc(q.e)}
          </div>` : `
          <button class="unsure-toggle ${isUnsure ? "on" : ""}" id="unsureBtn" aria-pressed="${isUnsure}">
            <span class="box">${isUnsure ? "✓" : ""}</span>
            <span>Not sure yet. Mark this to come back to it before submitting.</span>
          </button>`}
      </div>
      ${last
        ? `<div class="actions"><button class="btn" id="submitBtn">Review & Submit</button></div>`
        : `<div class="submit-row"><button class="link" id="submitEarly">Finish & submit all</button></div>`}
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
      if (on) pet().say("Starred! ⭐ Babalikan natin 'yan.");
      saveStars(); renderQuestion(false);
    });
    document.getElementById("helpBtn").addEventListener("click", () => showHelp(q));
    const ub = document.getElementById("unsureBtn");
    if (ub) ub.addEventListener("click", () => {
      S.unsure.has(idx) ? S.unsure.delete(idx) : (S.unsure.add(idx), pet().say("Okay! We'll come back to this one 👍"));
      renderQuestion(false);
    });
    document.getElementById("prevBtn").addEventListener("click", () => goTo(idx - 1));
    document.getElementById("nextBtn").addEventListener("click", goNext);
    const sb = document.getElementById("submitBtn");
    if (sb) sb.addEventListener("click", openSubmit);
    const se = document.getElementById("submitEarly");
    if (se) se.addEventListener("click", openSubmit);

    // Swipe left/right on the question card to navigate
    const card = document.getElementById("qcard");
    let sx = 0, sy = 0;
    card.addEventListener("touchstart", e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    card.addEventListener("touchend", e => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 70 && Math.abs(dy) < 45) dx < 0 ? goNext() : goTo(idx - 1);
    }, { passive: true });

    // Keep the current number visible in the one-line overview
    const pal = document.getElementById("palette");
    if (pal) {
      const cur = pal.children[idx];
      pal.scrollLeft = cur.offsetLeft - pal.clientWidth / 2 + cur.clientWidth / 2;
    }
    if (scrollTop) window.scrollTo(0, 0);
  }

  document.addEventListener("keydown", e => {
    if (!session || session.done || document.querySelector(".modal-bg") || /input|textarea/i.test(e.target.tagName)) return;
    if (e.key === "ArrowRight") goNext();
    if (e.key === "ArrowLeft") goTo(session.idx - 1);
  });

  function showHelp(q) {
    const s = subjectOf(q);
    modal(`
      <div class="modal-title">💡 Coach</div>
      <div class="coach-block">
        <div class="coach-label">How to approach this question</div>
        <p>${esc(q.h)}</p>
      </div>
      <div class="coach-block">
        <div class="coach-label">General strategy for ${esc(s.name)}</div>
        <ul>${s.tips.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
      </div>
      <p class="muted small">The coach guides you toward the answer but won't give it away. Try it yourself!</p>
      <div class="actions"><button class="btn" data-close>Got it</button></div>
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
      <div class="modal-title">${clean ? "Ready to submit?" : "Before you submit…"}</div>
      ${clean ? `<p class="modal-text">You've answered all ${S.items.length} questions. Once you submit, you'll see your score and a review.</p>` : ""}
      ${unanswered.length ? `
        <div class="sum-block">
          <div class="sum-label">⭕ Unanswered (${unanswered.length})</div>
          <div class="chips">${chips(unanswered, "")}</div>
        </div>` : ""}
      ${unsure.length ? `
        <div class="sum-block">
          <div class="sum-label">✓ Marked "not sure" (${unsure.length})</div>
          <div class="chips">${chips(unsure, "unsure")}</div>
        </div>` : ""}
      ${starIdx.length ? `
        <div class="sum-block">
          <div class="sum-label">★ Starred (${starIdx.length})</div>
          <div class="chips">${chips(starIdx, "star")}</div>
        </div>` : ""}
      ${!clean ? `<p class="muted small">Tap a number to go back to that question.${unanswered.length ? " Unanswered questions count as wrong." : ""}</p>` : ""}
      <div class="actions">
        <button class="btn secondary" data-back>Keep reviewing</button>
        <button class="btn" data-submit>Submit${unanswered.length ? " anyway" : ""}</button>
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
    setBack(S.exitTo || renderHome);
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
        ? pet().cheer(pct === 100 ? "PERFECT! Ang galing mo! 🏆" : "Pasado! " + pct + "%! 🎉")
        : pet().cry(pct >= 60 ? "Malapit na! " + pct + "%… kaya natin 'to! 💪" : "Huhu… " + pct + "%. Review tayo together 💙"), 300);
      const saveable = !S.key.endsWith(":retry") && S.key !== "starred";
      if (saveable && (best[S.key] == null || pct > best[S.key])) { best[S.key] = pct; store.set("cscoach.best", best); }
    }

    filter = filter || "all";
    const shown = rows.filter(r =>
      filter === "all" ? true :
      filter === "unsure" ? r.unsure :
      filter === "starred" ? starred.has(r.q.id) :
      r.status === filter);

    const tab = (id, label) => counts[id] || id === "all"
      ? `<button class="tab ${filter === id ? "active" : ""}" data-f="${id}">${label} <span>${counts[id]}</span></button>` : "";
    const statusLabel = { correct: "✅ Correct", wrong: "❌ Wrong", unanswered: "⭕ Unanswered" };

    app.innerHTML = `
      <div class="result-head">
        <h2>${esc(S.title)}</h2>
        <div class="ring" style="--p:${pct}"><div>${pct}%</div></div>
        <div class="verdict ${pct >= PASSING ? "pass" : "fail"}">
          ${pct >= PASSING ? "🎉 Passed! Great job" + (profile && profile.name ? ", " + esc(profile.name) : "") + "." : "Keep going. You need " + PASSING + "% to pass."}
        </div>
        <div class="result-stats">
          <span class="ok">✅ ${counts.correct} correct</span>
          <span class="no">❌ ${counts.wrong} wrong</span>
          ${counts.unanswered ? `<span>⭕ ${counts.unanswered} unanswered</span>` : ""}
        </div>
        <div class="actions">
          ${missed.length ? `<button class="btn" id="retryWrong">Retry ${missed.length} missed</button>` : ""}
          <button class="btn blue" id="again">${SUBJECTS.some(x => x.id === S.key) ? "Next round" : "Take again"}</button>
          <button class="btn secondary" id="exit">Done</button>
        </div>
      </div>

      <h3 class="review-title">📖 Review all answers</h3>
      <div class="tabs">
        ${tab("all", "All")}${tab("correct", "Correct")}${tab("wrong", "Wrong")}${tab("unanswered", "Unanswered")}${tab("unsure", "Not sure")}${tab("starred", "★ Starred")}
      </div>
      ${shown.length ? shown.map(r => `
        <div class="review-item ${r.status}">
          <div class="review-top">
            <span class="review-status">Q${r.i + 1} · ${statusLabel[r.status]}${r.unsure ? ' <span class="badge unsure-badge">Not sure</span>' : ""}</span>
            <button class="tool small-tool ${starred.has(r.q.id) ? "on" : ""}" data-star="${r.q.id}" title="Star">${starred.has(r.q.id) ? "★" : "☆"}</button>
          </div>
          <div class="q">${esc(r.q.q)}</div>
          ${r.status === "correct"
            ? `<div class="row right">Your answer: ${LETTERS[r.ans]}. ${esc(r.q.c[r.ans])}</div>`
            : `<div class="row yours">Your answer: ${r.ans === null ? "No answer" : LETTERS[r.ans] + ". " + esc(r.q.c[r.ans])}</div>
               <div class="row right">Correct answer: ${LETTERS[r.q.a]}. ${esc(r.q.c[r.q.a])}</div>`}
          <div class="why">💡 ${esc(r.q.e)}</div>
        </div>`).join("") : `<div class="perfect">Nothing here.</div>`}
    `;

    app.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => {
      renderResults(b.dataset.f);
      document.querySelector(".review-title").scrollIntoView({ block: "start" });
    }));
    app.querySelectorAll("[data-star]").forEach(b => b.addEventListener("click", () => {
      const id = b.dataset.star; starred.has(id) ? starred.delete(id) : starred.add(id); saveStars();
      const y = window.scrollY; renderResults(filter); window.scrollTo(0, y);
    }));
    document.getElementById("exit").addEventListener("click", () => { const ex = S.exitTo || renderHome; session = null; ex(); });
    document.getElementById("again").addEventListener("click", () => {
      const base = S.key.replace(/:retry$/, "");
      if (base === "mock") return startMock();
      if (SUBJECTS.some(x => x.id === base)) return startSubject(base);
      startSession(S.key, S.title, S.items.map(q => byId.get(q.id)), S.exitTo, false);
    });
    const rw = document.getElementById("retryWrong");
    if (rw) rw.addEventListener("click", () => {
      const base = S.key.replace(/:retry$/, "");
      startSession(base + ":retry", S.title.replace(/ \(retry\)$/, "") + " (retry)", missed.map(r => byId.get(r.q.id)), S.exitTo, false);
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
    profile: () => profile,
    startSubject, startMock,
    startStarred: () => starred.size && startSession("starred", "Starred Questions", [...starred].map(i => byId.get(i)).filter(Boolean), renderHome),
    // Current question for the coach. The answer key is included only after it's revealed.
    current: () => {
      if (!session || session.done) return null;
      const q = session.items[session.idx], ans = session.answers[session.idx];
      const revealed = session.instant && ans !== null;
      return { subject: q.subject, sid: q.sid, question: q.q, choices: q.c, hint: q.h, revealed, answer: revealed ? q.c[q.a] : null, explanation: revealed ? q.e : null };
    }
  };

  if (!profile) renderSettings(true);
  else {
    renderHome();
    pet().setVisible(profile.pet !== false);
    setTimeout(() => pet().say(`Hi${profile.name ? " " + profile.name : ""}! Ready to review? 🌱`, 3200), 700);
  }
})();
