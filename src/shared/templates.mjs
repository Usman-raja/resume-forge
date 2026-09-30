// Template registry. Every template is a layout + a CSS class in resume.css.
// layout: "single" | "sidebar" | "twocol"
// head (sidebar only): "side" puts name/photo/contact in the sidebar, "main" puts the header in the main column
// side: which sections go into the sidebar / narrow column
// photo: false | "circle" | "square" | "tall"
// order: default section order for this template (user can override)

export const DEFAULT_ORDER = ["summary", "experience", "education", "projects", "skills", "certifications", "languages", "details", "custom"];
const SIDE = ["skills", "languages", "certifications", "details"];

export const TEMPLATES = [
  {
    id: "modern", name: "Modern", layout: "sidebar", head: "side", side: SIDE, photo: "circle", accent: "#16624f",
    tags: ["professional", "photo", "two-column"],
    desc: "A confident colour sidebar holds your photo, contact details and skills, leaving the main column for experience.",
    bestFor: "Office, IT, marketing and business roles where a clean but modern look helps you stand out."
  },
  {
    id: "timeline", name: "Timeline", layout: "single", photo: false, accent: "#1e3a6e",
    tags: ["professional", "ats"],
    desc: "Your career laid out as a vertical timeline with dots, so a recruiter sees your progression at a glance.",
    bestFor: "People with 3+ jobs who want to show steady growth."
  },
  {
    id: "elegant", name: "Elegant", layout: "twocol", sidePos: "right", side: ["education", "skills", "certifications", "languages", "details"], photo: false, accent: "#7a2233",
    tags: ["professional", "two-column"],
    desc: "Refined serif name, italic section titles and a slim right column. Quiet, confident and expensive-looking.",
    bestFor: "Management, consulting, law, finance and senior roles."
  },
  {
    id: "classic", name: "Classic", layout: "single", photo: false, accent: "#1f4e79",
    tags: ["ats", "simple", "professional"],
    desc: "A timeless centred serif layout with ruled section titles. Reads well on paper and in every applicant tracking system.",
    bestFor: "Government, banking, education and any conservative industry."
  },
  {
    id: "harvard", name: "Harvard", layout: "single", photo: false, accent: "#111111",
    tags: ["ats", "simple", "fresher"],
    desc: "The plain black-and-white format that career offices recommend. Zero decoration, maximum readability.",
    bestFor: "Fresh graduates, internships, MNC applications and online portals."
  },
  {
    id: "minimal", name: "Minimal", layout: "single", photo: false, accent: "#0e6f86",
    tags: ["ats", "simple"],
    desc: "Light type and a narrow label column give every section room to breathe.",
    bestFor: "Designers, writers and anyone who likes white space."
  },
  {
    id: "executive", name: "Executive", layout: "single", photo: false, accent: "#8a6d1e",
    tags: ["professional"],
    desc: "A shaded header band with a strong accent rule and Baskerville headings. Built for senior profiles.",
    bestFor: "Managers, directors and professionals with 8+ years of experience."
  },
  {
    id: "creative", name: "Creative", layout: "single", photo: "circle", accent: "#b0531c",
    tags: ["creative", "photo"],
    desc: "A bold colour header with your photo, big grotesque name and pill-shaped skills.",
    bestFor: "Design, media, marketing and hospitality."
  },
  {
    id: "tech", name: "Tech", layout: "single", photo: false, accent: "#0f766e",
    tags: ["ats", "simple"],
    desc: "Monospace accents that feel like a code editor, while staying fully readable by ATS software.",
    bestFor: "Software engineers, data and IT professionals."
  },
  {
    id: "aurora", name: "Aurora", layout: "single", photo: "circle", accent: "#5a3a78",
    tags: ["creative", "photo"],
    desc: "A soft tinted header card with a ringed photo and rounded details. Friendly without being childish.",
    bestFor: "Teaching, healthcare, customer service and HR."
  },
  {
    id: "slate", name: "Slate", layout: "sidebar", head: "main", sidePos: "right", side: SIDE, photo: "square", accent: "#2f7d6d",
    tags: ["professional", "photo", "two-column"],
    desc: "A charcoal right sidebar with a square photo, contact and skills. Modern and serious.",
    bestFor: "Engineering, operations and supply chain roles."
  },
  {
    id: "metro", name: "Metro", layout: "single", photo: false, accent: "#c0392b",
    tags: ["creative", "bold"],
    desc: "Condensed uppercase headings set in solid colour blocks, with a thick accent edge beside your name.",
    bestFor: "Sales, sports, events and anyone who wants energy on the page."
  },
  {
    id: "nordic", name: "Nordic", layout: "single", photo: false, accent: "#3d6b8f",
    tags: ["simple", "ats"],
    desc: "Generous margins, soft grey type and tiny accent underlines. Calm Scandinavian restraint.",
    bestFor: "Product, UX, research and remote roles."
  },
  {
    id: "banner", name: "Banner", layout: "single", photo: "tall", accent: "#1d4e89",
    tags: ["professional", "photo"],
    desc: "A deep full-width banner with a portrait photo beside your name. Popular for Gulf and Asian job markets.",
    bestFor: "Jobs in UAE, Saudi Arabia, Qatar and Pakistan where a photo is expected."
  },
  {
    id: "compact", name: "Compact", layout: "twocol", sidePos: "left", side: SIDE, photo: false, accent: "#2d5f8b",
    tags: ["ats", "professional", "one-page"],
    desc: "Dense, tidy and small-set, it fits a long career onto one page without looking cramped.",
    bestFor: "Experienced professionals who must stay within one page."
  },
  {
    id: "magazine", name: "Magazine", layout: "twocol", sidePos: "right", side: ["skills", "education", "certifications", "languages", "details"], photo: false, accent: "#a4262c",
    tags: ["creative", "two-column"],
    desc: "Editorial style with a huge Playfair name, a heavy masthead rule and a drop cap on your profile.",
    bestFor: "Journalism, content, communications and fashion."
  },
  {
    id: "horizon", name: "Horizon", layout: "single", photo: "tall", accent: "#0b5563",
    order: ["summary", "details", "experience", "education", "skills", "languages", "certifications", "projects", "custom"],
    tags: ["professional", "photo"],
    desc: "Photo top-right, personal details up front and shaded section bars — the format many Middle East employers ask for.",
    bestFor: "Gulf jobs, drivers, technicians, nurses and hospitality staff."
  },
  {
    id: "bold", name: "Bold", layout: "single", photo: false, accent: "#e0a100",
    tags: ["creative", "bold"],
    desc: "An oversized uppercase name, black title tag and thick accent bars. Impossible to ignore.",
    bestFor: "Creative, startup and marketing roles."
  },
  {
    id: "pastel", name: "Pastel", layout: "sidebar", head: "side", side: SIDE, photo: "circle", accent: "#8a4f7d",
    tags: ["creative", "photo", "two-column"],
    desc: "A soft tinted sidebar with a centred photo. Warm, approachable and neat.",
    bestFor: "Teachers, nurses, social work, beauty and retail."
  },
  {
    id: "scholar", name: "Scholar", layout: "single", photo: false, accent: "#5b3f1f",
    order: ["summary", "education", "experience", "projects", "custom", "certifications", "skills", "languages", "details"],
    tags: ["ats", "academic", "simple"],
    desc: "An academic CV in Lora with small-caps headings. Education comes first and custom sections suit publications.",
    bestFor: "Lecturers, researchers, PhD and scholarship applications."
  },
  {
    id: "startup", name: "Startup", layout: "single", photo: "square", accent: "#4338ca",
    tags: ["creative", "photo"],
    desc: "Every section sits on its own rounded card over a light canvas, like a modern product dashboard.",
    bestFor: "Startups, tech, growth and product roles."
  },
  {
    id: "ribbon", name: "Ribbon", layout: "single", photo: false, accent: "#0f7b5f",
    tags: ["creative", "bold"],
    desc: "Section titles become colour ribbons that run in from the page edge.",
    bestFor: "Freshers and career changers who want a lively but tidy look."
  },
  {
    id: "monogram", name: "Monogram", layout: "single", photo: false, accent: "#8c6a3f",
    tags: ["professional", "elegant"],
    desc: "Your initials in a fine circle, a spaced-out Cormorant name and centred italic headings.",
    bestFor: "Hospitality, luxury retail, architecture and PR."
  },
  {
    id: "swiss", name: "Swiss", layout: "single", photo: false, accent: "#e4572e",
    tags: ["simple", "creative"],
    desc: "International typographic style: a huge tight name, heavy rules and a strict grid.",
    bestFor: "Designers, architects and engineers who appreciate order."
  },
  {
    id: "fresher", name: "Fresher", layout: "single", photo: "circle", accent: "#0e7490",
    order: ["summary", "education", "skills", "projects", "experience", "certifications", "languages", "details", "custom"],
    tags: ["fresher", "ats", "photo"],
    desc: "Puts education, skills and projects before experience, so a first CV still looks full and confident.",
    bestFor: "Students, fresh graduates and internship applications."
  },
  {
    id: "corporate", name: "Corporate", layout: "twocol", sidePos: "right", side: SIDE, photo: false, accent: "#1c3d6e",
    tags: ["professional", "ats"],
    desc: "A navy top rule, strong headings and a light grey side panel for skills. Safe, polished and corporate.",
    bestFor: "Banks, telecoms, FMCG and large companies."
  }
];

