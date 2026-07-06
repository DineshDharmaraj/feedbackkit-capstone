import { shell } from "./_shared.js";

export function renderDashboard(): string {
  return shell("Triage inbox", `
<h2>Triage inbox</h2>
<div class="row" style="margin-bottom: 1rem;">
  <select id="status">
    <option value="open">Open</option>
    <option value="closed">Recent closes</option>
  </select>
  <button class="secondary" onclick="load()">Refresh</button>
</div>
<div id="list">Loading…</div>

<script>
async function load() {
  const token = localStorage.getItem("token");
  if (!token) { document.getElementById("list").innerHTML = '<p>Please <a href="/login" style="color:var(--accent)">log in</a> first.</p>'; return; }
  const status = document.getElementById("status").value;
  const r = await fetch("/api/feedback?status=" + status, { headers: { authorization: "Bearer " + token } });
  if (!r.ok) { document.getElementById("list").innerHTML = "<p>" + r.status + " — " + await r.text() + "</p>"; return; }
  const { data } = await r.json();
  document.getElementById("list").innerHTML = data.map(f => \`
    <div class="card">
      <h2><a href="/feedback/\${f.id}" style="color:inherit; text-decoration:none;">\${escapeHtml(f.title)}</a></h2>
      <p>\${escapeHtml(f.body).slice(0, 140)}\${f.body.length > 140 ? "…" : ""}</p>
      <div>\${(f.tags||[]).map(t => \`<span class="tag" style="background:\${t.color}22; color:\${t.color}">\${escapeHtml(t.name)}</span>\`).join("")}</div>
    </div>\`).join("") || "<p>Nothing here.</p>";
}
function escapeHtml(s) { return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }
load();
</script>
`);
}
