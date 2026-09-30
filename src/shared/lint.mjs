// Instant resume check — runs in the browser, no AI, free and unlimited.
// A rule-based score out of 100 plus specific, located suggestions.

const VERBS = new Set(("achieved accelerated administered advised analysed analyzed arranged assembled assessed assisted audited automated balanced boosted briefed built calculated captured championed checked coached collaborated compiled completed composed conducted configured consolidated constructed consulted contributed controlled converted coordinated created cut debugged decreased defined delivered demonstrated deployed designed developed devised diagnosed directed discovered doubled drafted drove edited educated eliminated enabled engineered enhanced established evaluated exceeded executed expanded facilitated finalised finalized forecast formulated founded generated grew guided halved handled headed helped hired identified implemented improved increased influenced initiated inspected installed instructed integrated interviewed introduced investigated launched led lowered maintained managed mapped marketed maximised maximized mentored merged migrated minimised minimized modernised modernized monitored motivated negotiated operated optimised optimized orchestrated organised organized oversaw owned partnered performed pioneered planned prepared presented prioritised prioritized processed produced programmed promoted proposed protected published raised ranked rebuilt recommended reconciled recruited redesigned reduced refactored refined reorganised reorganized repaired reported represented researched resolved restructured revamped reviewed revised saved scaled scheduled secured served shipped simplified sold solved spearheaded standardised standardized streamlined strengthened supervised supported surpassed taught tested tracked trained transformed translated tripled troubleshot tutored upgraded upsold validated verified won wrote " +
  "achieve analyse analyze build coach coordinate create deliver design develop drive handle lead maintain manage mentor own plan prepare process run sell serve supervise support teach test train write").split(/\s+/));
const WEAK = [/^responsible for\b/i, /^duties (included|include)\b/i, /^worked on\b/i, /^helped( to)?\b/i, /^involved in\b/i, /^tasked with\b/i, /^in charge of\b/i, /^assisted in\b/i];
const clean = a => (Array.isArray(a) ? a : []).map(x => String(x ?? "").trim()).filter(Boolean);
const words = s => String(s || "").trim().split(/\s+/).filter(Boolean);
const has = v => String(v ?? "").trim().length > 0;

