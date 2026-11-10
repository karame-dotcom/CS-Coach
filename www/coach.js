// CS Coach: floating AI coach chat.
// Uses Claude via the artifact `sample` capability when available; otherwise a
// built-in coach that reasons over your local analytics.
(function () {
  "use strict";
  const A = () => window.CSApp;
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

  // ---------- UI ----------
  const fab = document.createElement("button");
  fab.className = "coach-fab";
  fab.setAttribute("aria-label", "Open AI coach");
  fab.innerHTML = `<span class="fab-ico">💬</span><span class="fab-label">AI Coach</span>`;
  const panel = document.createElement("div");
  panel.className = "coach-panel hidden";
  panel.setAttribute("role", "dialog");
  panel.innerHTML = `
    <div class="coach-head">
      <div class="coach-avatar">🤖</div>
      <div><b>AI Coach</b><span id="coachSub">Analyzes your progress and builds your plan</span></div>
      <button class="coach-x" aria-label="Close">✕</button>
    </div>
    <div class="coach-msgs" id="coachMsgs"></div>
    <div class="coach-chips" id="coachChips"></div>
    <form class="coach-input" id="coachForm">
      <input id="coachText" type="text" placeholder="Ask your coach anything…" autocomplete="off" />
      <button type="submit" aria-label="Send">➤</button>
    </form>`;
  document.body.append(fab, panel);
  const msgs = panel.querySelector("#coachMsgs");
  const chips = panel.querySelector("#coachChips");
  const input = panel.querySelector("#coachText");
  const transcript = []; // { role, text }

  let sample = null, aiTried = false;
  if (window.claude && typeof window.claude.use === "function") {
    window.claude.use("sample").then(s => {
      sample = s;
      if (s) panel.querySelector("#coachSub").textContent = "Powered by Claude · knows your analytics";
    }).catch(() => {});
  }

  fab.addEventListener("click", () => {
    const open = panel.classList.toggle("hidden") === false;
    fab.classList.toggle("open", open);
    if (open) {
      if (!msgs.children.length) greet();
      renderChips();
      setTimeout(() => input.focus(), 50);
    }
  });
  panel.querySelector(".coach-x").addEventListener("click", () => { panel.classList.add("hidden"); fab.classList.remove("open"); });

  function addMsg(role, html, text) {
    const div = document.createElement("div");
    div.className = "cmsg " + role;
    div.innerHTML = html;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    if (text !== undefined) transcript.push({ role, text });
    div.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => act(b.dataset.act)));
    return div;
  }
  function act(a) {
    panel.classList.add("hidden"); fab.classList.remove("open");
    if (a === "mock") A().startMock();
    else if (a === "starred") A().startStarred();
    else if (a.startsWith("s:")) A().startSubject(a.slice(2));
  }
  const btn = (act, label) => `<button class="cbtn" data-act="${act}">${label}</button>`;

  function renderChips() {
    const inQuiz = !!A().current();
    const list = [
      ["analyze", "📊 Analyze my performance"],
      ["plan", "🗓️ Make my study plan"],
      ["focus", "🎯 What should I focus on?"],
      inQuiz ? ["hint", "💡 Help with this question"] : ["tips", "🧠 Exam-day tips"],
      ["motivate", "💪 Motivate me"]
    ];
    chips.innerHTML = list.map(([k, l]) => `<button class="chip-q" data-k="${k}">${l}</button>`).join("");
    chips.querySelectorAll(".chip-q").forEach(b => b.addEventListener("click", () => {
      addMsg("user", esc(b.textContent), b.textContent);
      reply(builtIn(b.dataset.k));
    }));
  }
  function reply(html) {
    const typing = addMsg("bot", `<span class="typing"><i></i><i></i><i></i></span>`);
    setTimeout(() => {
      typing.remove();
      addMsg("bot", html, html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
      renderChips();
    }, 450);
  }

  function greet() {
    const a = A().analytics();
    addMsg("bot", `Hi${a.name ? " " + esc(a.name) : ""}! 👋 I'm your AI Coach. I look at your scores and tell you exactly what to focus on.
      ${a.overall.attempts ? `So far you've answered <b>${a.overall.attempts}</b> questions with <b>${a.overall.acc}%</b> accuracy.` : "Answer a few rounds first so I can find your strong and weak subjects."}
      <br>Tap a question below or type your own.`, "greeting");
  }

  // ---------- built-in coach (works offline) ----------
  const SUB = id => A().subjects.find(s => s.id === id);
  function ranked(a) {
    // untested subjects first, then lowest accuracy
    return a.subjects.slice().sort((x, y) => (x.acc == null ? -1 : x.acc) - (y.acc == null ? -1 : y.acc));
  }
  function bar(p) { return `<span class="cbar"><span style="width:${p || 0}%;background:${p >= 80 ? "var(--green)" : p >= 60 ? "var(--blue)" : "var(--wrong)"}"></span></span>`; }

  function builtIn(kind, text) {
    const a = A().analytics();
    const tested = a.subjects.filter(s => s.acc != null);
    const r = ranked(a);
    const weakest = r[0], weakSub = SUB(weakest.id);

    if (kind === "analyze") {
      if (!tested.length) return `I don't have data yet. Take one round per subject (10 questions each) and I'll analyze you. 📊<div class="cacts">${a.subjects.map(s => btn("s:" + s.id, SUB(s.id).icon + " " + s.name.replace("Verbal Ability", "Verbal"))).join("")}</div>`;
      const strong = tested.slice().sort((x, y) => y.acc - x.acc)[0];
      return `<b>📊 Your performance</b><br>Overall: <b>${a.overall.acc}%</b> on ${a.overall.attempts} answers · ${a.daysActive} day(s) active · 🔥 ${a.streak}-day streak
        <table class="ctable">${a.subjects.map(s => `<tr><td>${SUB(s.id).icon} ${esc(s.name.replace("Verbal Ability", "Verbal"))}</td><td>${s.acc == null ? '<span class="muted">not yet</span>' : bar(s.acc) + " " + s.acc + "%"}</td></tr>`).join("")}</table>
        💪 <b>Strongest:</b> ${esc(strong.name)} (${strong.acc}%)<br>
        🎯 <b>Needs work:</b> ${esc(weakest.name)} ${weakest.acc == null ? "(not tried yet)" : "(" + weakest.acc + "%)"}<br>
        ${a.overall.acc >= a.passing ? "You're above the 80% passing mark overall. Keep it consistent! 🎉" : `You're ${a.passing - a.overall.acc} points below the 80% passing mark. Very doable with daily practice.`}
        <div class="cacts">${btn("s:" + weakest.id, "Practice " + weakSub.icon + " now")}</div>`;
    }

    if (kind === "plan") {
      const days = a.daysLeft && a.daysLeft > 0 ? a.daysLeft : null;
      const weak = r.filter(s => s.acc == null || s.acc < a.passing);
      const w1 = r[0], w2 = r[1];
      const daily = [
        [w1, 5], [w2, 3], ...r.slice(2).map(s => [s, 2])
      ];
      const total = daily.reduce((n, d) => n + d[1], 0);
      return `<b>🗓️ Your study plan</b>${days ? ` · <b>${days} day(s)</b> until your exam` : ""}<br>
        ${!tested.length ? "Since I don't have your scores yet, start with a diagnostic: one round of each subject this week. Then ask me again for a sharper plan.<br>" : ""}
        <b>Daily (${total} questions, about ${Math.round(total * 1.2)} min):</b>
        <ul>${daily.map(([s, n]) => `<li>${SUB(s.id).icon} <b>${n} questions</b> ${esc(s.name)}${s.acc != null ? ` <span class="muted">(${s.acc}%)</span>` : ' <span class="muted">(untested)</span>'}</li>`).join("")}
        <li>⭐ Re-try your starred and missed questions (5 min)</li></ul>
        <b>Weekly:</b> one 📝 Full Mock Exam every ${days && days < 14 ? "3 days" : "Sunday"} to track your score.<br>
        <b>Focus this week:</b> ${esc(w1.name)}. ${esc(SUB(w1.id).tips[0])}<br>
        <b>Goal:</b> get every subject to 80%+. ${weak.length ? `You have ${weak.length} subject(s) below that now.` : "You're there. Now keep it steady! 🌟"}
        ${days && days <= 7 ? "<br>⏰ <b>Final week:</b> focus on reviewing and mock exams, not new topics. Sleep well before exam day." : ""}
        ${!a.examDate ? '<br><span class="muted">Tip: add your exam date in ⚙️ Settings and I\'ll plan around it.</span>' : ""}
        <div class="cacts">${btn("s:" + w1.id, "Start today's " + SUB(w1.id).icon)}${btn("mock", "📝 Mock exam")}</div>`;
    }

    if (kind === "focus") {
      if (!tested.length) return `Start with <b>Numerical Ability</b> and <b>Analytical Ability</b>. Many examinees lose the most points there. Take one round of each, then ask me again.<div class="cacts">${btn("s:numerical", "🔢 Numerical")}${btn("s:analytical", "🧩 Analytical")}</div>`;
      return `🎯 Focus on <b>${esc(weakest.name)}</b>${weakest.acc != null ? ` (${weakest.acc}% accuracy)` : " (you haven't tried it yet)"}.
        ${weakest.wrongNow ? `You have <b>${weakest.wrongNow}</b> question(s) there you last got wrong. They'll come first in your next round.` : ""}
        <br><b>How to improve:</b><ul>${weakSub.tips.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
        Aim for <b>5 questions a day</b> in this subject until you're consistently above 80%.
        <div class="cacts">${btn("s:" + weakest.id, "Practice " + weakSub.icon + " now")}</div>`;
    }

    if (kind === "hint") {
      const c = A().current();
      if (!c) return "Open a question first, then ask me for help with it. 🙂";
      return `<b>💡 Coaching for this question</b><br>${esc(c.hint)}<br><br><b>Strategy for ${esc(c.subject)}:</b> ${esc(SUB(c.sid).tips[0])}
        ${c.revealed ? `<br><br><b>Why the answer is "${esc(c.answer)}":</b> ${esc(c.explanation)}` : "<br><br><span class=\"muted\">I won't reveal the answer, but you've got this!</span>"}`;
    }

    if (kind === "tips") {
      return `<b>🧠 Exam-day tips</b><ul>
        <li>Answer the easy questions first. Don't get stuck: mark hard ones and come back.</li>
        <li>Never leave a blank. There's no penalty for guessing, so eliminate choices and pick the best one.</li>
        <li>Budget your time: roughly 1 minute per question.</li>
        <li>Shade carefully and double-check that your item number matches.</li>
        <li>Bring valid ID, black ballpen, and your Notice of School Assignment. Arrive early.</li>
        <li>Sleep well the night before. A rested brain scores higher than a crammed one.</li></ul>`;
    }

    if (kind === "motivate") {
      const lines = [
        "Every question you practice today is one less surprise on exam day. 💚",
        "Hindi mo kailangang maging perpekto, kailangan mo lang maging consistent. 🌱",
        "Many who pass had to try more than once. What matters is you keep going. 💪",
        "Small daily progress beats last-minute cramming. You're building something real. 🚀"
      ];
      return `${lines[Math.floor(Math.random() * lines.length)]}${a.streak ? `<br>You're on a <b>🔥 ${a.streak}-day streak</b>. Don't break it!` : "<br>Start a streak today with just 10 questions."}
        <div class="cacts">${btn("s:" + weakest.id, "Do 10 questions now")}</div>`;
    }

    // keyword routing for typed questions
    const t = (text || "").toLowerCase();
    if (/analy|perform|score|stat|progress|how am i|result|resulta/.test(t)) return builtIn("analyze");
    if (/plan|strateg|schedule|routine|study|araw-araw|daily|week/.test(t)) return builtIn("plan");
    if (/weak|focus|improve|mahina|what should|ano dapat/.test(t)) return builtIn("focus");
    if (/hint|this question|tanong na ito|help/.test(t)) return builtIn("hint");
    if (/motivat|tired|pagod|give up|nervous|kaba|stress|sad|lungkot/.test(t)) return builtIn("motivate");
    if (/exam day|tip|bring|dalhin|time/.test(t)) return builtIn("tips");
    const subj = A().subjects.find(s => t.includes(s.id) || (s.id === "numerical" && /math|number|compute/.test(t)) || (s.id === "geninfo" && /constitution|law|ra |general/.test(t)) || (s.id === "verbal" && /english|grammar|vocab/.test(t)) || (s.id === "filipino" && /filipino|tagalog/.test(t)) || (s.id === "analytical" && /logic|analytic|reason/.test(t)));
    if (subj) return `<b>${subj.icon} Tips for ${esc(subj.name)}</b><ul>${subj.tips.map(x => `<li>${esc(x)}</li>`).join("")}</ul><div class="cacts">${btn("s:" + subj.id, "Practice " + subj.icon)}</div>`;
    return `I can help you with:<ul><li>📊 analyzing your performance</li><li>🗓️ making a study plan</li><li>🎯 finding what to focus on</li><li>💡 coaching on a question</li><li>🧠 tips for any subject (e.g., "tips for math")</li></ul>`;
  }

  // ---------- AI (Claude) ----------
  function mdLite(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/^#{1,3} (.+)$/gm, "<b>$1</b>")
      .replace(/^\s*[-•*] (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, "<ul>$1</ul>")
      .replace(/\n/g, "<br>").replace(/<\/li><br>/g, "</li>").replace(/<ul><br>/g, "<ul>");
  }

  async function askAI(text) {
    const a = A().analytics(), cur = A().current();
    const context = {
      student: a,
      subjects: A().subjects.map(s => ({ id: s.id, name: s.name, tips: s.tips })),
      currentQuestion: cur ? {
        subject: cur.subject, question: cur.question, choices: cur.choices, coachHint: cur.hint,
        answerRevealed: cur.revealed, answer: cur.answer, explanation: cur.explanation
      } : null,
      today: new Date().toDateString()
    };
    const instructions = `You are "AI Coach" inside CS Coach, a reviewer app for the Philippine Civil Service Exam (Professional level, passing rate 80%). Subjects: Verbal Ability (English and Filipino), Numerical Ability, Analytical Ability, General Information (1987 Constitution, RA 6713, peace and human rights, environment).
Be warm, encouraging and specific. Use the student's analytics below: name their weak and strong subjects with numbers, and give concrete daily targets (e.g., "5 Numerical questions a day"). If an exam date is set, plan around the days left. Keep replies short (under 150 words), with short bullet lists and **bold** for key points. You may mix in a little Taglish if the student writes in Filipino.
IMPORTANT: if currentQuestion.answerRevealed is false, NEVER reveal or hint at which choice is correct. Only coach the method. If it is true, you may explain the answer.
Do not claim the app's questions are actual past CSC exam questions; they are practice items.

APP DATA (JSON):
${JSON.stringify(context)}`;
    const history = transcript.filter(m => m.text && m.text !== "greeting").slice(-10);
    const messages = [];
    history.forEach(m => messages.push({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
    while (messages.length && messages[0].role !== "user") messages.shift();
    if (!messages.length || messages[messages.length - 1].role !== "user") messages.push({ role: "user", content: text });
    messages[0] = { role: "user", content: instructions + "\n\nSTUDENT: " + messages[0].content };
    // merge accidental consecutive roles
    const merged = [];
    messages.forEach(m => { const l = merged[merged.length - 1]; if (l && l.role === m.role) l.content += "\n" + m.content; else merged.push({ ...m }); });

    const bubble = addMsg("bot", `<span class="typing"><i></i><i></i><i></i></span>`);
    try {
      const res = await sample(merged, { cache: false, onText: ({ text }) => { bubble.innerHTML = mdLite(text); msgs.scrollTop = msgs.scrollHeight; } });
      bubble.innerHTML = mdLite(res.text);
      transcript.push({ role: "bot", text: res.text });
      const r = ranked(a)[0];
      bubble.insertAdjacentHTML("beforeend", `<div class="cacts">${btn("s:" + r.id, "Practice " + SUB(r.id).icon)}${btn("mock", "📝 Mock exam")}</div>`);
      bubble.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => act(b.dataset.act)));
    } catch (e) {
      bubble.remove();
      if (e && e.code === "not_granted") sample = null;
      reply(builtIn("text", text) + (e && e.code === "rate_limited" ? '<br><span class="muted">(AI is busy right now, so here is my built-in answer.)</span>' : ""));
    }
  }

  panel.querySelector("#coachForm").addEventListener("submit", e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    addMsg("user", esc(text), text);
    if (sample) askAI(text); else reply(builtIn("text", text));
  });
})();
