// Monta app/index.html a partir de src/template.html, src/base.css e assets/.
const fs = require("fs");

let html = fs.readFileSync("src/template.html", "utf8")
  .replace("{{CSS}}", fs.readFileSync("src/base.css", "utf8"))
  .split("{{LOGO}}").join("logo.png");

// Fonte local (funciona sem internet)
html = html.replace(/<link rel="preconnect"[^>]*>\n/g, "")
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis[^>]*>\n/, "")
  .replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "")
  .replace("<style>\n", `<style>
@font-face { font-family: "Alice"; font-style: normal; font-weight: 400; font-display: swap; src: url("alice.woff2") format("woff2"); }
html, body { margin: 0; }
img { max-width: 100%; }
`);

// Backup (só no app: o navegador do Claude bloqueia downloads)
html = html.replace(/(<div class="notice" id="notice")/, `<div class="backup">
      <span>Seus dados ficam salvos neste computador.</span>
      <button class="ghost" type="button" id="bk-save">Fazer backup</button>
      <input type="file" id="bk-file" class="sr-only" accept=".json">
      <label class="ghost" for="bk-file" tabindex="0">Restaurar backup</label>
      <span class="versao" id="versao"></span>
    </div>
    $1`);
html = html.replace("/* ===== Telas ===== */", `.backup { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 10px 12px; color: var(--muted); font-size: 0.92rem; }
.backup .ghost { font-size: 0.92rem; }
.backup .versao { width: 100%; text-align: center; font-size: 0.8rem; }
/* ===== Telas ===== */`);
html = html.replace("/* Navegação entre telas */", `/* Backup */
const versaoApp = new URLSearchParams(location.search).get("v");
if (versaoApp) $("versao").textContent = "Versão " + versaoApp;
$("bk-save").addEventListener("click", () => {
  const dados = { app: "junkes-finance", versao: 2, criadoEm: new Date().toISOString(), lancamentos: txs, projecao: pj, metas, conselhos };
  const url = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url; a.download = "junkes-finance-backup-" + hojeIso + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
});
$("bk-file").addEventListener("change", async e => {
  const f = e.target.files[0]; e.target.value = "";
  if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (d.app !== "junkes-finance" || !Array.isArray(d.lancamentos)) throw new Error();
    const antes = txs, pjAntes = { ...pj };
    txs = d.lancamentos; if (d.projecao) Object.assign(pj, d.projecao);
    if (Array.isArray(d.metas)) { metas = d.metas; conselhos = d.conselhos || {}; metaSel = metas[0] ? metas[0].id : null; saveMetas(); }
    save(); render(); renderProj(); renderMetas();
    toast(d.lancamentos.length + " lançamentos restaurados do backup.", () => { txs = antes; Object.assign(pj, pjAntes); renderProj(); });
  } catch (err) { toast("Este arquivo não é um backup da Junkes Finance."); }
});

/* Navegação entre telas */`);

const doc = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; font-src 'self'">
${html}
</head>`.replace("</style>\n", "</style>\n</head>\n<body>\n").replace(/<\/head>$/, "</body>\n</html>\n");
fs.writeFileSync("app/index.html", doc);
fs.copyFileSync("assets/logo.png", "app/logo.png");
fs.copyFileSync("assets/alice.woff2", "app/alice.woff2");
console.log("index.html pronto");
