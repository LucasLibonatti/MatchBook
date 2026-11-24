# MATCHBOOK — MASTER ENGINEERING & DESIGN SPECIFICATION (ONE-SHOT REBUILD)

Você atuará como **Principal Frontend Architect e Staff Design Engineer** (nível Linear, Literal.club, Read.cv, Stripe Press e Apple Books). Sua missão é refatorar e reconstruir a aplicação **MatchBook** de ponta a ponta em uma única execução, eliminando todos os bugs existentes e entregando um produto final impecável, fluido a 120 FPS, com estética editorial autêntica (zero aparência de template genérico de IA).

O arquivo `.env` já existe na raiz do projeto contendo `VITE_GROQ_API_KEY` e `VITE_GOOGLE_BOOKS_API_KEY`.

Siga rigorosamente todas as diretrizes arquiteturais, visuais e de código abaixo.

---

## 1. DIAGNÓSTICO DOS PROBLEMAS ATUAIS (O QUE VOCÊ DEVE ELIMINAR)

1. **Bug da Busca no Onboarding:** O dropdown de busca falhava por três motivos: (a) conflito de `onBlur` no `<input>` fechando o menu antes do `onClick` do item registrar; (b) excesso de chamadas simultâneas gerando HTTP `429 Too Many Requests` na Google Books API; (c) containers pais com `overflow-hidden` cortando o menu suspenso.
2. **Lag e Queda de FPS nas Animações:** O uso de `useState` dentro de eventos `onDrag` e a presença de classes CSS `transition-all` / `transition-transform` no mesmo elemento `<motion.div>` do Framer Motion causavam recálculo de layout a cada frame.
3. **Capas em Baixa Qualidade ou Quebradas:** As URLs da Google Books vinham em `http://` com `zoom=1` (128px borrado) e `&edge=curl`, e livros sem capa exibiam caixas laranjas vazias.
4. **Dark Mode / Light Mode Quebrado:** O Tailwind v4 não aplicava as variantes `dark:` corretamente por falta da diretiva `@custom-variant dark` e de variáveis CSS semânticas no `index.css`.
5. **Problemas Críticos de UX:**
   - No modal "Minha Biblioteca", o botão de fechar (`X`) estava posicionado com `fixed` no canto do monitor, longe do cabeçalho do modal.
   - Depois de entrar na arena de swipe, o usuário ficava preso e não tinha um botão para **trocar os 3 livros favoritos** sem perder os matches já salvos.

---

## 2. ARQUITETURA DE PASTAS E ARQUIVOS

Estruture e limpe o projeto mantendo exatamente esta organização em `src/`:

```text
src/
├── components/
│   ├── EditorialCover.tsx     # Capa tipográfica estilo Penguin/Companhia das Letras (fallback visual)
│   ├── Header.tsx             # Navbar editorial fixa com Trocar Livros, Tema (Sol/Lua) e Biblioteca
│   ├── Onboarding.tsx         # Seleção dos 3 livros com busca híbrida 0ms + Google Books
│   ├── SwipeArena.tsx         # Arena 120 FPS com MotionValues, Undo, atalhos e Empty State
│   ├── BookCard.tsx           # Card físico 3D da capa + sinopse expansível + Match Reason da Groq
│   └── MatchesLibrary.tsx     # Modal centralizado com Header interno, busca, detalhes e links
├── data/
│   └── curatedBooks.ts        # Catálogo local instantâneo (40 clássicos e best-sellers com capas HD)
├── services/
│   ├── groqService.ts         # Motor de IA (Groq API) que retorna 10 livros + % match + sinopse + razão
│   └── bookCoverService.ts    # Busca de capas HD (Google Books + Open Library fallback + Cache)
├── types/
│   └── book.ts                # Contratos TypeScript estritos
├── utils/
│   └── storage.ts             # Persistência localStorage tipada (matches, seeds, swipes, theme, cache)
├── App.tsx                    # Orquestração de estado global, tema e modais
├── main.tsx                   # Entry point
└── index.css                  # Design tokens CSS, suporte Tailwind v4 dark mode e efeitos 3D de livro
```

