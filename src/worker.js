// mazzen.dev — a hub of links to the subdomains. Tiles live in D1 now, so
// the whole hub (which sites, their names/descriptions/tags, and the order)
// can be edited from /admin instead of by hand-editing this file.

function jsonResponse(data, init) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json", ...(init && init.headers) },
  });
}

async function getTiles(db) {
  const { results } = await db.prepare(
    "SELECT id, name, href, desc, tag, position FROM tiles ORDER BY position ASC, id ASC"
  ).all();
  return results;
}

async function handleListTiles(db) {
  return jsonResponse({ tiles: await getTiles(db) });
}

async function handleCreateTile(db, request) {
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return jsonResponse({ error: "bad request body" }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const href = typeof body.href === "string" ? body.href.trim() : "";
  const desc = typeof body.desc === "string" ? body.desc.trim() : "";
  const tag = typeof body.tag === "string" && body.tag.trim() ? body.tag.trim() : null;
  if (!name || !href) {
    return jsonResponse({ error: "name and href are required" }, { status: 400 });
  }
  const maxRow = await db.prepare("SELECT MAX(position) AS m FROM tiles").first();
  const nextPos = (maxRow && Number.isInteger(maxRow.m) ? maxRow.m : -1) + 1;
  const res = await db.prepare(
    "INSERT INTO tiles (name, href, desc, tag, position) VALUES (?, ?, ?, ?, ?)"
  ).bind(name, href, desc, tag, nextPos).run();
  return jsonResponse({ ok: true, id: res.meta.last_row_id, tiles: await getTiles(db) });
}

async function handleUpdateTile(db, request, idStr) {
  const id = Number(idStr);
  if (!Number.isInteger(id)) return jsonResponse({ error: "invalid id" }, { status: 400 });
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return jsonResponse({ error: "bad request body" }, { status: 400 });
  }
  const existing = await db.prepare("SELECT id FROM tiles WHERE id = ?").bind(id).first();
  if (!existing) return jsonResponse({ error: "not found" }, { status: 404 });

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const href = typeof body.href === "string" ? body.href.trim() : "";
  const desc = typeof body.desc === "string" ? body.desc.trim() : "";
  const tag = typeof body.tag === "string" && body.tag.trim() ? body.tag.trim() : null;
  if (!name || !href) {
    return jsonResponse({ error: "name and href are required" }, { status: 400 });
  }
  await db.prepare("UPDATE tiles SET name = ?, href = ?, desc = ?, tag = ? WHERE id = ?")
    .bind(name, href, desc, tag, id).run();
  return jsonResponse({ ok: true, tiles: await getTiles(db) });
}

async function handleDeleteTile(db, idStr) {
  const id = Number(idStr);
  if (!Number.isInteger(id)) return jsonResponse({ error: "invalid id" }, { status: 400 });
  await db.prepare("DELETE FROM tiles WHERE id = ?").bind(id).run();
  return jsonResponse({ ok: true, tiles: await getTiles(db) });
}

async function handleReorderTiles(db, request) {
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return jsonResponse({ error: "bad request body" }, { status: 400 });
  }
  const order = Array.isArray(body.order) ? body.order.map(Number) : null;
  if (!order || !order.length || order.some((n) => !Number.isInteger(n))) {
    return jsonResponse({ error: "order must be an array of tile ids" }, { status: 400 });
  }
  const stmts = order.map((id, i) =>
    db.prepare("UPDATE tiles SET position = ? WHERE id = ?").bind(i, id)
  );
  await db.batch(stmts);
  return jsonResponse({ ok: true, tiles: await getTiles(db) });
}

// ---------- shared look ----------