export function lintResume(r) {
  r = r || {};
  let score = 0;
  const strengths = [], issues = [], tips = [];
  const exp = (r.experience || []).filter(e => has(e.role) || has(e.company) || clean(e.bullets).length);
  const edu = (r.education || []).filter(e => has(e.degree) || has(e.school));
  const bullets = exp.flatMap(e => clean(e.bullets).map(b => ({ b, e })));
  const skills = clean(r.skills);

  // 1. Contact & headline (15)
  let c = 0;
  if (has(r.name)) c += 4; else issues.push("Add your full name at the top.");
  if (/@/.test(r.email || "")) c += 4; else issues.push("Add a professional email address.");
  if (/\d{7,}/.test(String(r.phone || "").replace(/\D/g, ""))) c += 4; else issues.push("Add a phone number (with country code for jobs abroad, e.g. +92).");
  if (has(r.title)) c += 3; else issues.push("Add a job title under your name (e.g. \"Accountant\") so recruiters and ATS know what you do.");
  score += c;
  if (c === 15) strengths.push("Complete contact details and a clear job title.");

  // 2. Summary (10)
  const sw = words(r.summary).length;
  if (!sw) issues.push("Add a 2–3 line professional summary at the top — it's the first thing recruiters read.");
  else {
    score += 5;
    if (sw >= 25 && sw <= 90) { score += 5; strengths.push("Summary is a good length."); }
    else if (sw < 25) issues.push(`Your summary is short (${sw} words). Aim for 2–3 sentences (40–65 words) with your experience and strongest result.`);
    else issues.push(`Your summary is long (${sw} words). Cut it to 2–3 sentences.`);
    if (/\b(hard[- ]working|team player|go-getter|result[- ]oriented|self[- ]motivated)\b/i.test(r.summary)) issues.push("Your summary uses clichés (e.g. \"hard-working\", \"team player\"). Replace them with a real achievement.");
  }

  // 3. Experience (35)
  if (!exp.length) {
    issues.push("Add your work experience, internships or part-time jobs. Freshers can use projects and volunteering instead.");
  } else {
    score += 10;
    const missingDates = exp.filter(e => !has(e.start) && !has(e.end));
    const missingCo = exp.filter(e => !has(e.company));
    if (!missingDates.length && !missingCo.length) score += 5;
    missingDates.slice(0, 2).forEach(e => issues.push(`Add dates for "${e.role || e.company}".`));
    missingCo.slice(0, 2).forEach(e => issues.push(`Add the company name for "${e.role}".`));
    const thin = exp.slice(0, 2).filter(e => clean(e.bullets).length < 2);
    if (!thin.length) score += 5; else thin.forEach(e => issues.push(`"${e.role || e.company}" has ${clean(e.bullets).length || "no"} achievement line${clean(e.bullets).length === 1 ? "" : "s"}. Add 3–5 for recent jobs.`));
    if (bullets.length) {
      const verbRatio = bullets.filter(({ b }) => VERBS.has(b.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, ""))).length / bullets.length;
      if (verbRatio >= 0.7) { score += 5; strengths.push("Most bullet points start with strong action verbs."); }
      else issues.push(`Only ${Math.round(verbRatio * 100)}% of your bullet points start with an action verb (Led, Built, Increased…). Aim for all of them.`);
      const numRatio = bullets.filter(({ b }) => /\d/.test(b)).length / bullets.length;
      if (numRatio >= 0.3) { score += 5; strengths.push("Achievements include numbers — recruiters love proof."); }
      else { score += numRatio >= 0.15 ? 2 : 0; issues.push(`Only ${Math.round(numRatio * 100)}% of your bullet points have a number. Add results like sales %, customers per day, money saved or team size.`); }
      const weak = bullets.filter(({ b }) => WEAK.some(re => re.test(b)));
      if (!weak.length) score += 5;
      else issues.push(`${weak.length} bullet point${weak.length > 1 ? "s" : ""} start${weak.length > 1 ? "" : "s"} with weak phrases like "Responsible for" (e.g. under "${weak[0].e.role || weak[0].e.company}"). Say what you achieved instead.`);
    }
  }

  // 4. Education (10)
  if (edu.length) { score += edu.every(e => has(e.degree) && has(e.school)) ? 10 : 6; if (edu.some(e => !has(e.school))) issues.push("Add the school or university name for each qualification."); }
  else issues.push("Add your education — degree, institution and year.");

  // 5. Skills (10)
  if (skills.length >= 6 && skills.length <= 20) { score += 10; strengths.push(`${skills.length} skills listed — a healthy number for ATS keyword matching.`); }
  else if (skills.length > 20) { score += 6; issues.push(`You list ${skills.length} skills. Keep the 12–18 most relevant so the important ones stand out.`); }
  else if (skills.length) { score += 5; issues.push(`Only ${skills.length} skill${skills.length > 1 ? "s" : ""} listed. Add 6–15 specific tools and skills from the jobs you want.`); }
  else issues.push("Add a skills section with the tools and skills employers search for.");

  // 6. Polish (20)
  const all = [r.summary, ...bullets.map(x => x.b), ...(r.projects || []).map(p => p.desc)].join(" ");
  const total = words(all).length + words(skills.join(" ")).length;
  if (total >= 150 && total <= 900) score += 5; else if (total < 150) issues.push("Your resume looks thin. Add more detail about your results, projects or training."); else issues.push("Your resume is very long. Two pages is the maximum for most jobs — cut older or less relevant items.");
  if (!/\b(I|me|my|myself)\b/.test(all)) score += 5; else issues.push("Avoid \"I\", \"me\" and \"my\" in a resume — start lines with the action instead.");
  const longB = bullets.filter(({ b }) => words(b).length > 38);
  if (!longB.length) score += 5; else issues.push(`${longB.length} bullet point${longB.length > 1 ? "s are" : " is"} longer than 38 words. Split or shorten them.`);
  const dated = exp.filter(e => has(e.start) || has(e.end));
  if (dated.every(e => /\d{4}|present|current/i.test(`${e.start} ${e.end}`))) score += 5; else issues.push("Use a clear date format with years, e.g. \"Mar 2023 – Present\".");

  score = Math.max(0, Math.min(100, Math.round(score)));
  if (!r.photo) tips.push("For Gulf and many Pakistani employers, a professional photo helps. For UK/US jobs, leave it out.");
  tips.push("Paste a job ad into \"Tailor to a job\" to match its keywords.");
  const verdict = score >= 85 ? "Excellent — ready to send." : score >= 70 ? "Good — a few fixes will make it stronger." : score >= 50 ? "Fair — fix the items below before applying." : "Needs work — start with the first few fixes below.";
  return { score, verdict, strengths: strengths.slice(0, 5), issues: issues.slice(0, 8), tips };
}