---

## 3. DIREÇÃO DE ARTE E CSS ("ANTI-IA" / ESTÉTICA EDITORIAL TÁTIL)

Não use gradientes neon exagerados nem cartões genéricos. Inspire-se em **Literal.club**, **Read.cv** e **Stripe Press**.

### 3.1. Tipografia Editorial (`index.html`)
Importe no `<head>` do `index.html` as fontes do Google Fonts:
- **Display / Títulos de Livros:** `'Instrument Serif'` (pesos 400 e 400 italic) — traz alma literária imediata.
- **UI e Leitura:** `'Plus Jakarta Sans'` (pesos 400, 500, 600, 700).
- **Dados Numéricos, `% MATCH` e Metadados:** `'JetBrains Mono'` (pesos 500, 600).

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### 3.2. Sistema de Cores Dual Theme à Prova de Falhas (`src/index.css`)
Para funcionar perfeitamente no Tailwind v4 e v3 sem nenhum bug de compilação, configure o `src/index.css` com `@custom-variant dark (&:where(.dark, .dark *));` e defina variáveis CSS semânticas no `:root` e em `html.dark`:

- **Light Mode ("Warm Editorial Paper"):**
  - `--bg-canvas`: `#F7F4EF` (papel pólen creme suave — nunca branco puro estéril)
  - `--bg-surface`: `#FFFFFF`
  - `--bg-elevated`: `#F0ECE3`
  - `--border-subtle`: `#E5DFD3`
  - `--text-primary`: `#161514`
  - `--text-secondary`: `#5C5852`
  - `--text-muted`: `#8C867B`
  - `--accent-primary`: `#EA580C` (Laranja Editorial Terracota)
  - `--accent-hover`: `#C2410C`
  - `--accent-soft`: `rgba(234, 88, 12, 0.10)`

- **Dark Mode ("Obsidian Reading Room"):**
  - `--bg-canvas`: `#0A0A0C` (Obsidian profundo)
  - `--bg-surface`: `#131317`
  - `--bg-elevated`: `#1C1C22`
  - `--border-subtle`: `#272730`
  - `--text-primary`: `#F5F3EF`
  - `--text-secondary`: `#A19E97`
  - `--text-muted`: `#6E6B65`
  - `--accent-primary`: `#F97316`
  - `--accent-hover`: `#FB923C`
  - `--accent-soft`: `rgba(249, 115, 22, 0.14)`

### 3.3. Acabamento Físico de Livro (`.book-cover-frame`)
Crie no `src/index.css` uma classe `.book-cover-frame` para que toda capa de livro pareça um objeto físico real:
- Proporção `aspect-[2/3]`, `border-radius: 4px 12px 12px 4px`.
- Sombra interna simulando o vinco da lombada à esquerda:
  `box-shadow: inset 6px 0 12px rgba(0, 0, 0, 0.28), inset 1px 0 2px rgba(255, 255, 255, 0.25), 0 16px 32px -8px rgba(0, 0, 0, 0.28);`

---

## 4. CONTRATOS TYPESCRIPT (`src/types/book.ts`)

Defina tipos limpos e unificados:

```typescript
export interface SeedBook {
  id: string;
  title: string;
  author: string;
  publishedYear?: string | number;
  categories: string[];
  coverUrl?: string;
  isbn?: string;
}

export interface BookRecommendation {
  id: string;
  title: string;
  originalTitle?: string;
  author: string;
  publishedYear: number | string;
  pageCount: number;
  categories: string[];
  matchPercentage: number; // 84 a 99
  synopsis: string;        // Sinopse rica gerada pela Groq
  matchReason: string;     // Explicação personalizada gerada pela Groq
  coverUrl?: string;       // Preenchido pelo bookCoverService (Google Books HD)
  previewLink?: string;
  infoLink?: string;
  isbn?: string;
}
```

---

## 5. INTEGRAÇÃO DAS APIs (GROQ + GOOGLE BOOKS + FALLBACKS)

