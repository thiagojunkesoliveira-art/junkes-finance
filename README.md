# Junkes Finance

Controle financeiro pessoal para Windows: saldo, gastos por categoria, resumo por dia, semana e mês, importação do extrato do Inter (OFX/CSV) e projeção de investimentos.

Os dados ficam salvos só no computador. Use **Fazer backup** na capa de vez em quando.

## Instalar

Baixe o `Junkes-Finance-Setup-<versão>.exe` mais recente em **Releases** e abra.
Na primeira vez o Windows pode mostrar "O Windows protegeu o computador": clique em **Mais informações → Executar assim mesmo**.

Depois disso, o app se atualiza sozinho: ao abrir, ele procura uma versão nova, baixa e pergunta se você quer reiniciar.

## Publicar uma nova versão

1. Faça as mudanças (a interface fica em `src/template.html` e `src/base.css`).
2. Aumente a versão em `package.json` (por exemplo `1.0.0` → `1.1.0`).
3. Crie e envie a tag da versão:

   ```bash
   git commit -am "Versão 1.1.0"
   git tag v1.1.0
   git push && git push --tags
   ```

O GitHub Actions monta o instalador num Windows e publica em Releases. Os apps instalados recebem a atualização na próxima vez que abrirem.

## Estrutura

| Pasta / arquivo | O que é |
|---|---|
| `src/template.html` | Telas e lógica do app |
| `src/base.css` | Cores, fontes e estilos base |
| `assets/` | Logo e fonte Alice (funciona sem internet) |
| `app/main.js` | Janela do Windows e atualização automática |
| `app/icon.ico` | Ícone do app |
| `build.js` | Gera `app/index.html` a partir de `src/` |
| `.github/workflows/release.yml` | Monta e publica o instalador a cada tag `v*` |

## Rodar no computador (desenvolvimento)

```bash
npm install
npm start
```
