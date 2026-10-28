<div align="center">
  <img src="src/public/logo.webp" width="96" alt="Logo do FM Blog">

  # FM Blog

  *Blog de tecnologia com autenticação, editor rich text e comentários em tempo real*

  [![Deploy](https://img.shields.io/badge/deploy-fm--blog.vercel.app-000000?style=flat-square&logo=vercel&logoColor=white)](https://fm-blog.vercel.app)
  [![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=white)](https://react.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
  [![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)

  [Funcionalidades](#funcionalidades) • [Stack](#stack) • [Rodando localmente](#rodando-localmente) • [Scripts](#scripts) • [Rotas](#rotas) • [Testes](#testes)
</div>

Um blog completo de tecnologia construído com React 18, TypeScript e Firebase. Usuários podem se cadastrar, publicar posts com editor rich text, comentar em threads, curtir e salvar conteúdo. O projeto inclui dashboard com métricas, busca com filtros, tema claro/escuro e regras de segurança no Firestore.

O FM Blog foi desenvolvido como projeto de portfólio front-end, priorizando arquitetura em componentes, tipagem estrita, testes automatizados e deploy contínuo.

> [!NOTE]
> A versão publicada está em [fm-blog.vercel.app](https://fm-blog.vercel.app).

## Funcionalidades

### Conteúdo

- Criação e edição de posts com editor rich text (TipTap) e upload de capa no Cloudinary
- Tags, tempo estimado de leitura e contador de visualizações com janela de 24h
- Paginação, posts relacionados e compartilhamento

### Comentários

- Comentários e respostas em threads, com curtidas
- Atualização em tempo real via `onSnapshot` do Firestore
- Paginação "carregar mais", limite de 500 caracteres e validação com Zod

### Conta e autenticação

- Login com e-mail/senha e com Google
- Recuperação de senha e rotas protegidas (`PrivateRoute` e `PublicRoute`)
- Perfil editável com upload de foto
- Encerramento automático de sessão por inatividade

### Dashboard

- Listagem dos posts do autor com busca, filtros e ordenação
- Métricas de visualizações e curtidas por post
- Exclusão individual e em lote com confirmação

### Descoberta

- Busca por título com debounce de 300 ms
- Filtros avançados, tags populares e posts salvos

### Interface

- Tema claro/escuro persistido no Firestore por usuário
- Layout responsivo (mobile, tablet e desktop), skeletons, empty states e animações com Framer Motion
- Página 404 personalizada e notificações com Sonner

## Stack

| Camada | Tecnologias |
| --- | --- |
| Interface | React 18, TypeScript 5, Tailwind CSS 3, shadcn/ui, Framer Motion, React Icons |
| Roteamento e dados | React Router 6, TanStack Query 5 |
| Formulários e validação | React Hook Form, Zod |
| Conteúdo | TipTap 3, DOMPurify, tocbot |
| Backend (BaaS) | Firebase 10 (Authentication + Firestore), Cloudinary |
| Build e qualidade | Vite 5, Biome 1.9, Vitest |

## Pré-requisitos

- Node.js 18 ou superior
- pnpm 10 (`corepack enable` para ativar)
- Projeto Firebase com Authentication (e-mail/senha e Google) e Firestore habilitados
- Conta Cloudinary com um upload preset **unsigned**

## Configuração

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env.local
```

| Variável | Origem |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Console do Firebase → Configurações do projeto |
| `VITE_FIREBASE_AUTH_DOMAIN` | Console do Firebase → Configurações do projeto |
| `VITE_FIREBASE_PROJECT_ID` | Console do Firebase → Configurações do projeto |
| `VITE_FIREBASE_STORAGE_BUCKET` | Console do Firebase → Configurações do projeto |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Console do Firebase → Configurações do projeto |
| `VITE_FIREBASE_APP_ID` | Console do Firebase → Configurações do projeto |
| `VITE_CLOUDINARY_CLOUD_NAME` | Dashboard do Cloudinary |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary → Settings → Upload → Upload presets |
| `VITE_RECAPTCHA_SITE_KEY` | App Check → Firestore → reCAPTCHA v3 (opcional) |
| `VITE_APPCHECK_DEBUG_TOKEN` | Token de debug do App Check, só em desenvolvimento (opcional) |

> [!IMPORTANT]
> Variáveis com prefixo `VITE_` são embutidas no bundle do cliente. Use apenas as chaves públicas do Firebase e um preset unsigned do Cloudinary — nunca credenciais administrativas.

As regras e os índices do Firestore estão versionados em `firestore.rules` e `firestore.indexes.json`. Publique as regras com:

```bash
firebase deploy --only firestore:rules
```

Antes de publicar, rode `pnpm test:rules`: são 53 cenários contra o emulador, cobrindo a permissão de publicar (custom claim `author`), comentários, curtidas, salvos e visualizações. Os índices mudam com menos frequência e merecem um deploy próprio (`--only firestore:indexes`) — o Firebase recalcula índices ao subir esse alvo, o que pode demorar e custar leitura.

### App Check

Sem `VITE_RECAPTCHA_SITE_KEY` o App Check não é inicializado e nada muda. Para ativar:

1. Console do Firebase → App Check → Firestore → reCAPTCHA v3 → registrar o app web.
2. Copiar a chave e definir `VITE_RECAPTCHA_SITE_KEY` no `.env.local` e na Vercel.
3. Deixar a exigência em **monitoramento** por alguns dias, conferindo a proporção de tráfego verificado.
4. Só então marcar como exigido.

### Backup

```bash
pnpm backup
```

Grava `backups/firestore-<data>.json` com todas as coleções, usando a credencial do Firebase CLI já autenticado. Não usa export para Cloud Storage, então funciona no plano Spark. O arquivo é ignorado pelo git — copie para fora da máquina se quiser durabilidade. Não há restauração automática.

## Rodando localmente

```bash
# Instalar dependências
pnpm install

# Iniciar o servidor de desenvolvimento (abre o navegador)
pnpm dev
```

A aplicação fica disponível em `http://localhost:5173`.

Para validar o build de produção:

```bash
pnpm build
pnpm preview
```

## Scripts

| Comando | Descrição |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento com hot reload |
| `pnpm build` | Build de produção em `dist/` |
| `pnpm preview` | Pré-visualiza o build de produção |
| `pnpm lint` | Lint com Biome em `src/` |
| `pnpm lint:fix` | Lint com correções automáticas |
| `pnpm format` | Formatação com Biome |
| `pnpm check` | Lint, formatação e organização de imports |
| `pnpm test` | Testes unitários (Vitest, modo watch) |
| `pnpm test:run` | Testes unitários em execução única |
| `pnpm test:ui` | Interface gráfica do Vitest |

## Rotas

| Rota | Página | Acesso |
| --- | --- | --- |
| `/` | Home | Pública |
| `/about` | About | Pública |
| `/posts/:id` | Post | Pública |
| `/search` | Search | Pública |
| `/resetPassword` | ResetPassword | Pública |
| `/login` | Login | Apenas visitantes |
| `/register` | Register | Apenas visitantes |
| `/posts/create` | CreatePost | Autenticado |
| `/posts/edit/:id` | EditPost | Autenticado |
| `/dashboard` | Dashboard | Autenticado |
| `/profile` | Profile | Autenticado |
| `/saved` | SavedPosts | Autenticado |
| `*` | NotFound | Pública |

Todas as páginas são carregadas com `React.lazy` e `Suspense`, com fallback de spinner.

## Estrutura do projeto

```
FM-Blog/
├── public/                  # robots.txt, sitemap.xml
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   └── ui/              # Primitivos shadcn/ui
│   ├── contexts/            # AuthContext e ColorModeContext
│   ├── firebase/            # Inicialização do Firebase
│   ├── hooks/               # Hooks de dados, formulário e sessão
│   ├── lib/
│   │   ├── api/             # Acesso a posts
│   │   ├── hooks/           # Queries do TanStack Query
│   │   ├── cloudinary.ts    # Upload de imagens
│   │   └── queryClient.ts   # Configuração do TanStack Query
│   ├── pages/               # Páginas da aplicação
│   ├── public/              # Logo
│   ├── schemas/             # Schemas de validação Zod
│   ├── tests/               # Testes unitários
│   └── utils/               # Constantes, datas, sanitização e sessão
├── firestore.rules          # Regras de segurança do Firestore
├── firestore.indexes.json   # Índices compostos
└── vercel.json              # Rewrites de SPA
```

O alias `@` aponta para `src/` (configurado em `vite.config.ts`).

## Testes

- **Unitários (Vitest + Testing Library)** em `src/tests/`: sanitização de HTML, schemas Zod (login, cadastro, posts, comentários e perfil), utilitários de segurança com rate limiting e busca avançada.

```bash
pnpm test:run      # unitários
```

## Deploy

O deploy principal é feito na **Vercel**, com rewrite de SPA configurado em `vercel.json` para que todas as rotas resolvam em `index.html`. O build roda `pnpm build` e publica a pasta `dist/`.

As variáveis de ambiente da seção [Configuração](#configuração) precisam ser cadastradas no painel do projeto.

## Segurança

- Regras do Firestore validam autoria, tipos e limites de tamanho em cada escrita (`firestore.rules`)
- Rate limiting de login com 5 tentativas por janela de 15 minutos, persistido no Firestore
- HTML dos posts sanitizado com DOMPurify antes da renderização
- Preferências, visualizações e posts salvos isolados por UID
- Sessão encerrada automaticamente após inatividade
- Cabeçalhos de segurança (CSP, HSTS, `X-Frame-Options`, `Permissions-Policy`) aplicados em produção via `vercel.json`

## Agradecimentos

- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [Firebase](https://firebase.google.com)
- [Cloudinary](https://cloudinary.com)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [TipTap](https://tiptap.dev)
- [TanStack Query](https://tanstack.com/query)
