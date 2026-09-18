// mazzen.dev — a hub of links to the subdomains. No backend, no state:
// this worker just serves one static page.

const TILES = [
  { name: "MTG Tracker", href: "https://mtg.mazzen.dev", desc: "Metashare tracker for the LGS." },
  { name: "Crane", href: "https://crane.mazzen.dev", desc: "Fold-your-own origami crane guide.", tag: "Not working well" },
  { name: "RPS", href: "https://rps.mazzen.dev", desc: "Rock, paper, scissors." },
  { name: "Show Tracker", href: "https://show.mazzen.dev", desc: "Track what you're watching." },
];

function page() {
  const tiles = TILES.map((t) => `
      <a class="tile" href="${t.href}">
        ${t.tag ? `<span class="tag">${t.tag}</span>` : ""}
        <div class="tile-name">${t.name}</div>
        <div class="tile-desc">${t.desc}</div>
        <div class="tile-link">${t.href.replace("https://", "")} &rarr;</div>
      </a>`).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>mazzen.dev</title>
<style>
  :root {
    --bg: #0a0e17;
    --panel: #131a28;
    --border: rgba(14, 165, 233, 0.2);
    --text: #e2e8f0;
    --muted: #94a3b8;
    --accent: #0ea5e9;
    --warn: #f59e0b;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    background: radial-gradient(circle at top right, #1a2333 0%, var(--bg) 60%);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
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
  .tag {
    position: absolute;
    top: 16px;
    right: 16px;
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
  footer { margin-top: 48px; color: var(--muted); font-size: 0.8rem; }
</style>
</head>
<body>
  <header>
    <h1>mazzen.dev</h1>
    <p>Pick a thing.</p>
  </header>
  <div class="grid">
    ${tiles}
  </div>
  <footer>mazzen.dev</footer>
</body>
</html>`;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(page(), { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    return new Response("Not found", { status: 404 });
  },
};
