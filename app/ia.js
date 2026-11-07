// Conselhos da IA (Claude) para as metas. Roda no processo principal:
// a chave da API nunca chega à página.
const { app, safeStorage } = require("electron");
const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk").default;

const MODELO = "claude-opus-5-5";
const arquivoChave = () => path.join(app.getPath("userData"), "chave-ia.bin");

function lerChave() {
  try {
    const dados = fs.readFileSync(arquivoChave());
    return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(dados) : null;
  } catch (e) { return null; }
}

function status() { return { temChave: !!lerChave(), criptografia: safeStorage.isEncryptionAvailable() }; }

function salvarChave(chave) {
  chave = String(chave || "").trim();
  if (!/^sk-ant-[\w-]{20,}$/.test(chave)) return { ok: false, erro: "Essa chave não parece uma chave da Anthropic. Ela começa com sk-ant-." };
  if (!safeStorage.isEncryptionAvailable()) return { ok: false, erro: "O Windows não liberou a criptografia para guardar a chave com segurança." };
  fs.writeFileSync(arquivoChave(), safeStorage.encryptString(chave));
  return { ok: true };
}

function removerChave() { try { fs.unlinkSync(arquivoChave()); } catch (e) {} return { ok: true }; }

const SISTEMA = `Você é o consultor financeiro do app Junkes Finance. Você recebe um resumo em JSON das finanças pessoais do usuário no Brasil (valores em reais) e uma meta que ele quer alcançar.

Escreva em português do Brasil, tratando o usuário por "você", de forma direta e prática. Baseie cada número no resumo recebido e não invente gastos, rendas ou estabelecimentos. Quando o histórico tiver poucos meses, diga isso em uma frase.

Use exatamente estas seções:
## Diagnóstico
Duas ou três frases: se a meta cabe no prazo, quanto ele precisa guardar por mês e quanto sobra hoje.
## O que mudar nos gastos
De 3 a 6 ações concretas, das que mais economizam para as que menos. Cada ação cita a categoria ou o estabelecimento, quanto gasta hoje por mês, o novo valor e a economia em R$. Comece pelos gastos variáveis (lazer, delivery, assinaturas, compras pequenas e repetidas) e só sugira mexer em gastos essenciais se não houver outra saída.
## Limites para este mês
Lista curta no formato "Categoria: R$ valor".
## Se não der
Só inclua esta seção quando os cortes não bastarem: proponha um prazo maior ou um valor mensal realista.

Escreva no máximo 350 palavras. Não indique produtos financeiros específicos e não prometa resultados. Use só markdown simples: títulos com ##, listas com - e **negrito**.`;

async function aconselhar(resumo) {
  const chave = lerChave();
  if (!chave) return { ok: false, erro: "Cadastre sua chave da API da Anthropic para usar a IA." };
  const cliente = new Anthropic({ apiKey: chave, timeout: 120000, maxRetries: 2 });
  try {
    const resp = await cliente.beta.messages.create({
      model: MODELO,
      max_tokens: 16000,
      output_config: { effort: "medium" },
      // Se o modelo recusar por engano, a API tenta de novo num modelo alternativo.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SISTEMA,
      messages: [{ role: "user", content: "Resumo das minhas finanças e da minha meta:\n\n" + JSON.stringify(resumo, null, 2) }]
    });
    if (resp.stop_reason === "refusal") return { ok: false, erro: "A IA não conseguiu responder a este pedido. Tente de novo mais tarde." };
    const texto = resp.content.filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    if (!texto) return { ok: false, erro: "A IA não devolveu nenhuma resposta. Tente de novo." };
    return { ok: true, texto, modelo: resp.model };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return { ok: false, erro: "A chave da API foi recusada. Confira se ela está correta e ativa." };
    if (e instanceof Anthropic.PermissionDeniedError) return { ok: false, erro: "Sua conta da Anthropic não tem acesso a este modelo." };
    if (e instanceof Anthropic.RateLimitError) return { ok: false, erro: "Muitos pedidos seguidos ou créditos esgotados. Espere um pouco ou confira seus créditos na Anthropic." };
    if (e instanceof Anthropic.APIConnectionTimeoutError) return { ok: false, erro: "A IA demorou demais para responder. Tente de novo." };
    if (e instanceof Anthropic.APIConnectionError) return { ok: false, erro: "Sem conexão com a internet. A IA precisa de internet para funcionar." };
    if (e instanceof Anthropic.APIError) return { ok: false, erro: `A IA respondeu com erro (${e.status}). Tente de novo mais tarde.` };
    return { ok: false, erro: "Não foi possível falar com a IA agora." };
  }
}

module.exports = { status, salvarChave, removerChave, aconselhar };