### 5.1. Motor de Recomendação com Groq API (`src/services/groqService.ts`)
- Leia `const GROQ_API_KEY = (import.meta.env.VITE_GROQ_API_KEY || '').trim();`.
- Faça uma requisição `POST` para `https://api.groq.com/openai/v1/chat/completions`.
- **Modelo primário:** `llama-3.3-70b-versatile`. Se retornar status 429 ou 503, tente imediatamente com `llama-3.1-8b-instant`.
- Configure `response_format: { type: "json_object" }`, `temperature: 0.72`, `max_tokens: 3500`.
- **Prompt do Sistema para a Groq:**
  - Instrua o modelo a atuar como um curador literário de elite.
  - Receba os 3 `seedBooks` escolhidos pelo usuário e a lista `excludeTitles` (livros já avaliados ou já escolhidos nos 3 slots).
  - Retorne um objeto JSON `{ "recommendations": [ ... ] }` contendo **exatamente 10 livros reais e consagrados** (nunca invente livros fictícios).
  - Cada item deve conter:
    - `title`: Título em português (como publicado no Brasil).
    - `originalTitle`: Título no idioma original (para facilitar busca de capa se necessário).
    - `author`: Nome do autor principal.
    - `publishedYear`: Ano de lançamento original.
    - `pageCount`: Número aproximado de páginas.
    - `categories`: Array com 2 ou 3 gêneros/temas curtos em português.
    - `matchPercentage`: Inteiro entre `85` e `99`, ordenado do maior para o menor conforme afinidade real com os 3 livros base.
    - `synopsis`: Sinopse envolvente, literária e sem spoilers em português (entre 280 e 440 caracteres).
    - `matchReason`: 1 frase curta e perspicaz citando explicitamente pelo menos um dos 3 livros escolhidos pelo usuário (exemplo: *"Combina a tensão psicológica de Dom Casmurro com a construção de mundo imersiva de Duna"*).
    - `isbn`: ISBN-13 conhecido da obra (string).

### 5.2. Serviço de Capas HD e Busca com Google Books API (`src/services/bookCoverService.ts`)
- Leia `const GOOGLE_BOOKS_KEY = (import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || '').trim();`.
- **Cache Persistente de Capas:** Salve todas as URLs de capas resolvidas em `localStorage` (`matchbook_covers_cache_v3`) indexadas por `slug(title + author)`. Se já estiver no cache, retorne em `0ms` sem gastar cota da API.
- **Função `upgradeGoogleBookCover(rawUrl: string): string`:**
  1. Substitua `http://` por `https://`.
  2. Remova `&edge=curl`.
  3. Mantenha `zoom=1` e adicione `&fife=w800-h1200` ao final da URL caso seja um link `books.google.com/books/content`. Isso instrui o servidor de imagens do Google a retornar a capa em alta resolução (800x1200px) em vez da miniatura borrada de 128px.
- **Resiliência Total na Google Books API (Anti-403 / Anti-429):**
  - Crie um helper `fetchGoogleVolumes(queryParams: string, signal?: AbortSignal)`:
    1. Tente primeiro passando `&key=${GOOGLE_BOOKS_KEY}` (se a chave existir).
    2. Se a resposta for `!res.ok` (ex: 400, 403 ou 429), refaça automaticamente a chamada **sem o parâmetro `&key=`** (usando a cota pública da Google Books).
    3. Se ainda assim falhar ou não retornar `imageLinks`, consulte automaticamente a API gratuita da **Open Library**:
       `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=1`
       e, se houver `cover_i`, retorne `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`.
- **Hidratação Paralela Controlada dos 10 Livros da Groq:**
  - Assim que a Groq retornar os 10 livros, busque as capas em lotes de 3 por vez (ou em paralelo com cache) e já libere a tela da `SwipeArena` assim que as 2 primeiras cartas tiverem capa resolvida, carregando o restante em background com `new Image().src = url` (preload).

