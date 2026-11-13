// CS Coach usage analytics (Firebase Analytics / Google Analytics 4).
// - Off until window.CS_FIREBASE.measurementId is set in config.js (nothing is loaded or sent before that).
// - Sends only anonymous usage events (visits, tab opened, quiz finished). Never names, emails,
//   answers or progress data. Respects the browser's "Do Not Track" setting.
// - Never affects the app: every call is wrapped so a failure here cannot break studying.
(function () {
  "use strict";
  const CFG = window.CS_FIREBASE || {};
  const ON = !!(CFG.apiKey && CFG.projectId && CFG.appId && CFG.measurementId) &&
    navigator.doNotTrack !== "1" && window.doNotTrack !== "1";
  const SDK = "https://www.gstatic.com/firebasejs/10.14.1/";
  let ready = null;
  const queue = [];

  function init() {
    if (!ON || ready) return;
    ready = Promise.all([import(SDK + "firebase-app.js"), import(SDK + "firebase-analytics.js")]).then(async ([app, an]) => {
      if (!(await an.isSupported())) return null;
      const a = an.getAnalytics(app.initializeApp(CFG, "cs-analytics"));
      return { an, a };
    }).catch(() => null);
    ready.then(r => { if (r) queue.splice(0).forEach(e => r.an.logEvent(r.a, e[0], e[1])); });
  }

  window.CSTrack = function (name, params) {
    try { if (!ON) return; init(); ready.then(r => { if (r) r.an.logEvent(r.a, name, params || {}); }); } catch (_) {}
  };
  // Start counting visits as soon as the page loads (after the first paint).
  if (ON) window.addEventListener("load", () => setTimeout(init, 1500));
})();
