import { $, esc, fitPage } from "./ui.mjs";
import { authEnabled } from "./auth.mjs";
import { getPublicResume } from "./store.mjs";
import { printResume, fileBase } from "./export.mjs";
import { renderResume } from "/js/shared/render.mjs";

(async () => {
  const id = new URLSearchParams(location.search).get("id");
  const fail = t => { $("#shTitle").textContent = "Resume not available"; $("#shMsg").textContent = t; };
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return fail("This link is incomplete. Ask the owner to send it again.");
  if (!authEnabled) return fail("Sharing isn't set up on this site.");
  try {
    const r = await getPublicResume(id);
    if (!r) return fail("This resume is private or the owner turned off link sharing.");
    const html = renderResume(r.data, r.settings);
    $("#shTitle").textContent = r.data?.name || r.title || "Resume";
    document.title = `${r.data?.name || "Resume"} — Resume`;
    $("#shBox").innerHTML = `<div class="scaled-page"><div class="inner">${html}</div></div>`;
    const holder = $("#shBox .scaled-page"), inner = holder.querySelector(".inner");
    const fit = () => fitPage(holder, inner, 1, 44);
    fit(); new ResizeObserver(fit).observe($("#shBox")); document.fonts?.ready?.then(fit);
    const b = $("#shPdf"); b.disabled = false;
    b.onclick = () => printResume(html, { paper: r.settings?.paper, title: fileBase(r.data) });
  } catch (e) { fail("Couldn't load this resume: " + esc(e.message)); }
})();
