# CS Coach 🇵🇭

A study coach for the **Civil Service Exam (Professional level)**. It runs in any browser, on desktop or phone, and can be packaged as an Android APK or an iOS app.

## Features
- Three tabs:
  - **Learn**: short original lessons per topic (25 lessons), each followed by the questions on that topic
  - **Practice**: subject rounds, Full Mock Exam, starred questions
  - **Analytics**: stat tiles, accuracy-by-subject chart, score trend, weakest topics, table view
- Interface language: **English, Tagalog or Taglish** (chosen at setup; also applies to Kiko and the AI coach). Questions stay in their exam language, as in the real CSC exam
- First-run setup: your name and Exam mode (answers revealed after submitting) or Practice mode (instant feedback); change anytime in Settings
- Tap a subject to jump straight into a 10-question round (new and missed questions first), or take a **Full Mock Exam**. 200+ questions in total
- One-line question overview, arrow buttons (plus swipe and keyboard arrows) for Previous/Next, a "Not sure" tick mark, and a ⭐ star to come back to questions
- "Help me" coach on every question: hints on how to approach it without giving the answer
- Results screen with an 80% passing mark and a **review of every question**, filterable by correct, wrong, unanswered, not sure and starred
- "Retry wrong" mode to drill your mistakes
- Per-subject analytics (accuracy and progress) saved on the device
- **AI Coach** floating chat: analyzes your stats, finds weak subjects, and builds a daily study plan around your exam date. Uses Claude when the page runs as a claude.ai artifact; otherwise a built-in coach answers from your local analytics
- **Kiko**, an animated study buddy that wanders, cheers when you get it right and cries with you when you miss (in Exam mode it reacts to your final score so answers stay hidden)
- Green, blue and white theme; works on phones and can be installed as an app (PWA)

> The CSC does not publish actual exam questions. The bank in `www/questions.js` contains practice items modeled on the official exam coverage. Add more by following the same format: `{ q, c: [choices], a: correctIndex, e: explanation, h: coaching hint }`.

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
