// Kiko's voice: speaks reactions out loud with a cute, high-pitched "anime" voice (Web Speech API).
// Line sets per language (en / tl / tg): 20 banters + 20 sarcastic (wrong answers),
// 20 cheers + 20 motivational (correct answers). Lines rotate without repeating.
// Voice on/off is kept under its own key ("cscoach.voice"); nothing else is stored.
(function () {
  "use strict";
  const L = {
    banter: {
      en: [
        "Oopsie! The brain buffered for a second 😅", "Hmm, plot twist! That wasn't it ✨", "Close, but the answer ran away from you 🏃",
        "Whoops! Even I trip sometimes, hehe 💦", "That one was sneaky, wasn't it? 🕵️", "Aww, no worries! Let's peek at the explanation 📖",
        "Error 404: correct answer not found 😆", "Plot armor failed. Next scene! 🎬", "Ehehe, wrong door! Try the next one 🚪",
        "My tummy hurts for you. Kidding! Keep going 😹", "Ouchie! But you're still cute 💕", "That's okay! Wrong answers are just practice in disguise 🎭",
        "Gasp! The question won this round! 😲", "Beep boop, brain reboot please 🤖", "Nope! But I believe in you anyway 💚",
        "Hehe, so close I could cry. Oh wait, I can 😭", "Whoa, creative answer! Wrong, but creative 🎨", "Don't worry, even heroes miss sometimes ⚔️",
        "Oh nooo! Okay okay, deep breath, next one 🌬️", "That question was a boss fight. Level up and try again! 🎮"
      ],
      tl: [
        "Ay! Nag-buffer saglit ang utak mo 😅", "Hmm, plot twist! Hindi 'yan ang sagot ✨", "Malapit na, pero tumakbo ang sagot palayo 🏃",
        "Ay naku! Natitisod din ako minsan, hehe 💦", "Tuso 'yung tanong, 'no? 🕵️", "Aww, ayos lang! Silipin natin ang paliwanag 📖",
        "Error 404: hindi mahanap ang tamang sagot 😆", "Bumigay ang plot armor. Susunod na eksena! 🎬", "Ehehe, maling pinto! Subukan ang susunod 🚪",
        "Sumakit ang tiyan ko para sa'yo. Biro lang! Tuloy lang 😹", "Aray! Pero cute ka pa rin 💕", "Ayos lang! Ang maling sagot ay praktis na nagtatago 🎭",
        "Ay! Nanalo ang tanong ngayon! 😲", "Beep boop, i-restart ang utak 🤖", "Mali! Pero naniniwala pa rin ako sa'yo 💚",
        "Hehe, sobrang lapit, muntik na akong umiyak. Teka, puwede pala 😭", "Wow, malikhaing sagot! Mali nga lang, pero malikhain 🎨", "'Wag kang mag-alala, kahit bayani nagkakamali 🦸",
        "Ay hindi! Sige, huminga muna, susunod na 🌬️", "Boss fight pala 'yang tanong. Mag-level up tayo at ulitin! 🎮"
      ],
      tg: [
        "Oopsie! Nag-buffer saglit ang brain mo 😅", "Hmm, plot twist! Hindi 'yan ang sagot ✨", "Close na, pero tumakbo na yung answer 🏃",
        "Whoops! Natitisod din ako minsan, hehe 💦", "Sneaky 'yung question, 'no? 🕵️", "Aww, okay lang! Silipin natin ang explanation 📖",
        "Error 404: hindi mahanap ang correct answer 😆", "Bumigay ang plot armor. Next scene! 🎬", "Ehehe, maling door! Try mo yung next 🚪",
        "Sumakit tiyan ko para sa'yo. Joke lang! Tuloy lang 😹", "Ouchie! Pero cute ka pa rin 💕", "Okay lang! Ang wrong answers ay practice in disguise 🎭",
        "Gasp! Nanalo ang question this round! 😲", "Beep boop, i-reboot ang brain please 🤖", "Mali! Pero naniniwala pa rin ako sa'yo 💚",
        "Hehe, sobrang lapit, iiyak na ako. Teka, pwede pala 😭", "Wow, creative na sagot! Wrong nga lang, pero creative 🎨", "Don't worry, kahit heroes nagkakamali minsan ⚔️",
        "Oh noooo! Okay okay, deep breath, next one 🌬️", "Boss fight pala 'yang question. Level up tayo then try ulit! 🎮"
      ]
    },
    sarcastic: {
      en: [
        "Wow. Bold choice. Wrong, but bold 🙃", "Did you read the question or just vibe with it? 😌", "Amazing! You found the one wrong answer 👏",
        "Plot twist: the phone doesn't know the answer either 📱", "I'm not saying you guessed, but... you guessed 😏", "Congratulations, that's the wrong one! A+ for confidence 🎉",
        "Oh sure, because reading is overrated 📖", "Is your brain on airplane mode again? ✈️", "Interesting strategy. Let's see if it works. Spoiler: no 🍿",
        "I'd clap, but wrong answers don't deserve it 👏", "Wow, you really said 'nah, I know better' huh? 😒", "That answer was so confident. And so wrong 💅",
        "Maybe the explanation is more interesting than the phone? Just maybe 📲", "Eyes on the screen. Brain on the question. Not the other way around 😤", "Keep it up! At this rate you'll master being wrong 🏆",
        "Oh no, the one thing you needed was studying. Weird! 🤷", "I believe in you. The answer doesn't, apparently 😌", "Mhm. Sure. Totally the right answer. In another universe 🌌",
        "Okay bestie, that one was a free point and you declined it 💸", "Cute. Wrong, but cute. Now read the explanation 🥲"
      ],
      tl: [
        "Wow. Matapang na pagpili. Mali, pero matapang 🙃", "Binasa mo ba ang tanong o nag-vibe ka lang? 😌", "Galing! Nahanap mo ang nag-iisang maling sagot 👏",
        "Plot twist: hindi rin alam ng cellphone ang sagot 📱", "Hindi ko sinasabing hinulaan mo, pero... hinulaan mo 😏", "Congrats, mali 'yan! A+ sa kumpiyansa 🎉",
        "Sige, kasi sobrang overrated ang pagbabasa 📖", "Naka-airplane mode ba ulit ang utak mo? ✈️", "Interesting na estratehiya. Tingnan natin kung gagana. Spoiler: hindi 🍿",
        "Papalakpak sana ako, pero hindi karapat-dapat ang maling sagot 👏", "Wow, sabi mo talaga 'ako na ang mas may alam,' 'no? 😒", "Sobrang kumpiyansa ng sagot na 'yan. At sobrang mali 💅",
        "Baka mas interesante ang paliwanag kaysa sa cellphone? Baka lang 📲", "Mata sa screen, utak sa tanong. Hindi baliktad 😤", "Ituloy mo! Sa takbo na 'to, magiging eksperto ka sa pagkakamali 🏆",
        "Ay naku, kailangan pala talaga ang pag-aaral. Nakakagulat! 🤷", "Naniniwala ako sa'yo. Mukhang ang sagot, hindi 😌", "Mhm. Sige. Tama 'yan, sa ibang universe 🌌",
        "Bes, libreng puntos na 'yon, tinanggihan mo pa 💸", "Cute. Mali, pero cute. Ngayon, basahin ang paliwanag 🥲"
      ],
      tg: [
        "Wow. Bold choice. Mali, pero bold 🙃", "Binasa mo ba ang question o nag-vibe ka lang? 😌", "Galing! Nahanap mo ang nag-iisang wrong answer 👏",
        "Plot twist: hindi rin alam ng cellphone ang sagot 📱", "Hindi ko sinasabing hinulaan mo, pero... hinulaan mo 😏", "Congrats, mali 'yan! A+ sa confidence 🎉",
        "Sige, kasi overrated ang pagbabasa 📖", "Naka-airplane mode ba ulit ang brain mo? ✈️", "Interesting strategy. Tingnan natin kung gagana. Spoiler: hindi 🍿",
        "Papalakpak sana ako, pero hindi deserve ng wrong answer 👏", "Wow, sabi mo talaga 'ako na ang mas may alam,' 'no? 😒", "Sobrang confident ng answer na 'yan. At sobrang mali 💅",
        "Baka mas interesting ang explanation kaysa sa phone? Baka lang 📲", "Eyes sa screen, brain sa question. Hindi baliktad 😤", "Keep it up! Sa takbo na 'to, magiging expert ka sa pagkakamali 🏆",
        "Ay naku, kailangan pala talaga ng study. Shocking! 🤷", "Naniniwala ako sa'yo. Mukhang ang answer, hindi 😌", "Mhm. Sige. Tama 'yan, sa ibang universe 🌌",
        "Bes, free point na 'yon, tinanggihan mo pa 💸", "Cute. Mali, pero cute. Ngayon, basahin ang explanation 🥲"
      ]
    },
    cheer: {
      en: [
        "Yay! Correct! 🎉", "Sugoi! You got it! ✨", "Nailed it! 💚", "Wow, so smart! 🌟", "That's right! Amazing! 🎊",
        "Yatta! Another point! 🙌", "Ding ding ding! Perfect! 🔔", "You're on fire! 🔥", "Brain power activated! 🧠✨", "Correct! I'm so proud of you! 🥹",
        "High five! ✋", "Kyaa! That was awesome! 💖", "Boom! Right answer! 💥", "You make it look easy! 😎", "Genius alert! 🚨✨",
        "Woohoo! Keep going! 🚀", "Spot on! 🎯", "Hooray! My hero! 🦸", "That's the one! 💯", "Superb! Do it again! 🌈"
      ],
      tl: [
        "Yey! Tama! 🎉", "Sugoi! Nakuha mo! ✨", "Panalo! 💚", "Wow, ang talino! 🌟", "Tama 'yan! Ang galing! 🎊",
        "Yatta! Isa pang puntos! 🙌", "Ding ding ding! Perpekto! 🔔", "Sunog ka na! 🔥", "Gumana ang lakas ng utak! 🧠✨", "Tama! Proud na proud ako sa'yo! 🥹",
        "High five! ✋", "Kyaa! Ang galing no'n! 💖", "Boom! Tamang sagot! 💥", "Parang ang dali lang para sa'yo! 😎", "Henyo alert! 🚨✨",
        "Woohoo! Tuloy lang! 🚀", "Bullseye! 🎯", "Hooray! Bayani ko! 🦸", "Iyan na 'yon! 💯", "Napakagaling! Ulitin mo pa! 🌈"
      ],
      tg: [
        "Yay! Tama! 🎉", "Sugoi! Nakuha mo! ✨", "Nailed it! 💚", "Wow, ang talino! 🌟", "Tama 'yan! Amazing! 🎊",
        "Yatta! Another point! 🙌", "Ding ding ding! Perfect! 🔔", "Sunog ka na! 🔥", "Brain power activated! 🧠✨", "Tama! Proud na proud ako sa'yo! 🥹",
        "High five! ✋", "Kyaa! Ang galing no'n! 💖", "Boom! Tamang sagot! 💥", "Parang ang dali lang para sa'yo! 😎", "Genius alert! 🚨✨",
        "Woohoo! Tuloy lang! 🚀", "Spot on! 🎯", "Hooray! My hero! 🦸", "Iyan na 'yon! 💯", "Superb! Ulit pa! 🌈"
      ]
    },
    motivate: {
      en: [
        "Correct! Every right answer brings you closer to passing! 💪", "You're building something great, one question at a time 🧱", "Keep this up and the exam will be easy 🌟",
        "Consistency beats talent. And you have both! 💚", "Your future self is saying thank you right now 🙏", "Small steps every day lead to big wins 🚶",
        "That's the spirit! Believe in yourself! ✨", "You've got what it takes to be a civil servant! 🏛️", "Hard work is paying off. I can see it! 🌱",
        "Keep going. Your family will be so proud! 🥹", "One more question, one more step toward your dream 🎯", "You are learning, and that's what matters most 📚",
        "Stay focused. You're doing amazing! 🔥", "Don't stop now. You're closer than you think! 🏁", "Every correct answer is a win. Celebrate it! 🎉",
        "You can do hard things. Look, you just did! 💫", "Trust your preparation. It's working! 🧠", "Progress, not perfection. And you're progressing! 📈",
        "The passing score is waiting for you. Go get it! 🏆", "Believe it. You're going to make it! 🌈"
      ],
      tl: [
        "Tama! Bawat tamang sagot ay palapit sa pagpasa! 💪", "May magandang binubuo ka, isang tanong sa bawat pagkakataon 🧱", "Ituloy mo 'yan at magiging madali ang eksamen 🌟",
        "Mas mahalaga ang tiyaga kaysa talento. At pareho mo 'yan! 💚", "Nagpapasalamat na ang sarili mo sa hinaharap 🙏", "Ang maliliit na hakbang araw-araw ay humahantong sa malaking tagumpay 🚶",
        "Ganyan nga! Maniwala ka sa sarili mo! ✨", "Kaya mong maging lingkod-bayan! 🏛️", "Nagbubunga na ang sipag mo. Nakikita ko! 🌱",
        "Tuloy lang. Magiging proud ang pamilya mo! 🥹", "Isa pang tanong, isa pang hakbang papunta sa pangarap mo 🎯", "Natututo ka, at 'yan ang pinakamahalaga 📚",
        "Mag-focus ka lang. Ang galing mo! 🔥", "'Wag kang titigil ngayon. Mas malapit ka na kaysa sa akala mo! 🏁", "Bawat tamang sagot ay panalo. I-celebrate mo! 🎉",
        "Kaya mo ang mahihirap na bagay. Tingnan mo, nagawa mo! 💫", "Magtiwala ka sa paghahanda mo. Gumagana ito! 🧠", "Pag-unlad, hindi kasakdalan. At umuunlad ka! 📈",
        "Naghihintay sa'yo ang passing score. Kunin mo na! 🏆", "Maniwala ka. Makakapasa ka! 🌈"
      ],
      tg: [
        "Tama! Bawat right answer ay palapit sa pagpasa! 💪", "May magandang binubuo ka, one question at a time 🧱", "Keep this up at magiging madali ang exam 🌟",
        "Consistency beats talent. At pareho mo 'yan! 💚", "Nagpapasalamat na ang future self mo ngayon 🙏", "Small steps every day, big wins in the end 🚶",
        "Ganyan nga! Believe in yourself! ✨", "Kaya mong maging civil servant! 🏛️", "Nagbubunga na ang sipag mo. Nakikita ko! 🌱",
        "Tuloy lang. Magiging proud ang family mo! 🥹", "One more question, one more step sa dream mo 🎯", "Natututo ka, at 'yan ang pinakaimportante 📚",
        "Stay focused. Ang galing mo! 🔥", "'Wag kang titigil ngayon. Mas malapit ka na kaysa sa akala mo! 🏁", "Bawat correct answer ay win. I-celebrate mo! 🎉",
        "Kaya mo ang mahirap na bagay. Look, nagawa mo! 💫", "Trust your preparation. Gumagana ito! 🧠", "Progress, not perfection. At nagpo-progress ka! 📈",
        "Naghihintay sa'yo ang passing score. Go get it! 🏆", "Believe it. Makakapasa ka! 🌈"
      ]
    }
  };

  const lang = () => (window.I18N && window.I18N.lang) || "en";
  const bags = {}, lastPick = {};
  function rot(key, pool) {   // shuffle-bag: no repeats until the whole set was used
    let b = bags[key];
    if (!b || !b.length) {
      b = pool.map((_, i) => i);
      for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
      if (b[b.length - 1] === lastPick[key]) b.unshift(b.pop());
      bags[key] = b;
    }
    const i = b.pop(); lastPick[key] = i;
    return pool[i];
  }
  const line = kind => rot(lang() + ":" + kind, L[kind][lang()] || L[kind].en);

  // ---------- speech ----------
  const synth = window.speechSynthesis;
  let enabled = true;
  try { enabled = localStorage.getItem("cscoach.voice") !== "off"; } catch (_) {}
  let voices = [];
  const load = () => { try { voices = synth ? synth.getVoices() : []; } catch (_) {} };
  load();
  if (synth && synth.addEventListener) synth.addEventListener("voiceschanged", load);

  // Cute voice: prefer a female / "Kyoko"-style voice, then pitch it up
  const CUTE = /kyoko|nanami|haruka|ayumi|female|zira|samantha|karen|tessa|moira|google (us english|uk english female)|aria|jenny|fiona|victoria/i;
  function pickVoice(l) {
    const fil = voices.filter(v => /^(fil|tl)/i.test(v.lang));
    const en = voices.filter(v => /^en/i.test(v.lang));
    const pool = l === "en" ? en : (fil.length ? fil : en);
    return pool.find(v => CUTE.test(v.name)) || pool[0] || voices.find(v => CUTE.test(v.name)) || null;
  }
  // Remove emojis/markup so the voice reads only words; sprinkle a little anime flavor
  function clean(s) {
    return String(s || "").replace(/<[^>]*>/g, " ")
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, "")
      .replace(/&amp;/g, "and").replace(/\s+/g, " ").trim();
  }
  function speak(text) {
    if (!enabled || !synth || typeof SpeechSynthesisUtterance === "undefined") return;
    const s = clean(text);
    if (!s) return;
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(s);
      const l = lang(), v = pickVoice(l);
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = l === "en" ? "en-US" : "fil-PH";
      u.pitch = 1.9;    // high and cute (browsers cap at 2)
      u.rate = 1.12;    // a bit bouncy
      u.volume = 1;
      synth.speak(u);
    } catch (_) {}
  }

  window.Voice = {
    speak, clean,
    // correct answer: cheer or motivation
    correct() { return line(Math.random() < 0.5 ? "cheer" : "motivate"); },
    // wrong answer: banter or sarcasm (more sarcasm after several misses in a row)
    wrong(cold) { return line(Math.random() < (cold ? 0.75 : 0.5) ? "sarcastic" : "banter"); },
    lines: L,
    isOn: () => enabled,
    setOn(v) { enabled = !!v; try { localStorage.setItem("cscoach.voice", enabled ? "on" : "off"); } catch (_) {} if (!enabled && synth) { try { synth.cancel(); } catch (_) {} } }
  };
})();
