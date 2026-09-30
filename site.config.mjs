// Site-wide settings. Everything here can also be set with environment
// variables in Cloudflare Pages (Settings → Environment variables), which win.
const env = typeof process !== "undefined" ? process.env : {};
const bool = (v, d) => (v == null || v === "" ? d : !/^(0|false|no|off)$/i.test(String(v)));

export default {
  name: env.SITE_NAME || "Resume Forge",
  // Your live address, no trailing slash. Used for canonical links, sitemap and social cards.
  url: (env.SITE_URL || "https://resumeforge.example.com").replace(/\/$/, ""),
  tagline: "Free AI resume builder",
  contactEmail: env.CONTACT_EMAIL || "hello@resumeforge.example.com",
  country: "Pakistan",

  // Supabase (login + cloud saving). Public values — safe to expose.
  supabaseUrl: env.SUPABASE_URL || "",
  supabaseAnonKey: env.SUPABASE_ANON_KEY || "",

  // AI
  aiEnabled: bool(env.AI_ENABLED, true),
  aiRequireLogin: bool(env.AI_REQUIRE_LOGIN, true),
  aiDailyCredits: parseInt(env.AI_DAILY_CREDITS || "30", 10),

  // Google AdSense — leave empty until your site is approved.
  adsenseClient: env.ADSENSE_CLIENT || "",           // e.g. ca-pub-1234567890123456
  adSlots: {
    home: env.ADSENSE_SLOT_HOME || "",
    gallery: env.ADSENSE_SLOT_GALLERY || "",
    template: env.ADSENSE_SLOT_TEMPLATE || "",
    example: env.ADSENSE_SLOT_EXAMPLE || "",
    builder: env.ADSENSE_SLOT_BUILDER || "",
    cover: env.ADSENSE_SLOT_COVER || ""
  },
  showAdPlaceholders: bool(env.SHOW_AD_PLACEHOLDERS, false),

  // Google Analytics 4 measurement ID, e.g. G-XXXXXXX (optional)
  gaId: env.GA_ID || "",
  // Google Search Console verification code (optional, the content="" value)
  googleVerification: env.GOOGLE_SITE_VERIFICATION || ""
};