### 5.3. Busca Híbrida Instantânea no Onboarding (`curatedBooks.ts` + `searchBooksForOnboarding`)
Para garantir que a barra de pesquisa do Onboarding funcione em 100% dos casos e pareça mágica:
1. Crie `src/data/curatedBooks.ts` com **36 obras icônicas** (incluindo *Dom Casmurro*, *1984*, *O Alquimista*, *Memórias Póstumas de Brás Cubas*, *O Hobbit*, *Duna*, *Hábitos Atômicos*, *Crime e Castigo*, *O Pequeno Príncipe*, *A Hora da Estrela*, *Capitães da Areia*, *Torto Arado*, *Sapiens*, *O Nome do Vento*, *A Revolução dos Bichos*, *Cem Anos de Solidão*, *A Metamorfose*, *Orgulho e Preconceito*, *Rápido e Devagar*, *Código Limpo*, *Entendendo Algoritmos*, *Harry Potter e a Pedra Filosofal*, *O Senhor dos Anéis*, *Neuromancer*, *Fundação*, *vidas Secas*, *Grande Sertão: Veredas*, *Ensaio sobre a Cegueira*, *O Retrato de Dorian Gray*, *Meditações*).
2. Quando o usuário digitar 1 ou mais caracteres no input do `Onboarding.tsx`:
   - **Em 0ms (síncrono):** Filtre localmente `CURATED_BOOKS` por título, autor ou gênero e exiba imediatamente no dropdown!
   - **Após 350ms de debounce (assíncrono com `AbortController`):** Chame a Google Books API (`intitle:` / query geral, `maxResults=8`) e a Open Library como backup, mesclando os resultados da API com os resultados locais (deduplicando por `title + author` normalizado).
   - **Resultado:** O dropdown abre no mesmo milissegundo em que o usuário digita e nunca fica em branco, mesmo se a internet oscilar!

---

## 6. ESPECIFICAÇÃO DE TELAS, INTERAÇÕES E CORREÇÕES DE UX

### 6.1. Header Editorial (`src/components/Header.tsx`)
- Fixo no topo (`sticky top-0 z-40 backdrop-blur-md border-b`).
- **Esquerda:** Marca `MatchBook` (com um ícone editorial elegante e `Book` em fonte *Instrument Serif* itálica cor laranja).
- **Direita (Controles agrupados com clareza):**
  1. **Botão `"Trocar 3 Livros"`** (ícone `RotateCcw` + texto visível): Exibido sempre que o usuário estiver na `SwipeArena`. Ao clicar, leva o usuário de volta ao `Onboarding` com os 3 livros atuais carregados nos slots para que ele possa remover/trocar qualquer um e gerar novos matches, **mantendo intactos todos os livros salvos na "Minha Biblioteca"**.
  2. **Botão de Tema Claro/Escuro** (ícone `Sun` / `Moon`): Alterna imediatamente a classe `dark` na tag `<html>` e persiste em `localStorage` (`matchbook_theme`).
  3. **Botão `"Minha Biblioteca"`** (ícone `BookMarked` / `Heart` + Badge numérica com a contagem de matches salvos).

### 6.2. Tela 1: Onboarding (`src/components/Onboarding.tsx`)
- **Título Editorial:** `"Três livros que definem seu gosto."` (com *"definem seu gosto"* em `Instrument Serif` itálico e cor laranja).
- **Barra de Pesquisa Blindada contra Bugs de Foco:**
  - Container da barra com `relative z-30` (nunca coloque `overflow-hidden` no pai da barra de busca!).
  - Input com ícone `Search`, botão `X` para limpar texto e spinner sutil quando buscando na rede.
  - **REGRA DE OURO DO DROPDOWN:** Em cada item da lista de resultados do dropdown, use **`onMouseDown={(e) => { e.preventDefault(); handleSelectBook(book); }}`** em vez de depender apenas de `onClick`. Isso impede que o evento `onBlur` do `<input>` feche o dropdown antes de o clique selecionar o livro!
- **Sugestões Rápidas ("Acervo Rápido") + Botão `"Surpreenda-me"`:**
  - Abaixo da busca, exiba chips clicáveis de gêneros/livros populares e um botão `"Surpreenda-me"` (ícone `Sparkles`) que preenche automaticamente os slots vazios com uma combinação literária interessante.
