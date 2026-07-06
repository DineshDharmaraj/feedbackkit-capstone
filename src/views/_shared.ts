export function escape(s: string): string {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function shell(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escape(title)} · FeedbackKit</title>
<style>
:root { --bg:#0f172a; --card:#1e293b; --accent:#38bdf8; --text:#e2e8f0; --muted:#94a3b8; --danger:#ef4444; --ok:#22c55e; }
* { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--bg); color: var(--text); min-height: 100vh; }
header.page { padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(148,163,184,0.15);
  display: flex; justify-content: space-between; align-items: center; }
header.page h1 { margin: 0; font-size: 1.15rem; }
header.page a { color: var(--accent); text-decoration: none; margin-left: 1rem; font-size: 0.9rem; }
main { max-width: 1100px; margin: 0 auto; padding: 1.5rem; }
.card { background: var(--card); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 0.75rem; }
.card h2 { margin: 0 0 0.25rem; font-size: 1rem; }
.card p { margin: 0.25rem 0 0.75rem; color: var(--muted); font-size: 0.9rem; }
.tag { display: inline-block; padding: 0.15rem 0.55rem; border-radius: 999px; font-size: 0.75rem; margin-right: 0.35rem; }
input, textarea, select, button { font: inherit; }
input, textarea, select { background: #0b1220; color: var(--text); border: 1px solid rgba(148,163,184,0.25);
  border-radius: 8px; padding: 0.5rem 0.75rem; width: 100%; }
button { background: var(--accent); color: #082f49; border: 0; padding: 0.55rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; }
button.secondary { background: transparent; color: var(--accent); border: 1px solid rgba(56,189,248,0.4); }
button.danger { background: var(--danger); color: white; }
.row { display: flex; gap: 0.5rem; align-items: center; }
.grow { flex: 1; }
</style>
</head>
<body>
<header class="page">
  <h1>📮 FeedbackKit</h1>
  <nav>
    <a href="/">Inbox</a>
    <a href="/admin/rules">Rules</a>
    <a href="/widget">Widget</a>
    <a href="/login">Login</a>
  </nav>
</header>
<main>
${body}
</main>
<footer style="text-align:center; padding:1rem; color: var(--muted); font-size: 0.75rem;">
FeedbackKit · capstone build
</footer>
</body>
</html>`;
}
