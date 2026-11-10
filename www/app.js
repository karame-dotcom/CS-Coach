(function () {
  "use strict";

  const PASSING = 80; // CSC passing rate for the Professional level
  const MOCK_SIZE = 30;
  const app = document.getElementById("app");
  const backBtn = document.getElementById("backBtn");
  const LETTERS = "ABCDEFGH";

  // ---------- storage (safe) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  };
  let best = store.get("cscoach.best", {});

  // ---------- helpers ----------
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const allQuestions = () => SUBJECTS.flatMap(s => s.questions.map(q => ({ ...q, subject: s.name })));

  // Shuffle the choice order while tracking the correct answer
  function prepare(q) {
    const order = shuffle(q.c.map((_, i) => i));
    return { ...q, c: order.map(i => q.c[i]), a: order.indexOf(q.a) };
  }

  // ---------- state ----------
  let session = null; // { id, title, items, idx, answers: [] }

  function startSession(id, title, items) {
    session = { id, title, items: shuffle(items).map(prepare), idx: 0, answers: [] };
    renderQuestion();
  }

  // ---------- views ----------
  function renderHome() {
    session = null;
    backBtn.classList.add("hidden");
    const total = SUBJECTS.reduce((n, s) => n + s.questions.length, 0);
    const attempted = Object.keys(best).length;
    const avg = attempted ? Math.round(Object.values(best).reduce((a, b) => a + b, 0) / attempted) : 0;

    app.innerHTML = `
      <h2>Choose a subject</h2>
      <p class="sub">Practice by subject, or take a full mock exam. Passing rate: ${PASSING}%.</p>
      <div class="hero">
        <div class="stat"><b>${total}</b><span>Questions</span></div>
        <div class="stat"><b>${SUBJECTS.length}</b><span>Subjects</span></div>
        <div class="stat"><b>${attempted ? avg + "%" : "–"}</b><span>Avg. best score</span></div>
      </div>
      <div class="grid">
        <button class="card mock" data-id="mock">
          <span class="ico">📝</span>
          <h3>Full Mock Exam</h3>
          <p>${MOCK_SIZE} random questions from all subjects, like the real Professional exam.</p>
          <div class="meta"><span class="badge">${MOCK_SIZE} items</span><span>${best.mock != null ? "Best: " + best.mock + "%" : "Not taken yet"}</span></div>
        </button>
        ${SUBJECTS.map(s => `
          <button class="card" data-id="${s.id}">
            <span class="ico">${s.icon}</span>
            <h3>${esc(s.name)}</h3>
            <p>${esc(s.desc)}</p>
            <div class="meta">
              <span class="badge blue">${s.questions.length} items</span>
              <span>${best[s.id] != null ? `<span class="badge">Best: ${best[s.id]}%</span>` : "Not taken yet"}</span>
            </div>
          </button>`).join("")}
      </div>
      <p class="note">ℹ️ These are practice questions written to match the coverage and format of the CSC Professional exam: Verbal (English and Filipino), Numerical, Analytical, and General Information (the Constitution, RA 6713, human rights, and environment). The Civil Service Commission does not publish actual exam questions.</p>
    `;
    app.querySelectorAll(".card").forEach(btn => btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (id === "mock") return startSession("mock", "Full Mock Exam", shuffle(allQuestions()).slice(0, MOCK_SIZE));
      const s = SUBJECTS.find(x => x.id === id);
      startSession(s.id, s.name, s.questions.map(q => ({ ...q, subject: s.name })));
    }));
    window.scrollTo(0, 0);
  }

  function renderQuestion() {
    backBtn.classList.remove("hidden");
    const { items, idx } = session;
    const q = items[idx];
    const pct = Math.round((idx / items.length) * 100);
    app.innerHTML = `
      <div class="progress-wrap">
        <span>${idx + 1} / ${items.length}</span>
        <div class="progress"><div style="width:${pct}%"></div></div>
        <span>${session.answers.filter(a => a.correct).length} ✓</span>
      </div>
      <div class="qcard">
        <div class="qsubject">${esc(q.subject)}</div>
        <div class="qtext">${esc(q.q)}</div>
        <div class="choices">
          ${q.c.map((c, i) => `<button class="choice" data-i="${i}"><span class="letter">${LETTERS[i]}</span><span>${esc(c)}</span></button>`).join("")}
        </div>
        <div id="fb"></div>
        <div class="actions hidden" id="nextWrap">
          <button class="btn" id="nextBtn">${idx + 1 === items.length ? "See results" : "Next question →"}</button>
        </div>
      </div>
    `;
    app.querySelectorAll(".choice").forEach(btn => btn.addEventListener("click", () => answer(+btn.dataset.i)));
    window.scrollTo(0, 0);
  }

  function answer(choice) {
    const q = session.items[session.idx];
    const correct = choice === q.a;
    session.answers.push({ q, choice, correct });

    app.querySelectorAll(".choice").forEach((b, i) => {
      b.disabled = true;
      if (i === q.a) b.classList.add("correct");
      else if (i === choice) b.classList.add("wrong");
    });
    document.getElementById("fb").innerHTML = `
      <div class="feedback ${correct ? "ok" : "no"}">
        <b>${correct ? "✅ Correct!" : "❌ Not quite. The answer is " + LETTERS[q.a] + ": " + esc(q.c[q.a])}</b>
        ${esc(q.e)}
      </div>`;
    const wrap = document.getElementById("nextWrap");
    wrap.classList.remove("hidden");
    const next = document.getElementById("nextBtn");
    next.focus({ preventScroll: true });
    next.addEventListener("click", () => {
      session.idx++;
      if (session.idx < session.items.length) renderQuestion();
      else renderResults();
    });
    wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function renderResults() {
    const { answers, id, title } = session;
    const score = answers.filter(a => a.correct).length;
    const pct = Math.round((score / answers.length) * 100);
    const wrong = answers.filter(a => !a.correct);
    const isRetry = id.endsWith(":retry");

    if (!isRetry && (best[id] == null || pct > best[id])) { best[id] = pct; store.set("cscoach.best", best); }

    app.innerHTML = `
      <div class="result-head">
        <h2>${esc(title)}</h2>
        <div class="ring" style="--p:${pct}"><div>${pct}%</div></div>
        <div class="verdict ${pct >= PASSING ? "pass" : "fail"}">
          ${pct >= PASSING ? "🎉 Passed! Great job." : "Keep going. You need " + PASSING + "% to pass."}
        </div>
        <p class="sub" style="margin:6px 0 0">${score} of ${answers.length} correct</p>
        <div class="actions">
          ${wrong.length ? `<button class="btn" id="retryWrong">Retry ${wrong.length} wrong</button>` : ""}
          <button class="btn blue" id="again">Take again</button>
          <button class="btn secondary" id="home">Subjects</button>
        </div>
      </div>
      ${wrong.length ? `
        <h3 class="review-title">📖 Review: questions you got wrong (${wrong.length})</h3>
        ${wrong.map((a, n) => `
          <div class="review-item">
            <div class="q">${n + 1}. ${esc(a.q.q)}</div>
            <div class="row yours">Your answer: ${LETTERS[a.choice]}. ${esc(a.q.c[a.choice])}</div>
            <div class="row right">Correct answer: ${LETTERS[a.q.a]}. ${esc(a.q.c[a.q.a])}</div>
            <div class="why">💡 ${esc(a.q.e)}</div>
          </div>`).join("")}
      ` : `<div class="perfect">🏆 Perfect score! You got every question right.</div>`}
    `;
    const original = session;
    document.getElementById("home").addEventListener("click", renderHome);
    document.getElementById("again").addEventListener("click", () => {
      const baseId = id.replace(":retry", "");
      if (baseId === "mock") return startSession("mock", "Full Mock Exam", shuffle(allQuestions()).slice(0, MOCK_SIZE));
      const s = SUBJECTS.find(x => x.id === baseId);
      startSession(s.id, s.name, s.questions.map(q => ({ ...q, subject: s.name })));
    });
    const rw = document.getElementById("retryWrong");
    if (rw) rw.addEventListener("click", () => {
      // Restore each question's original choice order before re-preparing
      const items = wrong.map(a => a.q);
      startSession(original.id.replace(":retry", "") + ":retry", original.title.replace(/ \(retry\)$/, "") + " (retry)", items);
    });
    window.scrollTo(0, 0);
  }

  backBtn.addEventListener("click", () => {
    if (session && session.answers.length && session.idx < session.items.length) {
      showConfirm("Leave this quiz? Your progress in this session will be lost.", renderHome);
    } else renderHome();
  });

  // In-page confirm dialog (native confirm() is blocked in some web views)
  function showConfirm(msg, onYes) {
    const box = document.createElement("div");
    box.style.cssText = "position:fixed;inset:0;background:rgba(15,42,61,.45);display:grid;place-items:center;z-index:50;padding:20px";
    box.innerHTML = `<div class="qcard" style="max-width:360px;width:100%"><p style="margin:0 0 14px;line-height:1.5">${esc(msg)}</p>
      <div class="actions" style="margin-top:0"><button class="btn secondary" data-n>Stay</button><button class="btn" data-y>Leave</button></div></div>`;
    document.body.appendChild(box);
    box.querySelector("[data-n]").onclick = () => box.remove();
    box.querySelector("[data-y]").onclick = () => { box.remove(); onYes(); };
  }

  // Offline support when installed as a PWA (ignored where not allowed)
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    try { navigator.serviceWorker.register("sw.js").catch(() => {}); } catch (_) {}
  }

  renderHome();
})();