- **Grid dos 3 Slots Favoritos (`Slot 01`, `Slot 02`, `Slot 03`):**
  - Cards táteis: quando vazios, mostram borda tracejada elegante e numeração em `JetBrains Mono`. Ao clicar em um slot vazio, foca automaticamente no input de busca.
  - Quando preenchidos: exibem a capa HD com acabamento `.book-cover-frame` (ou `EditorialCover` se não houver foto), título, autor, ano e um botão circular `X` no canto superior direito para remover o livro do slot.
- **Botão de Ação Principal:**
  - Enquanto `selectedBooks.length < 3`: Mostra `"Selecione mais X livro(s) para continuar"`.
  - Quando `selectedBooks.length === 3`: Botão laranja vibrante `"Curar 10 Livros com IA"` (ícone `Sparkles`).
  - Durante o carregamento: Mostre um estado de loading refinado com etapas reais (*"Lendo a essência dos seus 3 livros..."*, *"Consultando Groq Llama 3.3 70B..."*, *"Preparando capas em alta definição..."*).

### 6.3. Tela 2: Swipe Arena a 120 FPS (`src/components/SwipeArena.tsx` & `BookCard.tsx`)
- **Barra de Contexto Superior da Arena:**
  - Mostre discretos "pills" com os 3 livros base atuais (*"Baseado em: Dom Casmurro, 1984, Duna"*) + atalho `"Editar"` (que chama a função de trocar os 3 livros) + contador `"Carta X de 10"`.
- **Engenharia de Física 120 FPS (Zero Re-render durante o Drag):**
  - No card ativo, use exclusivamente `useMotionValue` e `useTransform` do `framer-motion`:
    ```tsx
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-240, 240], [-9, 9]);
    const likeOpacity = useTransform(x, [25, 110], [0, 1]);
    const passOpacity = useTransform(x, [-25, -110], [0, 1]);
    const nextCardScale = useTransform(x, [-180, 0, 180], [1, 0.95, 1]);
    ```
  - **PROIBIDO** usar `transition-all` ou `transition-transform` na `className` do `<motion.div>` que possui `drag="x"`.
- **Design do `BookCard.tsx` (Layout Editorial Compacto e Rico):**
  - O card deve caber confortavelmente na tela sem exigir scroll da janela principal:
  - **Seção Superior do Card:**
    - Capa do livro em alta definição centralizada com efeito 3D de lombada (`.book-cover-frame`), sob um fundo sutilmente iluminado.
    - No topo esquerdo: Badge em `JetBrains Mono` com **`97% MATCH`** em destaque laranja/esmeralda.
    - No topo direito: Pílulas de categoria/gênero e ano/páginas (`1899 • 256 págs`).
    - Selos dinâmicos de swipe: **"QUERO LER"** (verde esmeralda, canto superior esquerdo) e **"PASSAR"** (vermelho editorial, canto superior direito) controlados por `likeOpacity` e `passOpacity`.
  - **Seção Inferior do Card (Conteúdo Literário):**
    - Título do livro em fonte `'Instrument Serif'` (`text-2xl sm:text-3xl leading-tight`) + Autor e Ano.
    - **Bloco `"Por que combina com você"` (`matchReason`):** Caixa destacada com fundo `--accent-soft`, borda fina laranja e ícone `Sparkles`, exibindo a frase personalizada da Groq.
    - **Sinopse (`synopsis`):** Exibe 3 linhas com botão **"Ler sinopse completa"**. Ao clicar (usando `onPointerDown={(e) => e.stopPropagation()}` para não disparar o arrasto do card!), abre uma gaveta/overlay suave dentro do próprio card mostrando a sinopse integral, detalhes da obra e botão para fechar.
- **Dock de Controles Inferiores:**
  1. **Passar (`X`)** — descarta o livro para a esquerda (Atalho: `Seta Esquerda`).
  2. **Desfazer (`Undo2`)** — restaura imediatamente o último livro avaliado caso o usuário tenha passado sem querer (Atalho: `Z` ou `Backspace`).
  3. **Sinopse / Detalhes (`BookOpen`)** — abre/fecha a sinopse completa (Atalho: `Espaço`).
  4. **Quero Ler (`Heart`)** — dá match para a direita, salva na Biblioteca e exibe um Toast/Banner elegante não-bloqueante confirmando o Match (Atalho: `Seta Direita`).
