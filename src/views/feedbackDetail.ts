import { shell } from "./_shared.js";

export function renderFeedbackDetail(): string {
  return shell("Feedback", `
<div id="detail">Loading…</div>

<script>
async function load() {
  const id = location.pathname.split("/").pop();
  const token = localStorage.getItem("token");
  if (!token) { document.getElementById("detail").innerHTML = '<p>Please <a href="/login">log in</a>.</p>'; return; }
  const r = await fetch("/api/feedback/" + id, { headers: { authorization: "Bearer " + token } });
  if (!r.ok) { document.getElementById("detail").innerHTML = "<p>" + r.status + "</p>"; return; }
  const { data: f } = await r.json();
  document.getElementById("detail").innerHTML = \`
    <div class="card">
      <h2>\${esc(f.title)}</h2>
      <p style="white-space: pre-wrap;">\${esc(f.body)}</p>
      <div>\${(f.tags||[]).map(t => \`<span class="tag" style="background:\${t.color}22;color:\${t.color}">\${esc(t.name)}</span>\`).join("")}</div>
      <div class="row" style="margin-top:1rem;">
        <button onclick="setStatus('\${f.status === "open" ? "closed" : "open"}')">
          \${f.status === "open" ? "Close" : "Reopen"}
        </button>
        <a href="/" class="secondary" style="text-decoration:none; color:var(--accent); padding:0.55rem 1rem;">← Back</a>
      </div>
    </div>\`;
}
async function setStatus(status) {
  const id = location.pathname.split("/").pop();
  const token = localStorage.getItem("token");
  await fetch("/api/feedback/" + id + "/status", {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: "Bearer " + token },
    body: JSON.stringify({ status })
  });
  load();
}
function esc(s) { return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }
load();
</script>
`);
}
