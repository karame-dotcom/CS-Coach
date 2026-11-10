// One AI connection for the whole app (tutor chat, explanations, AI questions, word lookups).
// Order: 1) inside claude.ai: Claude via the page's "sample" capability
//        2) the user's OWN API key (Settings → AI tutor): Google Gemini (free tier) or Claude
//        3) the optional CS Coach server (config.js → CS_AI_ENDPOINT)
//        4) none: the built-in tutor is used
// The user's key is stored only on this device (localStorage "cscoach.aikey", not in
// backups) and is sent only to the provider they chose.
window.CSAI = (function () {
  "use strict";
  let ready = null;
  const read = () => { try { return JSON.parse(localStorage.getItem("cscoach.aikey")) || null; } catch (_) { return null; } };
  const err = (code, msg) => { const e = new Error(msg || code); e.code = code; return e; };
  const toMessages = input => typeof input === "string" ? [{ role: "user", content: input }] : input;
  const parseJson = text => { const m = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/); return JSON.parse(m ? m[0] : text); };
  function wrap(callText) {
    const call = async (input, opts) => {
      const text = await callText(toMessages(input));
      if (opts && opts.onText) opts.onText({ text, delta: text });
      return { text, truncated: false };
    };
    call.json = async (input, opts) => parseJson((await call(input, opts)).text);
    return call;
  }

  // ---- Google Gemini (free tier with a Google AI Studio key) ----
  const GEMINI = "https://generativelanguage.googleapis.com/v1beta/";
  async function geminiModel(key) {
    const cached = localStorage.getItem("cscoach.geminiModel");
    if (cached) return cached;
    let pick = "models/gemini-2.5-flash";
    try {
      const r = await fetch(GEMINI + "models?pageSize=200", { headers: { "x-goog-api-key": key } });
      if (r.status === 400 || r.status === 403) throw err("bad_key");
      const d = await r.json();
      // newest stable "flash" text model that supports generateContent
      const ok = (d.models || []).filter(m => (m.supportedGenerationMethods || []).includes("generateContent")
        && /gemini-[\d.]+-flash$/.test(m.name));
      const ver = n => parseFloat((n.match(/gemini-([\d.]+)/) || [0, 0])[1]);
      ok.sort((a, b) => ver(b.name) - ver(a.name));
      if (ok.length) pick = ok[0].name;
    } catch (e) { if (e.code === "bad_key") throw e; }
    try { localStorage.setItem("cscoach.geminiModel", pick); } catch (_) {}
    return pick;
  }
  function viaGemini(key) {
    return wrap(async messages => {
      const model = await geminiModel(key);
      let res, d = {};
      try {
        res = await fetch(GEMINI + model + ":generateContent", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            contents: messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
            generationConfig: { maxOutputTokens: 4096 }
          })
        });
        d = await res.json().catch(() => ({}));
      } catch (_) { throw err("offline"); }
      if (res.status === 429) throw err("rate_limited");
      if (res.status === 400 || res.status === 401 || res.status === 403) throw err("bad_key", d.error && d.error.message);
      if (res.status === 404) { try { localStorage.removeItem("cscoach.geminiModel"); } catch (_) {} throw err("error"); }
      if (!res.ok) throw err("error", d.error && d.error.message);
      const c = d.candidates && d.candidates[0];
      const text = c && c.content && (c.content.parts || []).map(p => p.text || "").join("");
      if (!text) throw err("refusal");
      return text;
    });
  }

  // ---- Claude with the user's own Anthropic key (official SDK, loaded on demand) ----
  function viaClaude(key, model) {
    let clientP = null;
    const client = () => clientP || (clientP = import("https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk/+esm")
      .then(m => new (m.default || m.Anthropic)({ apiKey: key, dangerouslyAllowBrowser: true })));
    return wrap(async messages => {
      let Anthropic, c;
      try { c = await client(); Anthropic = c.constructor; } catch (_) { throw err("offline"); }
      const opus = model !== "claude-haiku-5-5";
      try {
        const response = opus
          ? await c.beta.messages.create({ model, max_tokens: 16000, output_config: { effort: "low" }, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default", messages })
          : await c.messages.create({ model, max_tokens: 16000, output_config: { effort: "low" }, messages });
        if (response.stop_reason === "refusal") throw err("refusal");
        return response.content.filter(b => b.type === "text").map(b => b.text).join("");
      } catch (e) {
        if (e.code) throw e;
        if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw err("bad_key");
        if (e instanceof Anthropic.RateLimitError) throw err("rate_limited");
        throw err("error");
      }
    });
  }

  // ---- optional shared server ----
  function viaServer(url) {
    return wrap(async messages => {
      let res, data = {};
      try {
        res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages }) });
        data = await res.json().catch(() => ({}));
      } catch (_) { throw err("offline"); }
      if (!res.ok || data.error) throw err(res.status === 429 ? "rate_limited" : (data.error || "error"));
      return data.text;
    });
  }

  function get() {
    if (ready) return ready;
    ready = (async () => {
      if (window.claude && typeof window.claude.use === "function") {
        try { const s = await window.claude.use("sample"); if (s) return s; } catch (_) {}
      }
      const own = read();
      if (own && own.key) return own.provider === "claude" ? viaClaude(own.key, own.model || "claude-opus-5-5") : viaGemini(own.key);
      return window.CS_AI_ENDPOINT ? viaServer(window.CS_AI_ENDPOINT) : null;
    })();
    return ready;
  }
  function setKey(cfg) {
    try {
      if (cfg && cfg.key) localStorage.setItem("cscoach.aikey", JSON.stringify(cfg)); else localStorage.removeItem("cscoach.aikey");
      localStorage.removeItem("cscoach.geminiModel");
    } catch (_) {}
    ready = null;
    document.dispatchEvent(new CustomEvent("cscoach:ai"));
  }
  // quick check that a key works (one tiny request)
  async function test(cfg) {
    const fn = cfg.provider === "claude" ? viaClaude(cfg.key, cfg.model || "claude-opus-5-5") : viaGemini(cfg.key);
    const r = await fn("Reply with just the word OK.");
    return /ok/i.test(r.text);
  }
  const builtIn = () => !!(window.claude && typeof window.claude.use === "function");
  return { get, setKey, test, current: read, builtIn };
})();
