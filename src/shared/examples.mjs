// CV examples for SEO pages (/cv-examples/<slug>/). All people and companies are fictional.
import { AVATAR } from "./sample.mjs";

const ex = (o) => o;

export const EXAMPLES = {
  "software-engineer": ex({
    title: "Software Engineer", template: "tech",
    intro: "A software engineer CV has to prove two things quickly: what you have built, and how well you build it. Recruiters and hiring managers scan for the stack first, then for evidence of impact — faster pages, fewer bugs, features shipped to real users.",
    tips: [
      "Put your main languages and frameworks in the title line and skills section — ATS software filters on exact names like \"React\", \"Node.js\" and \"PostgreSQL\".",
      "Write bullets as problem → what you built → result: \"Cut API response time from 900 ms to 180 ms by adding Redis caching\".",
      "Link a GitHub profile or 1–2 projects with a live demo. For fresh graduates, projects can replace work experience.",
      "Keep it to one page under 5 years of experience. Delete school-level certificates and generic skills like \"MS Office\"."
    ],
    data: {
      name: "Hamza Rauf", title: "Software Engineer — Node.js & React", email: "hamza.rauf@example.com", phone: "+92 321 5551234", location: "Lahore, Pakistan",
      links: ["github.com/hamza-rauf-example", "linkedin.com/in/hamza-rauf-example"], photo: "",
      summary: "Full-stack software engineer with 3 years of experience building payment and logistics products in Node.js, React and PostgreSQL. Shipped a rider-tracking system used in 14 cities and reduced cloud costs by 31%. Strong on clean APIs, testing and code review.",
      experience: [
        { role: "Software Engineer", company: "RaastaPay", location: "Lahore", start: "Aug 2023", end: "Present", bullets: [
          "Built the merchant settlement service in Node.js and PostgreSQL, processing 40k+ transactions a day with zero reconciliation errors",
          "Cut average API response time from 900 ms to 180 ms by adding Redis caching and fixing N+1 queries",
          "Reduced AWS spend by 31% by moving batch jobs to scheduled Lambda functions",
          "Review pull requests for a team of 6 and wrote the team's testing guidelines (Jest, Supertest)"
        ] },
        { role: "Associate Software Engineer", company: "Cargo Chain Labs", location: "Lahore", start: "Jul 2022", end: "Jul 2023", bullets: [
          "Developed the React dashboard for real-time rider tracking used by dispatch teams in 14 cities",
          "Wrote 220+ unit and integration tests, raising coverage from 38% to 76%"
        ] }
      ],
      education: [{ degree: "BS Software Engineering", school: "University of Engineering and Technology", location: "Lahore", start: "2018", end: "2022", details: "CGPA 3.3 / 4.0" }],
      projects: [{ name: "Qist Tracker", link: "github.com/hamza-rauf-example/qist", desc: "Open-source instalment tracker for small shops, built with Next.js and Supabase." }],
      skills: ["JavaScript", "TypeScript", "Node.js", "React", "PostgreSQL", "Redis", "AWS Lambda", "Docker", "Jest", "Git"],
      certifications: ["AWS Certified Cloud Practitioner (2024)"], languages: ["English — professional", "Urdu — native"], details: [], custom: []
    }
  }),
  "accountant": ex({
    title: "Accountant", template: "classic",
    intro: "Accounting CVs are read by detail-oriented people, so accuracy and structure matter more than design. Show the size of what you handled, the systems you used, and where your work saved time or money.",
    tips: [
      "State your qualification stage clearly — ACCA (affiliate / 9 papers passed), CA Inter, ICMA or B.Com — near the top.",
      "Name the software: SAP FI, Oracle, QuickBooks, Xero, Peachtree, Excel (pivot tables, XLOOKUP, Power Query).",
      "Quantify: number of vendors, monthly close time, value of reconciliations, audit findings closed.",
      "Use a clean single-column template. Many finance employers still print CVs."
    ],
    data: {
      name: "Sana Tariq", title: "Accountant — ACCA Affiliate", email: "sana.tariq@example.com", phone: "+92 300 5557788", location: "Karachi, Pakistan", links: ["linkedin.com/in/sana-tariq-example"], photo: "",
      summary: "ACCA affiliate with 4 years of experience in general ledger, month-end close and tax compliance for manufacturing and retail companies. Shortened the monthly close from 9 to 5 working days and led preparation for two clean external audits.",
      experience: [
        { role: "Accountant", company: "Indus Textile Mills", location: "Karachi", start: "Feb 2022", end: "Present", bullets: [
          "Own the general ledger and month-end close for 3 business units with combined revenue of PKR 4.2 billion",
          "Shortened the monthly close from 9 to 5 working days by building reconciliation templates in Excel Power Query",
          "Prepare monthly sales tax and withholding tax returns on the FBR IRIS portal with no late filings in 2 years",
          "Coordinated two statutory audits with a Big Four firm, closing all findings within the agreed deadline"
        ] },
        { role: "Junior Accountant", company: "Crescent Retail", location: "Karachi", start: "Jul 2020", end: "Jan 2022", bullets: [
          "Reconciled 12 bank accounts and 300+ vendor ledgers each month in SAP FI",
          "Processed payroll for 180 staff and resolved discrepancies before payment dates"
        ] }
      ],
      education: [
        { degree: "ACCA — Affiliate (13 of 13 papers)", school: "Association of Chartered Certified Accountants", location: "", start: "", end: "2023", details: "" },
        { degree: "B.Com", school: "University of Karachi", location: "Karachi", start: "2016", end: "2020", details: "First division" }
      ],
      projects: [],
      skills: ["General ledger", "Month-end close", "Bank reconciliation", "IFRS", "Sales tax & withholding", "SAP FI", "QuickBooks", "Advanced Excel", "Power Query"],
      certifications: ["ACCA Affiliate", "Advanced Excel for Finance — ICAP (2021)"], languages: ["English — fluent", "Urdu — native"], details: [], custom: []
    }
  }),
  "teacher": ex({
    title: "Teacher", template: "aurora",
    intro: "Schools hire teachers who can show results with real students. Your CV should make it easy to see your subjects, the classes you teach, your qualifications, and what improved because of your teaching.",
    tips: [
      "Mention the curriculum you teach — Cambridge O/A Level, Matric/FSc (board), IB or Montessori — and the grade levels.",
      "Use results: pass rates, average grade improvements, competitions won, number of students.",
      "Add training such as B.Ed, M.Ed, Cambridge CIE workshops or classroom-technology courses.",
      "A friendly template with a photo is fine for most private schools in Pakistan and the Gulf."
    ],
    data: {
      name: "Mariam Qureshi", title: "O Level Mathematics Teacher", email: "mariam.qureshi@example.com", phone: "+92 333 5553311", location: "Islamabad, Pakistan", links: [], photo: AVATAR,
      summary: "Mathematics teacher with 6 years of experience teaching Cambridge O Level and Grade 6–8 classes. Raised the O Level Mathematics A*–A rate from 41% to 63% in three years through diagnostic testing, small-group practice and weekly parent updates.",
      experience: [
        { role: "O Level Mathematics Teacher", company: "Margalla Grammar School", location: "Islamabad", start: "Aug 2021", end: "Present", bullets: [
          "Teach Cambridge O Level Mathematics (4024) to 4 sections of 25–30 students",
          "Raised the A*–A rate from 41% to 63% over three exam sessions using diagnostic tests and targeted revision groups",
          "Built a bank of 400+ past-paper questions sorted by topic, now used by the whole maths department",
          "Coach the school team for the National Maths Olympiad — 2 regional medals in 2024"
        ] },
        { role: "Mathematics Teacher, Grades 6–8", company: "Beaconfield School", location: "Rawalpindi", start: "Aug 2018", end: "Jul 2021", bullets: [
          "Introduced weekly low-stakes quizzes that cut the Grade 8 fail rate from 18% to 6%",
          "Ran monthly parent meetings and a WhatsApp update group for 90 families"
        ] }
      ],
      education: [
        { degree: "M.Sc Mathematics", school: "Quaid-i-Azam University", location: "Islamabad", start: "2015", end: "2017", details: "" },
        { degree: "B.Ed", school: "Allama Iqbal Open University", location: "", start: "2017", end: "2018", details: "" }
      ],
      projects: [],
      skills: ["Cambridge O Level", "Lesson planning", "Differentiated instruction", "Assessment design", "Google Classroom", "GeoGebra", "Classroom management", "Parent communication"],
      certifications: ["Cambridge CIE Teacher Training — Mathematics (2022)"], languages: ["English — fluent", "Urdu — native"], details: [], custom: []
    }
  }),
  "nurse": ex({
    title: "Staff Nurse", template: "horizon",
    intro: "Nursing CVs are checked for licence, specialty and clinical exposure before anything else. Hospitals in Pakistan and the Gulf also expect personal details and a professional photo.",
    tips: [
      "List your PNC registration and, for the Gulf, your DHA, HAAD/DOH, MOH, SCFHS or QCHP status (eligibility, Dataflow, passed).",
      "Name your units and patient load: ICU, CCU, ER, OT, NICU, beds per shift.",
      "Add BLS, ACLS or PALS with expiry dates — recruiters check them first.",
      "Put personal details (nationality, date of birth, passport status) in a separate section as many Gulf employers require it."
    ],
    data: {
      name: "Rabia Saleem", title: "Registered Staff Nurse — ICU", email: "rabia.saleem@example.com", phone: "+92 345 5552200", location: "Lahore, Pakistan", links: [], photo: AVATAR,
      summary: "PNC-registered staff nurse with 5 years of ICU experience in a 600-bed tertiary hospital. Skilled in ventilator care, central line management and infection control. DHA exam passed and Dataflow completed; available to join within 30 days.",
      experience: [
        { role: "Staff Nurse — Medical ICU", company: "Shalamar Teaching Hospital", location: "Lahore", start: "Mar 2021", end: "Present", bullets: [
          "Care for 2–3 critically ill ventilated patients per shift in a 24-bed medical ICU",
          "Manage central lines, arterial lines and infusion pumps following hospital infection-control protocols",
          "Trained 14 new nurses on ICU charting and ventilator alarm response",
          "Part of the team that cut central-line infections from 4 to 1 per quarter in 2023"
        ] },
        { role: "Staff Nurse — Emergency", company: "City Care Hospital", location: "Lahore", start: "Jan 2019", end: "Feb 2021", bullets: [
          "Triaged 60+ patients per shift and assisted in resuscitation and trauma cases",
          "Maintained accurate records on the hospital information system"
        ] }
      ],
      education: [{ degree: "BSc Nursing (Generic)", school: "College of Nursing, Allama Iqbal Medical College", location: "Lahore", start: "2014", end: "2018", details: "" }],
      projects: [],
      skills: ["Critical care", "Ventilator management", "Central line care", "Infection control", "Medication administration", "Patient assessment", "HIS documentation"],
      certifications: ["BLS — AHA (valid to 2026)", "ACLS — AHA (valid to 2026)", "DHA Registered Nurse exam — passed (2025)"],
      languages: ["English — fluent", "Urdu — native", "Punjabi — native"],
      details: [{ label: "Nationality", value: "Pakistani" }, { label: "Date of birth", value: "12 May 1996" }, { label: "PNC licence", value: "Active" }, { label: "Passport", value: "Valid" }, { label: "Notice period", value: "30 days" }],
      custom: []
    }
  }),
  "sales-executive": ex({
    title: "Sales Executive", template: "metro",
    intro: "Sales managers read CVs for numbers. Targets, achievement percentages, accounts opened and revenue closed should jump off the page within the first few seconds.",
    tips: [
      "Put a number in almost every bullet: % of target, revenue in PKR or USD, number of new accounts, ranking in the team.",
      "Name your territory and channel — B2B, retail, distribution, FMCG, telecom, real estate.",
      "Mention the CRM you used (Salesforce, HubSpot, Zoho) and any awards like \"Top performer Q3\".",
      "A bold, energetic template works well for sales roles."
    ],
    data: {
      name: "Usman Javed", title: "B2B Sales Executive", email: "usman.javed@example.com", phone: "+92 301 5559090", location: "Karachi, Pakistan", links: ["linkedin.com/in/usman-javed-example"], photo: "",
      summary: "B2B sales executive with 5 years of experience selling software and telecom services to SMEs and corporates. Achieved 118% of annual target in 2024 and opened 46 new corporate accounts. Strong at prospecting, demos and closing.",
      experience: [
        { role: "Sales Executive — Corporate", company: "NetLink Telecom", location: "Karachi", start: "Jan 2022", end: "Present", bullets: [
          "Achieved 118% of a PKR 60 million annual target in 2024, ranked #2 of 14 in the southern region",
          "Opened 46 new corporate accounts through cold outreach, referrals and LinkedIn prospecting",
          "Cut the average sales cycle from 52 to 34 days by introducing a standard demo and proposal pack",
          "Manage a pipeline of 80+ opportunities in Salesforce with weekly forecasts to the regional head"
        ] },
        { role: "Sales Officer", company: "Bright Office Solutions", location: "Karachi", start: "Jun 2019", end: "Dec 2021", bullets: [
          "Sold office equipment and service contracts to 120+ SMEs, exceeding target in 9 of 10 quarters",
          "Won \"Sales Officer of the Year\" 2021"
        ] }
      ],
      education: [{ degree: "BBA (Marketing)", school: "Institute of Business Management", location: "Karachi", start: "2015", end: "2019", details: "" }],
      projects: [],
      skills: ["B2B sales", "Prospecting", "Key account management", "Negotiation", "Salesforce", "Proposal writing", "Pipeline forecasting", "Product demos"],
      certifications: [], languages: ["English — fluent", "Urdu — native"], details: [], custom: [{ title: "Awards", items: ["Sales Officer of the Year — Bright Office Solutions (2021)"] }]
    }
  }),
  "customer-service": ex({
    title: "Customer Service Representative", template: "banner",
    intro: "Call centres and service teams want proof that you stay calm, solve problems and hit quality scores. Your CV should show the volume you handled, the channels you worked on and the scores you achieved.",
    tips: [
      "Mention your channels: inbound calls, outbound, live chat, email, WhatsApp, social media.",
      "Add your KPIs: calls per day, average handling time, first-call resolution, CSAT or quality score.",
      "List languages clearly — English fluency is often the deciding factor for international campaigns.",
      "Note shift flexibility (night shift, weekends) if you have it."
    ],
    data: {
      name: "Ahmed Nawaz", title: "Customer Service Representative", email: "ahmed.nawaz@example.com", phone: "+92 312 5554545", location: "Rawalpindi, Pakistan", links: [], photo: AVATAR,
      summary: "Customer service representative with 3 years of experience on international inbound voice and chat campaigns. Consistently scored 94%+ on quality audits and handled 70+ customer contacts per shift while keeping CSAT above 4.6 / 5.",
      experience: [
        { role: "Customer Service Representative", company: "Blue Horizon Contact Centre", location: "Islamabad", start: "Apr 2022", end: "Present", bullets: [
          "Handle 70+ inbound calls and chats per shift for a US telecom client, resolving billing and technical issues",
          "Maintain a 94–97% quality score and CSAT of 4.6 / 5 across 2 years of audits",
          "Reduced repeat calls on my queue by 12% by writing clear follow-up notes and knowledge-base updates",
          "Selected as floor buddy to support 8 new hires during their first month"
        ] },
        { role: "Customer Support Agent", company: "ShopKaro Online", location: "Rawalpindi", start: "Jan 2021", end: "Mar 2022", bullets: [
          "Answered order, refund and delivery queries on phone, WhatsApp and email for 300+ customers a week",
          "Escalated courier issues and cut unresolved complaints older than 7 days by half"
        ] }
      ],
      education: [{ degree: "BA (English, Economics)", school: "Punjab University", location: "", start: "2017", end: "2020", details: "" }],
      projects: [],
      skills: ["Inbound calls", "Live chat support", "Complaint handling", "Zendesk", "Salesforce Service Cloud", "Typing 55 WPM", "Night shifts"],
      certifications: [], languages: ["English — fluent (neutral accent)", "Urdu — native"], details: [], custom: []
    }
  }),
  "fresh-graduate": ex({
    title: "Fresh Graduate", template: "fresher",
    intro: "Your first CV doesn't need years of experience. It needs a clear goal, your degree, the skills you actually have, and proof you can apply them — projects, internships, competitions and volunteering all count.",
    tips: [
      "Put education, skills and projects before experience. The Fresher template does this for you.",
      "Treat your final-year project like a job: what you built, the tools, and the result.",
      "Include internships, freelance work, societies and volunteering — they show reliability and teamwork.",
      "Keep it to one page and write a 2-line summary aimed at the exact role you're applying for."
    ],
    data: {
      name: "Fatima Noor", title: "Business Graduate — Marketing & Analytics", email: "fatima.noor@example.com", phone: "+92 303 5556767", location: "Faisalabad, Pakistan", links: ["linkedin.com/in/fatima-noor-example"], photo: AVATAR,
      summary: "BBA graduate with a marketing major and hands-on experience running social media campaigns and analysing sales data in Excel and Power BI. Looking for a management trainee or marketing executive role where I can grow into brand management.",
      experience: [
        { role: "Marketing Intern", company: "Chenab Foods", location: "Faisalabad", start: "Jun 2024", end: "Aug 2024", bullets: [
          "Planned and posted 36 Instagram and Facebook posts, growing page followers by 2,100 in 8 weeks",
          "Built a Power BI dashboard of monthly sales by city used in the marketing team's weekly meeting"
        ] }
      ],
      education: [
        { degree: "BBA (Hons), Marketing", school: "Government College University", location: "Faisalabad", start: "2021", end: "2025", details: "CGPA 3.56 / 4.0 · Dean's list (2 semesters)" },
        { degree: "Intermediate (FSc Pre-Engineering)", school: "Punjab Group of Colleges", location: "Faisalabad", start: "2019", end: "2021", details: "A grade" }
      ],
      projects: [
        { name: "Final year project: Brand loyalty among university students", link: "", desc: "Surveyed 320 students, analysed results in SPSS and presented recommendations to a local beverage brand." },
        { name: "Campus food-delivery page", link: "", desc: "Ran a student-run delivery page for 6 months with 140+ orders a month." }
      ],
      skills: ["Social media marketing", "Canva", "Microsoft Excel", "Power BI", "SPSS", "Market research", "Presentation skills"],
      certifications: ["Google Digital Marketing & E-commerce Certificate (2024)"], languages: ["English — fluent", "Urdu — native", "Punjabi — native"], details: [],
      custom: [{ title: "Volunteering", items: ["General Secretary, GCUF Marketing Society (2023–24)", "Volunteer teacher, The Citizens Foundation summer camp (2022)"] }]
    }
  }),
  "data-analyst": ex({
    title: "Data Analyst", template: "timeline",
    intro: "Data analyst CVs are judged on tools and business impact. Show which questions you answered, what data you worked with, and the decisions or savings that followed.",
    tips: [
      "List SQL, Excel, Python or R and your BI tool (Power BI, Tableau, Looker, Qlik) in the top third of the page.",
      "Explain the business result, not just the dashboard: \"identified PKR 12M of slow-moving stock\".",
      "Mention data size and sources: millions of rows, ERP, CRM, Google Analytics, APIs.",
      "Link a portfolio (GitHub, Tableau Public, Kaggle) — it often matters more than certificates."
    ],
    data: {
      name: "Bilal Ahmed", title: "Data Analyst — SQL, Power BI, Python", email: "bilal.ahmed@example.com", phone: "+92 322 5558181", location: "Karachi, Pakistan", links: ["github.com/bilal-ahmed-example", "public.tableau.com/app/profile/bilal.example"], photo: "",
      summary: "Data analyst with 4 years of experience turning sales, inventory and customer data into decisions for retail and FMCG teams. Built the reporting that uncovered PKR 12 million of slow-moving stock and automated 20+ weekly reports with SQL and Python.",
      experience: [
        { role: "Data Analyst", company: "MegaMart Retail", location: "Karachi", start: "Mar 2022", end: "Present", bullets: [
          "Built Power BI dashboards on 30M+ rows of POS data used by 40 store managers every week",
          "Identified PKR 12 million of slow-moving stock across 18 stores, leading to a clearance plan that freed warehouse space",
          "Automated 20+ weekly Excel reports with SQL and Python, saving the finance team about 15 hours a week",
          "Designed an A/B test for loyalty-app offers that increased repeat purchases by 7%"
        ] },
        { role: "Business Intelligence Associate", company: "Delta Consumer Goods", location: "Karachi", start: "Jul 2020", end: "Feb 2022", bullets: [
          "Maintained distributor sales reporting in Qlik Sense for 220 distributors across Sindh and Balochistan",
          "Cleaned and merged ERP and field-sales data, cutting reporting errors by 80%"
        ] }
      ],
      education: [{ degree: "BS Computer Science", school: "NED University of Engineering & Technology", location: "Karachi", start: "2016", end: "2020", details: "" }],
      projects: [{ name: "Karachi traffic accident analysis", link: "github.com/bilal-ahmed-example/traffic", desc: "Python and Tableau analysis of 5 years of public accident data, featured in a local data meetup." }],
      skills: ["SQL", "Power BI", "Python (pandas)", "Excel", "Qlik Sense", "Tableau", "A/B testing", "Data cleaning", "Statistics"],
      certifications: ["Microsoft Certified: Power BI Data Analyst Associate (2023)"], languages: ["English — fluent", "Urdu — native"], details: [], custom: []
    }
  }),
  "graphic-designer": ex({
    title: "Graphic Designer", template: "creative",
    intro: "A designer's CV is itself a design sample. Keep it clean and confident, link your portfolio prominently, and describe projects by the brands and results rather than the software alone.",
    tips: [
      "Put your portfolio link (Behance, Dribbble or your own site) right under your name.",
      "Name the brands, campaigns and formats: packaging, social media, print, motion, UI.",
      "Mention results where you can: campaign reach, sales lift, client retention.",
      "Show personality through one bold colour — but keep text readable and ATS-friendly."
    ],
    data: {
      name: "Zainab Hussain", title: "Graphic Designer — Brand & Social", email: "zainab.hussain@example.com", phone: "+92 334 5552626", location: "Lahore, Pakistan", links: ["behance.net/zainab-example"], photo: AVATAR,
      summary: "Graphic designer with 4 years of agency experience creating brand identities, packaging and social campaigns for FMCG, fashion and food brands. Led the design of a Ramadan campaign that reached 3.2 million people and rebranded 9 local businesses.",
      experience: [
        { role: "Graphic Designer", company: "Pixel & Pattern Agency", location: "Lahore", start: "Jan 2022", end: "Present", bullets: [
          "Design social media, print and outdoor campaigns for 12 retainer clients in fashion, food and FMCG",
          "Led visuals for a Ramadan campaign that reached 3.2 million people across Instagram and YouTube",
          "Created brand identities for 9 local businesses, from logo to packaging and signage",
          "Built a shared Figma component library that halved turnaround time for social posts"
        ] },
        { role: "Junior Designer", company: "Print Point Studio", location: "Lahore", start: "Jul 2020", end: "Dec 2021", bullets: [
          "Prepared print-ready files for packaging, flyers and wedding stationery",
          "Handled client revisions for 30+ jobs a month"
        ] }
      ],
      education: [{ degree: "BFA Graphic Design", school: "National College of Arts", location: "Lahore", start: "2016", end: "2020", details: "" }],
      projects: [],
      skills: ["Brand identity", "Packaging design", "Social media design", "Adobe Illustrator", "Adobe Photoshop", "InDesign", "Figma", "After Effects", "Typography"],
      certifications: [], languages: ["English — fluent", "Urdu — native"], details: [], custom: []
    }
  }),
  "civil-engineer": ex({
    title: "Civil Engineer", template: "slate",
    intro: "Construction and consultancy firms look for your registration, the type and size of projects you worked on, and your role on site. Numbers — floors, kilometres, budgets, crew size — make your experience concrete.",
    tips: [
      "Show your PEC registration number type (registered engineer / professional engineer) near the top.",
      "Describe projects by type and scale: \"12-storey residential tower\", \"18 km dual carriageway\", \"PKR 900M contract\".",
      "List software: AutoCAD, Revit, ETABS, SAFE, Primavera P6, MS Project.",
      "For Gulf roles, add personal details and your passport and licence status."
    ],
    data: {
      name: "Hassan Ali Shah", title: "Site Engineer — Civil", email: "hassan.shah@example.com", phone: "+92 331 5553434", location: "Peshawar, Pakistan", links: ["linkedin.com/in/hassan-shah-example"], photo: AVATAR,
      summary: "PEC-registered civil engineer with 5 years of site experience on high-rise residential and road projects worth up to PKR 2.4 billion. Skilled in execution planning, quality control and subcontractor coordination; delivered a 12-storey tower 6 weeks ahead of schedule.",
      experience: [
        { role: "Site Engineer", company: "Frontier Builders", location: "Peshawar", start: "May 2021", end: "Present", bullets: [
          "Supervise structural works on a 12-storey residential tower (PKR 2.4 billion) with crews of 80–120 workers",
          "Delivered the structure 6 weeks early by re-sequencing formwork cycles in Primavera P6",
          "Run daily quality checks on concrete, steel and formwork, keeping rejection below 2%",
          "Coordinate 6 subcontractors and prepare weekly progress reports for the client and consultant"
        ] },
        { role: "Assistant Engineer", company: "KP Highways Consultants", location: "Mardan", start: "Jan 2020", end: "Apr 2021", bullets: [
          "Assisted in supervision of an 18 km dual carriageway, including earthworks and asphalt layers",
          "Verified contractor bills and quantities, flagging PKR 14 million of over-measurements"
        ] }
      ],
      education: [{ degree: "BSc Civil Engineering", school: "UET Peshawar", location: "Peshawar", start: "2015", end: "2019", details: "" }],
      projects: [],
      skills: ["Site supervision", "Quality control", "Quantity surveying", "AutoCAD", "ETABS", "Primavera P6", "MS Project", "HSE"],
      certifications: ["PEC Registered Engineer", "OSHA 30-Hour Construction (2022)"], languages: ["English — fluent", "Urdu — native", "Pashto — native"],
      details: [{ label: "Nationality", value: "Pakistani" }, { label: "Driving licence", value: "Pakistan (LTV)" }, { label: "Passport", value: "Valid" }], custom: []
    }
  }),
  "hr-officer": ex({
    title: "HR Officer", template: "pastel",
    intro: "HR managers read many CVs a week, so yours should model what good looks like: tidy, specific and easy to scan. Show the HR areas you have covered and the numbers behind them.",
    tips: [
      "Name the HR functions you handle: recruitment, onboarding, payroll, performance reviews, employee relations, compliance.",
      "Give scale: positions filled, employees supported, time-to-hire, turnover rate changes.",
      "Mention HRIS tools (SAP SuccessFactors, BambooHR, Oracle HCM, Odoo) and labour-law knowledge (EOBI, PESSI/SESSI).",
      "Include CIPD, SHRM or HR diploma courses if you have them."
    ],
    data: {
      name: "Hira Aslam", title: "HR Officer — Talent Acquisition", email: "hira.aslam@example.com", phone: "+92 302 5557070", location: "Lahore, Pakistan", links: ["linkedin.com/in/hira-aslam-example"], photo: AVATAR,
      summary: "HR officer with 4 years of experience in recruitment, onboarding and employee engagement for a 900-person manufacturing company. Filled 160+ roles in 2024 and cut average time-to-hire from 41 to 27 days.",
      experience: [
        { role: "HR Officer — Talent Acquisition", company: "Ravi Pharmaceuticals", location: "Lahore", start: "Jan 2022", end: "Present", bullets: [
          "Manage end-to-end hiring for sales, production and office roles — 160+ positions filled in 2024",
          "Cut average time-to-hire from 41 to 27 days with structured interview guides and a shared hiring calendar",
          "Run onboarding for 15–20 joiners a month and reduced first-90-day exits by 30%",
          "Maintain employee records and leave data in SAP SuccessFactors"
        ] },
        { role: "HR Assistant", company: "Metro Logistics", location: "Lahore", start: "Aug 2020", end: "Dec 2021", bullets: [
          "Prepared monthly attendance and overtime for payroll of 350 staff",
          "Organised quarterly engagement events and an annual employee survey"
        ] }
      ],
      education: [{ degree: "MBA (Human Resource Management)", school: "University of Central Punjab", location: "Lahore", start: "2018", end: "2020", details: "" }],
      projects: [],
      skills: ["Recruitment", "Onboarding", "Interviewing", "HR policies", "Employee engagement", "SAP SuccessFactors", "Labour law basics", "MS Excel"],
      certifications: ["CIPD Level 3 Foundation Certificate in People Practice (2023)"], languages: ["English — fluent", "Urdu — native"], details: [], custom: []
    }
  }),
  "marketing-manager": ex({
    title: "Marketing Manager", template: "elegant",
    intro: "Marketing leaders are hired for growth. A strong marketing manager CV connects budgets, channels and campaigns to business outcomes — revenue, market share, customer acquisition cost.",
    tips: [
      "Lead with outcomes: revenue growth, market share, leads, CAC, ROAS, brand metrics.",
      "Show budget and team size — they signal your level.",
      "Name your channels and tools: Meta Ads, Google Ads, SEO, CRM, marketing automation, TV/ATL.",
      "Keep it to two pages and use an elegant, understated template."
    ],
    data: {
      name: "Omar Farooq", title: "Marketing Manager — Consumer Brands", email: "omar.farooq@example.com", phone: "+92 300 5550101", location: "Karachi, Pakistan", links: ["linkedin.com/in/omar-farooq-example"], photo: "",
      summary: "Marketing manager with 9 years of experience growing consumer brands across digital and traditional channels. Manage a PKR 180 million annual budget and a team of 7; led the relaunch that took a snack brand from #4 to #2 in its category within 18 months.",
      experience: [
        { role: "Marketing Manager", company: "Sunrise Snacks", location: "Karachi", start: "Mar 2021", end: "Present", bullets: [
          "Own brand strategy and a PKR 180 million annual budget across TV, digital, trade and events",
          "Led the brand relaunch that moved the brand from #4 to #2 in its category in 18 months (retail audit data)",
          "Rebuilt performance marketing in-house, lowering cost per acquisition by 38% on Meta and Google Ads",
          "Manage a team of 7 and 3 agencies; introduced monthly campaign reviews tied to sales data"
        ] },
        { role: "Assistant Brand Manager", company: "Clover Home Care", location: "Karachi", start: "Jan 2017", end: "Feb 2021", bullets: [
          "Launched 4 product variants, including a detergent sachet that reached 11% of brand sales in year one",
          "Ran consumer research with 1,200 households to shape packaging and price points"
        ] }
      ],
      education: [{ degree: "MBA (Marketing)", school: "Institute of Business Administration", location: "Karachi", start: "2014", end: "2016", details: "" }],
      projects: [],
      skills: ["Brand strategy", "Integrated campaigns", "Performance marketing", "Budget management", "Consumer research", "Meta Ads", "Google Ads", "Team leadership"],
      certifications: [], languages: ["English — fluent", "Urdu — native"], details: [], custom: []
    }
  })
};

export const EXAMPLE_LIST = Object.entries(EXAMPLES).map(([slug, e]) => ({ slug, ...e }));
