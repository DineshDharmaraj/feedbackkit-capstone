import { shell, escape } from "./_shared.js";

export function renderAdminRules(opts: { tags: { id: number; name: string }[] }): string {
  const tagOptions = opts.tags
    .map((t) => `<option value="${t.id}">${escape(t.name)}</option>`)
    .join("");
  return shell("Rules · admin", `
<h2>Auto-tag rules</h2>
<div id="list">Loading…</div>

<div class="card" style="margin-top:1.5rem;">
  <h2>Add rule</h2>
  <div class="row" style="margin-bottom:0.5rem;">
    <input id="pattern" placeholder="regex, e.g. (broken|crash)" class="grow"/>
    <select id="tag">${tagOptions}</select>
    <input id="weight" type="number" min="1" value="1" style="width:6rem"/>
    <button onclick="add()">Add</button>
  </div>
  <p style="margin:0; color: var(--muted); font-size: 0.8rem;">Invalid regex is rejected before insert.</p>
</div>

<script>
async function load() {
  const token = localStorage.getItem("token");
  if (!token) { document.getElementById("list").innerHTML = '<p>Please <a href="/login">log in</a> as admin.</p>'; return; }
  const r = await fetch("/api/rules", { headers: { authorization: "Bearer " + token } });
  if (!r.ok) { document.getElementById("list").innerHTML = "<p>" + r.status + "</p>"; return; }
  const { data } = await r.json();
  document.getElementById("list").innerHTML = data.map(x => \`
    <div class="card">
      <div class="row">
        <div class="grow"><code>\${esc(x.pattern)}</code> → <span class="tag" style="background:\${x.tag.color}22;color:\${x.tag.color}">\${esc(x.tag.name)}</span> (weight \${x.weight})</div>
        <button class="danger" onclick="del(\${x.id})">Delete</button>
      </div>
    </div>\`).join("") || "<p>No rules yet.</p>";
}
async function add() {
  const token = localStorage.getItem("token");
  const pattern = document.getElementById("pattern").value;
  const tagId = Number(document.getElementById("tag").value);
  const weight = Number(document.getElementById("weight").value);
  const r = await fetch("/api/rules", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + token },
    body: JSON.stringify({ pattern, tagId, weight })
  });
  if (!r.ok) alert(await r.text());
  load();
}
async function del(id) {
  const token = localStorage.getItem("token");
  await fetch("/api/rules/" + id, { method: "DELETE", headers: { authorization: "Bearer " + token } });
  load();
}
function esc(s) { return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }
load();
</script>
`);
}
