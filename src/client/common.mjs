// Runs on every page: header user menu, mobile nav, ads, analytics, live mini previews.
import { $, $$, esc, ICON, CFG, fitPage } from "./ui.mjs";
import { authEnabled, getUser, onAuthChange, signOut, displayName, avatarUrl, goSignIn } from "./auth.mjs";

/* ---------------- header user slot ---------------- */
function renderUserSlots(user) {
  $$(".user-slot").forEach(slot => {
    if (!authEnabled) { slot.innerHTML = ""; return; }
    if (!user) {
      slot.innerHTML = `<button class="btn btn-ghost" data-signin type="button">Sign in</button>`;
      slot.querySelector("[data-signin]").onclick = () => goSignIn(location.pathname.startsWith("/login") ? "/dashboard/" : location.pathname + location.search);
      return;
    }
    const pic = avatarUrl(user);
    const name = displayName(user);
    slot.innerHTML = `<div class="dropdown">
      <button class="avatar-btn" type="button" aria-haspopup="true" aria-expanded="false"><span class="avatar">${pic ? `<img src="${esc(pic)}" alt="" referrerpolicy="no-referrer">` : esc(name[0] || "U")}</span><span class="nm">${esc(name.split(" ")[0])}</span></button>
      <div class="dropdown-menu" hidden>
        <div class="who">${esc(user.email || name)}</div>
        <a href="/dashboard/">${ICON.grid}<span>My resumes</span></a>
        <a href="/builder/?new=1">${ICON.plus}<span>New resume</span></a>
        <a href="/cover-letter-generator/">${ICON.mail}<span>Cover letter</span></a>
        <hr><button type="button" data-signout>${ICON.logout}<span>Sign out</span></button>
      </div></div>`;
    const btn = slot.querySelector(".avatar-btn"), menu = slot.querySelector(".dropdown-menu");
    btn.onclick = e => { e.stopPropagation(); menu.hidden = !menu.hidden; btn.setAttribute("aria-expanded", String(!menu.hidden)); };
    slot.querySelector("[data-signout]").onclick = async () => { await signOut(); try { const d = JSON.parse(localStorage.getItem("rf:draft:v2") || "null"); if (d?.cloudId) localStorage.removeItem("rf:draft:v2"); } catch {} location.href = "/"; };
  });
}
document.addEventListener("click", e => {
  $$(".user-slot .dropdown-menu").forEach(m => { if (!m.parentElement.contains(e.target)) m.hidden = true; });
});
if (authEnabled) {
  renderUserSlots(null);
  getUser().then(u => { renderUserSlots(u); document.dispatchEvent(new CustomEvent("rf:user", { detail: u })); });
  onAuthChange(u => renderUserSlots(u));
}

/* ---------------- mobile nav ---------------- */
const menuBtn = $(".menu-btn"), mnav = $(".mobile-nav");
if (menuBtn && mnav) menuBtn.onclick = () => { mnav.hidden = !mnav.hidden; menuBtn.setAttribute("aria-expanded", String(!mnav.hidden)); };

/* ---------------- ads ---------------- */
export function pushAds(root = document) {
  if (!CFG.adsenseClient) return;
  $$("ins.adsbygoogle:not([data-rf-pushed])", root).forEach(ins => {
    ins.setAttribute("data-rf-pushed", "1");
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
  });
}
export function adSlotHTML(name) {
  const slot = CFG.adSlots?.[name];
  if (CFG.adsenseClient && slot) {
    return `<div class="ad-slot"><div class="ad-label">Advertisement</div><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(CFG.adsenseClient)}" data-ad-slot="${esc(slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins></div>`;
  }
  return CFG.showAdPlaceholders ? `<div class="ad-slot placeholder">Ad space · ${esc(name)}</div>` : "";
}
pushAds();

/* ---------------- live mini previews (gallery cards) ---------------- */
const minis = $$("[data-mini]");
if (minis.length) {
  Promise.all([import("/js/shared/render.mjs"), import("/js/shared/sample.mjs"), import("/js/shared/examples.mjs")]).then(([R, S, E]) => {
    const draw = el => {
      if (el.dataset.drawn) return;
      el.dataset.drawn = "1";
      const ex = el.dataset.example && E.EXAMPLES[el.dataset.example];
      const data = ex ? ex.data : S.EXAMPLE;
      const html = R.renderResume(data, { template: el.dataset.mini, accent: el.dataset.accent || "" });
      el.insertAdjacentHTML("beforeend", `<div class="mini">${html}</div>`);
      size(el);
    };
    const size = el => { const m = el.querySelector(".mini"); if (m) m.style.transform = `scale(${el.clientWidth / 794})`; };
    const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { draw(e.target); io.unobserve(e.target); } }), { rootMargin: "400px" }) : null;
    minis.forEach(el => (io ? io.observe(el) : draw(el)));
    const ro = new ResizeObserver(es => es.forEach(e => size(e.target)));
    minis.forEach(el => ro.observe(el));
    document.addEventListener("rf:redraw-minis", () => $$("[data-mini]").forEach(el => { el.querySelector(".mini")?.remove(); delete el.dataset.drawn; draw(el); }));
  });
}

/* ---------------- scaled full-page previews ---------------- */
$$(".scaled-page").forEach(holder => {
  const inner = holder.querySelector(".inner");
  const max = +(holder.dataset.max || 1);
  const run = () => fitPage(holder, inner, max, +(holder.dataset.pad || 0));
  run();
  new ResizeObserver(run).observe(holder.parentElement);
  document.fonts?.ready?.then(run);
});
