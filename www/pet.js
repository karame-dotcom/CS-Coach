// Kiko: CS Coach's animated study buddy (original character).
// API: Pet.cheer(msg), Pet.cry(msg), Pet.say(msg, ms), Pet.hop(), Pet.setVisible(bool), Pet.setChatOpen(bool), Pet.avatar()
// Tapping Kiko opens the tutor chat (coach.js).
(function () {
  "use strict";
  const SVG = `
  <svg viewBox="0 0 120 120" class="kiko" aria-hidden="true">
    <defs>
      <linearGradient id="kikoBody" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#3b82f6"/>
      </linearGradient>
    </defs>
    <ellipse class="k-shadow" cx="60" cy="112" rx="30" ry="5" fill="#0f2a3d" opacity=".15"/>
    <g class="k-bod">
      <ellipse cx="44" cy="104" rx="10" ry="6" fill="#2563eb"/>
      <ellipse cx="76" cy="104" rx="10" ry="6" fill="#2563eb"/>
      <g class="k-arm k-arm-l"><ellipse cx="22" cy="74" rx="8" ry="12" fill="#22c58b"/></g>
      <g class="k-arm k-arm-r"><ellipse cx="98" cy="74" rx="8" ry="12" fill="#3b82f6"/></g>
      <ellipse cx="60" cy="70" rx="40" ry="36" fill="url(#kikoBody)"/>
      <ellipse cx="60" cy="84" rx="24" ry="17" fill="#fff" opacity=".92"/>
      <g class="k-sprout">
        <path d="M60 35 Q59 26 61 18" stroke="#16a34a" stroke-width="4" fill="none" stroke-linecap="round"/>
        <ellipse cx="51" cy="19" rx="10" ry="5.5" fill="#22c55e" transform="rotate(-25 51 19)"/>
        <ellipse cx="70" cy="16" rx="10" ry="5.5" fill="#4ade80" transform="rotate(20 70 16)"/>
      </g>
      <ellipse cx="36" cy="74" rx="6" ry="3.5" fill="#fb7185" opacity=".55"/>
      <ellipse cx="84" cy="74" rx="6" ry="3.5" fill="#fb7185" opacity=".55"/>
      <!-- idle -->
      <g class="m-idle">
        <g class="k-eyes">
          <ellipse cx="46" cy="62" rx="5" ry="6.5" fill="#0f2a3d"/><circle cx="47.8" cy="59.5" r="1.8" fill="#fff"/>
          <ellipse cx="74" cy="62" rx="5" ry="6.5" fill="#0f2a3d"/><circle cx="75.8" cy="59.5" r="1.8" fill="#fff"/>
        </g>
        <path d="M54 74 Q60 79 66 74" stroke="#0f2a3d" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      </g>
      <!-- happy -->
      <g class="m-happy">
        <path d="M40 64 Q46 55 52 64" stroke="#0f2a3d" stroke-width="3.2" fill="none" stroke-linecap="round"/>
        <path d="M68 64 Q74 55 80 64" stroke="#0f2a3d" stroke-width="3.2" fill="none" stroke-linecap="round"/>
        <path d="M51 72 Q60 72 69 72 Q67 84 60 84 Q53 84 51 72 Z" fill="#0f2a3d"/>
        <ellipse cx="60" cy="80" rx="5" ry="3" fill="#fb7185"/>
      </g>
      <!-- sad -->
      <g class="m-sad">
        <path d="M39 55 L51 59" stroke="#0f2a3d" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M81 55 L69 59" stroke="#0f2a3d" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M41 66 Q46 62 51 66" stroke="#0f2a3d" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M69 66 Q74 62 79 66" stroke="#0f2a3d" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M53 80 Q60 73 67 80" stroke="#0f2a3d" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path class="k-tear t1" d="M45 68 Q42 74 45 76 Q48 74 45 68 Z" fill="#60a5fa"/>
        <path class="k-tear t2" d="M75 68 Q72 74 75 76 Q78 74 75 68 Z" fill="#60a5fa"/>
      </g>
    </g>
    <g class="k-sparkles">
      <path d="M14 30 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#facc15"/>
      <path d="M100 22 l2.4 5.6 5.6 2.4 -5.6 2.4 -2.4 5.6 -2.4 -5.6 -5.6 -2.4 5.6 -2.4z" fill="#22c55e"/>
      <path d="M106 58 l2 4.5 4.5 2 -4.5 2 -2 4.5 -2 -4.5 -4.5 -2 4.5 -2z" fill="#3b82f6"/>
    </g>
  </svg>`;

  const MSG = {
    en: {
      cheer: ["Great job! 🎉", "Correct! Keep it up! ✨", "Wow, so smart! 🌟", "Yes! You got it! 💚", "Correct! That's a pass! 🎊"],
      cry: ["Aww… it's okay, we'll learn! 💧", "So close… next one! 🥲", "It's okay, mistakes help us learn 💙", "Let me cry a bit… then we bounce back! 😢"],
      pat: ["Hehe, that tickles! 😆", "You can do this! 💪", "I'm your study buddy! 🌱", "Just a little more push! 🚀", "Proud of you! 💚"]
    },
    tl: {
      cheer: ["Ang galing mo! 🎉", "Tama! Ituloy mo lang! ✨", "Wow, ang talino! 🌟", "Oo! Nakuha mo! 💚", "Tama! Pasado 'yan! 🎊"],
      cry: ["Huhu… ayos lang, matututo tayo! 💧", "Sayang… sa susunod! 🥲", "Ayos lang, natututo tayo sa pagkakamali 💙", "Iiyak muna ako… tapos babawi tayo! 😢"],
      pat: ["Hehe, nakikiliti ako! 😆", "Kaya mo 'yan! 💪", "Kasama mo ako sa pag-aaral! 🌱", "Kaunting tiyaga pa! 🚀", "Ipinagmamalaki kita! 💚"]
    },
    tg: {
      cheer: ["Galing mo! 🎉", "Tama! Keep it up! ✨", "Wow, ang talino! 🌟", "Yes! Nakuha mo! 💚", "Correct! Pasado 'yan! 🎊"],
      cry: ["Huhu… okay lang, matututo tayo! 💧", "Aww, sayang… next one! 🥲", "It's okay, natututo tayo sa mistakes 💙", "Iyak muna tayo… tapos bawi! 😢"],
      pat: ["Hehe, kiliti! 😆", "You can do this! 💪", "Study buddy mo ako! 🌱", "Konting push pa! 🚀", "Proud of you! 💚"]
    }
  };
  const msgs = () => MSG[(window.I18N && window.I18N.lang) || "en"] || MSG.en;

  const root = document.createElement("div");
  root.className = "pet-wrap";
  root.innerHTML = `<div class="pet-bubble hidden"></div><div class="pet idle" role="button" tabindex="0" aria-label="Kiko: tap to ask your tutor buddy">${SVG}</div><div class="pet-hearts"></div>`;
  document.body.appendChild(root);
  const pet = root.querySelector(".pet");
  const bubble = root.querySelector(".pet-bubble");
  const hearts = root.querySelector(".pet-hearts");

  let moodTimer = null, bubbleTimer = null, x = 0, facing = 1;
  const pick = a => a[Math.floor(Math.random() * a.length)];

  function setMood(m, ms) {
    clearTimeout(moodTimer);
    pet.classList.remove("idle", "happy", "sad", "hop");
    void pet.offsetWidth; // restart animations
    pet.classList.add(m);
    if (ms) moodTimer = setTimeout(() => setMood("idle"), ms);
  }
  function say(msg, ms) {
    clearTimeout(bubbleTimer);
    bubble.textContent = msg;
    bubble.classList.remove("hidden");
    bubbleTimer = setTimeout(() => bubble.classList.add("hidden"), ms || 2600);
  }
  function burstHearts(ch) {
    for (let i = 0; i < 5; i++) {
      const h = document.createElement("span");
      h.textContent = ch || "💚";
      h.style.left = (20 + Math.random() * 50) + "px";
      h.style.animationDelay = (i * 0.08) + "s";
      hearts.appendChild(h);
      setTimeout(() => h.remove(), 1400);
    }
  }

  // Wander left and right along the bottom of the screen
  function wander() {
    if (!pet.classList.contains("idle")) return;
    const max = window.innerWidth < 480 ? 40 : Math.min(140, window.innerWidth * 0.28);
    const nx = Math.round(Math.random() * max);
    facing = nx >= x ? 1 : -1;
    x = nx;
    root.style.transform = `translateX(${x}px)`;
    pet.style.setProperty("--face", facing);
    pet.classList.add("walking");
    setTimeout(() => pet.classList.remove("walking"), 1600);
  }
  setInterval(wander, 5200);

  // Kiko IS the chat: tapping opens the tutor chat
  const hint = document.createElement("span");
  hint.className = "pet-ask"; hint.textContent = "💬";
  root.appendChild(hint);
  let chatOpen = false;
  function tap() {
    setMood("happy", 900); burstHearts();
    if (window.CoachUI) window.CoachUI.toggle(); else say(pick(msgs().pat));
  }
  pet.addEventListener("click", tap);
  hint.addEventListener("click", tap);
  bubble.addEventListener("click", tap);
  pet.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(); } });

  // Now and then, invite the student to ask a question
  const invite = () => {
    const I = window.I18N;
    if (chatOpen || root.classList.contains("hidden") || !pet.classList.contains("idle") || !bubble.classList.contains("hidden") || !I) return;
    const list = I.t("askMe");
    say(list[Math.floor(Math.random() * list.length)], 3500);
  };
  setTimeout(invite, 9000);
  setInterval(invite, 40000);

  window.Pet = {
    cheer(msg) { setMood("happy", 2200); say(msg || pick(msgs().cheer)); burstHearts(pick(["✨", "💚", "⭐"])); },
    cry(msg) { setMood("sad", 2800); say(msg || pick(msgs().cry), 3000); },
    say,
    hop() { setMood("hop", 600); },
    setVisible(v) { root.classList.toggle("hidden", !v); document.body.classList.toggle("no-pet", !v); },
    setChatOpen(v) { chatOpen = v; root.classList.toggle("chatting", v); if (v) { bubble.classList.add("hidden"); setMood("happy", 900); } },
    // small static Kiko for the chat header (unique gradient id)
    avatar() { return SVG.replace(/kikoBody/g, "kikoMini").replace('class="kiko"', 'class="kiko-mini"'); }
  };
})();
