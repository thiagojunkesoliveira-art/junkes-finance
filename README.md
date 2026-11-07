# Junkes Finance

Controle financeiro pessoal para Windows: saldo, gastos por categoria, resumo por dia, semana e mês, importação do extrato do Inter (OFX/CSV), projeção de investimentos e metas com plano de gastos e conselhos da IA.

Os dados ficam salvos só no computador. Use **Fazer backup** na capa de vez em quando.

## Instalar

Baixe o `Junkes-Finance-Setup-<versão>.exe` mais recente em **Releases** e abra.
Na primeira vez o Windows pode mostrar "O Windows protegeu o computador": clique em **Mais informações → Executar assim mesmo**.

Depois disso, o app se atualiza sozinho: ao abrir, ele procura uma versão nova, baixa e pergunta se você quer reiniciar.

## Conselhos da IA (Metas)

A aba **Metas** calcula quanto guardar por mês e sugere limites por categoria sem precisar de internet.
O botão **Pedir análise à IA** usa o Claude (Anthropic) e precisa de uma chave da API, criada em console.anthropic.com. A chave fica criptografada no computador (`chave-ia.bin` na pasta de dados do app) e cada análise é cobrada na conta da Anthropic.

São enviados apenas: totais por categoria, os 20 estabelecimentos com mais gastos e os dados da meta. O código fica em `app/ia.js`.

## Publicar uma nova versão

1. Faça as mudanças (a interface fica em `src/template.html` e `src/base.css`).
2. Aumente a versão em `package.json` (por exemplo `1.0.0` → `1.1.0`).
3. Envie para a branch `main`.

O GitHub Actions percebe o número novo, monta o instalador num Windows e publica em Releases com a tag `v1.1.0`. Os apps instalados recebem a atualização na próxima vez que abrirem. Se o número não mudar, nada é publicado.

## Estrutura

| Pasta / arquivo | O que é |
|---|---|
| `src/template.html` | Telas e lógica do app |
| `src/base.css` | Cores, fontes e estilos base |
| `assets/` | Logo e fonte Alice (funciona sem internet) |
| `app/main.js` | Janela do Windows e atualização automática |
| `app/ia.js` / `app/preload.js` | Conselhos da IA (Claude) e ponte segura com a página |
| `app/icon.ico` | Ícone do app |
| `build.js` | Gera `app/index.html` a partir de `src/` |
| `.github/workflows/release.yml` | Monta e publica o instalador quando a versão muda |

## Rodar no computador (desenvolvimento)

```bash
npm install
npm start
```
