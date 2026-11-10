# CS Coach 🇵🇭

A study coach for the **Civil Service Exam (Professional level)**. It runs in any browser, on desktop or phone, and can be packaged as an Android APK or an iOS app.

## Features
- Pick a subject: Verbal (English), Verbal (Filipino), Numerical, Analytical, General Information, or a **Full Mock Exam** (30 random items)
- Interactive answering with instant feedback and explanations
- Results screen with an 80% passing mark and a **review of every question you got wrong**
- "Retry wrong" mode to drill your mistakes
- Best scores are saved on the device
- Green, blue and white theme; works on phones and can be installed as an app (PWA)

> The CSC does not publish actual exam questions. The bank in `www/questions.js` contains practice items modeled on the official exam coverage. Add more by following the same format: `{ q, c: [choices], a: correctIndex, e: explanation }`.

## Run the web version
```bash
npm start        # serves www/ at http://localhost:3000
```
Or open `www/index.html` directly. Any static host works (GitHub Pages, Netlify, Vercel): publish the `www/` folder.

On a phone, open the site and choose **Add to Home Screen** to install it like an app.

## Build the Android APK
Requires Node 18+, Android Studio and a JDK.
```bash
npm install
npm run android  # opens Android Studio → Build → Build APK(s)
```

## Build the iOS app
Requires a Mac with Xcode and CocoaPods.
```bash
npm install
npm run ios      # opens Xcode → choose a device → Run / Archive
```

After editing anything in `www/`, run `npm run cap:sync` to copy the changes into the native projects.
