// Example content shown to first-time visitors and in template previews.
// Clearly fictional people and companies.

// Neutral illustrated avatar so photo templates look complete in previews.
export const AVATAR = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfe7ec"/><stop offset="1" stop-color="#c3d1da"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/><circle cx="100" cy="82" r="38" fill="#8a9aa6"/><path d="M28 200c6-44 36-68 72-68s66 24 72 68z" fill="#8a9aa6"/></svg>`
);

export const EXAMPLE = {
  name: "Emily Carter",
  title: "Frontend Developer",
  email: "emily.carter@example.com",
  phone: "+44 7700 90****",
  location: "London, United Kingdom",
  links: ["linkedin.com/in/emily-carter-example", "github.com/emily-carter-example"],
  photo: AVATAR,
  summary: "Frontend developer with 4 years of experience building fast, accessible web apps in React and TypeScript. Led the rebuild of a checkout flow used by 200k+ monthly shoppers and mentor two junior developers. Comfortable owning features end to end, from design review to release.",
  experience: [
    {
      role: "Frontend Developer", company: "Brightline Digital (example)", location: "London", start: "Mar 2023", end: "Present",
      bullets: [
        "Rebuilt the checkout flow in React and TypeScript, cutting page load time by 38% on mid-range Android phones",
        "Introduced a shared component library now used by 5 product teams, removing 12k lines of duplicate code",
        "Mentor two junior developers through weekly code reviews and pair programming"
      ]
    },
    {
      role: "Junior Web Developer", company: "Northwind Systems (example)", location: "Manchester", start: "Jul 2021", end: "Feb 2023",
      bullets: [
        "Built reporting dashboards for three banking clients using Angular and REST APIs",
        "Fixed 120+ accessibility issues to meet WCAG 2.1 AA ahead of a client audit"
      ]
    }
  ],
  education: [
    { degree: "BSc Computer Science", school: "University of Manchester", location: "Manchester", start: "2017", end: "2021", details: "First-Class Honours · Final year project: offline-first note-taking app" }
  ],
  projects: [
    { name: "Budget Buddy", link: "github.com/emily-carter-example/budget", desc: "Open-source household budget planner for web and mobile, 3k+ downloads." }
  ],
  skills: ["React", "TypeScript", "JavaScript", "Next.js", "Tailwind CSS", "REST APIs", "Jest", "Git", "Figma"],
  certifications: ["Meta Front-End Developer Certificate (2022)"],
  languages: ["English — native", "French — conversational"],
  details: [],
  custom: []
};
