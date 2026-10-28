# Alertas do Dependabot — correções por nível

Levantamento feito em **28/10/2026**, a partir de `/repos/FelipeMeloGomes/FM_Blog/dependabot/alerts`.
Commit de referência: `05d9acc`. Versões instaladas lidas do `pnpm-lock.yaml`.

**111 alertas abertos:** 6 críticos, 36 altos, 53 médios e 16 baixos.
Há ainda 2 alertas `auto_dismissed` que não entram na conta.

## Estado da aplicação (28/10/2026)

As quatro fases aplicadas localmente, **sem commit**:

| Fase | Estado | Efeito |
| --- | --- | --- |
| 1 — `pnpm update` | aplicada | fecha 63 alertas; atenção: o pnpm 10 **reescreve os ranges** no `package.json` para a versão resolvida |
| 2 — `pnpm.overrides` | aplicada | fecha 27 alertas (`undici` 6.29.1, `@grpc/grpc-js` 1.14.6, `postcss-selector-parser` 6.1.5) |
| 3 — majors de build/teste | aplicada | fecha 21 alertas: `vite` 6.4.5 + `esbuild` 0.25.12; `vitest` **4.1.12** |
| 4 — `react-router` 7 | aplicada | fecha os 2 últimos: `react-router-dom` 7.18.5 (traz `react-router` 7.18.5) |

**`vitest` ficou em 4.1.12, não em 3.2.7** (o alvo estimado nas tabelas). O Vitest 3 depende de `tinypool ^1.1.1`, e o único `tinypool` corrigido é 2.x — a correção exigiria override de major numa dependência interna, com risco de incompatibilidade de API. O Vitest 4 abandonou `tinypool` e `vite-node`, então os dois pacotes saíram da árvore e os 4 alertas fecharam sem override.

**A Fase 4 não estava prevista.** Dois advisories de `react-router` publicados em 28/10 às 17:02 UTC (`GHSA-337j-9hxr-rhxg` e `GHSA-wrjc-x8rr-h8h6`) têm correção **só em 7.18.0** — nenhuma 6.x. O `react-router-dom` 7 mantém a API declarativa usada no projeto (`BrowserRouter`, `Routes`, `Route`, `Link`, `Navigate`, `Outlet`, hooks), e o pacote `@remix-run/router` deixa de existir como dependência separada.