function baseStyle() {
  return `
  :root {
    --bg: #0a0e17;
    --panel: #131a28;
    --border: rgba(14, 165, 233, 0.2);
    --text: #e2e8f0;
    --muted: #94a3b8;
    --accent: #0ea5e9;
    --warn: #f59e0b;
    --danger: #f43f5e;
    --good: #10b981;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    background: radial-gradient(circle at top right, #1a2333 0%, var(--bg) 60%);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
  }
  a { color: inherit; }
  .tag {
    display: inline-block;
    background: rgba(245, 158, 11, 0.15);
    color: var(--warn);
    border: 1px solid rgba(245, 158, 11, 0.4);
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 3px 8px;
    border-radius: 999px;
  }
  `;
}

function page() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>mazzen.dev</title>
<style>
${baseStyle()}
  body {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60px 20px;
  }
  header { text-align: center; margin-bottom: 44px; }
  header h1 {
    margin: 0;
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 2.2rem;
    color: var(--accent);
    letter-spacing: 1px;
    text-shadow: 0 0 15px rgba(14, 165, 233, 0.4);
  }
  header p { color: var(--muted); margin-top: 10px; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    width: 100%;
    max-width: 900px;
  }
  .tile {
    position: relative;
    display: block;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  }
  .tile:hover {
    transform: translateY(-2px);
    border-color: var(--accent);
    box-shadow: 0 10px 40px rgba(14, 165, 233, 0.25);
  }
  .tile-name { font-size: 1.25rem; font-weight: 700; margin-bottom: 6px; }
  .tile-desc { color: var(--muted); font-size: 0.92rem; margin-bottom: 16px; }
  .tile-link { font-family: ui-monospace, monospace; font-size: 0.85rem; color: var(--accent); }
  .tile .tag { position: absolute; top: 16px; right: 16px; }
  footer { margin-top: 48px; color: var(--muted); font-size: 0.8rem; text-align: center; }
  footer .admin-link {
    display: block;
    margin-top: 10px;
    color: #475569;
    font-size: 0.72rem;
    text-decoration: underline;
  }
  .empty-note { color: var(--muted); text-align: center; padding: 20px 0; }
