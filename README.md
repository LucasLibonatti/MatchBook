# MatchBook

> Descubra seu próximo livro favorito com curadoria de Inteligência Artificial e mecânica de *swipe*.

[![CI](https://github.com/LucasLibonatti/MatchBook/actions/workflows/ci.yml/badge.svg)](https://github.com/LucasLibonatti/MatchBook/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)

## Sobre o Projeto

O **MatchBook** é uma aplicação web de descoberta literária inspirada em mecânicas de *swipe*. A partir de **3 livros-base** escolhidos pelo leitor, o motor híbrido analisa o perfil temático e estilístico da seleção e recomenda **10 obras reais** com percentual de afinidade, justificativa personalizada (*"Por que combina com você"*) e capas em alta definição.

### Principais Funcionalidades
- **Onboarding inteligente:** busca combinada no acervo curado local + **Google Books API** + **Open Library API** com deduplicação e opção *Surpreenda-me*.
- **Arena de Swipe 60fps:** gestos fluidos com **Framer Motion**, botões dedicados, **Desfazer (Undo)** real e atalhos globais de teclado (`←`, `→`, `Z`/`Backspace`, `Espaço`, `Esc`).
- **Curadoria IA no Servidor:** backend serverless em **Hono** (Vercel Functions) consultando a **Groq API** (`llama-3.3-70b-versatile`) com regras estritas de coerência temática e fallback local automático.
- **Biblioteca Pessoal:** salve seus matches, filtre por título/autor/gênero, ordene por afinidade ou data e abra links diretos na Amazon ou Google Books.
- **Design Editorial & Acessibilidade:** modo claro/escuro sincronizado, `ErrorBoundary` global, *focus trap* nos modais e capas editoriais geradas proceduralmente quando a obra não possui imagem.

---

## Stack Tecnológica

| Camada | Tecnologias |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS v4, Framer Motion, Lucide Icons |
| **Backend Serverless** | Hono em entrypoint único na Vercel (`api/index.ts` + `server/`) |
| **Inteligência Artificial** | Groq API (`llama-3.3-70b-versatile` com fallback `llama-3.1-8b-instant`) executada exclusivamente no servidor |
| **Catálogo & Capas** | Google Books API + Open Library API (proxy no servidor com cache local de 30 dias) |
| **Qualidade & CI** | Vitest, Oxlint, GitHub Actions CI, `qa-check.ps1` |

---

## Arquitetura

```text
matchBook/
├── api/
│   └── index.ts                 # Entrypoint único Vercel Functions (Hono)
├── server/
│   ├── app.ts                   # Roteador Hono (/api/health, /api/recommendations, /api/books/*)
│   ├── dev.ts                   # Servidor local de desenvolvimento (porta 3001)
│   └── routes/
│       ├── recommendations.ts   # Curadoria Groq + coerência temática + normalização
│       └── books.ts             # Busca e capas (Google Books + Open Library)
├── src/
│   ├── context/                 # MatchBookContext (estado global sincronizado)
│   ├── components/              # Header, Onboarding, SwipeArena, BookCard, MatchesLibrary, Toast, ErrorBoundary
│   ├── services/                # Clientes HTTP para /api/* + fallback local
│   ├── data/                    # Acervo curado local
│   ├── utils/                   # Persistência localStorage
│   └── __tests__/               # Testes unitários (Vitest)
├── .github/workflows/ci.yml     # Pipeline CI (lint + test + build)
└── vercel.json                  # Rewrites de API/SPA + headers CSP/HSTS
```

---

## Como Rodar Localmente

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```
   Preencha `GROQ_API_KEY` (e opcionalmente `GOOGLE_BOOKS_API_KEY`) no `.env`.

3. **Inicie frontend + API Hono juntos:**
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - API Hono: `http://localhost:3001/api/health`

4. **Validação completa (Lint + Testes + Build):**
   ```bash
   npm run lint
   npm test
   npm run build
   ```

---

## Deploy na Vercel

Configure as variáveis de ambiente no painel da Vercel (sem prefixo `VITE_`):
- `GROQ_API_KEY`
- `GOOGLE_BOOKS_API_KEY` *(opcional)*

O `vercel.json` já roteia `/api/*` para `api/index.ts` e aplica headers de segurança (`CSP`, `HSTS`, `X-Frame-Options`, `X-Content-Type-Options`).

---

## Licença

Distribuído sob a licença **MIT**. Veja [LICENSE](LICENSE) para mais detalhes.
