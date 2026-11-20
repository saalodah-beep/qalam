// يصنع لكل منشور صفحة صغيرة فيها عنوانه ومقتطفه، ليظهرا في معاينة الروابط (واتساب، إكس…)
// ثم ينقل القارئ إلى المقالة داخل المدونة.
import fs from "node:fs";
import path from "node:path";

const SITE = "https://sqalam.com/";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const { posts: raw = [] } = JSON.parse(fs.readFileSync(path.join(root, "posts.json"), "utf8"));

// يطابق assignIds في index.html: المعرّف الآلي = تاريخ النشر مختصرًا (YYMMDD)، و-2، -3 لما يتكرر في اليوم نفسه
const assignIds = list => { const used = new Set(list.map(p => p.id && String(p.id).trim()).filter(Boolean)); const sorted = [...list].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")) || String(a.title || "").localeCompare(String(b.title || ""))); for (const p of sorted) { if (p.id && String(p.id).trim()) continue; const base = String(p.date || "").replace(/-/g, "").slice(2) || "p"; let id = base, n = 2; while (used.has(id)) id = base + "-" + n++; used.add(id); p._id = id; } return list.map(p => ({ ...p, id: (p.id && String(p.id).trim()) || p._id })); };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clean = s => String(s || "").replace(/\*\*|\(\(|\)\)|^>\s*/gm, "").replace(/\s+/g, " ").trim();
const excerpt = p => { const t = clean(p.excerpt || String(p.body || "").replace(/^بسم الله الرحمن الرحيم\s*/, "")); return t.length > 180 ? t.slice(0, 180).replace(/\s\S*$/, "") + "…" : t; };
const posts = assignIds(raw.map(p => ({ ...p })));
const CATS = { maqalat: "مقالات", khawater: "خواطر", taamulat: "تأملات" };

const outDir = path.join(root, "p");
fs.rmSync(outDir, { recursive: true, force: true });
let n = 0;
for (const p of posts) {
  if (p.published === false) continue;
  const id = p.id;
  if (!/^[A-Za-z0-9_-]+$/.test(id)) continue;
  const url = `${SITE}p/${id}/`;
  const target = `../../#p-${id}`;
  const title = `${p.title} — قلم`;
  const desc = excerpt(p);
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="قَلَم — مدونة صالح بن عوده">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:locale" content="ar_AR">
<meta property="article:section" content="${esc(CATS[p.cat] || "")}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(p.title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="theme-color" content="#25352f">
<link rel="canonical" href="${esc(url)}">
<meta http-equiv="refresh" content="0; url=${esc(target)}">
<script>location.replace(${JSON.stringify(target)});</script>
</head>
<body style="font-family:serif;text-align:center;padding:3em 1em;background:#f7f4ec;color:#1d2622">
<p><a href="${esc(target)}">${esc(p.title)}</a></p>
</body>
</html>
`;
  fs.mkdirSync(path.join(outDir, id), { recursive: true });
  fs.writeFileSync(path.join(outDir, id, "index.html"), html);
  n++;
}
console.log(`built ${n} article pages`);
