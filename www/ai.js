// One AI connection for the whole app (tutor chat + AI-generated questions):
//  1. inside claude.ai (the artifact): Claude through the page's "sample" capability
//  2. on the website: the CS Coach server (CS_AI_ENDPOINT in config.js), if set up
//  3. otherwise: no AI (the app uses its built-in coach)
window.CSAI = (function () {
  "use strict";
  let ready = null;
  function viaServer(url) {
    const call = async (input, opts) => {
      const messages = typeof input === "string" ? [{ role: "user", content: input }] : input;
      let res, data = {};
      try {
        res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages }) });
        data = await res.json().catch(() => ({}));
      } catch (_) { const e = new Error("offline"); e.code = "offline"; throw e; }
      if (!res.ok || data.error) { const e = new Error(data.error || "error"); e.code = res.status === 429 ? "rate_limited" : (data.error || "error"); throw e; }
      if (opts && opts.onText) opts.onText({ text: data.text, delta: data.text });
      return { text: data.text, truncated: false };
    };
    call.json = async (input, opts) => {
      const { text } = await call(input, opts);
      const m = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      return JSON.parse(m ? m[0] : text);
    };
    return call;
  }
  function get() {
    if (ready) return ready;
    ready = (async () => {
      if (window.claude && typeof window.claude.use === "function") {
        try { const s = await window.claude.use("sample"); if (s) return s; } catch (_) {}
      }
      return window.CS_AI_ENDPOINT ? viaServer(window.CS_AI_ENDPOINT) : null;
    })();
    return ready;
  }
  return { get };
})();