Verificação local: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test:run` (106 testes) e `pnpm build`, todos exit 0 — com Vite 6, Vitest 4 e React Router 7.

Auditoria final mecanizada: comparei as 111 faixas vulneráveis com as versões do `pnpm-lock.yaml` e **nenhuma versão instalada cai em faixa vulnerável**. Sete pacotes saíram da árvore (`markdown-it`, `linkify-it`, `tinypool`, `brace-expansion`, `minimatch`, `glob`, `@remix-run/router`).

Os alertas no GitHub só caem depois do push — o Dependabot reanalisa a branch padrão.

## Como ler as tabelas

| Coluna | Significado |
| --- | --- |
| **Instalado** | versão presente no `pnpm-lock.yaml` (pode haver mais de uma cópia) |
| **Corrigir para** | menor versão que fecha **todos** os alertas abertos daquele pacote |
| **Tipo** | `direto` = declarado no `package.json`; `transitivo` = vem de outro pacote |
| **Via** | quem puxa o pacote (primeiro nível da cadeia) |
| **Como** | `update` = cabe no range atual; `override` = exige `pnpm.overrides`; `major` = exige bump de major |
| **Alertas** | quantos alertas o pacote tem **neste nível**; parênteses = alertas em outros níveis |

## Crítico — 6 alertas

| Pacote | Instalado | Corrigir para | Tipo | Via | Como | Alertas |
| --- | --- | --- | --- | --- | --- | --- |
| `protobufjs` | 7.2.6 | **7.6.3** | transitivo | `@grpc/proto-loader` ← `@firebase/firestore` ← `firebase` | `update` | 1 (5 altos, 5 médios) |
| `tinypool` | 0.8.4 | **2.1.2** | transitivo | `vitest` | `major` (Vitest 4, que removeu a dependência) | 2 |
| `websocket-driver` | 0.7.4 | **0.7.5** | transitivo | `faye-websocket` ← `@firebase/database` | `update` | 1 (1 médio) |
| `vitest` | 1.6.1 | **4.1.12** | direto | devDependencies | `major` | 2 |

Os quatro vêm de duas frentes: o SDK do Firebase (`protobufjs`, `websocket-driver`) e a stack de teste (`vitest`/`tinypool`).

## Alto — 36 alertas

| Pacote | Instalado | Corrigir para | Tipo | Via | Como | Alertas |
| --- | --- | --- | --- | --- | --- | --- |
| `undici` | 6.19.7 | **6.29.1** | transitivo | `@firebase/auth`, `@firebase/firestore`, `@firebase/functions`, `@firebase/storage` (todos fixam versão exata) | `override` | 7 (10 médios, 4 baixos) |
| `dompurify` | 3.3.3 | **3.4.17** | direto | dependencies | `update` | 1 (10 médios, 6 baixos) |
| `vite` | 5.4.21 | **6.4.4** | direto | devDependencies | `major` | 2 (12 médios, 2 baixos) |
| `markdown-it` | 14.1.1 | **14.3.3** | transitivo | `prosemirror-markdown` ← `@tiptap/pm` | `update` | 2 (2 médios, 1 baixo) |
| `@grpc/grpc-js` | 1.9.15 | **1.13.6** | transitivo | `@firebase/firestore` (`~1.9.0`) | `override` | 3 (1 baixo) |
| `postcss` | 8.4.45 / 8.5.8 | **8.5.23** | direto | devDependencies | `update` | 2 (2 médios) |
| `brace-expansion` | 2.0.1 | **2.1.7** | transitivo | `minimatch` ← `glob` ← `sucrase` ← `tailwindcss` | `update` | 1 (1 médio) |
| `@tiptap/core` | 3.20.4 | **3.30.5** | direto | dependencies | `update` | 1 (1 médio) |
| `linkify-it` | 5.0.0 | **5.0.2** | transitivo | `markdown-it` | `update` | 2 |
| `zod` | 4.3.6 | **4.6.6** | direto | dependencies | `update` | 1 |
| `source-map-js` | 1.2.0 / 1.2.1 | **1.2.2** | transitivo | `postcss` | `update` | 1 |
| `prosemirror-view` | 1.41.7 | **1.42.3** | transitivo | `@tiptap/pm` | `update` | 1 |
| `nanoid` | 3.3.7 / 3.3.11 | **3.3.12** | transitivo | `postcss` | `update` | 1 |
| `browserslist` | 4.23.0 / 4.23.3 | **4.28.7** | transitivo | `autoprefixer`, `@babel/helper-compilation-targets` | `update` | 1 |
| `form-data` | 4.0.5 | **4.0.6** | transitivo | `jsdom` | `update` | 1 |
| `ws` | 8.20.0 | **8.21.0** | transitivo | `jsdom` | `update` | 1 |
| `minimatch` | 9.0.5 | **9.0.7** | transitivo | `glob` | `update` | 1 |
| `glob` | 10.4.5 | **10.5.0** | transitivo | `sucrase` ← `tailwindcss` | `update` | 1 |
| `braces` | 3.0.2 | **3.0.3** | transitivo | `chokidar`, `micromatch` ← `tailwindcss` | `update` | 1 |

Fora do `pnpm update` ficam apenas `undici` e `@grpc/grpc-js` (Firebase fixa as versões) e os majors `vite` e `react-router`.

Contribuem ainda para o total do nível: `protobufjs` (5), já listado em Crítico.

## Médio — 53 alertas

| Pacote | Instalado | Corrigir para | Tipo | Via | Como | Alertas |
| --- | --- | --- | --- | --- | --- | --- |
| `react-router` | 6.30.3 | **7.18.0** | transitivo | `react-router-dom` | `major` (2 dos 3 alertas não têm fix em 6.x) | 3 |
| `postcss-selector-parser` | 6.0.10 / 6.1.2 | **6.1.5** | transitivo | `@tailwindcss/typography` fixa `6.0.10`; `tailwindcss` usa `^6.0.11` | `override` | 1 (1 baixo) |
| `react-router-dom` | 6.30.3 | **7.18.5** | direto | dependencies | `major` | 1 |
| `@remix-run/router` | 1.23.2 | **1.23.3** | transitivo | `react-router` e `react-router-dom` (fixam `1.23.2`) | `update` (some no router 7) | 1 |
| `@protobufjs/utf8` | 1.1.0 | **1.1.1** | transitivo | `protobufjs` | `update` | 1 |
| `picomatch` | 2.3.1 | **2.3.2** | transitivo | `micromatch`, `anymatch`, `readdirp`, `@rollup/pluginutils` | `update` | 1 |
| `esbuild` | 0.21.5 | **0.25.0** | transitivo | `vite` (`^0.21.3`) | `major` (Vite 6) | 1 |

Além destes, contribuem para o total do nível: `undici` (10), `dompurify` (10), `vite` (12), `protobufjs` (5), `markdown-it` (2), `postcss` (2), `brace-expansion` (1), `@tiptap/core` (1), `websocket-driver` (1).

## Baixo — 16 alertas

| Pacote | Instalado | Corrigir para | Tipo | Via | Como | Alertas |
| --- | --- | --- | --- | --- | --- | --- |
| `@babel/core` | 7.24.4 | **7.29.6** | transitivo | `@vitejs/plugin-react` | `update` | 1 |

O restante do nível vem de `dompurify` (6), `undici` (4), `vite` (2), `markdown-it` (1), `@grpc/grpc-js` (1) e `postcss-selector-parser` (1).

## Plano de correção (4 fases)

### Fase 1 — `pnpm update` (63 alertas)

Respeita os ranges declarados — mas o pnpm 10 **reescreve esses ranges no `package.json`** para a versão resolvida (`--no-save` evita isso).

```bash
pnpm update
pnpm lint && pnpm exec tsc --noEmit && pnpm test:run && pnpm build
```

Resolve os 63 alertas de: `protobufjs`, `dompurify`, `postcss`, `websocket-driver`, `@tiptap/core`, `zod`, `source-map-js`, `prosemirror-view`, `nanoid`, `browserslist`, `form-data`, `ws`, `braces`, `react-router`, `react-router-dom`, `@remix-run/router`, `@protobufjs/utf8`, `picomatch`, `@babel/core`, `markdown-it`, `linkify-it`, `brace-expansion`, `minimatch`, `glob`.

Simulei em cópia isolada (`pnpm update --lockfile-only`, sem alterar o repositório) e o resultado foi:

| Pacote | Hoje | Depois do update |
| --- | --- | --- |
| `protobufjs` | 7.2.6 | 7.6.6 |
| `dompurify` | 3.3.3 | 3.4.17 |
| `postcss` | 8.4.45 / 8.5.8 | 8.5.32 |
| `@tiptap/core` | 3.20.4 | 3.32.0 |
| `zod` | 4.3.6 | 4.6.7 |
| `prosemirror-view` | 1.41.7 | 1.42.8 |
| `nanoid` | 3.3.7 / 3.3.11 | 3.3.20 |
| `browserslist` | 4.23.0 / 4.23.3 | 4.29.5 |
| `ws` | 8.20.0 | 8.22.0 |
| `react-router` / `react-router-dom` | 6.30.3 | 6.30.6 |
| `@remix-run/router` | 1.23.2 | 1.23.4 |
| `@babel/core` | 7.24.4 | 7.29.7 |
| `picomatch` | 2.3.1 | 2.3.2 |
| `websocket-driver` | 0.7.4 | 0.7.5 |
| `source-map-js` | 1.2.0 / 1.2.1 | 1.2.2 |
| `form-data` | 4.0.5 | 4.0.6 |
| `braces` | 3.0.2 | 3.0.3 |
| `@protobufjs/utf8` | 1.1.0 | 1.1.2 |

Cinco pacotes **saem da árvore** na simulação, e com eles os alertas:

- `markdown-it` e `linkify-it`: o `@tiptap/*` sobe de 3.20.4 para 3.32.0 e o `prosemirror-markdown` deixa de ser dependência. O projeto não usa markdown em `src/`.
- `glob`, `minimatch` e `brace-expansion`: o `sucrase` 3.35.1 troca o `glob` por `tinyglobby`.

Efeito colateral a validar: `@tiptap/core` 3.20 → 3.32 (minor) e `tailwindcss` 3.4.10 → 3.4.19. Rode build e testes antes de commitar.

### Fase 2 — overrides (27 alertas)

```json
"pnpm": {
  "overrides": {
    "undici": "^6.29.1",
    "@grpc/grpc-js": "^1.13.6",
    "postcss-selector-parser": "^6.1.5"
  }
}
```

| Pacote | Por que não basta o update | Risco |
| --- | --- | --- |
| `undici` | o Firebase fixa `6.19.7` **exato** em 5 pacotes | Firestore/Auth usam undici no Node; testar login e leitura de posts |
| `@grpc/grpc-js` | `@firebase/firestore` pede `~1.9.0` | transporte gRPC do Firestore; só afeta ambiente Node |
| `postcss-selector-parser` | `@tailwindcss/typography` fixa `6.0.10` | usado no build do Tailwind |

Alternativa estrutural: subir o **Firebase 10 → 11/12** (o 10 está fora de suporte). Isso traz `undici`, `protobufjs` e `@grpc/grpc-js` corrigidos sem override, mas é uma migração maior.

### Fase 3 — majors (21 alertas)

| Pacote | Hoje | Aplicado | Alertas que fecha |
| --- | --- | --- | --- |
| `vite` | 5.4.21 | **6.4.5** (traz `esbuild` 0.25.12) | 16 de `vite` + 1 de `esbuild` |
| `vitest` | 1.6.1 | **4.1.12** | 2 de `vitest` + 2 de `tinypool` |

O `vite 5 → 6` também está no PR #1 (que soma `react-router 6 → 7`); ele vai precisar de `@dependabot rebase` depois deste trabalho.

Vitest 3 não resolvia: `tinypool` 1.1.1 continua vulnerável e o fix exige 2.x. Ir para 3 só trocaria 2 alertas por um override arriscado. O Vitest 4 removeu `tinypool` e `vite-node` da árvore — solução limpa.

### Fase 4 — `react-router` 7 (2 alertas)

Descoberta depois das outras fases: dois advisories publicados em 28/10 às 17:02 UTC não têm correção em nenhuma 6.x.

| Advisory | Pacote | Faixa | Corrigido em |
| --- | --- | --- | --- |
| `GHSA-337j-9hxr-rhxg` — constructor injection em `deserializeErrors()` | `react-router` | `>= 6.4.0, < 7.18.0` | **7.18.0** |
| `GHSA-wrjc-x8rr-h8h6` — open redirect via backslash em `<Link>`/`useNavigate` | `react-router` | `>= 6.0.0, < 7.18.0` | **7.18.0** |

Aplicado `react-router-dom` **7.18.5** (traz `react-router` 7.18.5). O uso no projeto é só a API declarativa v6 — `BrowserRouter`, `Routes`, `Route`, `Link`, `Navigate`, `Outlet`, `useNavigate`, `useParams`, `useLocation`, `useSearchParams` —, toda presente no shim `react-router-dom@7`. `tsc`, lint, testes e build passaram sem nenhum ajuste de código.

## Risco real neste projeto

Nível do alerta não é o mesmo que exposição. O que verifiquei:

| Pacote | Onde aparece | Leitura |
| --- | --- | --- |
| `dompurify` | **no bundle** (`src/utils/sanitize.ts`) | usa `sanitize(string, config)` com `ALLOWED_TAGS`/`ALLOWED_ATTR` fixos. Não usa `IN_PLACE`, hooks, `CUSTOM_ELEMENT_HANDLING`, `SAFE_FOR_TEMPLATES` nem `RETURN_DOM` — que são o alvo de quase todos os 17 avisos. Ainda assim, a correção é gratuita |
| `prosemirror-view` | **no bundle** | XSS no tratamento de colar do editor: chega ao usuário que cola conteúdo. Corrigir |
| `vite`, `esbuild` | build/dev server | ataques exigem o dev server exposto. Não afetam produção |
| `protobufjs`, `@grpc/grpc-js`, `undici`, `websocket-driver` | **ausentes** do `dist/` | caminhos Node do Firebase, não entram no bundle web |
| `postcss`, `nanoid`, `source-map-js`, `braces`, `glob`, `minimatch` | build | execução em tempo de build |
| `jsdom`, `form-data`, `ws`, `vitest`, `tinypool` | testes | só rodam em desenvolvimento/CI |

A busca no `dist/` é textual; serve como indício forte de tree-shaking, não como prova formal.

## O alerta sem correção

`dompurify` #64 (`GHSA-x4vx-rjvf-j5p4`, baixo): `IN_PLACE` confia em `nodeName` controlado pelo atacante. Na data do levantamento não havia versão corrigida e o projeto não usa `IN_PLACE`.

**Resolvido na prática:** a faixa vulnerável é `<= 3.4.6` e a Fase 1 instalou 3.4.17 — o alerta sai na próxima análise do Dependabot, mesmo sem advisory de correção publicado.

## Como regenerar este relatório

Com o servidor MCP do GitHub conectado:

```
list_dependabot_alerts(owner="FelipeMeloGomes", repo="FM_Blog", perPage=100, state="open")
```

Ou pela API direta:

```bash
gh api "repos/FelipeMeloGomes/FM_Blog/dependabot/alerts?state=open&per_page=100" \
  --jq '.[] | [.number, .dependency.package.name, .security_advisory.severity, .security_vulnerability.vulnerable_version_range, (.security_vulnerability.first_patched_version.identifier // "sem fix")] | @tsv'
```

## Observações

- Alerta **não** é PR. Os PRs abertos são *version updates* do `dependabot.yml`; *security updates* só aparecem com o toggle ligado em **Settings → Code security**.
- `pnpm update` respeita os ranges do `package.json`; não troca major. Por isso `vite` e `vitest` ficam de fora.
- Não subir para pnpm 12: o lockfile em documento único é o que o Dependabot lê para os alertas.
