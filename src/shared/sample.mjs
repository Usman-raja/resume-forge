// Example content shown to first-time visitors and in template previews.
// Clearly fictional people and companies.

// Neutral illustrated avatar so photo templates look complete in previews.
export const AVATAR = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfe7ec"/><stop offset="1" stop-color="#c3d1da"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/><circle cx="100" cy="82" r="38" fill="#8a9aa6"/><path d="M28 200c6-44 36-68 72-68s66 24 72 68z" fill="#8a9aa6"/></svg>`
);

export const EXAMPLE = {
  name: "Ayesha Siddiqui",
  title: "Frontend Developer",
  email: "ayesha.siddiqui@example.com",
  phone: "+92 300 1234567",
  location: "Karachi, Pakistan",
  links: ["linkedin.com/in/ayesha-example", "github.com/ayesha-example"],
  photo: AVATAR,
  summary: "Frontend developer with 4 years of experience building fast, accessible web apps in React and TypeScript. Led the rebuild of a checkout flow used by 200k+ monthly shoppers and mentor two junior developers. Comfortable owning features end to end, from design review to release.",
  experience: [
    {
      role: "Frontend Developer", company: "Bazaar Digital (example)", location: "Karachi", start: "Mar 2023", end: "Present",
      bullets: [
        "Rebuilt the checkout flow in React and TypeScript, cutting page load time by 38% on mid-range Android phones",
        "Introduced a shared component library now used by 5 product teams, removing 12k lines of duplicate code",
        "Mentor two junior developers through weekly code reviews and pair programming"
      ]
    },
    {
      role: "Junior Web Developer", company: "Northwind Systems (example)", location: "Lahore", start: "Jul 2021", end: "Feb 2023",
      bullets: [
        "Built reporting dashboards for three banking clients using Angular and REST APIs",
        "Fixed 120+ accessibility issues to meet WCAG 2.1 AA ahead of a client audit"
      ]
    }
  ],
  education: [
    { degree: "BS Computer Science", school: "FAST-NUCES", location: "Karachi", start: "2017", end: "2021", details: "CGPA 3.4 / 4.0 · Final year project: offline-first Urdu note-taking app" }
  ],
  projects: [
    { name: "Shaadi Budget Planner", link: "github.com/ayesha-example/budget", desc: "Open-source wedding budget planner in Urdu and English, 3k+ downloads." }
  ],
  skills: ["React", "TypeScript", "JavaScript", "Next.js", "Tailwind CSS", "REST APIs", "Jest", "Git", "Figma"],
  certifications: ["Meta Front-End Developer Certificate (2022)"],
  languages: ["English — fluent", "Urdu — native"],
  details: [],
  custom: []
};
