(function () {
  "use strict";

  const PASSING = 80;          // CSC passing rate for the Professional level
  const MOCK_SIZE = 30;
  const SET_SIZE = window.SET_SIZE || 10;
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

  // ---------- helpers ----------
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // Give every question a stable id and subject reference
  const byId = new Map();
  SUBJECTS.forEach(s => s.questions.forEach((q, i) => { q.id = s.id + "-" + i; q.sid = s.id; q.subject = s.name; byId.set(q.id, q); }));
  const allQuestions = () => SUBJECTS.flatMap(s => s.questions);
  const subjectOf = q => SUBJECTS.find(s => s.id === q.sid);
  const setsOf = s => Array.from({ length: Math.ceil(s.questions.length / SET_SIZE) }, (_, i) => s.questions.slice(i * SET_SIZE, (i + 1) * SET_SIZE));

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
    const p = profile || { name: "", instant: false };
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

        <div class="actions"><button class="btn" type="submit">${firstRun ? "Start reviewing →" : "Save settings"}</button></div>
      </form>
      ${firstRun ? "" : `
        <div class="panel danger-zone">
          <b>Reset progress</b>
          <p class="sub" style="margin:4px 0 12px">Clears your best scores and starred questions on this device.</p>
          <button class="btn secondary" id="resetBtn">Reset progress</button>
        </div>`}
      <p class="note">Your profile is saved only on this device.</p>
    `;
    document.getElementById("setupForm").addEventListener("submit", e => {
      e.preventDefault();
      profile = {
        name: document.getElementById("name").value.trim(),
        instant: app.querySelector("input[name=mode]:checked").value === "instant"
      };
      store.set("cscoach.profile", profile);
      renderHome();
    });
    const reset = document.getElementById("resetBtn");
    if (reset) reset.addEventListener("click", () => confirmBox("Reset all best scores and starred questions?", "Reset", () => {
      best = {}; starred = new Set(); store.set("cscoach.best", best); saveStars(); renderHome();
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
      <p class="sub">Each subject has sets of ${SET_SIZE} questions. Passing rate: ${PASSING}%.</p>
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
        ${SUBJECTS.map(s => {
          const sets = setsOf(s);
          const done = sets.filter((_, i) => best[s.id + ":" + (i + 1)] != null).length;
          return `
          <button class="card" data-id="${s.id}">
            <span class="ico">${s.icon}</span>
            <h3>${esc(s.name)}</h3>
            <p>${esc(s.desc)}</p>
            <div class="meta">
              <span class="badge blue">${sets.length} sets · ${s.questions.length} items</span>
              <span>${done ? `<span class="badge">${done}/${sets.length} done</span>` : "Not started"}</span>
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
      renderSubject(SUBJECTS.find(x => x.id === id));
    }));
    window.scrollTo(0, 0);
  }

  function startMock() { startSession("mock", "Full Mock Exam", shuffle(allQuestions()).slice(0, MOCK_SIZE), renderHome); }

  // ---------- subject: choose a set ----------
  function renderSubject(s) {
    setBack(renderHome);
    const sets = setsOf(s);
    app.innerHTML = `
      <h2>${s.icon} ${esc(s.name)}</h2>
      <p class="sub">${esc(s.desc)}</p>
      <div class="set-list">
        ${sets.map((qs, i) => {
          const key = s.id + ":" + (i + 1), b = best[key];
          return `
          <button class="set-item" data-set="${i}">
            <div class="set-num">${i + 1}</div>
            <div class="set-info"><b>Set ${i + 1}</b><span>Questions ${i * SET_SIZE + 1}–${i * SET_SIZE + qs.length}</span></div>
            <div class="set-score">${b != null ? `<span class="badge ${b >= PASSING ? "" : "blue"}">${b >= PASSING ? "✓ " : ""}Best ${b}%</span>` : `<span class="muted">Start →</span>`}</div>
          </button>`;
        }).join("")}
        <button class="set-item all" data-set="all">
          <div class="set-num">∞</div>
          <div class="set-info"><b>All ${s.questions.length} questions</b><span>Every set combined, shuffled</span></div>
          <div class="set-score">${best[s.id + ":all"] != null ? `<span class="badge blue">Best ${best[s.id + ":all"]}%</span>` : `<span class="muted">Start →</span>`}</div>
        </button>
      </div>
      <div class="panel tips">
        <b>💡 Coach's tips for this subject</b>
        <ul>${s.tips.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
      </div>
    `;
    app.querySelectorAll(".set-item").forEach(btn => btn.addEventListener("click", () => {
      const v = btn.dataset.set, back = () => renderSubject(s);
      if (v === "all") return startSession(s.id + ":all", s.name + " · All", s.questions, back);
      const n = +v;
      startSession(s.id + ":" + (n + 1), s.name + " · Set " + (n + 1), sets[n], back, true);
    }));
    window.scrollTo(0, 0);
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
        <div class="palette">
          ${items.map((it, i) => `<button class="pal ${qState(i)} ${i === idx ? "current" : ""}" data-go="${i}" aria-label="Question ${i + 1}">${i + 1}${starred.has(it.id) ? '<i class="pal-star">★</i>' : ""}</button>`).join("")}
        </div>
        <div class="legend">
          ${S.instant
            ? `<span><i class="dot correct"></i>Correct</span><span><i class="dot wrong"></i>Wrong</span>`
            : `<span><i class="dot answered"></i>Answered</span><span><i class="dot unsure"></i>Not sure</span>`}
          <span><i class="dot"></i>Unanswered</span><span>★ Starred</span>
        </div>` : ""}

      <div class="qcard">
        <div class="qrow">
          <span class="qsubject">${esc(q.subject)}</span>
          <div class="qtools">
            <button class="tool ${isStar ? "on" : ""}" id="starBtn" aria-pressed="${isStar}" title="Star this question to come back to it">${isStar ? "★" : "☆"} <span>Star</span></button>
            <button class="tool help" id="helpBtn" title="Get coaching on how to answer">💡 <span>Help me</span></button>
          </div>
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

      <div class="nav">
        <button class="btn secondary" id="prevBtn" ${idx === 0 ? "disabled" : ""}>← Previous</button>
        ${last
          ? `<button class="btn" id="submitBtn">Review & Submit</button>`
          : `<button class="btn blue" id="nextBtn">Next →</button>`}
      </div>
      ${!last ? `<div class="submit-row"><button class="link" id="submitEarly">Finish & submit all</button></div>` : ""}
    `;

    const go = i => { S.idx = i; renderQuestion(true); };
    app.querySelectorAll(".pal").forEach(b => b.addEventListener("click", () => go(+b.dataset.go)));
    document.getElementById("togglePal").addEventListener("click", () => { S.showPalette = !S.showPalette; renderQuestion(false); });
    app.querySelectorAll(".choice").forEach(b => b.addEventListener("click", () => {
      const i = +b.dataset.i;
      if (locked) return;
      S.answers[idx] = (!S.instant && S.answers[idx] === i) ? null : i;   // tap again to clear (exam mode)
      if (S.instant) S.unsure.delete(idx);
      renderQuestion(false);
    }));
    document.getElementById("starBtn").addEventListener("click", () => {
      starred.has(q.id) ? starred.delete(q.id) : starred.add(q.id);
      saveStars(); renderQuestion(false);
    });
    document.getElementById("helpBtn").addEventListener("click", () => showHelp(q));
    const ub = document.getElementById("unsureBtn");
    if (ub) ub.addEventListener("click", () => { S.unsure.has(idx) ? S.unsure.delete(idx) : S.unsure.add(idx); renderQuestion(false); });
    document.getElementById("prevBtn").addEventListener("click", () => idx > 0 && go(idx - 1));
    const nb = document.getElementById("nextBtn");
    if (nb) nb.addEventListener("click", () => go(idx + 1));
    const sb = document.getElementById("submitBtn") || null;
    if (sb) sb.addEventListener("click", openSubmit);
    const se = document.getElementById("submitEarly");
    if (se) se.addEventListener("click", openSubmit);

    if (scrollTop) window.scrollTo(0, 0);
  }

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
          <button class="btn blue" id="again">Take again</button>
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

  if (!profile) renderSettings(true); else renderHome();
})();
