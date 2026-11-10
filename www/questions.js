// CS Coach question bank — Civil Service Exam (Professional Level) practice.
// Note: The Civil Service Commission does not publicly release actual exam
// questions. These are practice items modeled on the official coverage and
// format of the Professional level exam.
window.SUBJECTS = [
  {
    id: "verbal",
    name: "Verbal Ability (English)",
    icon: "📘",
    desc: "Vocabulary, grammar, analogies, idioms, spelling",
    questions: [
      { q: "Choose the word closest in meaning to the capitalized word: The manager gave a TERSE reply.", c: ["Lengthy", "Concise", "Rude", "Unclear"], a: 1, e: "Terse means brief and to the point, so 'concise' is the closest meaning." },
      { q: "Choose the word OPPOSITE in meaning to BENEVOLENT.", c: ["Generous", "Kind", "Malevolent", "Charitable"], a: 2, e: "Benevolent means well-meaning and kind. Malevolent means wishing harm to others." },
      { q: "Neither the teacher nor the students ____ aware of the change in schedule.", c: ["was", "were", "is", "has been"], a: 1, e: "With 'neither…nor', the verb agrees with the nearer subject. 'Students' is plural, so use 'were'." },
      { q: "BOOK : LIBRARY :: PAINTING : ____", c: ["Artist", "Canvas", "Museum", "Frame"], a: 2, e: "Books are kept and displayed in a library. Paintings are kept and displayed in a museum." },
      { q: "What does the idiom 'to burn the midnight oil' mean?", c: ["To waste resources", "To work or study late into the night", "To start a fire", "To lose one's temper"], a: 1, e: "'Burning the midnight oil' means working or studying late at night." },
      { q: "Which sentence is grammatically correct?", c: ["Each of the applicants have submitted the documents.", "Each of the applicants has submitted the documents.", "Each of the applicants are submitting the documents.", "Each of the applicants were submitting the documents."], a: 1, e: "'Each' is singular, so it takes a singular verb: 'has submitted'." },
      { q: "Which word is spelled correctly?", c: ["Accomodate", "Acommodate", "Accommodate", "Acomodate"], a: 2, e: "The correct spelling is 'accommodate', with a double 'c' and a double 'm'." },
      { q: "The new drainage system will MITIGATE the effects of flooding. MITIGATE means:", c: ["Worsen", "Lessen", "Measure", "Ignore"], a: 1, e: "To mitigate is to make something less severe, so it means 'lessen'." },
      { q: "She was accused ____ stealing the office supplies.", c: ["for", "with", "of", "about"], a: 2, e: "The correct preposition is 'accused of'." },
      { q: "Smartphones have become UBIQUITOUS in modern society. UBIQUITOUS means:", c: ["Expensive", "Found everywhere", "Dangerous", "Outdated"], a: 1, e: "Ubiquitous means present or found everywhere." },
      { q: "The number of applicants for the position ____ increased this year.", c: ["have", "has", "are", "were"], a: 1, e: "'The number of' takes a singular verb ('has'). Compare 'A number of' (plural)." },
      { q: "Choose the word OPPOSITE in meaning to METICULOUS.", c: ["Careless", "Careful", "Precise", "Thorough"], a: 0, e: "Meticulous means very careful and precise. The opposite is 'careless'." },
      { q: "PEN : WRITER :: SCALPEL : ____", c: ["Hospital", "Surgeon", "Patient", "Knife"], a: 1, e: "A pen is the tool of a writer. A scalpel is the tool of a surgeon." },
      { q: "If I ____ the mayor, I would prioritize public health.", c: ["am", "was", "were", "will be"], a: 2, e: "Hypothetical conditions use the subjunctive 'were': 'If I were…'." },
      { q: "The official's statement was AMBIGUOUS. This means the statement was:", c: ["Clear and direct", "Open to more than one interpretation", "Offensive", "Very long"], a: 1, e: "Ambiguous means it can be understood in more than one way." }
    ]
  },
  {
    id: "filipino",
    name: "Verbal Ability (Filipino)",
    icon: "📗",
    desc: "Talasalitaan, sawikain, wastong gamit ng salita",
    questions: [
      { q: "Ano ang kasingkahulugan ng MAPAGKUMBABA?", c: ["Mayabang", "Mababang-loob", "Matapang", "Masipag"], a: 1, e: "Ang mapagkumbaba ay mababang-loob o hindi nagmamataas." },
      { q: "Ano ang kasalungat ng MAGILIW?", c: ["Masayahin", "Malambing", "Masungit", "Mabait"], a: 2, e: "Ang magiliw ay palakaibigan at malambing. Ang kasalungat nito ay masungit." },
      { q: "Ang taong 'balat-sibuyas' ay:", c: ["Maramdamin o madaling masaktan", "Mahilig magluto", "Mapagbigay", "Matigas ang ulo"], a: 0, e: "Ang balat-sibuyas ay sawikaing tumutukoy sa taong maramdamin." },
      { q: "Ano ang ibig sabihin ng 'nagbibilang ng poste'?", c: ["Inhinyero", "Walang trabaho", "Nagtatrabaho sa Meralco", "Naglalakad nang malayo"], a: 1, e: "Ang 'nagbibilang ng poste' ay tumutukoy sa taong walang trabaho." },
      { q: "Piliin ang wastong salita: Tumakbo siya ____ mabilis.", c: ["ng", "nang", "nag", "naman"], a: 1, e: "Ginagamit ang 'nang' bilang pang-abay na naglalarawan kung paano ginawa ang kilos (tumakbo nang mabilis)." },
      { q: "Piliin ang wastong salita: Pakisara mo ang ____.", c: ["pinto", "pintuan", "bintanaan", "hagdanan"], a: 0, e: "Ang 'pinto' ang mismong isinasara. Ang 'pintuan' ay ang daanan o puwang kung saan nakalagay ang pinto." },
      { q: "Ang 'kabiyak ng dibdib' ay nangangahulugang:", c: ["Kaibigan", "Asawa", "Kapatid", "Kaaway"], a: 1, e: "Ang 'kabiyak ng dibdib' ay tumutukoy sa asawa." },
      { q: "Sino ang tinutukoy na 'ilaw ng tahanan'?", c: ["Ama", "Ina", "Panganay", "Lolo"], a: 1, e: "Ang 'ilaw ng tahanan' ay ang ina. Ang ama naman ang 'haligi ng tahanan'." },
      { q: "Ang taong 'mababaw ang luha' ay:", c: ["Iyakin", "Masayahin", "Matapang", "Walang pakialam"], a: 0, e: "Ang 'mababaw ang luha' ay madaling umiyak o iyakin." },
      { q: "Piliin ang wastong pangungusap:", c: ["Siya daw ang nanalo.", "Siya raw ang nanalo.", "Siya rin daw ang nanalo raw.", "Siya din ang nanalo."], a: 1, e: "Ginagamit ang 'raw/rin' kapag ang naunang salita ay nagtatapos sa patinig o w/y. Ang 'siya' ay nagtatapos sa patinig, kaya 'raw'." },
      { q: "Ano ang kasingkahulugan ng MAPANGLAW?", c: ["Maliwanag", "Malungkot", "Masaya", "Maingay"], a: 1, e: "Ang mapanglaw ay malungkot o mapanglaw ang kapaligiran." },
      { q: "Ano ang ibig sabihin ng 'itaga sa bato'?", c: ["Magalit", "Tandaan at tuparin", "Magtrabaho nang husto", "Kalimutan"], a: 1, e: "Ang 'itaga sa bato' ay tandaang mabuti, kadalasan isang pangakong tutuparin." },
      { q: "Ano ang kasingkahulugan ng MATIMTIMAN?", c: ["Taimtim o taos-puso", "Maingay", "Mapusok", "Mahina"], a: 0, e: "Ang matimtiman ay taimtim, tapat, at taos-puso." },
      { q: "Ang 'nagsusunog ng kilay' ay nangangahulugang:", c: ["Nagpapaganda", "Nag-aaral nang mabuti", "Nagluluto", "Nagagalit"], a: 1, e: "Ang 'nagsusunog ng kilay' ay masipag at puspusang nag-aaral." }
    ]
  },
  {
    id: "numerical",
    name: "Numerical Ability",
    icon: "🔢",
    desc: "Arithmetic, percentages, series, word problems",
    questions: [
      { q: "What is 25% of 480?", c: ["100", "120", "140", "96"], a: 1, e: "25% = 1/4, and 480 ÷ 4 = 120." },
      { q: "What is the next number in the series: 2, 6, 12, 20, 30, ___?", c: ["40", "42", "44", "36"], a: 1, e: "The differences are 4, 6, 8, 10, so the next difference is 12. 30 + 12 = 42." },
      { q: "Juan can finish a job in 6 days. Pedro can finish the same job in 3 days. How many days will it take them working together?", c: ["4.5 days", "2 days", "3 days", "1.5 days"], a: 1, e: "Combined rate = 1/6 + 1/3 = 1/2 job per day, so it takes 2 days." },
      { q: "What is the average of 85, 90, 78, 92, and 80?", c: ["84", "85", "86", "87"], a: 1, e: "Sum = 425. 425 ÷ 5 = 85." },
      { q: "A bag costs ₱1,200 and is sold at a 15% discount. What is the sale price?", c: ["₱1,000", "₱1,020", "₱1,050", "₱1,080"], a: 1, e: "15% of 1,200 = 180. 1,200 − 180 = ₱1,020." },
      { q: "₱64,000 is divided between two people in the ratio 3:5. How much is the larger share?", c: ["₱24,000", "₱38,000", "₱40,000", "₱42,000"], a: 2, e: "3 + 5 = 8 parts, so each part is 64,000 ÷ 8 = 8,000. The larger share is 5 × 8,000 = ₱40,000." },
      { q: "A bus travels 240 km in 4 hours. At the same speed, how long will it take to travel 390 km?", c: ["6 hours", "6.5 hours", "7 hours", "5.5 hours"], a: 1, e: "Speed = 240 ÷ 4 = 60 km/h. 390 ÷ 60 = 6.5 hours." },
      { q: "What is the simple interest on ₱10,000 at 6% per year for 3 years?", c: ["₱600", "₱1,200", "₱1,800", "₱2,000"], a: 2, e: "I = P × r × t = 10,000 × 0.06 × 3 = ₱1,800." },
      { q: "3/4 + 2/3 = ?", c: ["5/7", "1 5/12", "1 1/12", "5/12"], a: 1, e: "9/12 + 8/12 = 17/12 = 1 5/12." },
      { q: "Ana is twice as old as Ben. In 5 years, the sum of their ages will be 40. How old is Ana now?", c: ["10", "15", "20", "25"], a: 2, e: "Let Ben = b, so Ana = 2b. Then (2b + 5) + (b + 5) = 40, so 3b = 30 and b = 10. Ana is 20." },
      { q: "What is the next number in the series: 3, 9, 27, 81, ___?", c: ["162", "243", "324", "108"], a: 1, e: "Each term is multiplied by 3. 81 × 3 = 243." },
      { q: "Express 0.125 as a fraction in lowest terms.", c: ["1/4", "1/8", "1/5", "1/6"], a: 1, e: "0.125 = 125/1000 = 1/8." },
      { q: "If 3x − 7 = 11, what is x?", c: ["4", "5", "6", "7"], a: 2, e: "3x = 18, so x = 6." },
      { q: "A store's sales went from ₱50,000 to ₱60,000. What is the percent increase?", c: ["10%", "16.7%", "20%", "25%"], a: 2, e: "Increase = 10,000. 10,000 ÷ 50,000 = 0.20 = 20%." },
      { q: "If 5 pens cost ₱75, how much do 12 pens cost?", c: ["₱150", "₱170", "₱180", "₱200"], a: 2, e: "One pen = 75 ÷ 5 = ₱15. 12 × 15 = ₱180." }
    ]
  },
  {
    id: "analytical",
    name: "Analytical Ability",
    icon: "🧩",
    desc: "Logic, patterns, coding, direction, reasoning",
    questions: [
      { q: "All teachers are graduates. Some graduates are lawyers. Conclusion: Some teachers are lawyers. The conclusion is:", c: ["True", "False", "Uncertain"], a: 2, e: "The graduates who are lawyers may or may not include any teachers. The conclusion cannot be determined." },
      { q: "What comes next: A, C, F, J, O, ___?", c: ["T", "U", "V", "S"], a: 1, e: "The gaps are +2, +3, +4, +5, so the next gap is +6. O (15) + 6 = U (21)." },
      { q: "If CAT is coded as 3-1-20, how is DOG coded?", c: ["4-15-7", "4-14-7", "3-15-7", "4-15-8"], a: 0, e: "Each letter becomes its position in the alphabet: D = 4, O = 15, G = 7." },
      { q: "Which word does NOT belong?", c: ["Apple", "Mango", "Carrot", "Banana"], a: 2, e: "Carrot is a vegetable. The others are fruits." },
      { q: "Maria is taller than Ana. Ana is taller than Lisa. Who is the shortest?", c: ["Maria", "Ana", "Lisa", "Cannot be determined"], a: 2, e: "Maria > Ana > Lisa, so Lisa is the shortest." },
      { q: "Carlo walks 5 km north, turns right and walks 3 km, then turns right again and walks 5 km. Where is he from his starting point?", c: ["3 km West", "3 km East", "5 km South", "8 km North"], a: 1, e: "North 5, then east 3, then south 5 puts him 3 km east of the start." },
      { q: "HAND : GLOVE :: FOOT : ____", c: ["Toe", "Sock", "Leg", "Walk"], a: 1, e: "A glove covers the hand. A sock covers the foot." },
      { q: "4 : 16 :: 7 : ____", c: ["28", "42", "49", "56"], a: 2, e: "The second number is the square of the first: 4² = 16, so 7² = 49." },
      { q: "If today is Wednesday, what day will it be 100 days from today?", c: ["Thursday", "Friday", "Saturday", "Sunday"], a: 1, e: "100 ÷ 7 leaves a remainder of 2. Wednesday + 2 days = Friday." },
      { q: "If it rains, the event will be cancelled. The event was NOT cancelled. Which must be true?", c: ["It rained.", "It did not rain.", "The event was moved.", "Cannot be determined"], a: 1, e: "By modus tollens: if rain → cancelled, and not cancelled, then no rain." },
      { q: "What is the angle between the hour and minute hands at 3:30?", c: ["60°", "75°", "90°", "105°"], a: 1, e: "The minute hand is at 180°. The hour hand is at 90° + 15° = 105°. 180° − 105° = 75°." },
      { q: "Pointing to a boy, Liza says, 'His mother is the only daughter of my mother.' How is Liza related to the boy?", c: ["Aunt", "Sister", "Mother", "Grandmother"], a: 2, e: "The only daughter of Liza's mother is Liza herself, so Liza is the boy's mother." },
      { q: "What is the missing number: 1, 1, 2, 3, 5, 8, ___?", c: ["11", "12", "13", "15"], a: 2, e: "This is the Fibonacci sequence: each number is the sum of the two before it. 5 + 8 = 13." },
      { q: "No birds are mammals. All bats are mammals. Conclusion: No bats are birds.", c: ["True", "False", "Uncertain"], a: 0, e: "All bats are mammals and no mammals are birds, so no bats are birds." },
      { q: "Which number does NOT belong: 2, 3, 5, 9, 11, 13?", c: ["3", "9", "11", "13"], a: 1, e: "All are prime numbers except 9 (3 × 3)." }
    ]
  },
  {
    id: "geninfo",
    name: "General Information",
    icon: "🏛️",
    desc: "Constitution, RA 6713, human rights, environment",
    questions: [
      { q: "In what year was the present Philippine Constitution ratified?", c: ["1973", "1986", "1987", "1935"], a: 2, e: "The present Constitution was ratified in a plebiscite on February 2, 1987." },
      { q: "Republic Act No. 6713 is also known as:", c: ["Anti-Graft and Corrupt Practices Act", "Code of Conduct and Ethical Standards for Public Officials and Employees", "Anti-Red Tape Act", "Local Government Code"], a: 1, e: "RA 6713 (1989) is the Code of Conduct and Ethical Standards for Public Officials and Employees." },
      { q: "Under RA 6713, public officials and employees must respond to letters and requests from the public within how many working days from receipt?", c: ["5", "10", "15", "30"], a: 2, e: "Section 5(a) of RA 6713 requires action within fifteen (15) working days from receipt." },
      { q: "What does SALN stand for?", c: ["Statement of Assets, Liabilities and Net Worth", "Summary of Accounts, Loans and Net Income", "Statement of Annual Loans and Network", "Schedule of Assets and Legal Notes"], a: 0, e: "SALN is the Statement of Assets, Liabilities and Net Worth, which public officials must file under RA 6713." },
      { q: "What is the minimum age requirement to be elected President of the Philippines?", c: ["35", "40", "45", "50"], a: 1, e: "Article VII, Section 2: at least 40 years old on election day." },
      { q: "What is the term of office of a Senator?", c: ["3 years", "4 years", "6 years", "9 years"], a: 2, e: "Senators serve six years and may not serve more than two consecutive terms (Art. VI, Sec. 4)." },
      { q: "The Bill of Rights is found in which Article of the 1987 Constitution?", c: ["Article II", "Article III", "Article IV", "Article VI"], a: 1, e: "Article III contains the Bill of Rights." },
      { q: "Which is the central personnel agency of the Philippine government?", c: ["Department of Labor and Employment", "Civil Service Commission", "Commission on Audit", "Office of the Ombudsman"], a: 1, e: "Article IX-B establishes the Civil Service Commission as the central personnel agency." },
      { q: "Republic Act No. 9003 is the:", c: ["Clean Air Act", "Clean Water Act", "Ecological Solid Waste Management Act", "Climate Change Act"], a: 2, e: "RA 9003 is the Ecological Solid Waste Management Act of 2000." },
      { q: "Republic Act No. 8749 is known as the:", c: ["Philippine Clean Air Act of 1999", "Philippine Clean Water Act of 2004", "Philippine Mining Act", "Wildlife Act"], a: 0, e: "RA 8749 is the Philippine Clean Air Act of 1999." },
      { q: "The Universal Declaration of Human Rights was adopted by the UN General Assembly in what year?", c: ["1945", "1948", "1966", "1986"], a: 1, e: "The UDHR was adopted on December 10, 1948, now celebrated as Human Rights Day." },
      { q: "How many Associate Justices sit on the Supreme Court of the Philippines?", c: ["12", "14", "15", "11"], a: 1, e: "The Supreme Court has a Chief Justice and 14 Associate Justices (Art. VIII, Sec. 4)." },
      { q: "What is the term of office of a member of the House of Representatives?", c: ["3 years", "4 years", "6 years", "2 years"], a: 0, e: "Members of the House serve three years, up to three consecutive terms (Art. VI, Sec. 7)." },
      { q: "Republic Act No. 11032 is the:", c: ["Ease of Doing Business and Efficient Government Service Delivery Act of 2018", "Universal Health Care Act", "Data Privacy Act", "Free Tertiary Education Act"], a: 0, e: "RA 11032 (2018) amended the Anti-Red Tape Act of 2007 (RA 9485)." },
      { q: "'The Philippines is a democratic and republican State. Sovereignty resides in the people and all government authority emanates from them.' This is found in:", c: ["Preamble", "Article I, Section 1", "Article II, Section 1", "Article III, Section 1"], a: 2, e: "This is Article II, Section 1 of the 1987 Constitution (Declaration of Principles and State Policies)." },
      { q: "Which constitutional body is mandated to investigate human rights violations involving civil and political rights?", c: ["Commission on Elections", "Commission on Human Rights", "Commission on Audit", "Sandiganbayan"], a: 1, e: "Article XIII, Sections 17–18 create the Commission on Human Rights." },
      { q: "Republic Act No. 9275 is known as the:", c: ["Philippine Clean Water Act of 2004", "Philippine Clean Air Act", "Climate Change Act of 2009", "National Integrated Protected Areas System Act"], a: 0, e: "RA 9275 is the Philippine Clean Water Act of 2004." }
    ]
  }
];
