// CS Coach: floating AI coach chat.
// Uses Claude via the artifact `sample` capability when available; otherwise a
// built-in coach that reasons over your local analytics. Built-in replies follow
// the language chosen in Settings; AI replies are always short, friendly Taglish.
(function () {
  "use strict";
  const A = () => window.CSApp;
  const t = (k, v) => window.I18N.t(k, v);
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

  // ---------- UI ----------
  const fab = document.createElement("button");
  fab.className = "coach-fab";
  const panel = document.createElement("div");
  panel.className = "coach-panel hidden";
  panel.setAttribute("role", "dialog");
  panel.innerHTML = `
    <div class="coach-head">
      <div class="coach-avatar">${window.Pet && window.Pet.avatar ? window.Pet.avatar() : "🌱"}</div>
      <div><b id="coachTitle"></b><span id="coachSub"></span></div>
      <button class="coach-x" aria-label="Close">✕</button>
    </div>
    <div class="coach-msgs" id="coachMsgs"></div>
    <div class="coach-chips" id="coachChips"></div>
    <div class="coach-input" id="coachForm" role="group">
      <textarea id="coachText" rows="1" name="kiko-chat-message" autocomplete="off" autocorrect="on" autocapitalize="sentences" spellcheck="true" enterkeyhint="send" aria-autocomplete="none" data-lpignore="true" data-form-type="other"></textarea>
      <button type="button" aria-label="Send">➤</button>
    </div>`;
  document.body.append(fab, panel);
  const msgs = panel.querySelector("#coachMsgs");
  const chips = panel.querySelector("#coachChips");
  const input = panel.querySelector("#coachText");
  const transcript = []; // { role, text }

  let sample = null;
  let focus = null;   // a specific question the student asked about (e.g. from the review list)
  const ctxQ = () => focus || (A() && A().current());
  function paintLabels() {
    fab.setAttribute("aria-label", t("coachTitle"));
    fab.innerHTML = `<span class="fab-ico">💬</span><span class="fab-label">Kiko</span>`;
    panel.querySelector("#coachTitle").textContent = t("coachTitle");
    if (window.Pet && window.Pet.avatar) panel.querySelector(".coach-avatar").innerHTML = window.Pet.avatar();
    panel.querySelector("#coachSub").textContent = sample ? t("coachSubAI") : t("coachSub");
    input.placeholder = t("askPh");
    renderChips();
  }
  paintLabels();
  document.addEventListener("cscoach:lang", () => { paintLabels(); msgs.innerHTML = ""; transcript.length = 0; });
  document.addEventListener("cscoach:pet", paintLabels);

  const connectAI = () => window.CSAI.get().then(s => { sample = s; paintLabels(); }).catch(() => {});
  connectAI();
  document.addEventListener("cscoach:ai", connectAI);

  function open(kind) {
    panel.classList.remove("hidden");
    fab.classList.add("open");
    if (window.Pet && window.Pet.setChatOpen) window.Pet.setChatOpen(true);
    document.body.classList.add("chat-open");
    if (window.CSBack) window.CSBack();   // phone Back closes the chat
    setTimeout(fitPanel, 0);
    if (!msgs.children.length) { greet(); maybeDonate(); }
    renderChips();
    if (kind) { addMsg("user", esc(chipLabel(kind)), chipLabel(kind)); reply(builtIn(kind)); }
    // On phones don't pop the keyboard right away, so the quick questions stay visible
    else if (!window.matchMedia("(pointer: coarse)").matches) setTimeout(() => input.focus(), 50);
  }
  function close() { focus = null; document.body.classList.remove("chat-open"); panel.classList.add("hidden"); fitPanel(); fab.classList.remove("open"); if (window.Pet && window.Pet.setChatOpen) window.Pet.setChatOpen(false); }
  const toggle = () => panel.classList.contains("hidden") ? open() : close();
  fab.addEventListener("click", toggle);
  panel.querySelector(".coach-x").addEventListener("click", close);
  // Explain a specific question (from the review list) step by step
  function explain(ctx) {
    focus = ctx;
    open();
    const label = t("chipExplain");
    addMsg("user", esc(label) + `<br><small>“${esc(ctx.question.length > 90 ? ctx.question.slice(0, 90) + "…" : ctx.question)}”</small>`, label + ": " + ctx.question);
    if (sample) askAI(label + ": " + ctx.question, true); else reply(builtIn("explain"));
  }
  const isOpen = () => !panel.classList.contains("hidden");
  window.CoachUI = { open, close, toggle, explain, isOpen };

  // Keep the phone keyboard open after sending: the Send button never steals focus
  const sendBtn = panel.querySelector(".coach-input button");
  ["pointerdown", "mousedown", "touchstart"].forEach(ev => sendBtn.addEventListener(ev, e => e.preventDefault(), { passive: false }));
  sendBtn.addEventListener("touchend", e => { e.preventDefault(); send(); }, { passive: false });
  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } });
  // grow the text box up to 4 lines while typing
  const grow = () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 96) + "px"; };
  input.addEventListener("input", grow);
  // Hide the quick-question buttons while typing (keyboard open) to save space
  input.addEventListener("focus", () => panel.classList.add("typing"));
  input.addEventListener("blur", () => panel.classList.remove("typing"));

  // Freeze the chat header on phones: fit the panel to the visible area above the keyboard
  const vv = window.visualViewport;
  function fitPanel() {
    if (panel.classList.contains("hidden") || window.innerWidth > 520) { panel.style.top = panel.style.height = panel.style.bottom = ""; return; }
    const h = vv ? vv.height : window.innerHeight, top = vv ? vv.offsetTop : 0;
    panel.style.top = (top + 8) + "px";
    panel.style.bottom = "auto";
    panel.style.height = (h - 16) + "px";
    msgs.scrollTop = msgs.scrollHeight;
  }
  if (vv) { vv.addEventListener("resize", fitPanel); vv.addEventListener("scroll", fitPanel); }
  window.addEventListener("resize", fitPanel);

  // every Kiko message gets the rounded avatar + name on top, like a chat with a friend
  const botHead = () => `<div class="chead"><span class="cav">${window.Pet && window.Pet.avatar ? window.Pet.avatar() : "🌱"}</span><span class="cname">${esc((window.I18N && window.I18N.petName) || "Kiko")}</span></div>`;
  function addMsg(role, html, text) {
    const div = document.createElement("div");
    div.className = "cmsg " + role;
    div.innerHTML = role === "bot" ? botHead() + `<div class="cbody">${html}</div>` : html;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    if (text !== undefined) transcript.push({ role, text });
    div.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => act(b.dataset.act)));
    return div;
  }
  // Now and then (max once every 3 days, after a few sessions) remind that donations help
  function maybeDonate() {
    const D = A() && A().donate;
    if (!D || !D.enabled()) return;
    let last = 0; try { last = +localStorage.getItem("cscoach.donLast") || 0; } catch (_) {}
    if (Date.now() - last < 3 * 86400000 || A().analytics().sessions < 2) return;
    try { localStorage.setItem("cscoach.donLast", String(Date.now())); } catch (_) {}
    setTimeout(() => addMsg("bot", `<div class="don-chat">${t("donChat")}</div><div class="cacts">${btn("donate", "💚 " + t("donTitle"))}</div>`, "donation note"), 900);
  }
  function act(a) {
    close();
    if (a === "donate") return A().donate.open();
    if (a.startsWith("lesson:")) return A().openLesson(a.slice(7));
    if (a === "mock") A().startMock();
    else if (a === "starred") A().startStarred();
    else if (a.startsWith("s:")) A().startSubject(a.slice(2));
  }
  const btn = (act, label) => `<button class="cbtn" data-act="${act}">${label}</button>`;
  function chipLabel(k) { return t({ analyze: "chipAnalyze", plan: "chipPlan", focus: "chipFocus", hint: "chipHint", tips: "chipTips", motivate: "chipMotivate", explain: "chipExplain", notgets: "chipNotGets" }[k]); }

  function renderChips() {
    if (!A()) return;
    const hasQ = !!ctxQ();
    const list = hasQ ? ["explain", "notgets", "hint", "analyze", "plan", "focus", "motivate"] : ["analyze", "plan", "focus", "tips", "motivate"];
    chips.innerHTML = list.map(k => `<button class="chip-q" data-k="${k}">${chipLabel(k)}</button>`).join("");
    chips.querySelectorAll(".chip-q").forEach(b => b.addEventListener("click", () => {
      addMsg("user", esc(b.textContent), b.textContent);
      const k = b.dataset.k;
      if ((k === "explain" || k === "notgets") && sample) askAI(b.textContent, true);
      else reply(builtIn(k === "notgets" ? "explain" : k));
    }));
  }
  function reply(html) {
    if (html === lastBotHtml) { const opts = t("clarify"); html = `<div class="muted small">${opts[Math.floor(Math.random() * opts.length)]}</div>` + html; }
    lastBotHtml = html;
    const typing = addMsg("bot", `<span class="typing"><i></i><i></i><i></i></span>`);
    setTimeout(() => {
      typing.remove();
      addMsg("bot", html, html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
      renderChips();
    }, 450);
  }

  function greet() {
    const a = A().analytics();
    addMsg("bot", `${t("greet", { name: a.name ? " " + esc(a.name) : "" })}
      ${a.overall.attempts ? t("greetStats", { n: a.overall.attempts, p: a.overall.acc }) : t("greetNoData")}
      <br>${t("greetTap")}`, "greeting");
  }


  // ---------- built-in tutor helpers ----------
  const words = s => (String(s || "").toLowerCase().match(/[a-zà-ÿñ']{3,}/g) || []);
  function lessonOf(lid) {
    const L = window.LESSONS || {};
    for (const sid in L) for (const l of L[sid]) if (l.id === lid) return l;
    return null;
  }
  // the lesson rule (key point) that best matches this question, with its examples
  function bestRule(c) {
    const l = lessonOf(c.lid);
    if (!l) return { rule: c.trick, examples: [], lesson: null };
    const qw = new Set(words(c.question + " " + (c.explanation || "") + " " + (c.hint || "")));
    let best = 0, bi = 0;
    l.points.forEach((p, i) => { const sc = words(p).filter(w => qw.has(w)).length; if (sc > best) { best = sc; bi = i; } });
    const ex = (window.LESSON_EXAMPLES && LESSON_EXAMPLES[l.id] && LESSON_EXAMPLES[l.id][bi]) || [];
    return { rule: best > 0 ? l.points[bi] : l.remember, examples: ex, lesson: l };
  }
  const explainLevel = {};   // per question: 1st, 2nd, 3rd time the student asks
  let lastBotHtml = "";

  // ---------- built-in coach (works offline) ----------
  const SUB = id => A().subjects.find(s => s.id === id);
  const NAME = id => A().subjName(id);
  const ranked = a => a.subjects.slice().sort((x, y) => (x.acc == null ? -1 : x.acc) - (y.acc == null ? -1 : y.acc));
  const bar = p => `<span class="cbar"><span style="width:${p || 0}%;background:${p >= 80 ? "var(--green)" : "var(--blue)"}"></span></span>`;

  function builtIn(kind, text) {
    const a = A().analytics();
    const tested = a.subjects.filter(s => s.acc != null);
    const r = ranked(a);
    const weakest = r[0], weakIcon = SUB(weakest.id).icon, weakTr = NAME(weakest.id);

    if (kind === "analyze") {
      if (!tested.length) return `${t("noData")}<div class="cacts">${a.subjects.map(s => btn("s:" + s.id, SUB(s.id).icon + " " + esc(s.name))).join("")}</div>`;
      const strong = tested.slice().sort((x, y) => y.acc - x.acc)[0];
      return `<b>${t("perfTitle")}</b><br>${t("overall", { p: a.overall.acc, n: a.overall.attempts, d: a.daysActive, s: a.streak })}
        <table class="ctable">${a.subjects.map(s => `<tr><td>${SUB(s.id).icon} ${esc(s.name)}</td><td>${s.acc == null ? `<span class="muted">${t("notYet")}</span>` : bar(s.acc) + " " + s.acc + "%"}</td></tr>`).join("")}</table>
        💪 <b>${t("strongest")}:</b> ${esc(strong.name)} (${strong.acc}%)<br>
        🎯 <b>${t("needsWork")}:</b> ${esc(weakest.name)} (${weakest.acc == null ? t("notTried") : weakest.acc + "%"})<br>
        ${a.overall.acc >= a.passing ? t("abovePass") : t("belowPass", { n: a.passing - a.overall.acc })}
        <div class="cacts">${btn("s:" + weakest.id, t("practiceNow", { i: weakIcon }))}</div>`;
    }

    if (kind === "plan") {
      const days = a.daysLeft && a.daysLeft > 0 ? a.daysLeft : null;
      const weak = r.filter(s => s.acc == null || s.acc < a.passing);
      const daily = [[r[0], 5], [r[1], 3], ...r.slice(2).map(s => [s, 2])];
      const total = daily.reduce((n, d) => n + d[1], 0);
      return `<b>${t("planTitle")}</b>${days ? t("daysUntil", { n: days }) : ""}<br>
        ${!tested.length ? t("diagnostic") + "<br>" : ""}
        <b>${t("daily", { n: total, m: Math.round(total * 1.2) })}</b>
        <ul>${daily.map(([s, n]) => `<li>${SUB(s.id).icon} <b>${t("qCount", { n })}</b> ${esc(s.name)} <span class="muted">(${s.acc != null ? s.acc + "%" : t("untested")})</span></li>`).join("")}
        <li>${t("retryStarred")}</li></ul>
        ${t("weekly", { f: days && days < 14 ? t("every3") : t("sunday") })}<br>
        <b>${t("focusWeek")}:</b> ${esc(weakTr.name)}. ${esc(weakTr.tips[0])}<br>
        <b>${t("goal")}:</b> ${t("goalText")} ${weak.length ? t("belowCount", { n: weak.length }) : t("thereNow")}
        ${days && days <= 7 ? "<br>" + t("finalWeek") : ""}
        ${!a.examDate ? `<br><span class="muted">${t("addDate")}</span>` : ""}
        <div class="cacts">${btn("s:" + weakest.id, t("startToday", { i: weakIcon }))}${btn("mock", t("mockBtn"))}</div>`;
    }

    if (kind === "focus") {
      if (!tested.length) return `${t("focusNoData")}<div class="cacts">${btn("s:numerical", "🔢 " + esc(NAME("numerical").name))}${btn("s:analytical", "🧩 " + esc(NAME("analytical").name))}</div>`;
      return `${t("focusOn", { s: esc(weakest.name) })}${weakest.acc != null ? t("focusAcc", { p: weakest.acc }) : t("focusUntried")}
        ${weakest.wrongNow ? " " + t("lastWrong", { n: weakest.wrongNow }) : ""}
        <br><b>${t("howImprove")}</b><ul>${weakTr.tips.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
        ${t("aim5")}
        <div class="cacts">${btn("s:" + weakest.id, t("practiceNow", { i: weakIcon }))}</div>`;
    }

    if (kind === "hint") {
      const c = A().current();
      if (!c) return t("openFirst");
      return `<b>${t("hintTitle")}</b><br>${esc(c.hint)}<br><br><b>${t("strategyFor", { s: esc(c.subject) })}</b> ${esc(NAME(c.sid).tips[0])}
        ${c.revealed ? `<br><br><b>${t("whyAnswer", { a: esc(c.answer) })}</b> ${esc(c.explanation)}` : `<br><br><span class="muted">${t("wontReveal")}</span>`}`;
    }

    if (kind === "explain") {
      const c = ctxQ();
      if (!c) return t("openFirst");
      const L = "ABCD", key = c.question;
      const level = explainLevel[key] = (explainLevel[key] || 0) + 1;
      const br = bestRule(c);
      if (level === 1) {
        return `<div class="ex-sec"><b>${t("exBreak")}</b>
            <div><i>${t("exAsks")}:</i> ${esc(c.question)}</div>
            <div><i>${t("exChoices")}:</i> ${c.choices.map((x, i) => `<span class="ex-choice">${L[i]}. ${esc(x)}</span>`).join(" ")}</div></div>
          <div class="ex-sec"><b>${t("exSteps")}</b><ol>
            <li>${t("exStep1", { s: esc(c.topic || c.subject) })}</li>
            <li>${t("exStep2", { h: esc(c.hint) })}</li>
            <li>${t("exStep3")}</li>
            <li>${c.revealed ? t("exStep4Revealed", { e: esc(c.explanation) }) : t("exStep4Hidden")}</li></ol>
            ${c.revealed ? `<div class="ex-answer">${t("exAnswer", { a: esc(c.answerLetter + ". " + c.answer) })}</div>` : ""}</div>
          <div class="ex-sec trick"><b>${t("exTrick")}</b><div>${esc(br.rule)}</div></div>`;
      }
      if (level === 2) {
        const tryEach = c.revealed
          ? `${c.studentAnswer && c.studentAnswer !== c.answer ? `<div>${t("exYouPicked", { x: "<b>" + esc(c.studentAnswer) + "</b>" })}</div>` : ""}
             <ul class="ex-try">${c.choices.map((x, i) => x === c.answer
                ? `<li class="ok">✅ ${L[i]}. ${esc(x)}: ${t("exFits")}</li>`
                : `<li class="no">❌ ${L[i]}. ${esc(x)}: ${t("exNoFit")}</li>`).join("")}</ul>`
          : `<div>${t("exHiddenTry")}</div>`;
        return `<div>${t("exSimpler")}</div>
          <div class="ex-sec trick"><b>${t("exRule")}</b><div>${esc(br.rule)}</div></div>
          ${br.examples.length ? `<div class="ex-sec"><b>${t("exSimilar")}</b><ul>${br.examples.map(([q, a]) => `<li>${esc(q)} → <b>${esc(a)}</b></li>`).join("")}</ul></div>` : ""}
          <div class="ex-sec"><b>${t("exTryEach")}</b>${tryEach}</div>`;
      }
      explainLevel[key] = 0;   // next request starts over
      return `${t("exStill")}
        <div class="cacts">${br.lesson && A().lessonsOn ? btn("lesson:" + br.lesson.id, t("openLesson")) : ""}${btn("s:" + c.sid, t("practiceNow", { i: SUB(c.sid).icon }))}</div>`;
    }

    if (kind === "tips") return `<b>${t("tipsTitle")}</b><ul>${t("examTips").map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;

    if (kind === "motivate") {
      const lines = t("motiv");
      return `${lines[Math.floor(Math.random() * lines.length)]}<br>${a.streak ? t("streak", { n: a.streak }) : t("startStreak")}
        <div class="cacts">${btn("s:" + weakest.id, t("do10"))}</div>`;
    }

    // keyword routing for typed questions (English and Filipino keywords)
    const q = (text || "").toLowerCase().trim();
    if (/^(what|wut|huh|ha|ano|ano daw|eh|hmm+|\?+|i don'?t get it|don'?t get it|hindi ko gets|di ko gets|hindi ko maintindihan|di ko maintindihan|confused|nalilito)\W*$/.test(q)) {
      if (ctxQ()) return builtIn("explain");
      const opts = t("clarify"); return opts[Math.floor(Math.random() * opts.length)];
    }
    if (ctxQ() && /explain|hindi ko (ma)?gets|di ko gets|hindi ko maintindihan|di ko maintindihan|ipaliwanag|paliwanag|bakit|paano|why|how|confus|gulo|step by step/.test(q)) return builtIn("explain");
    if (/analy|perform|score|stat|progress|how am i|result|resulta|kumusta ako/.test(q)) return builtIn("analyze");
    if (/plan|strateg|schedule|routine|study|araw-araw|daily|week|linggo/.test(q)) return builtIn("plan");
    if (/weak|focus|improve|mahina|what should|ano dapat|pagtuunan/.test(q)) return builtIn("focus");
    if (/hint|this question|tanong na ito|help|tulong/.test(q)) return builtIn("hint");
    if (/motivat|tired|pagod|give up|nervous|kaba|stress|sad|lungkot|suko/.test(q)) return builtIn("motivate");
    const subj = A().subjects.find(s => q.includes(s.id) || (s.id === "numerical" && /math|number|compute|numer/.test(q)) || (s.id === "geninfo" && /constitution|konstitusyon|law|batas|ra |general/.test(q)) || (s.id === "verbal" && /english|ingles|grammar|vocab/.test(q)) || (s.id === "filipino" && /filipino|tagalog/.test(q)) || (s.id === "analytical" && /logic|lohika|analytic|reason/.test(q)));
    if (subj) { const tr = NAME(subj.id); return `<b>${subj.icon} ${t("tipsFor", { s: esc(tr.name) })}</b><ul>${tr.tips.map(x => `<li>${esc(x)}</li>`).join("")}</ul><div class="cacts">${btn("s:" + subj.id, t("practiceNow", { i: subj.icon }))}</div>`; }
    if (/exam day|tip|bring|dalhin|time|oras/.test(q)) return builtIn("tips");
    return t("canHelp");
  }

  // ---------- AI (Claude) ----------
  function mdLite(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/^#{1,3} (.+)$/gm, "<b>$1</b>")
      .replace(/^\s*[-•*] (.+)$/gm, "<li>$1</li>")
      .replace(/^\s*\d+[.)] (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, "<ul>$1</ul>")
      .replace(/\n/g, "<br>").replace(/<\/li><br>/g, "</li>").replace(/<ul><br>/g, "<ul>");
  }

  async function askAI(text, wantExplain) {
    const a = A().analytics(), cur = ctxQ();
    const context = {
      student: a,
      subjects: A().subjects.map(s => ({ id: s.id, name: NAME(s.id).name, tips: NAME(s.id).tips })),
      currentQuestion: cur ? {
        subject: cur.subject, question: cur.question, choices: cur.choices, coachHint: cur.hint,
        answerRevealed: cur.revealed, answer: cur.answer, explanation: cur.explanation,
        studentAnswer: cur.studentAnswer, topic: cur.topic, keyTrickFromLesson: cur.trick
      } : null,
      today: new Date().toDateString()
    };
    const instructions = `You are Kiko, the student's smartest friend and study bestie inside CS Coach, a reviewer app for the Philippine Civil Service Exam (Professional level, passing rate 80%). Subjects: Verbal Ability (English and Filipino), Numerical Ability, Analytical Ability, General Information (1987 Constitution, RA 6713, peace and human rights, environment).
LANGUAGE: Reply in casual, natural Taglish, like texting a close friend who happens to be really good at this stuff.
PERSONALITY: Warm, playful, upbeat and chill. It should feel like chatting, never like studying or being tested. Celebrate small wins, tease lightly and kindly only when it fits (e.g. "ayy bitin, isa pa?"), never shame, roast, or lecture. If they sound tired, stressed, sad or ready to quit, be extra gentle and encouraging.
LENGTH: 1-2 short sentences, like a chat message, not an essay. Use 1-2 emojis per message. No headings. Use a short bullet list only when actually giving a list (e.g. a study plan or targets); keep each bullet a few words.
Use the student's analytics below when relevant: mention real numbers (weak/strong subjects, accuracy, streak, days left before the exam). Mention the "Mistakes & Starred" review set when they have mistakes. The app has tabs: Practice, Analytics, Kiko (chat), Calendar, Settings.
IMPORTANT: if currentQuestion.answerRevealed is false, NEVER reveal or hint at which choice is correct. Only coach the method. If it is true, you may explain the answer.
EXPLAIN FORMAT: when the student asks you to explain, says they don't get it (e.g. "hindi ko gets", "di ko maintindihan", "bakit", "paano", "explain further"), or asks about currentQuestion, give a short step-by-step: one quick friendly line, then at most 3 numbered steps (one short sentence each) showing how to get the answer, then one line starting with "💡 Trick:" for similar questions. Under 80 words. If they answered wrong, point out where they went off. If answerRevealed is false, stop right before naming the correct choice.
Do not claim the app's questions are actual past CSC exam questions; they are practice items.

APP DATA (JSON):
${JSON.stringify(context)}`;
    const history = transcript.filter(m => m.text && m.text !== "greeting").slice(-10);
    const messages = [];
    history.forEach(m => messages.push({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
    while (messages.length && messages[0].role !== "user") messages.shift();
    if (!messages.length || messages[messages.length - 1].role !== "user") messages.push({ role: "user", content: text });
    messages[0] = { role: "user", content: instructions + "\n\nSTUDENT: " + messages[0].content };
    const merged = [];
    messages.forEach(m => { const l = merged[merged.length - 1]; if (l && l.role === m.role) l.content += "\n" + m.content; else merged.push({ ...m }); });

    if (wantExplain && merged.length) merged[merged.length - 1].content += "\n(Please use the EXPLAIN FORMAT for currentQuestion.)";
    const bubble = addMsg("bot", `<span class="typing"><i></i><i></i><i></i></span>`);
    try {
      const res = await sample(merged, { cache: false, onText: ({ text }) => { bubble.querySelector(".cbody").innerHTML = mdLite(text); msgs.scrollTop = msgs.scrollHeight; } });
      bubble.querySelector(".cbody").innerHTML = mdLite(res.text);
      transcript.push({ role: "bot", text: res.text });
      const r = ranked(a)[0];
      bubble.querySelector(".cbody").insertAdjacentHTML("beforeend", `<div class="cacts">${btn("s:" + r.id, t("practiceNow", { i: SUB(r.id).icon }))}${btn("mock", t("mockBtn"))}</div>`);
      bubble.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => act(b.dataset.act)));
    } catch (e) {
      bubble.remove();
      if (e && e.code === "not_granted") { sample = null; paintLabels(); }
      const note = e && e.code === "bad_key" ? t("aiBadKey") : e && (e.code === "rate_limited" || e.code === "offline" || e.code === "error") ? t("aiBusy") : "";
      reply(builtIn("text", text) + (note ? `<br><span class="muted">${note}</span>` : ""));
    }
  }

  // The chat box is not a <form>, so browsers don't show their autofill bar (passwords, cards, addresses)
  function send() {
    const text = input.value.trim();
    if (!text) return;
    input.value = ""; input.style.height = "auto";
    input.focus({ preventScroll: true });
    addMsg("user", esc(text), text);
    const wants = !!ctxQ() && /explain|gets|maintindihan|paliwanag|bakit|paano|why|how|confus|gulo|step/i.test(text);
    if (sample) askAI(text, wants); else reply(builtIn("text", text));
  }
})();
