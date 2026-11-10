// CS Coach lectures: short original lessons per topic, each linked to the
// practice questions (by index in that subject's question list).
// imp: importance for the exam (3 = high-yield, 2 = important, 1 = good to know),
//      an estimate based on how often each topic appears in CSC-style reviewers.
// yt:  YouTube search used for the "Watch video lessons" button (sorted by views).
// video: optional specific YouTube video (embedded outside the claude.ai artifact).
window.LESSONS = {
  verbal: [
    { id: "v-sva", imp: 3, yt: "civil service exam subject verb agreement", video: { id: "SAEdCQQzteU", title: "Subject-Verb Agreement · Team Lyqa" }, title: "Subject–Verb Agreement", mins: 4,
      intro: "The verb must agree in number with its true subject. The exam loves to hide the subject behind long phrases.",
      points: [
        "Find the real subject. Ignore phrases like 'of the applicants' or 'along with his staff'. Example: 'Each of the applicants HAS…'",
        "Each, every, either, neither, everyone, anybody → singular.",
        "Neither…nor / Either…or → the verb agrees with the subject CLOSER to it. 'Neither the teacher nor the students WERE…'",
        "'The number of…' is singular ('has'). 'A number of…' is plural ('have').",
        "Subjects ending in -s that are singular: mathematics, physics, news, economics."
      ],
      example: { q: "The list of requirements ___ posted outside.", a: "IS. The subject is 'list' (singular), not 'requirements'." },
      remember: "Cross out the prepositional phrase, then read the subject and verb together.",
      qs: [2, 5, 10, 27, 36] },
    { id: "v-vocab", imp: 3, yt: "civil service exam vocabulary synonyms antonyms", title: "Vocabulary: Synonyms, Antonyms & Context Clues", mins: 5,
      intro: "Vocabulary items test meaning. You don't need to know every word: use context and word roots.",
      points: [
        "Read the whole sentence. The situation usually tells you if the word is positive or negative.",
        "Roots help: bene- (good), mal- (bad), ambi- (both), trans- (across), -ous (full of).",
        "For antonyms, three choices are often near-synonyms of the word. The odd one out is the opposite.",
        "Watch for 'trap' choices that describe the speaker's mood instead of the word's meaning.",
        "Common exam words: terse, prudent, ubiquitous, meticulous, candid, frugal, mitigate, alleviate."
      ],
      example: { q: "The DILIGENT clerk finished early. DILIGENT means…", a: "Hardworking. The clue 'finished early' points to effort." },
      remember: "Decide first if the word is positive or negative, then pick from matching choices.",
      qs: [0, 1, 7, 9, 11, 14, 15, 16, 22, 23, 28, 32, 33, 38] },
    { id: "v-analogy", imp: 2, yt: "civil service exam analogy verbal", title: "Analogies", mins: 3,
      intro: "An analogy asks you to find the same relationship in a second pair.",
      points: [
        "Turn the first pair into a sentence: 'A pen is the tool of a writer.'",
        "Apply the exact same sentence to the second pair and each choice.",
        "Common relationships: tool–user, item–place, part–whole, lack-of (coward : bravery), group-of (archipelago : islands), cause–effect.",
        "If two choices fit, make your sentence more specific."
      ],
      example: { q: "BOOK : LIBRARY :: PAINTING : ?", a: "Museum. 'A ___ is kept and displayed in a ___.'" },
      remember: "Build the bridge sentence first. Never pick by 'feel'.",
      qs: [3, 12, 17, 25, 34] },
    { id: "v-idioms", imp: 2, yt: "civil service exam idiomatic expressions", title: "Idioms & Expressions", mins: 3,
      intro: "Idioms mean something different from their literal words.",
      points: [
        "Picture the literal image, then ask what it suggests (burning oil at midnight → working late).",
        "Decide if the idiom is positive or negative ('cut corners' is negative).",
        "Frequently tested: break the ice, blessing in disguise, burn the midnight oil, cut corners, hit the nail on the head, once in a blue moon."
      ],
      example: { q: "'A blessing in disguise' means…", a: "Something that looks bad at first but turns out good." },
      remember: "Literal image → hidden meaning → check the tone.",
      qs: [4, 19, 26, 35] },
    { id: "v-grammar", imp: 3, yt: "civil service exam grammar correct usage", title: "Grammar & Correct Usage", mins: 5,
      intro: "These items test prepositions, pronouns, verb forms and sentence clarity.",
      points: [
        "After a preposition use object pronouns: between you and ME, for him and HER.",
        "Fixed prepositions: accused OF, interested IN, capable OF, responsible FOR.",
        "SINCE + a point in time (since 2019). FOR + a duration (for five years).",
        "Hypotheticals use 'were': If I WERE the mayor…",
        "Negative openers invert word order: Hardly HAD HE arrived… / Never HAVE I seen…",
        "Avoid dangling modifiers: the person doing the action must follow the comma.",
        "Affect (verb, to influence) vs. effect (noun, a result)."
      ],
      example: { q: "Walking to work, ___ (my phone fell / I dropped my phone).", a: "'I dropped my phone'. The walker must come right after the comma." },
      remember: "Read the sentence aloud in your head. Formal English rules beat what 'sounds okay'.",
      qs: [8, 13, 18, 21, 24, 37, 39] },
    { id: "v-reading", imp: 2, yt: "civil service exam reading comprehension paragraph organization", title: "Spelling, Reading & Paragraph Order", mins: 4,
      intro: "Reading items reward careful, not fast, reading.",
      points: [
        "Main idea = the point the WHOLE passage supports, not one detail.",
        "Paragraph order: find the opening sentence (introduces the topic), then follow transition words: First, Then, Next, However, Finally.",
        "Signal words: 'despite/although' = contrast; 'therefore' = result; 'for example' = support.",
        "Spelling traps: accommodate, necessary, occurrence, separate, privilege, committee."
      ],
      example: { q: "Despite the rain, the volunteers ___.", a: "continued. 'Despite' signals that the result goes against expectation." },
      remember: "Underline signal words. They tell you the logic of the text.",
      qs: [6, 20, 29, 30, 31] }
  ],
  filipino: [
    { id: "f-talasalitaan", imp: 3, yt: "civil service exam filipino kasingkahulugan kasalungat", title: "Talasalitaan: Kasingkahulugan at Kasalungat", mins: 4,
      intro: "Sinusukat dito ang iyong kaalaman sa kahulugan ng mga salita.",
      points: [
        "Basahin ang buong pangungusap: nasa konteksto ang pahiwatig.",
        "Alamin kung positibo o negatibo ang salita bago pumili.",
        "Sa kasalungat, madalas magkakahawig ang tatlong pagpipilian. Ang naiiba ang sagot.",
        "Mga madalas lumabas: mapagkumbaba, mapanglaw, matimtiman, hikahos, mailap, masinop, masalimuot, mahinahon."
      ],
      example: { q: "Kasalungat ng MAILAP?", a: "Maamo. Ang mailap ay lumalayo; ang maamo ay lumalapit." },
      remember: "Positibo o negatibo? Iyan ang unang tanong.",
      qs: [0, 1, 10, 12, 14, 15, 22, 25, 27, 30, 31, 39] },
    { id: "f-sawikain", imp: 3, yt: "civil service exam sawikain idyoma", title: "Mga Sawikain at Idyoma", mins: 5,
      intro: "Ang sawikain ay pahayag na may malalim o matalinghagang kahulugan.",
      points: [
        "Huwag basahin nang literal. Isipin ang larawang ipinahihiwatig.",
        "Bahagi ng katawan: balat-sibuyas (maramdamin), taingang-kawali (nagbibingi-bingihan), mababaw ang luha (iyakin).",
        "Pamilya at lipunan: ilaw ng tahanan (ina), haligi ng tahanan (ama), kabiyak ng dibdib (asawa), anak-pawis (manggagawa).",
        "Ugali: bukas-palad (mapagbigay), ningas-kugon (sa simula lang masigla), kapit-tuko (ayaw bumitaw), bahag ang buntot (duwag).",
        "Kalagayan: butas ang bulsa (walang pera), nagbibilang ng poste (walang trabaho), pagputi ng uwak (hindi mangyayari)."
      ],
      example: { q: "Ano ang 'nagsusunog ng kilay'?", a: "Masipag mag-aral. Isipin ang pag-aaral sa tabi ng lampara hanggang gabi." },
      remember: "Larawan → kahulugan → tono.",
      qs: [2, 3, 6, 7, 8, 11, 13, 16, 17, 18, 19, 23, 24, 28, 29, 32, 33, 34, 35] },
    { id: "f-gamit", imp: 2, yt: "civil service exam wastong gamit ng salita nang ng", title: "Wastong Gamit ng Salita", mins: 5,
      intro: "Madalas lumabas ang mga pares ng salitang madaling mapagpalit.",
      points: [
        "NANG: pang-abay (tumakbo nang mabilis), 'noong' o 'upang'. NG: pantukoy sa layon (kumain ng saging).",
        "RAW/RIN: kapag patinig o malapatinig (w, y) ang dulo ng naunang salita (siya raw, masaya rin, ikaw raw). DAW/DIN: kapag katinig ang dulo (Juan daw, akin din).",
        "PINTO: ang mismong isinasara. PINTUAN: ang daanan.",
        "SUBUKAN: i-try o gamitin. SUBUKIN: suriin ang tibay o kakayahan.",
        "WALISAN: ang lugar (sahig). WALISIN: ang inaalis (kalat).",
        "MAY: kasunod ay pangngalan/pandiwa/pang-uri. MAYROON: kasunod ay kataga (ba, pa, na) o panagot.",
        "Pantig: magkahiwalay na pantig ang magkatabing patinig (ka-i-bi-gan)."
      ],
      example: { q: "Masaya ___ ako. (rin/din)", a: "rin. Patinig (a) ang dulo ng 'masaya'." },
      remember: "Tingnan ang dulo ng naunang salita at ang uri ng salitang kasunod.",
      qs: [4, 5, 9, 20, 21, 26, 36, 37, 38] }
  ],
  numerical: [
    { id: "n-percent", imp: 3, yt: "civil service exam percentage word problems", title: "Percent, Discount & Profit", mins: 5,
      intro: "Percent problems are the most common numerical items.",
      points: [
        "Move the decimal: 10% of 480 = 48. Then 5% = half of that, 20% = double.",
        "Discount price = original × (1 − rate). 15% off ₱1,200 → 1,200 × 0.85.",
        "Percent change = change ÷ ORIGINAL × 100.",
        "Profit on cost: selling price = cost × (1 + rate). To find cost, divide.",
        "Successive changes multiply: +20% then −20% = 1.2 × 0.8 = 0.96 → 4% decrease.",
        "'15% of what number is 45?' → 45 ÷ 0.15."
      ],
      example: { q: "A ₱650 shirt gave 30% profit on cost. Cost?", a: "650 ÷ 1.30 = ₱500. Not 650 − 30%!" },
      remember: "Always ask: percent OF WHAT? That's your base.",
      qs: [0, 4, 13, 17, 20, 22, 30, 31, 32, 39] },
    { id: "n-fractions", imp: 2, yt: "civil service exam fractions decimals", title: "Fractions, Decimals & Operations", mins: 4,
      intro: "Fast, accurate arithmetic saves you minutes on the exam.",
      points: [
        "Add fractions with a common denominator: 3/4 + 2/3 = 9/12 + 8/12 = 17/12.",
        "'2/5 of 350' → divide by 5, multiply by 2.",
        "Know key equivalents: 1/8 = 0.125 = 12.5%, 3/8 = 37.5%, 1/3 ≈ 33.3%.",
        "Multiply decimals as whole numbers, then count decimal places.",
        "Order of operations: roots and powers before addition.",
        "LCM for 'when do they meet again' problems; GCF for 'largest equal groups'."
      ],
      example: { q: "Bells ring every 12 and 18 minutes. Together again after?", a: "LCM(12, 18) = 36 minutes." },
      remember: "Memorize the eighths. They appear constantly.",
      qs: [8, 11, 15, 23, 28, 38] },
    { id: "n-series", imp: 2, yt: "civil service exam number series", title: "Number Series", mins: 3,
      intro: "Find the rule that produces each next number.",
      points: [
        "Step 1: differences (2, 6, 12, 20 → +4, +6, +8).",
        "Step 2: ratios (3, 9, 27 → ×3).",
        "Step 3: alternating rules (×2, −2, ×2, −2).",
        "Step 4: special sequences: squares (1, 4, 9, 16), Fibonacci (1, 1, 2, 3, 5), factorials (1, 2, 6, 24)."
      ],
      example: { q: "100, 95, 85, 70, 50, ?", a: "Subtract 5, 10, 15, 20, 25 → 25." },
      remember: "Differences → ratios → alternating → special.",
      qs: [1, 10, 16, 26, 35] },
    { id: "n-word", imp: 3, yt: "civil service exam work problems rate problems", title: "Work, Rate & Mixture Problems", mins: 5,
      intro: "These word problems follow a few reusable formulas.",
      points: [
        "Distance = speed × time. Find the speed first, then reuse it.",
        "Work: add rates. A in 6 days (1/6) + B in 3 days (1/3) = 1/2 per day → 2 days.",
        "Draining pipes SUBTRACT their rate.",
        "Workers × days = total work (8 × 12 = 96 worker-days). Fewer workers → more days.",
        "Mixtures: the pure amount stays the same; only the total changes.",
        "Time: add hours, then minutes; carry when minutes pass 60."
      ],
      example: { q: "Pipe A fills in 4 h, B empties in 6 h. Both open?", a: "1/4 − 1/6 = 1/12 → 12 hours." },
      remember: "Convert everything to 'per hour' or 'per day' first.",
      qs: [2, 6, 19, 24, 27, 29, 34] },
    { id: "n-algebra", imp: 3, yt: "civil service exam age problems algebra", title: "Algebra, Ages & Averages", mins: 5,
      intro: "Set up a simple equation, or test the answer choices.",
      points: [
        "Average = total ÷ count. Missing value = (average × count) − known values.",
        "Ages: everyone ages the same number of years. Write both future ages.",
        "Sum & difference: larger = (sum + difference) ÷ 2.",
        "Consecutive numbers: the middle one equals the average.",
        "Coins: assume all are the smaller coin, then count the 'upgrades'.",
        "When stuck, PLUG IN the choices. One will work."
      ],
      example: { q: "Average of 4 numbers is 25; three are 20, 30, 18. Fourth?", a: "100 − 68 = 32." },
      remember: "Testing choices is a legitimate strategy, and often the fastest.",
      qs: [3, 9, 12, 21, 25, 33, 36, 37] },
    { id: "n-ratio", imp: 2, yt: "civil service exam ratio and proportion", title: "Ratio, Interest & Geometry", mins: 4,
      intro: "Proportional thinking solves most of these quickly.",
      points: [
        "Ratio 3:5 of ₱64,000 → 8 parts of ₱8,000.",
        "Unit price: find the cost of one, then scale.",
        "Simple interest I = P × r × t (rate as a decimal).",
        "Rectangle: perimeter = 2(l + w); area = l × w.",
        "Map scale: multiply map distance by the scale factor."
      ],
      example: { q: "Simple interest on ₱10,000 at 6% for 3 years?", a: "10,000 × 0.06 × 3 = ₱1,800." },
      remember: "Find the value of ONE part or ONE unit first.",
      qs: [5, 7, 14, 18] }
  ],
  analytical: [
    { id: "a-logic", imp: 3, yt: "civil service exam syllogism logic", title: "Syllogisms & Conditional Logic", mins: 5,
      intro: "Only conclude what MUST be true. 'Possibly true' is not enough.",
      points: [
        "Draw circles. 'All A are B' = A inside B. 'No A are B' = separate circles. 'Some' = overlap.",
        "If you can draw a version where the conclusion is false, the answer is 'Uncertain'.",
        "If P then Q. Not Q → Not P (valid). Q → P is NOT valid.",
        "'Only members can vote' → anyone who voted is a member."
      ],
      example: { q: "All teachers are graduates. Some graduates are lawyers. Some teachers are lawyers?", a: "Uncertain. The lawyer circle can avoid the teachers." },
      remember: "Try to break the conclusion. If you can, it's uncertain.",
      qs: [0, 9, 13, 19, 25, 30, 39] },
    { id: "a-series", imp: 3, yt: "civil service exam letter series", title: "Number & Letter Series", mins: 4,
      intro: "Convert letters to numbers and look for the pattern.",
      points: [
        "A=1, B=2 … Z=26. Memorize E=5, J=10, O=15, T=20.",
        "Check gaps: +2, +3, +4… or skipping letters.",
        "Backwards series: Z, X, V, T…",
        "Grouped series (BDF, HJL): check within and between groups.",
        "Number rules: ×2+1, factorials, Fibonacci."
      ],
      example: { q: "A, C, F, J, O, ?", a: "+2, +3, +4, +5, +6 → U." },
      remember: "E-J-O-T (5-10-15-20) anchors make letter math fast.",
      qs: [1, 12, 15, 20, 31, 32] },
    { id: "a-coding", imp: 2, yt: "civil service exam coding decoding analogy", title: "Coding & Analogies", mins: 4,
      intro: "Find the shift or rule, then apply it to every letter or number.",
      points: [
        "Letter shift: PEN → QFO is +1 for every letter.",
        "Position coding: CAT → 3-1-20.",
        "Number analogies: squares (4:16), cubes (3:27), multiples.",
        "Word analogies: measure-of (odometer : distance), cover-for (glove : hand)."
      ],
      example: { q: "MANGO → OCPIQ. APPLE → ?", a: "+2 each letter → CRRNG." },
      remember: "Check the rule on at least two letters before applying it.",
      qs: [2, 6, 7, 16, 23, 28, 33, 37] },
    { id: "a-odd", imp: 1, yt: "civil service exam odd one out", title: "Odd One Out", mins: 2,
      intro: "Find the property that all but one share.",
      points: [
        "Categories: fruit vs vegetable, 2D vs 3D shapes.",
        "Number properties: prime, perfect square, even/odd.",
        "Calendar facts: months with 31 days (Jan, Mar, May, Jul, Aug, Oct, Dec)."
      ],
      example: { q: "121, 144, 169, 180, 196?", a: "180, the only non-perfect square." },
      remember: "Name the group out loud. The one that doesn't fit the name is your answer.",
      qs: [3, 14, 17, 27, 36] },
    { id: "a-arrange", imp: 2, yt: "civil service exam arrangement direction problems", title: "Arrangement, Direction & Ranking", mins: 4,
      intro: "Draw it. These are easy on paper and hard in your head.",
      points: [
        "Seating: draw blanks, place fixed people first (ends), then blocks.",
        "Order: write names with > signs.",
        "Direction: facing north, right = east. A 180° turn = opposite direction.",
        "Rank from bottom = total − rank from top + 1."
      ],
      example: { q: "Rosa is 12th from top in a class of 40. From bottom?", a: "40 − 12 + 1 = 29th." },
      remember: "Never solve directions without a sketch.",
      qs: [4, 5, 18, 22, 26, 34] },
    { id: "a-relations", imp: 2, yt: "civil service exam blood relation clock calendar", title: "Relationships, Calendars & Clocks", mins: 5,
      intro: "Family trees, day counting and clock angles follow fixed rules.",
      points: [
        "'Only daughter of my mother' (said by a woman) = herself.",
        "Draw a family tree with gender marks.",
        "Days repeat every 7: use the remainder of (days ÷ 7).",
        "Clock angle = |30H − 5.5M|. The hour hand moves 0.5° per minute.",
        "Hands overlap 11 times in 12 hours."
      ],
      example: { q: "Angle at 3:30?", a: "|90 − 165| = 75°." },
      remember: "For days: divide by 7 and only count the remainder.",
      qs: [8, 10, 11, 21, 24, 29, 35, 38] }
  ],
  geninfo: [
    { id: "g-const", imp: 3, yt: "civil service exam philippine constitution reviewer", title: "The 1987 Constitution & Government", mins: 6,
      intro: "The most tested General Information topic.",
      points: [
        "Ratified February 2, 1987. Art. I Territory · II Principles · III Bill of Rights · IV Citizenship · VI Legislative · VII Executive · VIII Judiciary · IX Constitutional Commissions · XI Accountability · XIII Social Justice & Human Rights · XIV Education & Language.",
        "President: 40+ years old, natural-born, 10-year resident; a single 6-year term, no reelection. VP: 6 years, max two successive terms.",
        "Senate: 24 senators, 35+ years old, 6-year terms (max 2 consecutive). House: 3-year terms (max 3 consecutive).",
        "Supreme Court: Chief Justice + 14 Associate Justices.",
        "Only Congress (2/3 of both Houses, voting separately) declares a state of war. Amnesty = President + majority of all Members of Congress.",
        "National language: Filipino. Art. II Sec. 1: sovereignty resides in the people.",
        "Natural-born citizens are citizens from birth without performing any act."
      ],
      example: { q: "Where is 'Public office is a public trust'?", a: "Article XI, Section 1 (Accountability of Public Officers)." },
      remember: "Make a table: office → age → term → limit.",
      qs: [0, 4, 5, 6, 11, 12, 14, 17, 18, 19, 20, 23, 24, 29, 36, 37, 38] },
    { id: "g-ethics", imp: 3, yt: "civil service exam RA 6713 code of conduct", title: "RA 6713, Ethics & Anti-Corruption", mins: 5,
      intro: "Every civil servant must know the Code of Conduct.",
      points: [
        "RA 6713 (1989): Code of Conduct and Ethical Standards for Public Officials and Employees.",
        "Eight norms of conduct: commitment to public interest, professionalism, justness and sincerity, political neutrality, responsiveness to the public, nationalism and patriotism, commitment to democracy, simple living.",
        "Act on letters and requests within 15 working days.",
        "SALN (Statement of Assets, Liabilities and Net Worth): file on or before April 30 every year.",
        "RA 3019 (1960): Anti-Graft and Corrupt Practices Act.",
        "RA 11032 (2018): Ease of Doing Business Act, which amended the Anti-Red Tape Act (RA 9485).",
        "The CSC is the central personnel agency (Art. IX-B)."
      ],
      example: { q: "Which is NOT a norm: political neutrality or political partisanship?", a: "Partisanship. Public servants must be neutral." },
      remember: "6713 = ethics, 3019 = graft, 11032 = red tape.",
      qs: [1, 2, 3, 7, 13, 21, 22, 30] },
    { id: "g-rights", imp: 2, yt: "civil service exam human rights peace", title: "Human Rights & Peace", mins: 4,
      intro: "Covers international and Philippine human rights instruments.",
      points: [
        "UDHR adopted December 10, 1948, now Human Rights Day.",
        "Commission on Human Rights: Art. XIII, Secs. 17–18 (investigates civil and political rights violations).",
        "Writ of Habeas Corpus: against illegal detention. Writ of Amparo: threats to life, liberty and security. Habeas Data: right to privacy of information.",
        "RA 9262 (VAWC, 2004) and RA 7610 (special protection of children, 1992).",
        "Peace: RA 11054 (2018), the Bangsamoro Organic Law, created the BARMM."
      ],
      example: { q: "Which writ requires a detained person to be brought to court?", a: "Habeas corpus ('you shall have the body')." },
      remember: "Match each writ to the right it protects.",
      qs: [10, 15, 26, 31, 32, 33, 39] },
    { id: "g-env", imp: 2, yt: "civil service exam environmental laws philippines", title: "Environment Laws & Issues", mins: 4,
      intro: "Know the environmental laws by number, title and year.",
      points: [
        "RA 8749: Clean Air Act (1999). RA 9003: Ecological Solid Waste Management Act (2000). RA 9275: Clean Water Act (2004).",
        "RA 9729: Climate Change Act (2009). RA 10121: Disaster Risk Reduction and Management Act (2010).",
        "RA 7586: NIPAS Act (1992), amended by RA 11038 (E-NIPAS, 2018).",
        "Writ of Kalikasan protects the right to a balanced and healthful ecology.",
        "Carbon dioxide is the main human-caused greenhouse gas. The Montreal Protocol (1987) protects the ozone layer."
      ],
      example: { q: "Which law requires waste segregation and MRFs?", a: "RA 9003, the Ecological Solid Waste Management Act." },
      remember: "Air (8749) comes before waste (9003), then water (9275): the numbers rise with the years.",
      qs: [8, 9, 16, 25, 27, 28, 34, 35, 40] }
  ]
};
