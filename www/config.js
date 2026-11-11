// Website settings.
// After deploying server/worker.js to Cloudflare, paste its URL here, e.g.
//   window.CS_AI_ENDPOINT = "https://cs-coach-ai.<your-subdomain>.workers.dev";
// Leave empty to run without AI on the website (the claude.ai version has AI built in).
window.CS_AI_ENDPOINT = "";

// Donations (Settings → Support CS Coach). The section stays hidden until a number is set.
// These values are public: anyone can read them in the website's code.
window.CS_DONATE = {
  name: "",     // account name shown to donors, e.g. "Karen M."
  gcash: "",    // GCash number, e.g. "0917 123 4567"
  maya: "",     // Maya number (leave empty to hide)
  qr: ""        // optional QR image file in www/, e.g. "icons/gcash-qr.png"
};