</style>
</head>
<body>
  <header>
    <h1>mazzen.dev</h1>
    <p>Pick a thing.</p>
  </header>
  <div class="grid" id="grid">
    <p class="empty-note">Loading…</p>
  </div>
  <footer>
    mazzen.dev
    <a class="admin-link" href="/admin">edit hub</a>
  </footer>
  <script>
    (async function () {
      const grid = document.getElementById("grid");
      const res = await fetch("/api/tiles");
      const data = await res.json();
      if (!data.tiles.length) {
        grid.innerHTML = '<p class="empty-note">Nothing here yet. <a href="/admin">Add a tile</a>.</p>';
        return;
      }
      grid.innerHTML = data.tiles.map((t) => \`
        <a class="tile" href="\${t.href}">
          \${t.tag ? \`<span class="tag">\${t.tag}</span>\` : ""}
          <div class="tile-name">\${t.name}</div>
          <div class="tile-desc">\${t.desc || ""}</div>
          <div class="tile-link">\${t.href.replace("https://", "")} &rarr;</div>
        </a>\`).join("\\n");
    })();
  </script>
</body>
</html>`;
}

function adminPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Edit hub — mazzen.dev</title>
<style>
${baseStyle()}
  body { padding: 32px 16px 80px; }
  .wrap { max-width: 640px; margin: 0 auto; }
  header { text-align: center; margin-bottom: 28px; }
  header h1 {
    margin: 0;
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 1.6rem;
    color: var(--accent);
  }
  header p { color: var(--muted); margin-top: 8px; font-size: 0.9rem; }
  nav { display: flex; justify-content: center; margin-top: 14px; }
  nav a {
    color: var(--muted);
    text-decoration: none;
    font-size: 0.85rem;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid var(--border);
  }
  .card {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 18px;
    margin-bottom: 14px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  }
  .card-row { display: flex; gap: 10px; align-items: flex-start; }
  .card-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
  .card-controls { display: flex; flex-direction: column; gap: 6px; align-items: center; }
  input, textarea {
    width: 100%;
    background: rgba(148,163,184,0.06);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 10px;
    color: var(--text);
    font-size: 0.88rem;
    font-family: inherit;
  }
  label { font-size: 0.72rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 2px; display: block; }
  .field { display: flex; flex-direction: column; }
  .field-row { display: flex; gap: 8px; }
  .field-row .field { flex: 1; }
  .arrow-btn {
    background: transparent;
    border: 1px solid rgba(148,163,184,0.3);
    color: var(--text);
    border-radius: 6px;
    width: 30px;
    height: 30px;
    font-size: 0.9rem;
    cursor: pointer;
  }
  .arrow-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .btn {
    padding: 8px 14px;
    border-radius: 8px;
    border: none;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
  }
  .btn-save { background: var(--accent); color: #04121c; }
  .btn-delete {
    background: transparent;
    border: 1px solid rgba(244, 63, 94, 0.4);
    color: #fca5a5;
  }
  .row-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
  .add-card { border-style: dashed; }
  .add-card h2 { margin: 0 0 10px; font-size: 1rem; color: var(--accent); }
  .status-msg { font-size: 0.8rem; margin-top: 8px; min-height: 1.2em; }
  .status-msg.ok { color: var(--good); }
  .status-msg.err { color: var(--danger); }
  .empty-note { color: var(--muted); text-align: center; padding: 20px 0; }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>Edit hub</h1>
      <p>Add, remove, rename or reorder the tiles on mazzen.dev.</p>
      <nav><a href="/">&larr; back to hub</a></nav>
    </header>

    <div id="tileList"><p class="empty-note">Loading…</p></div>

    <div class="card add-card">
      <h2>Add a tile</h2>
      <div class="card-main">
        <div class="field-row">
          <div class="field"><label>Name</label><input id="newName" placeholder="e.g. Guess Who"></div>
          <div class="field"><label>Tag (optional)</label><input id="newTag" placeholder="e.g. New"></div>
        </div>
        <div class="field"><label>Link</label><input id="newHref" placeholder="https://example.mazzen.dev"></div>
        <div class="field"><label>Description</label><textarea id="newDesc" rows="2" placeholder="What is this?"></textarea></div>
      </div>
      <div class="row-actions">
        <button class="btn btn-save" id="addBtn">Add tile</button>
      </div>
      <div class="status-msg" id="addStatus"></div>
    </div>
  </div>

  <script>
    const list = document.getElementById("tileList");
    const addBtn = document.getElementById("addBtn");
    const addStatus = document.getElementById("addStatus");

    function tileCard(t, i, total) {
      const wrap = document.createElement("div");
      wrap.className = "card";
      wrap.innerHTML = \`
        <div class="card-row">
          <div class="card-main">
            <div class="field-row">
              <div class="field"><label>Name</label><input data-f="name" value="\${escapeAttr(t.name)}"></div>
              <div class="field"><label>Tag</label><input data-f="tag" value="\${escapeAttr(t.tag || "")}" placeholder="(none)"></div>
            </div>
            <div class="field"><label>Link</label><input data-f="href" value="\${escapeAttr(t.href)}"></div>
            <div class="field"><label>Description</label><textarea data-f="desc" rows="2">\${escapeText(t.desc || "")}</textarea></div>
            <div class="row-actions">
              <button class="btn btn-delete" data-act="delete">Delete</button>
              <button class="btn btn-save" data-act="save">Save</button>
            </div>
            <div class="status-msg" data-status></div>
          </div>
          <div class="card-controls">
            <button class="arrow-btn" data-act="up" \${i === 0 ? "disabled" : ""}>\\u2191</button>
            <button class="arrow-btn" data-act="down" \${i === total - 1 ? "disabled" : ""}>\\u2193</button>
          </div>
        </div>
      \`;
      wrap.dataset.id = t.id;

      wrap.querySelector('[data-act="save"]').addEventListener("click", async () => {
        const statusEl = wrap.querySelector("[data-status]");
        statusEl.textContent = "";
        statusEl.className = "status-msg";
        const payload = {
          name: wrap.querySelector('[data-f="name"]').value,
          href: wrap.querySelector('[data-f="href"]').value,
          desc: wrap.querySelector('[data-f="desc"]').value,
          tag: wrap.querySelector('[data-f="tag"]').value,
        };
        try {
          const res = await fetch("/api/tiles/" + t.id, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "couldn't save");
          statusEl.textContent = "Saved.";
          statusEl.className = "status-msg ok";
          render(data.tiles);
        } catch (err) {
          statusEl.textContent = err.message;
          statusEl.className = "status-msg err";
        }
      });

      wrap.querySelector('[data-act="delete"]').addEventListener("click", async () => {
        if (!confirm('Remove "' + t.name + '" from the hub?')) return;
        const res = await fetch("/api/tiles/" + t.id, { method: "DELETE" });
        const data = await res.json();
        if (res.ok) render(data.tiles);
      });

      wrap.querySelector('[data-act="up"]')?.addEventListener("click", () => move(i, i - 1));
      wrap.querySelector('[data-act="down"]')?.addEventListener("click", () => move(i, i + 1));

      return wrap;
    }

    function escapeAttr(s) {
      return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    }
    function escapeText(s) {
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    }

    let currentTiles = [];

    function render(tiles) {
      currentTiles = tiles;
      list.innerHTML = "";
      if (!tiles.length) {
        list.innerHTML = '<p class="empty-note">No tiles yet — add one below.</p>';
        return;
      }
      tiles.forEach((t, i) => list.appendChild(tileCard(t, i, tiles.length)));
    }

    async function move(i, j) {
      if (j < 0 || j >= currentTiles.length) return;
      const order = currentTiles.map((t) => t.id);
      [order[i], order[j]] = [order[j], order[i]];
      const res = await fetch("/api/tiles/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order }),
      });
      const data = await res.json();
      if (res.ok) render(data.tiles);
    }

    addBtn.addEventListener("click", async () => {
      addStatus.textContent = "";
      addStatus.className = "status-msg";
      const payload = {
        name: document.getElementById("newName").value,
        href: document.getElementById("newHref").value,
        desc: document.getElementById("newDesc").value,
        tag: document.getElementById("newTag").value,
      };
      try {
        const res = await fetch("/api/tiles", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "couldn't add tile");
        document.getElementById("newName").value = "";
        document.getElementById("newHref").value = "";
        document.getElementById("newDesc").value = "";
        document.getElementById("newTag").value = "";
        addStatus.textContent = "Added.";
        addStatus.className = "status-msg ok";
        render(data.tiles);
      } catch (err) {
        addStatus.textContent = err.message;
        addStatus.className = "status-msg err";
      }
    });

    (async function () {
      const res = await fetch("/api/tiles");
      const data = await res.json();
      render(data.tiles);
    })();
  </script>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const db = env.DB;

    if (url.pathname === "/api/tiles" && request.method === "GET") return handleListTiles(db);
    if (url.pathname === "/api/tiles" && request.method === "POST") return handleCreateTile(db, request);
    if (url.pathname === "/api/tiles/reorder" && request.method === "POST") return handleReorderTiles(db, request);
    if (url.pathname.startsWith("/api/tiles/") && request.method === "PUT") {
      return handleUpdateTile(db, request, url.pathname.slice("/api/tiles/".length));
    }
    if (url.pathname.startsWith("/api/tiles/") && request.method === "DELETE") {
      return handleDeleteTile(db, url.pathname.slice("/api/tiles/".length));
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(page(), { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    if (url.pathname === "/admin" || url.pathname === "/admin.html") {
      return new Response(adminPage(), { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    return new Response("Not found", { status: 404 });
  },
};
