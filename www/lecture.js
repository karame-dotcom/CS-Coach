// Chalkboard mini-lecture for the "Help me" coach.
// Kiko (in a graduation cap) talks through the hint on a chalkboard: text is
// "written" in chalk, doodles are drawn, and the browser's speech engine reads
// it aloud. It never reveals the answer.
// API: Lecture.mount(el, { q, hint, lang, labels }) -> stop()
(function () {
  "use strict";

  // ---------- text (English, Tagalog, Taglish) ----------
  const L = {
    start: ["▶ Start the lesson", "▶ Simulan ang aralin", "▶ Start na ang lesson"],
    qLabel: ["The question", "Ang tanong", "Ang question"],
    qTalk: ["Let's read the question first.", "Basahin muna natin ang tanong.", "Basahin muna natin 'yung question."],
    approach: ["How to approach it", "Paano ito lapitan", "Paano i-approach"],
    approachTalk: ["Here's how to approach it.", "Ganito natin ito lalapitan.", "Okay, ganito natin i-approach 'to."],
    setup: ["Let's set it up", "Ihanda natin", "I-set up natin"],
    setupTalk: ["Let's set it up step by step. But I won't solve it for you!", "Ihanda natin nang hakbang-hakbang. Pero hindi ko ito sasagutin para sa iyo!", "Step by step natin i-set up. Pero hindi ko sasagutin para sa'yo ha!"],
    avgS1: ["Step 1: Add them all", "Hakbang 1: Pagsamahin lahat", "Step 1: I-add lahat"],
    avgS2: ["Step 2: Count them", "Hakbang 2: Bilangin", "Step 2: Bilangin kung ilan"],
    avgS2b: ["{n} numbers", "{n} na numero", "{n} numbers"],
    avgS3: ["Step 3: Divide", "Hakbang 3: Hatiin", "Step 3: I-divide"],
    check: ["Quick check", "Mabilis na pagsuri", "Quick check"],
    checkTalk: ["Before you pick, do a quick check.", "Bago pumili, mabilis na suriin.", "Bago ka pumili, quick check muna."],
    avgCheck: ["The average is always between the smallest and the biggest number.", "Laging nasa pagitan ng pinakamaliit at pinakamalaking numero ang average.", "Laging nasa pagitan ng pinakamaliit at pinakamalaking number ang average."],
    avgCheck2: ["So it must be between {a} and {b}.", "Kaya dapat nasa pagitan ito ng {a} at {b}.", "So dapat nasa pagitan siya ng {a} at {b}."],
    outro: ["Your turn!", "Ikaw na!", "Ikaw na!"],
    outroTalk: ["You've got this. Go back and try it!", "Kaya mo 'yan. Bumalik ka at subukan mo!", "Kaya mo 'yan! Balikan mo ang question at try mo!"],
    outroNote: ["The coach guides you but won't give the answer away.", "Gagabayan ka ng coach pero hindi nito ibibigay ang sagot.", "Gu-guide-an ka ng coach pero hindi niya ibibigay ang sagot."],
    noVoice: ["Voice isn't available on this device, so read along with Kiko.", "Walang boses sa device na ito, kaya sabayan na lang si Kiko sa pagbasa.", "Walang voice sa device na ito, so basahin mo na lang kasabay ni Kiko."],
    prev: ["Previous", "Nakaraan", "Previous"], next: ["Next", "Susunod", "Next"],
    play: ["Play", "I-play", "Play"], pause: ["Pause", "I-pause", "Pause"],
    mute: ["Mute", "I-mute", "Mute"], unmute: ["Unmute", "Buksan ang tunog", "Unmute"],
    voice: ["Voice", "Boses", "Voice"],
    noFil: ["", "Walang boses na Tagalog sa device na ito, kaya Ingles na boses muna ang gamit. Para sa natural na Tagalog, buksan ito sa Microsoft Edge (boses ni Blessica) o sa Chrome sa Android.", "Walang Tagalog voice sa device na ito, kaya English voice muna. Para sa natural na Tagalog, i-open ito sa Microsoft Edge (Blessica voice) o sa Chrome sa Android."],
    nums: [["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"], ["isa", "dalawa", "tatlo", "apat", "lima", "anim", "pito", "walo", "siyam", "sampu"], ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"]],
    speed: ["Speed", "Bilis", "Speed"], replay: ["Replay", "Ulitin", "Ulitin"]
  };
  const IDX = { en: 0, tl: 1, tg: 2 };
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

  // ---------- chalk doodles ----------
  const C = { w: "#f4f1e8", y: "#fde68a", p: "#fda4af", b: "#93c5fd", g: "#86efac" };
  const P = (d, c = "w", t = 0, dash) => `<path class="ch${dash ? " dash" : ""}" pathLength="1" d="${d}" style="stroke:${C[c]};--t:${t}s"/>`;
  const T = (x, y, s, c = "w", t = 0, sz = 16, a = "middle") => `<text class="cht" x="${x}" y="${y}" font-size="${sz}" text-anchor="${a}" style="fill:${C[c]};--t:${t}s">${esc(s)}</text>`;
  const svg = inner => `<svg viewBox="0 0 220 120" class="lec-doodle" aria-hidden="true">${inner}</svg>`;
  const nums = s => (String(s).match(/\d+(?:\.\d+)?/g) || []).map(Number);

  const D = {
    bulb: () => P("M94 60 a22 22 0 1 1 32 0 q-6 7 -6 15 h-20 q0 -8 -6 -15z", "y") + P("M100 82 h20 M102 89 h16 M106 96 h8", "w", .6) +
      P("M110 16 v-9 M80 28 l-6 -6 M140 28 l6 -6 M72 50 h-9 M148 50 h9", "y", .9) + T(110, 60, "?", "w", 1.2, 24),
    average: q => {
      let v = nums(q.q).filter(n => n > 0).slice(0, 6);
      if (v.length < 2) v = [6, 9, 4, 7];
      const mn = Math.min(...v), mx = Math.max(...v), span = mx - mn || 1, w = 16, gap = 8, x0 = 14;
      const h = n => 22 + (n - mn) / span * 52, mean = v.reduce((a, b) => a + b, 0) / v.length;
      let s = P(`M8 96 H${x0 + v.length * (w + gap) + 4}`, "w", 0);
      v.forEach((n, i) => {
        const x = x0 + i * (w + gap);
        s += P(`M${x} 96 V${96 - h(n)} H${x + w} V96`, i % 2 ? "b" : "g", .25 + i * .25) + T(x + w / 2, 110, n, "w", .4 + i * .25, 10);
      });
      const end = x0 + v.length * (w + gap), ly = 96 - h(mean), last = .5 + v.length * .25;
      s += P(`M8 ${ly} H${end}`, "p", last, true) + T(end + 6, ly + 4, "?", "p", last + .6, 15, "start");
      s += T(186, 34, "total", "y", last + .9, 14) + P("M162 44 h48", "y", last + 1.1) + T(186, 62, v.length, "y", last + 1.3, 16) + T(186, 90, "= ?", "p", last + 1.6, 16);
      return s;
    },
    rangeCheck: q => {
      const v = nums(q.q).filter(n => n > 0);
      const mn = v.length ? Math.min(...v) : 1, mx = v.length ? Math.max(...v) : 9;
      return P("M14 66 H206", "w") + P("M200 60 l6 6 -6 6", "w", .3) + P("M50 56 v20 M170 56 v20", "y", .5) +
        T(50, 96, mn, "y", .7, 16) + T(170, 96, mx, "y", .9, 16) + P("M54 50 Q110 22 166 50", "g", 1.1) + T(110, 30, "?", "g", 1.6, 22) +
        P("M20 40 l12 12 m0 -12 l-12 12 M188 40 l12 12 m0 -12 l-12 12", "p", 1.9);
    },
    percent: () => P("M60 25 a32 32 0 1 0 0.1 0", "w") + P("M60 57 V25 M60 57 L88 72", "y", .6) + T(80, 44, "%", "y", 1, 14) +
      T(160, 50, "x %", "w", 1.2, 20) + P("M130 62 h60", "w", 1.4) + T(160, 88, "100", "w", 1.6, 20),
    series: () => ["2", "4", "8", "16", "?"].map((n, i) => T(24 + i * 43, 82, n, i === 4 ? "p" : "w", i * .2, 22)).join("") +
      [0, 1, 2, 3].map(i => P(`M${30 + i * 43} 58 q18 -24 36 0`, "y", .9 + i * .25) + T(48 + i * 43, 36, "×2", "y", 1 + i * .25, 12)).join(""),
    letters: () => ["A", "B", "C", "D", "E"].map((l, i) => T(30 + i * 40, 40, l, "w", i * .15, 20) + P(`M${30 + i * 40} 50 v18`, "y", .8 + i * .1) + T(30 + i * 40, 92, i + 1, "y", 1 + i * .1, 20)).join(""),
    clock: () => P("M110 18 a42 42 0 1 0 0.1 0", "w") + P("M110 22 v8 M152 60 h-8 M110 98 v-8 M68 60 h8", "w", .5) + P("M110 60 V32", "y", .8) + P("M110 60 L132 70", "p", 1),
    ratio: () => P("M30 50 H190 V80 H30 Z", "w") + P("M94 50 V80", "y", .6) + T(62, 72, "2", "y", .9, 18) + T(142, 72, "3", "b", 1.1, 18) + T(110, 108, "2 : 3", "w", 1.3, 16),
    speed: () => P("M14 84 H206", "w") + P("M20 70 H190 m-10 -7 l10 7 -10 7", "y", .4) + T(110, 40, "d = s × t", "w", .9, 20),
    compass: () => P("M60 20 V100 M20 60 H100", "w") + T(60, 14, "N", "y", .4, 14) + T(108, 64, "E", "w", .5, 12, "start") + T(60, 116, "S", "w", .6, 12) + T(12, 64, "W", "w", .7, 12, "end") +
      P("M140 96 V60 H180 V30", "g", 1, true) + P("M174 36 l6 -6 6 6", "g", 1.6),
    analogy: () => T(110, 64, "A : B  ::  C : ?", "w", 0, 22) + P("M40 74 q18 18 36 0", "y", .8) + P("M140 74 q18 18 36 0", "y", 1.1) + T(110, 108, "same link", "y", 1.4, 13),
    family: () => P("M90 16 h40 v20 h-40 z", "w") + P("M110 36 v14 M60 50 h100 M60 50 v14 M160 50 v14", "y", .6) + P("M40 64 h40 v20 h-40 z M140 64 h40 v20 h-40 z", "w", 1) +
      T(110, 30, "👵", "w", .3, 12) + T(60, 78, "👩", "w", 1.2, 12) + T(160, 78, "👨", "w", 1.3, 12),
    venn: () => P("M85 20 a40 40 0 1 0 0.1 0", "b") + P("M135 20 a40 40 0 1 0 0.1 0", "p", .6) + T(70, 64, "A", "b", 1, 16) + T(150, 64, "B", "p", 1.1, 16) + T(110, 64, "?", "y", 1.4, 16),
    law: () => P("M40 18 h70 v86 h-70 z M110 18 h70 v86 h-70 z", "w") + P("M52 40 h46 M52 52 h46 M52 64 h30 M122 40 h46 M122 52 h46 M122 64 h30", "w", .6) + T(110, 116, "Art. III", "y", 1.2, 13),
    word: () => T(70, 56, "word", "w", 0, 22) + P("M42 64 h58", "y", .5) + P("M118 44 a18 18 0 1 0 0.1 0 M131 74 l14 14", "y", .8) + T(110, 104, "context → meaning", "g", 1.2, 13),
    grammar: () => T(60, 50, "Subject", "b", 0, 18) + T(160, 50, "Verb", "g", .3, 18) + P("M92 44 H132 m-8 -6 l8 6 -8 6", "y", .6) + T(60, 86, "1", "b", .9, 18) + T(160, 86, "1", "g", 1, 18) + P("M98 80 l8 8 16 -18", "y", 1.2),
    cheer: () => P("M70 60 l22 22 50 -52", "g") + P("M30 30 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z", "y", .8) + P("M180 20 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z", "y", 1) + P("M186 86 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z", "b", 1.2)
  };
  function hintArt(q) {
    const s = (q.q + " " + q.h).toLowerCase();
    const rules = [[/average|\bmean\b/, "average"], [/%|percent|discount|profit|interest|porsiyento/, "percent"], [/series|next number|pattern|differences|term/, "series"],
      [/alphabet|letter/, "letters"], [/clock|hour hand|o'clock/, "clock"], [/ratio|proportion/, "ratio"], [/speed|km\b|distance|travel/, "speed"],
      [/north|south|east|west|direction/, "compass"], [/::|analog|relationship/, "analogy"], [/mother|father|daughter|brother|sister|family/, "family"],
      [/syllogism|conclude|\ball\b.*\bare\b/, "venn"], [/\bra \d|republic act|\blaw\b|article|constitution|agency|sec\./, "law"],
      [/verb|subject|pronoun|grammar|tense|singular|plural/, "grammar"], [/antonym|opposite|synonym|mean|idiom|word/, "word"]];
    const hit = rules.find(([re]) => re.test(s));
    return hit ? hit[1] : "bulb";
  }

  // ---------- Kiko the teacher ----------
  const TEACHER = `
  <svg viewBox="0 0 140 130" class="lec-kiko" aria-hidden="true">
    <defs><linearGradient id="lecKikoBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#3b82f6"/></linearGradient></defs>
    <ellipse cx="60" cy="122" rx="30" ry="5" fill="#0f2a3d" opacity=".15"/>
    <g class="lk-bod">
      <ellipse cx="44" cy="114" rx="10" ry="6" fill="#2563eb"/><ellipse cx="76" cy="114" rx="10" ry="6" fill="#2563eb"/>
      <ellipse cx="22" cy="84" rx="8" ry="12" fill="#22c58b"/>
      <ellipse cx="60" cy="80" rx="40" ry="36" fill="url(#lecKikoBody)"/>
      <ellipse cx="60" cy="94" rx="24" ry="17" fill="#fff" opacity=".92"/>
      <ellipse cx="36" cy="86" rx="6" ry="3.5" fill="#fb7185" opacity=".55"/><ellipse cx="84" cy="86" rx="6" ry="3.5" fill="#fb7185" opacity=".55"/>
      <g class="lk-eyes">
        <ellipse cx="46" cy="72" rx="5" ry="6.5" fill="#0f2a3d"/><circle cx="47.8" cy="69.5" r="1.8" fill="#fff"/>
        <ellipse cx="74" cy="72" rx="5" ry="6.5" fill="#0f2a3d"/><circle cx="75.8" cy="69.5" r="1.8" fill="#fff"/>
      </g>
      <g fill="none" stroke="#0f2a3d" stroke-width="2"><circle cx="46" cy="72" r="10"/><circle cx="74" cy="72" r="10"/><path d="M56 72 h8"/></g>
      <path class="lk-smile" d="M53 86 Q60 92 67 86" stroke="#0f2a3d" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <g class="lk-mouth"><ellipse cx="60" cy="88" rx="6" ry="5" fill="#0f2a3d"/><ellipse cx="60" cy="91" rx="3.5" ry="2" fill="#fb7185"/></g>
      <path d="M26 38 L60 24 L94 38 L60 52 Z" fill="#1f2937"/><path d="M44 44 v10 q16 7 32 0 v-10 L60 52 Z" fill="#111827"/>
      <path class="lk-tassel" d="M60 38 L88 42 L90 56" stroke="#facc15" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <g class="lk-arm">
        <line x1="100" y1="78" x2="134" y2="22" stroke="#a16207" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="134" cy="22" r="3" fill="#f4f1e8"/>
        <ellipse cx="98" cy="84" rx="8" ry="12" fill="#3b82f6"/>
      </g>
    </g>
  </svg>`;

  const CSS = `
  .lec { position: relative; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .lec-board { position: relative; background:
      radial-gradient(ellipse at 20% 25%, rgba(255,255,255,.07), transparent 45%),
      radial-gradient(ellipse at 80% 75%, rgba(255,255,255,.05), transparent 50%), #234a35;
    border: 10px solid #8b5a2b; border-radius: 14px; box-shadow: inset 0 0 40px rgba(0,0,0,.45), 0 5px 0 #6b4220;
    padding: 14px 16px 34px; min-height: 340px; color: #f4f1e8; overflow: hidden;
    font-family: "Patrick Hand", "Chalkboard SE", "Comic Sans MS", "Segoe Print", cursive; }
  .lec-label { color: #fde68a; font-size: 1rem; letter-spacing: .5px; padding-bottom: 4px; margin-bottom: 8px; border-bottom: 2px dashed rgba(253,230,138,.45); display: inline-block; }
  .lec-count { position: absolute; top: 10px; right: 14px; font-size: .9rem; opacity: .6; }
  .lec-text { font-size: 1.35rem; line-height: 1.35; min-height: 1.4em; text-shadow: 0 0 1px rgba(255,255,255,.7), 0 0 8px rgba(255,255,255,.12); }
  .lec-text.long { font-size: 1.12rem; }
  .lec-text .ln { min-height: 1.35em; }
  .lec-text .ln.toks { margin: 12px 0 30px; }
  .lec-text .ln.y { color: #fde68a; } .lec-text .ln.g { color: #86efac; } .lec-text .ln.p { color: #fda4af; } .lec-text .ln.b { color: #93c5fd; }
  .lec-text .ln.big { font-size: 1.25em; }
  .lec-ptr { position: absolute; left: 0; top: 0; width: 20px; height: 28px; transform: translate(-50%, 2px); opacity: 0; pointer-events: none; z-index: 2;
    transition: left .35s cubic-bezier(.4,1.4,.6,1), top .35s cubic-bezier(.4,1.4,.6,1), opacity .2s; filter: drop-shadow(0 0 3px rgba(253,230,138,.5)); }
  .lec-ptr.on { opacity: 1; animation: lecNudge .5s ease-in-out infinite alternate; }
  .lec-ptr svg { width: 100%; height: 100%; display: block; }
  @keyframes lecNudge { from { margin-top: 4px; } to { margin-top: 0; } }
  .lec-text .tok { position: relative; border-radius: 8px; transition: color .2s, background .2s; }
  .lec-text .tok.hit { color: #fde68a; background: rgba(253,230,138,.16); box-shadow: 0 0 0 2px rgba(253,230,138,.55); }
  .lec-text .tok[data-n]::after { content: attr(data-n); position: absolute; right: -9px; top: -10px; min-width: 17px; height: 17px; border-radius: 50%; background: #fda4af; color: #3b0d17;
    font-size: 11px; line-height: 17px; text-align: center; font-family: system-ui, sans-serif; font-weight: 800; animation: lecPop .3s ease-out; }
  @keyframes lecPop { from { transform: scale(0); } to { transform: scale(1); } }
  .lec-cursor { display: inline-block; width: 7px; height: 1em; margin-left: 2px; background: #f4f1e8; vertical-align: -2px; border-radius: 2px; opacity: .8; transform: rotate(18deg); }
  .lec-art { margin-top: 6px; }
  .lec-doodle { width: 100%; max-height: 150px; display: block; }
  .lec-doodle .ch { fill: none; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1 1; stroke-dashoffset: 1; opacity: .92; animation: lecDraw .9s ease-out var(--t) forwards; }
  .lec-doodle .ch.dash { stroke-dasharray: .02 .02; stroke-dashoffset: 0; opacity: 0; animation: lecFade .5s var(--t) forwards; }
  .lec-doodle .cht { font-family: inherit; opacity: 0; animation: lecFade .45s var(--t) forwards; }
  @keyframes lecDraw { to { stroke-dashoffset: 0; } }
  @keyframes lecFade { to { opacity: .95; } }
  .lec-tray { position: absolute; left: 0; right: 0; bottom: 0; height: 12px; background: #6b4220; }
  .lec-tray::before { content: ""; position: absolute; right: 30px; bottom: 9px; width: 26px; height: 6px; border-radius: 3px; background: #f4f1e8; }
  .lec-tray::after { content: ""; position: absolute; right: 66px; bottom: 9px; width: 34px; height: 10px; border-radius: 3px; background: linear-gradient(#475569 0 50%, #e2e8f0 50%); }
  .lec-stage { display: flex; align-items: flex-end; gap: 8px; margin-top: -30px; position: relative; z-index: 2; }
  .lec-kiko { width: 112px; flex: none; overflow: visible; }
  .lec-kiko .lk-mouth { display: none; transform-origin: 60px 88px; }
  .lec.talking .lec-kiko .lk-mouth { display: block; animation: lecTalk .22s ease-in-out infinite alternate; }
  .lec.talking .lec-kiko .lk-smile { display: none; }
  @keyframes lecTalk { from { transform: scaleY(.25); } to { transform: scaleY(1); } }
  .lec-kiko .lk-eyes { transform-origin: 60px 72px; animation: lecBlink 4s infinite; }
  @keyframes lecBlink { 0%, 93%, 100% { transform: scaleY(1); } 96% { transform: scaleY(.1); } }
  .lec-kiko .lk-arm { transform-origin: 98px 86px; transition: transform .5s cubic-bezier(.3,1.6,.5,1); transform: rotate(18deg); }
  .lec.pointing .lec-kiko .lk-arm { transform: rotate(-8deg); }
  .lec-kiko .lk-bod { transform-origin: 60px 120px; }
  .lec.talking .lec-kiko .lk-bod { animation: lecBob .5s ease-in-out infinite alternate; }
  .lec.cheer .lec-kiko .lk-bod { animation: lecHop .45s ease-in-out 3 alternate; }
  @keyframes lecBob { to { transform: translateY(-2px) rotate(-1.5deg); } }
  @keyframes lecHop { to { transform: translateY(-14px); } }
  .lec-side { flex: 1; min-width: 0; padding-bottom: 4px; }
  .lec-bubble { position: relative; background: #fff; border: 2px solid #0f2a3d; border-radius: 14px; padding: 8px 12px; font-size: .95rem; line-height: 1.35; color: #0f2a3d; margin: 0 0 8px 6px; min-height: 2.6em; box-shadow: 0 3px 0 rgba(15,42,61,.12); }
  .lec-bubble::before { content: ""; position: absolute; left: -10px; bottom: 12px; border: 8px solid transparent; border-right-color: #0f2a3d; border-left: 0; }
  .lec-bubble::after { content: ""; position: absolute; left: -6px; bottom: 14px; border: 6px solid transparent; border-right-color: #fff; border-left: 0; }
  .lec-ctrls { display: flex; gap: 6px; align-items: center; margin-left: 6px; flex-wrap: wrap; }
  .lec-ctrls button { border: 1.5px solid #dde6ee; background: #fff; color: #0f2a3d; border-radius: 10px; height: 38px; min-width: 40px; padding: 0 8px; font-size: 1rem; font-weight: 700; cursor: pointer; }
  .lec-ctrls button.main { background: #16a34a; border-color: #16a34a; color: #fff; min-width: 52px; }
  .lec-ctrls button:disabled { opacity: .4; cursor: default; }
  .lec-dots { display: flex; gap: 5px; margin: 10px 0 0 6px; flex-wrap: wrap; }
  .lec-dots button { width: 10px; height: 10px; padding: 0; border-radius: 50%; border: 0; background: #cbd5e1; cursor: pointer; }
  .lec-dots button.on { background: #16a34a; transform: scale(1.3); }
  .lec-dots button.seen { background: #86efac; }
  .lec-start { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(15,30,22,.55); z-index: 3; }
  .lec-start button { font: inherit; font-size: 1.4rem; background: #fde68a; color: #0f2a3d; border: 0; border-radius: 14px; padding: 12px 22px; cursor: pointer; box-shadow: 0 4px 0 #b45309; }
  .lec .hidden { display: none !important; }
  .lec-voice { margin: 10px 0 0 6px; font-size: .85rem; color: #5b6b7a; }
  .lec-voice select { margin-left: 4px; max-width: 72%; font: inherit; color: #0f2a3d; padding: 5px 6px; border: 1.5px solid #dde6ee; border-radius: 8px; background: #fff; }
  .lec-note { font-size: .8rem; color: #5b6b7a; margin: 8px 0 0 6px; }
  @media (prefers-reduced-motion: reduce) {
    .lec-doodle .ch { animation: none; stroke-dashoffset: 0; } .lec-doodle .cht, .lec-doodle .ch.dash { animation: none; opacity: .95; }
    .lec.talking .lec-kiko .lk-bod, .lec.cheer .lec-kiko .lk-bod, .lec-kiko .lk-eyes { animation: none; }
  }`;

  function injectCSS() {
    if (document.getElementById("lec-css")) return;
    const s = document.createElement("style"); s.id = "lec-css"; s.textContent = CSS; document.head.appendChild(s);
  }

  // Make text friendlier for the speech engine.
  function speakable(s) {
    return String(s)
      .replace(/_{2,}/g, " blank ").replace(/₱\s?([\d,.]+)/g, "$1 pesos").replace(/÷/g, " divided by ").replace(/×/g, " times ")
      .replace(/\s=\s|=/g, ", equals ").replace(/\s\+\s/g, ", plus ").replace(/≈/g, " about ").replace(/[→…]/g, " ").replace(/\s{2,}/g, " ").trim();
  }

  // Wrap numbers (and the ___ blank) in spans the pointer can aim at.
  const tokHTML = t => esc(t).replace(/\d+(?:\.\d+)?|_{2,}/g, m => `<span class="tok${m[0] === "_" ? " blank" : ""}">${m}</span>`);
  const lineHTML = l => l.tok ? tokHTML(l.t) : esc(l.t);

  // ---------- build the slides for a question ----------
  function buildSlides(o, tr) {
    const q = o.q, sl = [];
    sl.push({ label: tr("qLabel"), talk: tr("qTalk"), lines: [{ t: q.q }], art: "" });
    const art = hintArt(q);
    const hintLines = String(o.hint || q.h).split(/(?<=[.?!])\s+/).filter(Boolean).map(t => ({ t }));
    sl.push({ label: (o.labels && o.labels.howApproach) || tr("approach"), talk: tr("approachTalk"), lines: hintLines, art: svg(D[art](q)), point: true });
    if (art === "average") {
      const v = nums(q.q).filter(n => n > 0);
      if (v.length >= 2) {
        sl.push({ label: tr("setup"), talk: tr("setupTalk"), lines: [
          { t: tr("avgS1"), c: "y" }, { t: v.join(" + ") + " = ___", tok: true, walk: [...v.map((n, i) => (i ? "plus " : "") + n), "equals blank"] },
          { t: tr("avgS2"), c: "y" }, { t: tr("avgS2b", { n: v.length }), count: 1 },
          { t: tr("avgS3"), c: "y" }, { t: "Average = ___ ÷ " + v.length }
        ], art: "" });
        sl.push({ label: tr("check"), talk: tr("checkTalk"), lines: [{ t: tr("avgCheck") }, { t: tr("avgCheck2", { a: Math.min(...v), b: Math.max(...v) }), c: "g" }], art: svg(D.rangeCheck(q)), point: true });
      }
    }
    sl.push({ label: tr("outro"), talk: tr("outroTalk"), lines: [{ t: tr("outro"), c: "y", big: true }, { t: o.note || tr("outroNote") }], art: svg(D.cheer()), cheer: true });
    return sl;
  }

  // ---------- mount ----------
  function mount(host, o) {
    injectCSS();
    const lang = IDX[o.lang] != null ? o.lang : "en";
    const tr = (k, vars) => { let s = L[k][IDX[lang]] || L[k][0]; if (vars) for (const v in vars) s = s.split("{" + v + "}").join(vars[v]); return s; };
    const slides = buildSlides(o, tr);
    const synth = window.speechSynthesis;
    const tts = !!(synth && window.SpeechSynthesisUtterance);
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

    host.innerHTML = `
      <div class="lec">
        <div class="lec-board">
          <div class="lec-count"></div>
          <div class="lec-label"></div>
          <div class="lec-text" aria-live="polite"></div>
          <div class="lec-art"></div>
          <div class="lec-tray"></div>
          <div class="lec-ptr" aria-hidden="true"><svg viewBox="0 0 24 34"><path d="M12 32 V7 M4 16 L12 6 L20 16" fill="none" stroke="#fde68a" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
          <div class="lec-start"><button type="button">${tr("start")}</button></div>
        </div>
        <div class="lec-stage">
          ${TEACHER}
          <div class="lec-side">
            <div class="lec-bubble"></div>
            <div class="lec-ctrls">
              <button type="button" data-a="prev" aria-label="${tr("prev")}" title="${tr("prev")}">⏮</button>
              <button type="button" data-a="play" class="main" aria-label="${tr("play")}">▶</button>
              <button type="button" data-a="next" aria-label="${tr("next")}" title="${tr("next")}">⏭</button>
              <button type="button" data-a="mute" aria-label="${tr("mute")}" title="${tr("mute")}">🔊</button>
              <button type="button" data-a="speed" title="${tr("speed")}">1×</button>
            </div>
            <div class="lec-dots">${slides.map((_, i) => `<button type="button" data-i="${i}" aria-label="${i + 1}"></button>`).join("")}</div>
          </div>
        </div>
        ${tts ? `<div class="lec-voice hidden"><label>🗣 ${tr("voice")} <select></select></label>
          <p class="lec-note lec-voice-tip hidden">${tr("noFil")}</p></div>` : `<p class="lec-note">${tr("noVoice")}</p>`}
      </div>`;
    const root = host.querySelector(".lec"), $ = s => root.querySelector(s);
    const textEl = $(".lec-text"), artEl = $(".lec-art"), labelEl = $(".lec-label"), countEl = $(".lec-count"), bubble = $(".lec-bubble"), board = $(".lec-board"), ptr = $(".lec-ptr");
    const playBtn = $('[data-a="play"]'), muteBtn = $('[data-a="mute"]'), speedBtn = $('[data-a="speed"]');

    let idx = 0, playing = false, muted = !tts, rate = 1, gen = 0, timers = [], typer = null, stopped = false;
    const seen = new Set();
    const RATES = [1, 1.25, 0.85];
    const later = (fn, ms) => { const g = gen; timers.push(setTimeout(() => { if (g === gen && !stopped) fn(); }, ms)); };
    const clearTimers = () => { timers.forEach(clearTimeout); timers = []; clearInterval(typer); typer = null; };
    const talking = on => root.classList.toggle("talking", on);

    // Voice: rank what the device offers. Prefer natural Filipino voices
    // (Edge: Blessica/Angelo, Android: Google Filipino), then Philippine English,
    // and skip novelty/robotic voices. The user can override with the picker.
    let voice = null, voices = [];
    const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley/i;
    function score(v) {
      const l = v.lang.replace("_", "-").toLowerCase(), n = v.name.toLowerCase();
      if (NOVELTY.test(n)) return -1;
      let s = 0;
      if (/^(fil|tl)\b/.test(l)) s += lang === "en" ? 40 : 100;
      else if (l === "en-ph") s += lang === "en" ? 90 : 60;
      else if (/^en-(us|gb|au|ca)/.test(l)) s += lang === "en" ? 70 : 30;
      else if (/^en/.test(l)) s += lang === "en" ? 60 : 25;
      else return -1;
      if (/natural|neural|online|premium|enhanced/.test(n)) s += 25;
      if (/google/.test(n)) s += 15;
      if (/blessica|rosa|samantha|aria|jenny|ava|emma/.test(n)) s += 8;   // warm, clear default voices
      return s;
    }
    let savedVoice = ""; try { savedVoice = localStorage.getItem("cscoach.voice") || ""; } catch (_) {}
    function pickVoice() {
      if (!tts) return;
      voices = synth.getVoices().filter(v => score(v) >= 0).sort((a, b) => score(b) - score(a));
      voice = voices.find(v => v.name === savedVoice) || voices[0] || null;
      const sel = $(".lec-voice select");
      if (!sel) return;
      sel.innerHTML = voices.map(v => `<option value="${esc(v.name)}"${v === voice ? " selected" : ""}>${esc(v.name.replace(/^(Microsoft|Google)\s+/, "").replace(/\s+Online \(Natural\)/, " (Natural)"))} · ${esc(v.lang)}</option>`).join("");
      $(".lec-voice").classList.toggle("hidden", !voices.length);
      const hasFil = voices.some(v => /^(fil|tl)/i.test(v.lang));
      $(".lec-voice-tip").classList.toggle("hidden", hasFil || lang === "en");
    }

    const readMs = s => Math.max(900, s.split(/\s+/).length * 330 / rate);
    const wait = ms => new Promise(r => later(r, ms / rate));

    // Speak in short phrases with real pauses between them, the way a teacher
    // talks: a breath after each sentence, a shorter one after "Step 1:".
    const phrases = text => speakable(text).split(/(?<=[.?!:;])\s+/).map(x => x.trim()).filter(Boolean);

    function speakOne(text) {
      return new Promise(res => {
        const g = gen;
        if (muted || !tts) return later(res, readMs(text));
        const u = new SpeechSynthesisUtterance(text);
        try { if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = lang === "en" ? "en-US" : "fil-PH"; } catch (_) {}
        u.rate = rate * 0.92; u.pitch = 1.04;   // unhurried and warm
        let done = false;
        const end = () => { if (done) return; done = true; if (g === gen && !stopped) res(); };
        u.onend = end; u.onerror = end;
        later(end, readMs(text) * 2.5 + 2500);   // safety net if onend never fires
        synth.speak(u);
      });
    }

    async function say(text) {   // resolves false if the slide changed mid-way
      const g = gen, ps = phrases(text);
      for (let k = 0; k < ps.length; k++) {
        talking(true);
        await speakOne(ps[k]);
        talking(false);
        if (g !== gen) return false;
        if (k < ps.length - 1) { await wait(/[:;]$/.test(ps[k]) ? 260 : 420); if (g !== gen) return false; }
      }
      return true;
    }

    function renderLines(lines, full) {
      textEl.innerHTML = lines.map(l => `<div class="ln${l.tok ? " toks" : ""}${l.c ? " " + l.c : ""}${l.big ? " big" : ""}"></div>`).join("");
      textEl.classList.toggle("long", lines.reduce((a, l) => a + l.t.length, 0) > 150);
      if (full || reduce) [...textEl.children].forEach((e, i) => e.innerHTML = lineHTML(lines[i]));
    }

    // Chalk-write one line while Kiko says it.
    function writeLine(i, line) {
      const el = textEl.children[i];
      if (!el || el.textContent) return Promise.resolve();
      return new Promise(res => {
        let ci = 0;
        const step = Math.max(1, Math.round(26 * rate / 30));
        typer = setInterval(() => {
          ci = Math.min(line.t.length, ci + step);
          el.innerHTML = esc(line.t.slice(0, ci)) + '<span class="lec-cursor"></span>';
          if (ci >= line.t.length) { clearInterval(typer); typer = null; el.innerHTML = lineHTML(line); res(); }
        }, 33);
      });
    }

    // Move the chalk arrow over a token; n adds a count badge that stays.
    function pointAt(tok, n) {
      textEl.querySelectorAll(".tok.hit").forEach(t => t.classList.remove("hit"));
      if (!tok) { ptr.classList.remove("on"); root.classList.remove("counting"); return; }
      const br = board.getBoundingClientRect(), r = tok.getBoundingClientRect();
      ptr.style.left = (r.left - br.left + r.width / 2 - board.clientLeft) + "px";
      ptr.style.top = (r.bottom - br.top - board.clientTop) + "px";
      ptr.classList.add("on"); root.classList.add("pointing", "counting");
      tok.classList.add("hit");
      if (n) tok.dataset.n = n;
    }

    function show(i, opts = {}) {
      idx = Math.max(0, Math.min(slides.length - 1, i));
      gen++; clearTimers(); if (tts) synth.cancel(); talking(false);
      const s = slides[idx]; seen.add(idx);
      labelEl.textContent = s.label;
      countEl.textContent = `${idx + 1}/${slides.length}`;
      bubble.textContent = s.talk;
      artEl.innerHTML = s.art;
      pointAt(null);
      root.classList.toggle("pointing", !!s.point);
      root.classList.remove("cheer"); void root.offsetWidth; root.classList.toggle("cheer", !!s.cheer);
      root.querySelectorAll(".lec-dots button").forEach((d, j) => { d.classList.toggle("on", j === idx); d.classList.toggle("seen", seen.has(j) && j !== idx); });
      $('[data-a="prev"]').disabled = idx === 0;
      $('[data-a="next"]').disabled = idx === slides.length - 1;
      renderLines(s.lines, opts.instant || !playing);
      if (!playing) return;
      const g = gen;
      (async () => {
        if (!(await say(s.talk))) return;              // Kiko's intro line
        await wait(550); if (g !== gen) return;        // beat before the board
        for (let k = 0; k < s.lines.length; k++) {
          const l = s.lines[k];
          if (l.walk) {
            // write it, then read it piece by piece with the arrow on each number
            await writeLine(k, l); if (g !== gen) return;
            await wait(300); if (g !== gen) return;
            const toks = [...textEl.children[k].querySelectorAll(".tok")];
            for (let j = 0; j < l.walk.length; j++) {
              pointAt(toks[j]);
              bubble.textContent = l.walk.slice(0, j + 1).join("… ").replace(/\bplus\b/g, "+").replace(/equals blank/, "= ?");
              if (!(await say(l.walk[j]))) return;
              await wait(140); if (g !== gen) return;
            }
            pointAt(null);
          } else {
            if (l.count != null) {
              // count the numbers one by one before saying the result
              const toks = [...textEl.children[l.count].querySelectorAll(".tok:not(.blank)")];
              const said = [];
              for (let j = 0; j < toks.length; j++) {
                pointAt(toks[j], j + 1);
                const w = lang === "tl" ? L.nums[1][j] || String(j + 1) : String(j + 1);
                said.push(w); bubble.textContent = said.join("… ") + "…";
                if (!(await say(w))) return;
                await wait(260); if (g !== gen) return;
              }
              pointAt(null);
              await wait(300); if (g !== gen) return;
            }
            const [ok] = await Promise.all([say(l.t), writeLine(k, l)]);
            if (!ok || g !== gen) return;
          }
          await wait(480); if (g !== gen) return;      // pause between board lines
        }
        await wait(700); if (g !== gen) return;
        if (idx < slides.length - 1) show(idx + 1); else setPlaying(false);
      })();
    }

    function setPlaying(on) {
      playing = on;
      playBtn.textContent = on ? "❚❚" : (idx === slides.length - 1 && seen.size > 1 ? "↺" : "▶");
      playBtn.setAttribute("aria-label", on ? tr("pause") : tr("play"));
      if (!on) { gen++; clearTimers(); if (tts) synth.cancel(); talking(false); pointAt(null); renderLines(slides[idx].lines, true); }
    }

    function act(a) {
      if (a === "play") {
        if (playing) return setPlaying(false);
        const restart = idx === slides.length - 1 && seen.size > 1;
        setPlaying(true); show(restart ? 0 : idx, { instant: !restart });
      }
      if (a === "prev") show(idx - 1);
      if (a === "next") show(idx + 1);
      if (a === "mute" && tts) {
        muted = !muted; muteBtn.textContent = muted ? "🔇" : "🔊";
        muteBtn.setAttribute("aria-label", muted ? tr("unmute") : tr("mute"));
        if (playing) show(idx, { instant: true });
      }
      if (a === "speed") { rate = RATES[(RATES.indexOf(rate) + 1) % RATES.length]; speedBtn.textContent = rate + "×"; if (playing) show(idx, { instant: true }); }
    }

    root.querySelectorAll("[data-a]").forEach(b => b.addEventListener("click", () => act(b.dataset.a)));
    root.querySelectorAll(".lec-dots button").forEach(b => b.addEventListener("click", () => show(+b.dataset.i)));
    $(".lec-start button").addEventListener("click", () => { $(".lec-start").remove(); setPlaying(true); show(0); });
    const vsel = $(".lec-voice select");
    if (vsel) vsel.addEventListener("change", () => {
      voice = voices.find(v => v.name === vsel.value) || voice;
      try { localStorage.setItem("cscoach.voice", voice.name); } catch (_) {}
      if (playing) show(idx, { instant: true });
    });
    if (tts) { pickVoice(); synth.addEventListener ? synth.addEventListener("voiceschanged", pickVoice) : (synth.onvoiceschanged = pickVoice); }
    if (!tts) { muteBtn.disabled = true; muteBtn.textContent = "🔇"; }

    const onKey = e => {
      if (!root.isConnected) return stop();
      if (/input|textarea/i.test(e.target.tagName)) return;
      if (e.key === "ArrowRight") { e.stopPropagation(); show(idx + 1); }
      if (e.key === "ArrowLeft") { e.stopPropagation(); show(idx - 1); }
    };
    document.addEventListener("keydown", onKey, true);
    const watch = setInterval(() => { if (!root.isConnected) stop(); }, 400);

    function stop() {
      if (stopped) return; stopped = true; gen++;
      clearTimers(); clearInterval(watch);
      if (tts) synth.cancel();
      document.removeEventListener("keydown", onKey, true);
    }

    // first slide shown (static) under the Start overlay
    show(0, { instant: true });
    return stop;
  }

  window.Lecture = { mount };
})();
