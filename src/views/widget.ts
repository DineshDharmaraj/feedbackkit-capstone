import { shell } from "./_shared.js";

export function renderWidget(): string {
  return shell("Send feedback", `
<h2>Send us feedback</h2>
<div class="card">
  <div style="margin-bottom:0.5rem;"><input id="title" placeholder="Title" maxlength="200"/></div>
  <div style="margin-bottom:0.5rem;"><textarea id="body" rows="4" placeholder="What's up? (up to 5000 chars)"></textarea></div>
  <div class="row">
    <button onclick="send()" class="grow">Send</button>
    <span id="status" style="color: var(--muted); font-size: 0.85rem;"></span>
  </div>
</div>

<script>
async function send() {
  const title = document.getElementById("title").value.trim();
  const body = document.getElementById("body").value.trim();
  const status = document.getElementById("status");
  if (!title) { status.textContent = "Title required"; return; }
  const r = await fetch("/api/feedback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, body })
  });
  if (!r.ok) { status.textContent = "Error " + r.status; return; }
  status.textContent = "Thanks! Sent.";
  document.getElementById("title").value = "";
  document.getElementById("body").value = "";
}
</script>
`);
}