- **Fim do Deck (Quando avaliar os 10 livros):**
  - Exiba um card de encerramento elegante com duas ações claras:
    1. **`"Gerar +10 Recomendações com IA"`** (chama a Groq novamente passando todos os livros já vistos em `excludeTitles`).
    2. **`"Trocar meus 3 Livros Base"`** (retorna ao Onboarding para escolher novos livros favoritos).

### 6.4. Modal "Minha Biblioteca" (`src/components/MatchesLibrary.tsx`)
- **Correção Definitiva do Layout e do Botão de Fechar:**
  - Backdrop cobrindo toda a viewport: `fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6`.
  - Container do Modal: `relative w-full max-w-4xl max-h-[86vh] rounded-3xl border flex flex-col overflow-hidden shadow-2xl` (usando `--bg-surface` e `--border-subtle`).
  - **Cabeçalho Interno do Modal (`flex items-center justify-between px-6 py-5 border-b`):**
    - À esquerda: Título `"Minha Biblioteca"` + contador de livros salvos.
    - À direita (DENTRO do cabeçalho do modal, nunca solto na tela!): Botão circular bem visível com ícone `X` e legenda acessível `"Fechar (Esc)"`.
  - **Barra de Busca e Ordenação Interna:** Permita filtrar os matches salvos por título/autor e ordenar por `Maior % de Match` ou `Mais Recentes`.
  - **Grid de Livros Salvos e Visualização de Detalhes:**
    - Exiba os livros em um grid responsivo (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 overflow-y-auto`).
    - Ao clicar em um livro salvo, exiba a visão detalhada com capa HD, `% de Match`, a explicação `"Por que deu match"`, a sinopse completa da Groq, botão para **Buscar na Amazon** (`https://www.amazon.com.br/s?k=${encodeURIComponent(book.title + ' ' + book.author)}`), botão para **Ver no Google Books** e botão para **Remover da Biblioteca**.

---

## 7. COMPONENTE DE CAPA TIPOGRAFICA DE FALLBACK (`src/components/EditorialCover.tsx`)

Sempre que um livro ainda estiver carregando a imagem, não possuir capa na API ou sofrer erro de carregamento (`<img onError={...} />`), renderize `<EditorialCover title={book.title} author={book.author} category={book.categories?.[0]} />`:
- Deve ter proporção `aspect-[2/3]`, paleta clássica inspirada nas edições da *Penguin Classics* / *Companhia das Letras* (varie sutilmente a cor de fundo a partir de um hash do título entre tons terracota, azul petróleo, verde floresta, vinho e grafite editorial), moldura interna fina, ornamento geométrico minimalista, título em `'Instrument Serif'` centralizado e nome do autor no rodapé.
- Isso garante que **100% dos livros do site tenham uma capa linda**, mesmo offline.

---

## 8. CHECKLIST DE VERIFICAÇÃO ANTES DE CONCLUIR

1. Verifique se todas as chamadas usam `import.meta.env.VITE_GROQ_API_KEY` e `import.meta.env.VITE_GOOGLE_BOOKS_API_KEY`.
2. Teste mentalmente o fluxo do `Onboarding.tsx`: digitar "Dom Casmurro" ou qualquer outro livro deve abrir o dropdown imediatamente, e clicar em um item deve adicioná-lo ao slot sem falhar por causa do `onBlur`.
3. Verifique se o botão de alternar tema Claro/Escuro no `Header.tsx` muda instantaneamente todas as cores de fundo, textos, cards e modais.
4. Verifique se o botão `"Trocar 3 Livros"` está visível na `SwipeArena` e permite voltar ao `Onboarding` mantendo os matches salvos.
5. Verifique se o botão `X` de fechar a `"Minha Biblioteca"` está **dentro do cabeçalho do modal**.
6. Execute `npm run build` para confirmar que o TypeScript e o Vite compilam com **zero erros**.