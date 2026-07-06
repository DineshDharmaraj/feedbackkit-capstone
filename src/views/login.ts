import { shell } from "./_shared.js";

export function renderLogin(): string {
  return shell("Log in", `
<h2>Log in</h2>
<div class="card" style="max-width: 24rem;">
  <div style="margin-bottom:0.5rem;"><input id="email" placeholder="email" autocomplete="username"/></div>
  <div style="margin-bottom:0.5rem;"><input id="pw" type="password" placeholder="password" autocomplete="current-password"/></div>
  <div class="row"><button onclick="login()" class="grow">Sign in</button></div>
  <p id="err" style="color: var(--danger); margin: 0.5rem 0 0; font-size: 0.85rem;"></p>
</div>

<script>
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("pw").value;
  const r = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const err = document.getElementById("err");
  if (!r.ok) { err.textContent = "Invalid credentials"; return; }
  const { token } = await r.json();
  localStorage.setItem("token", token);
  location.href = "/";
}
</script>
`);
}
