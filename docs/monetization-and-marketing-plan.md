# CS Coach: monetization & marketing plan

Decisions so far: test pricing first · manual GCash payments first · keep the public site live until the new one works.

## Phase 0: Measure (weeks 1–2, no price yet)
Turn on analytics (see `www/analytics.js`; set `measurementId` in `www/config.js`). Watch in Firebase/GA4:
| Question | Where to look |
|---|---|
| How many people visit? | Users, New users |
| How long do they stay? | Average engagement time |
| Do they come back? | Retention (day 1, day 7) |
| What do they use? | `tab_open` and `quiz_complete` events |
| Do they finish quizzes? | `quiz_complete` count vs. visits |

**Decision rule:** if fewer than ~20% come back on day 7, fix the app/content *before* charging. If 30%+ come back, start selling.

## Phase 1: Test willingness to pay (weeks 2–4)
No code needed. Run a survey inside the app/FB posts: "Would you pay ₱99 for all questions until your exam?" Also post a "Support CS Coach" GCash price and count who actually pays. Compare ₱49 / ₱99 / ₱199 by showing different prices to different groups.

## Phase 2: Free limit + Exam Season Pass
- **Free:** 2–3 subjects, 1 limited mock exam, analytics, Kiko.
- **Paid (suggested ₱99–199 one-time, valid until the exam date):** all subjects, full mock exams, AI-generated questions, cloud backup.
- Manual flow: user pays GCash → sends reference number + account email (via the in-app report form) → you mark them "paid".
- Real locking needs paid questions on a server that checks the account. Do this once people are paying; a browser-only lock can be bypassed.
- Later: PayMongo for instant, automatic unlock.

## Marketing (low cost)
1. **Short videos (TikTok / Reels / Shorts):** "3 CSC questions 90% get wrong". Link in bio to the site. Post 3–4 a week.
2. **Facebook groups** (CSC reviewers, civil service Philippines): share free tips, not ads. Answer questions, mention the app when relevant.
3. **Referral:** invite a friend, both get extra questions or a discount.
4. **Exam calendar:** push harder 4–8 weeks before each CSC exam date. Sales are seasonal.
5. **Partners:** review centers, university graduating-class pages, LGU/government employee groups. Offer a free pass to group admins who share it.
6. **Reviews:** ask happy users for a short testimonial; show it on the unlock screen.
7. **SEO:** a few blog/FB posts like "CSC Professional exam coverage" that link to the app.

## Trust & legal basics
- Add a short privacy note (what analytics collect) and refund policy.
- Questions are "modeled on" the exam, not real leaked items. Keep saying that.
- Consider registering a DTI business name before taking regular payments.

## Moving off public GitHub Pages
1. Deploy `www/` to Cloudflare Pages (free; works with a private repo) and test it.
2. Add the new domain to Firebase → Authentication → Authorized domains.
3. Change the old GitHub Pages site to a redirect page to the new URL.
4. Then make the repo private. (The deployed JS is still readable by visitors.)
