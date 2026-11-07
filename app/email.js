// Importação automática: lê no Gmail os e-mails "Seu extrato está disponível" do Inter
// e devolve os anexos OFX/CSV para a página importar. Roda no processo principal.
const { app, safeStorage } = require("electron");
const fs = require("fs");
const path = require("path");
const { ImapFlow } = require("imapflow");
const { simpleParser } = require("mailparser");

const arq = nome => path.join(app.getPath("userData"), nome);
const REMETENTE = "no-reply@inter.co";
const DIAS = 45; // procura e-mails dos últimos 45 dias

function lerCred() {
  try {
    if (!safeStorage.isEncryptionAvailable()) return null;
    return JSON.parse(safeStorage.decryptString(fs.readFileSync(arq("email.bin"))));
  } catch (e) { return null; }
}
function lerVistos() { try { return JSON.parse(fs.readFileSync(arq("email-vistos.json"), "utf8")); } catch (e) { return []; } }
function gravarVistos(v) { fs.writeFileSync(arq("email-vistos.json"), JSON.stringify(v.slice(-500))); }

function status() {
  const c = lerCred();
  return { configurado: !!c, email: c ? c.email : "" };
}

function cliente(c) {
  return new ImapFlow({
    host: "imap.gmail.com", port: 993, secure: true,
    auth: { user: c.email, pass: c.senha },
    logger: false, socketTimeout: 60000, greetingTimeout: 20000
  });
}

function traduzErro(e) {
  if (e && e.authenticationFailed) return "O Gmail recusou o login. Confira o e-mail e a senha de app (16 letras, sem a senha normal da conta).";
  if (e && /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|ECONNRESET/.test(e.code || "")) return "Sem conexão com o Gmail. Confira a internet.";
  return "Não foi possível ler o e-mail agora. Tente de novo mais tarde.";
}

async function salvar(email, senha) {
  email = String(email || "").trim().toLowerCase();
  senha = String(senha || "").replace(/\s+/g, "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, erro: "Digite um e-mail válido." };
  if (senha.length < 16) return { ok: false, erro: "A senha de app do Google tem 16 letras. Copie a que o Google mostrou." };
  if (!safeStorage.isEncryptionAvailable()) return { ok: false, erro: "O Windows não liberou a criptografia para guardar a senha com segurança." };
  const c = cliente({ email, senha });
  try { await c.connect(); await c.logout(); }
  catch (e) { try { c.close(); } catch (_) {} return { ok: false, erro: traduzErro(e) }; }
  fs.writeFileSync(arq("email.bin"), safeStorage.encryptString(JSON.stringify({ email, senha })));
  return { ok: true };
}

function remover() {
  try { fs.unlinkSync(arq("email.bin")); } catch (e) {}
  return { ok: true };
}

let ocupado = false;
async function verificar() {
  const cred = lerCred();
  if (!cred) return { ok: false, erro: "A importação pelo e-mail não está configurada." };
  if (ocupado) return { ok: true, novos: [] };
  ocupado = true;
  const c = cliente(cred);
  try {
    await c.connect();
    const caixas = await c.list();
    const todos = caixas.find(b => b.specialUse === "\\All");
    const lock = await c.getMailboxLock(todos ? todos.path : "INBOX");
    const novos = [];
    try {
      const desde = new Date(Date.now() - DIAS * 86400000);
      const uids = (await c.search({ from: REMETENTE, subject: "extrato", since: desde }, { uid: true })) || [];
      const vistos = new Set(lerVistos());
      for (const uid of uids.slice(-15)) {
        const msg = await c.fetchOne(String(uid), { envelope: true, source: true }, { uid: true });
        if (!msg || !msg.source) continue;
        const id = (msg.envelope && msg.envelope.messageId) || `uid-${uid}`;
        if (vistos.has(id)) continue;
        const assunto = (msg.envelope && msg.envelope.subject) || "";
        if (!/extrato/i.test(assunto)) continue;
        const email = await simpleParser(msg.source);
        const anexos = (email.attachments || []).filter(a => /\.(ofx|csv)$/i.test(a.filename || ""));
        const escolhido = anexos.find(a => /\.ofx$/i.test(a.filename)) || anexos[0];
        if (!escolhido) { vistos.add(id); continue; }
        novos.push({ id, nome: escolhido.filename, data: (email.date || new Date()).toISOString(), base64: escolhido.content.toString("base64") });
      }
    } finally { lock.release(); }
    await c.logout();
    novos.sort((a, b) => a.data.localeCompare(b.data));
    return { ok: true, novos };
  } catch (e) {
    try { c.close(); } catch (_) {}
    return { ok: false, erro: traduzErro(e) };
  } finally { ocupado = false; }
}

function marcar(ids) {
  const v = lerVistos();
  (ids || []).forEach(id => { if (!v.includes(id)) v.push(id); });
  gravarVistos(v);
  return { ok: true };
}

module.exports = { status, salvar, remover, verificar, marcar };