export const TAG_LABELS = {
  ats: "ATS-friendly", photo: "With photo", professional: "Professional", creative: "Creative",
  simple: "Simple", fresher: "Fresher", "two-column": "Two column", bold: "Bold", academic: "Academic",
  elegant: "Elegant", "one-page": "One page"
};

export const FONTS = {
  "": { label: "Template default" },
  manrope: { label: "Manrope", css: '"Manrope", "Segoe UI", sans-serif' },
  plex: { label: "IBM Plex Sans", css: '"IBM Plex Sans", Helvetica, Arial, sans-serif' },
  dmsans: { label: "DM Sans", css: '"DM Sans", Helvetica, Arial, sans-serif' },
  poppins: { label: "Poppins", css: '"Poppins", Helvetica, Arial, sans-serif' },
  worksans: { label: "Work Sans", css: '"Work Sans", Helvetica, Arial, sans-serif' },
  lora: { label: "Lora (serif)", css: '"Lora", Georgia, serif' },
  sourceserif: { label: "Source Serif (serif)", css: '"Source Serif 4", Georgia, serif' },
  garamond: { label: "EB Garamond (serif)", css: '"EB Garamond", Georgia, serif' }
};

export const ACCENTS = ["#16624f", "#1e3a6e", "#1d4e89", "#0e7490", "#0f7b5f", "#7a2233", "#a4262c", "#b0531c", "#8a6d1e", "#5a3a78", "#8a4f7d", "#2f353d"];

export const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?" + [
  "family=Archivo:wght@400;600;800",
  "family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800",
  "family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500",
  "family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700",
  "family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400",
  "family=IBM+Plex+Mono:wght@400;600",
  "family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400",
  "family=Karla:wght@400;600",
  "family=Libre+Baskerville:ital,wght@0,400;0,700;1,400",
  "family=Lora:ital,wght@0,400;0,600;1,400",
  "family=Manrope:wght@400;500;600;700;800",
  "family=Oswald:wght@400;500;600",
  "family=Playfair+Display:ital,wght@0,700;0,800;1,400",
  "family=Poppins:wght@400;500;600;700",
  "family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,700;1,8..60,400",
  "family=Work+Sans:wght@400;500;600;700"
].join("&") + "&display=swap";

export function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
}
