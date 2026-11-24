import type { SeedBook } from '../types/book';

export const CURATED_BOOKS: SeedBook[] = [
  {
    id: 'dom-casmurro',
    title: 'Dom Casmurro',
    author: 'Machado de Assis',
    publishedYear: 1899,
    categories: ['Romance', 'Literatura Brasileira', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=xxYDAAAAYAAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535910663',
    pageCount: 256,
    fallbackSynopsis: 'Bentinho narra sua obsessão por Capitu, a mulher que pode ou não ter o traído com seu melhor amigo. Um estudo magistral sobre ciúme, memória e a impossibilidade de conhecer o outro.',
    fallbackMatchReason: 'Como em "Dom Casmurro", a narrativa em primeira pessoa expõe as armadilhas da memória e do ciúme, transformando o leitor em cúmplice da dúvida.'
  },
  {
    id: '1984',
    title: '1984',
    author: 'George Orwell',
    publishedYear: 1949,
    categories: ['Distopia', 'Ficção Científica', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=Z4k3YVKBdrUC&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535914849',
    pageCount: 328,
    fallbackSynopsis: 'Em um Estado totalitário onde o Grande Irmão tudo vê, Winston Smith tenta preservar sua humanidade. O romance que definiu o vigilantismo moderno e a manipulação da verdade.',
    fallbackMatchReason: 'A distopia orwelliana dialoga diretamente com o controle social e a vigilância presentes na sua escolha, ecoando o mesmo alerta sobre a fragilidade da liberdade.'
  },
  {
    id: 'o-alquimista',
    title: 'O Alquimista',
    author: 'Paulo Coelho',
    publishedYear: 1988,
    categories: ['Ficção', 'Filosofia', 'Bestseller'],
    coverUrl: 'https://books.google.com/books/content?id=KO2lDwAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788576655534',
    pageCount: 168,
    fallbackSynopsis: 'Santiago, um pastor andaluz, segue seu destino até as pirâmides do Egito. Uma parábola sobre ouvir o coração, ler os sinais do universo e realizar a lenda pessoal.',
    fallbackMatchReason: 'A jornada iniciática de Santiago espelha a busca por sentido que permeia sua seleção, onde cada encontro é um sinal do destino.'
  },
  {
    id: 'memorias-postumas',
    title: 'Memórias Póstumas de Brás Cubas',
    author: 'Machado de Assis',
    publishedYear: 1881,
    categories: ['Romance', 'Literatura Brasileira', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=0Q0TAAAAYAAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535910649',
    pageCount: 224,
    fallbackSynopsis: 'Um defunto autor narra suas memórias com ironia devastadora. Brás Cubas expõe a futilidade da elite carioca oitocentista em capítulos curtos, digressivos e geniais.',
    fallbackMatchReason: 'A ironia machadiana e o narrador pós-morte criam o mesmo distanciamento crítico que você aprecia, transformando a leitura em jogo intelectual.'
  },
  {
    id: 'o-hobbit',
    title: 'O Hobbit',
    author: 'J.R.R. Tolkien',
    publishedYear: 1937,
    categories: ['Fantasia', 'Aventura', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=BQYxAQAAIAAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788595084742',
    pageCount: 320,
    fallbackSynopsis: 'Bilbo Bolseiro deixa seu buraco confortável para ajudar anões a recuperar um tesouro guardado por Smaug. A jornada que nasceu uma mitologia moderna.',
    fallbackMatchReason: 'A relutância do herói comum diante do extraordinário ecoa a transformação dos protagonistas que você escolheu, do conforto à aventura.'
  },
  {
    id: 'duna',
    title: 'Duna',
    author: 'Frank Herbert',
    publishedYear: 1965,
    categories: ['Ficção Científica', 'Épico', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=B1hSG45JCX4C&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788576573201',
    pageCount: 688,
    fallbackSynopsis: 'No planeta deserto Arrakis, Paul Atreides enfrenta intrigas imperiais, vermes gigantes e o destino messiânico. A obra-prima que fundou a FC moderna complexa.',
    fallbackMatchReason: 'A construção de mundo densa e a política interestelar de Duna expandem a escala épica que você valoriza, unindo ecologia, religião e poder.'
  },
  {
    id: 'habitos-atomicos',
    title: 'Hábitos Atômicos',
    author: 'James Clear',
    publishedYear: 2018,
    categories: ['Autoajuda', 'Produtividade', 'Bestseller'],
    coverUrl: 'https://books.google.com/books/content?id=wbDLDwAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788551004612',
    pageCount: 304,
    fallbackSynopsis: 'Pequenas mudanças consistentes superam metas grandiosas. Clear ensina o sistema de 1% ao dia, design de ambiente e identidade baseada em hábitos para transformação real.',
    fallbackMatchReason: 'A abordagem sistêmica e prática de Clear complementa a busca por autoconhecimento estruturado presente nas suas escolhas filosóficas.'
  },
  {
    id: 'crime-e-castigo',
    title: 'Crime e Castigo',
    author: 'Fiódor Dostoiévski',
    publishedYear: 1866,
    categories: ['Romance', 'Clássico', 'Filosofia'],
    coverUrl: 'https://books.google.com/books/content?id=3VwKAAAAYAAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535914764',
    pageCount: 576,
    fallbackSynopsis: 'Raskolnikov assassina uma agiota para testar sua teoria do homem superior. A culpa o persegue num labirinto psicológico até a confissão e a redenção possível.',
    fallbackMatchReason: 'O tormento moral de Raskolnikov espelha a profundidade existencial que você busca, onde cada escolha carrega o peso da consciência.'
  },
  {
    id: 'o-pequeno-principe',
    title: 'O Pequeno Príncipe',
    author: 'Antoine de Saint-Exupéry',
    publishedYear: 1943,
    categories: ['Fábula', 'Clássico', 'Infantojuvenil'],
    coverUrl: 'https://books.google.com/books/content?id=1M2sEAAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788572329513',
    pageCount: 96,
    fallbackSynopsis: 'Um piloto perdido no deserto encontra um menino de outro planeta. Através de encontros absurdos, o Príncipe ensina que "o essencial é invisível aos olhos".',
    fallbackMatchReason: 'A simplicidade enganosa que esconde verdades profundas reflete a capacidade de ver além das aparências que suas leituras cultivam.'
  },
  {
    id: 'a-hora-da-estrela',
    title: 'A Hora da Estrela',
    author: 'Clarice Lispector',
    publishedYear: 1977,
    categories: ['Romance', 'Literatura Brasileira', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=Zz4tDwAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535914740',
    pageCount: 96,
    fallbackSynopsis: 'Macabéa, datilógrafa nordestina no Rio, vive sua insignificância até o encontro fatal. Rodrigo S.M. narra sua tentativa de dar voz a quem não tem uma.',
    fallbackMatchReason: 'A escrita que nasce do silêncio e da invisibilidade dialoga com a sensibilidade para o marginal que suas escolhas revelam.'
  },
  {
    id: 'capitaes-da-areia',
    title: 'Capitães da Areia',
    author: 'Jorge Amado',
    publishedYear: 1937,
    categories: ['Romance', 'Literatura Brasileira', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=0zVLAAAAYAAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535914726',
    pageCount: 288,
    fallbackSynopsis: 'Meninos de rua em Salvador formam uma gangue para sobreviver. Pedro Bala lidera os "capitães" entre roubos, sonhos e a dura realidade da exclusão social.',
    fallbackMatchReason: 'O retrato cru da infância roubada e da solidariedade na margem ressoa com o olhar humanista para os invisíveis presente nas suas leituras.'
  },
  {
    id: 'torto-arado',
    title: 'Torto Arado',
    author: 'Itamar Vieira Junior',
    publishedYear: 2019,
    categories: ['Romance', 'Literatura Brasileira', 'Bestseller'],
    coverUrl: 'https://books.google.com/books/content?id=JV0tDwAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535932645',
    pageCount: 264,
    fallbackSynopsis: 'Duas irmãs no sertão da Bahia descobrem uma faca misteriosa. Três vozes narram gerações de trabalho análogo à escravidão, fé e resistência quilombola.',
    fallbackMatchReason: 'A oralidade ancestral e a denúncia social entrelaçadas ecoam a força da narrativa brasileira que denuncia e celebra ao mesmo tempo.'
  },
  {
    id: 'sapiens',
    title: 'Sapiens: Uma Breve História da Humanidade',
    author: 'Yuval Noah Harari',
    publishedYear: 2011,
    categories: ['História', 'Ciência', 'Bestseller'],
    coverUrl: 'https://books.google.com/books/content?id=JwSfCgAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788551002670',
    pageCount: 448,
    fallbackSynopsis: 'Da revolução cognitiva à inteligência artificial, Harari explica como Homo sapiens dominou o planeta através de mitos compartilhados: deuses, nações, dinheiro, direitos.',
    fallbackMatchReason: 'A visão macro-histórica que conecta biologia, cultura e tecnologia expande o mesmo pensamento sistêmico que você cultiva nas leituras escolhidas.'
  },
  {
    id: 'o-nome-do-vento',
    title: 'O Nome do Vento',
    author: 'Patrick Rothfuss',
    publishedYear: 2007,
    categories: ['Fantasia', 'Épico', 'Bestseller'],
    coverUrl: 'https://books.google.com/books/content?id=Xy5vDwAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788581634028',
    pageCount: 672,
    fallbackSynopsis: 'Kvothe narra sua vida: de menino prodígio em troupe itinerante a estudante na Universidade, aprendendo simpatia e nomeação, até se tornar lenda viva.',
    fallbackMatchReason: 'A narrativa em camadas de um contador de histórias que molda sua própria lenda reflete o poder da palavra e da música que você valoriza.'
  },
  {
    id: 'a-revolucao-dos-bichos',
    title: 'A Revolução dos Bichos',
    author: 'George Orwell',
    publishedYear: 1945,
    categories: ['Fábula', 'Política', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=YJ_9DwAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535909551',
    pageCount: 112,
    fallbackSynopsis: 'Animais expulsam o fazendeiro e criam sua própria sociedade. "Todos os animais são iguais, mas alguns são mais iguais que outros." A sátire perfeita do totalitarismo.',
    fallbackMatchReason: 'A alegoria política que desmascara a corrupção do poder ecoa o ceticismo saudável em relação a ideologias que suas leituras cultivam.'
  },
  {
    id: 'cem-anos-solidao',
    title: 'Cem Anos de Solidão',
    author: 'Gabriel García Márquez',
    publishedYear: 1967,
    categories: ['Realismo Mágico', 'Romance', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=J0zQDwAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535914702',
    pageCount: 416,
    fallbackSynopsis: 'A saga dos Buendía em Macondo: fundação, glória, pragas, guerras e o fim profetizado. O realismo mágico em sua forma mais pura e arrebatadora.',
    fallbackMatchReason: 'O tempo circular e o realismo mágico de Márquez dialogam com a percepção de que história e mito se entrelaçam, presente nas suas escolhas.'
  },
  {
    id: 'a-metamorfose',
    title: 'A Metamorfose',
    author: 'Franz Kafka',
    publishedYear: 1915,
    categories: ['Clássico', 'Ficção', 'Existencialismo'],
    coverUrl: 'https://books.google.com/books/content?id=2VwKAAAAYAAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535914788',
    pageCount: 96,
    fallbackSynopsis: 'Gregor Samsa acorda transformado em inseto gigante. A família passa da comiseração ao repúdio. A alienação moderna em sua forma mais visceral e absurda.',
    fallbackMatchReason: 'O absurdo burocrático e a transformação do sujeito em objeto refletem a sensibilidade para o existencial que permeia suas leituras.'
  },
  {
    id: 'orgulho-e-preconceito',
    title: 'Orgulho e Preconceito',
    author: 'Jane Austen',
    publishedYear: 1813,
    categories: ['Romance', 'Clássico', 'Literatura Inglesa'],
    coverUrl: 'https://books.google.com/books/content?id=NVq8AAAAMAAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535914800',
    pageCount: 352,
    fallbackSynopsis: 'Elizabeth Bennet navega convenções sociais, orgulho próprio e o preconceito de Darcy. O romance que definiu a comédia de costumes com inteligência afiada.',
    fallbackMatchReason: 'A ironia social e a protagonista que pensa por si mesma espelham a valorização da autonomia intelectual feminina presente nas suas escolhas.'
  },
  {
    id: 'rapido-e-devagar',
    title: 'Rápido e Devagar',
    author: 'Daniel Kahneman',
    publishedYear: 2011,
    categories: ['Psicologia', 'Economia', 'Bestseller'],
    coverUrl: 'https://books.google.com/books/content?id=ZmJwCwAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535922615',
    pageCount: 512,
    fallbackSynopsis: 'Dois sistemas de pensamento: o rápido, intuitivo e emocional; o lento, deliberado e lógico. Kahneman revela como vieses cognitivos moldam nossas decisões.',
    fallbackMatchReason: 'A dissecação da mente humana entre intuição e razão complementa o olhar analítico sobre si mesmo que suas leituras filosóficas estimulam.'
  },
  {
    id: 'codigo-limpo',
    title: 'Código Limpo',
    author: 'Robert C. Martin',
    publishedYear: 2008,
    categories: ['Tecnologia', 'Programação', 'Referência'],
    coverUrl: 'https://books.google.com/books/content?id=HjH-DwAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788576082675',
    pageCount: 464,
    fallbackSynopsis: 'Princípios, padrões e práticas para escrever código legível, manutenível e profissional. Nomes significativos, funções pequenas, testes, refatoração: o manual do artesão de software.',
    fallbackMatchReason: 'A busca pela excelência técnica e a ética do ofício bem feito ressoam com o padrão de qualidade e rigor que você aplica às suas leituras.'
  },
  {
    id: 'entendendo-algoritmos',
    title: 'Entendendo Algoritmos',
    author: 'Aditya Bhargava',
    publishedYear: 2016,
    categories: ['Tecnologia', 'Algoritmos', 'Educação'],
    coverUrl: 'https://books.google.com/books/content?id=R9lDDwAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788575225639',
    pageCount: 256,
    fallbackSynopsis: 'Introdução visual e acessível a algoritmos fundamentais: busca, ordenação, grafos, programação dinâmica. Ilustrações explicam o que o texto denso obscurece.',
    fallbackMatchReason: 'A clareza didática para temas complexos reflete seu apreço por explicações que respeitam a inteligência do leitor sem jargão desnecessário.'
  },
  {
    id: 'harry-potter-pedra-filosofal',
    title: 'Harry Potter e a Pedra Filosofal',
    author: 'J.K. Rowling',
    publishedYear: 1997,
    categories: ['Fantasia', 'Infantojuvenil', 'Bestseller'],
    coverUrl: 'https://books.google.com/books/content?id=wrOQLV6xB-wC&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788532530780',
    pageCount: 264,
    fallbackSynopsis: 'Órfão descobre ser bruxo aos 11 anos. Em Hogwarts, faz amigos, enfrenta Voldemort e aprende que o amor é a magia mais forte. O fenômeno que redefiniu a literatura juvenil.',
    fallbackMatchReason: 'A jornada do herói relutante que descobre seu lugar no mundo mágico espelha a descoberta de pertencimento que suas leituras celebram.'
  },
  {
    id: 'o-senhor-dos-aneis',
    title: 'O Senhor dos Anéis: A Sociedade do Anel',
    author: 'J.R.R. Tolkien',
    publishedYear: 1954,
    categories: ['Fantasia', 'Épico', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=JwYXAQAAIAAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788595084704',
    pageCount: 576,
    fallbackSynopsis: 'Frodo herda o Um Anel e parte para destruí-lo na Montanha da Perdição. Nove companheiros enfrentam o mal antigo. A fundação da fantasia épica moderna.',
    fallbackMatchReason: 'A missão impossível carregada por um ser pequeno reflete o tema do indivíduo comum diante do destino extraordinário que você valoriza.'
  },
  {
    id: 'neuromancer',
    title: 'Neuromancer',
    author: 'William Gibson',
    publishedYear: 1984,
    categories: ['Cyberpunk', 'Ficção Científica', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=M5sYDwAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535914824',
    pageCount: 272,
    fallbackSynopsis: 'Case, hacker queimado, aceita o último trabalho: invadir uma IA militar. O romance que cunhou "ciberespaço" e definiu a estética cyberpunk.',
    fallbackMatchReason: 'A fusão de alta tecnologia e baixa vida antecipa os dilemas da identidade digital que suas leituras de FC contemporânea exploram.'
  },
  {
    id: 'fundacao',
    title: 'Fundação',
    author: 'Isaac Asimov',
    publishedYear: 1951,
    categories: ['Ficção Científica', 'Épico', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=5Y0tDwAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535914862',
    pageCount: 320,
    fallbackSynopsis: 'Hari Seldon cria a psico-história para prever a queda do Império Galáctico. A Fundação encurta 30 mil anos de trevas para mil. A ciência prevendo a história.',
    fallbackMatchReason: 'A ideia de que padrões macro-históricos podem ser modelados dialoga com o pensamento sistêmico e preditivo presente nas suas escolhas.'
  },
  {
    id: 'vidas-secas',
    title: 'Vidas Secas',
    author: 'Graciliano Ramos',
    publishedYear: 1938,
    categories: ['Romance', 'Literatura Brasileira', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=0zVLAAAAYAAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535914726',
    pageCount: 160,
    fallbackSynopsis: 'Família de retirantes foge da seca no sertão. Fabiano, Sinhá Vitória e filhos enfrentam fome, injustiça e a própria linguagem que lhes falha. O romance da seca absoluta.',
    fallbackMatchReason: 'A linguagem enxuta que espelha a aridez do sertão e a dignidade na miséria ressoam com o estilo sóbrio e humano que você aprecia.'
  },
  {
    id: 'grande-sertao-veredas',
    title: 'Grande Sertão: Veredas',
    author: 'João Guimarães Rosa',
    publishedYear: 1956,
    categories: ['Romance', 'Literatura Brasileira', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=xxYDAAAAYAAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535910663',
    pageCount: 608,
    fallbackSynopsis: 'Riobaldo narra sua vida de jagunço, o pacto com o diabo, o amor por Diadorim. A linguagem inventada recria o sertão como cosmos. A obra-prima da língua portuguesa.',
    fallbackMatchReason: 'A invenção linguística que cria realidade e a ambiguidade moral do jagunço ecoam a complexidade ética e formal que você busca.'
  },
  {
    id: 'ensaio-cegueira',
    title: 'Ensaio sobre a Cegueira',
    author: 'José Saramago',
    publishedYear: 1995,
    categories: ['Romance', 'Distopia', 'Prêmio Nobel'],
    coverUrl: 'https://books.google.com/books/content?id=KO2lDwAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535914886',
    pageCount: 312,
    fallbackSynopsis: 'Epidemia de cegueira branca paralisa uma cidade. Numa quarentena, a civilização colapsa. Uma mulher que vê guia o grupo. A alegoria da cegueira moral da humanidade.',
    fallbackMatchReason: 'O colapso social visto de dentro expõe a fragilidade da ética, tema central nas distopias e romances filosóficos que você escolhe.'
  },
  {
    id: 'retrato-dorian-gray',
    title: 'O Retrato de Dorian Gray',
    author: 'Oscar Wilde',
    publishedYear: 1890,
    categories: ['Romance', 'Clássico', 'Filosofia'],
    coverUrl: 'https://books.google.com/books/content?id=BQYxAQAAIAAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535914909',
    pageCount: 256,
    fallbackSynopsis: 'Dorian vende a alma para que o retrato envelheça em seu lugar. Beleza eterna, corrupção oculta. O esteticismo levado às últimas consequências morais.',
    fallbackMatchReason: 'A dualidade entre aparência e essência, beleza e corrupção, reflete a tensão entre superfície e profundidade que suas leituras investigam.'
  },
  {
    id: 'meditacoes',
    title: 'Meditações',
    author: 'Marco Aurélio',
    publishedYear: 180,
    categories: ['Filosofia', 'Estoicismo', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=Z4k3YVKBdrUC&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535914923',
    pageCount: 304,
    fallbackSynopsis: 'O imperador romano escreve para si mesmo: controle o que depende de você, aceite o resto. Dever, virtude, efemeridade. O manual estoico definitivo.',
    fallbackMatchReason: 'A prática filosófica como exercício diário de autodomínio e aceitação alinha-se à busca por sabedoria prática que suas leituras cultivam.'
  },
  {
    id: 'o-conto-da-aia',
    title: 'O Conto da Aia',
    author: 'Margaret Atwood',
    publishedYear: 1985,
    categories: ['Distopia', 'Ficção Científica', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=0Q0TAAAAYAAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535914947',
    pageCount: 336,
    fallbackSynopsis: 'Em Gilead, teocracia totalitária, mulheres férteis são "aias" forçadas a gerar filhos para a elite. Offred narra sua resistência silenciosa. O corpo como campo de batalha político.',
    fallbackMatchReason: 'O controle reprodutivo como instrumento de poder dialoga com a vigilância sobre corpos e liberdades que suas distopias favoritas denunciam.'
  },
  {
    id: 'a-sombra-do-vento',
    title: 'A Sombra do Vento',
    author: 'Carlos Ruiz Zafón',
    publishedYear: 2001,
    categories: ['Mistério', 'Romance', 'Bestseller'],
    coverUrl: 'https://books.google.com/books/content?id=B1hSG45JCX4C&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535914961',
    pageCount: 480,
    fallbackSynopsis: 'Barcelona, 1945. Daniel encontra um livro maldito no Cemitério dos Livros Esquecidos. Alguém queima todos os exemplares do autor. Mistério gótico sobre o poder dos livros.',
    fallbackMatchReason: 'O livro dentro do livro e a bibliomania como trama central celebram o amor pela leitura que move sua própria jornada literária.'
  },
  {
    id: 'o-psicanalista',
    title: 'O Psicanalista',
    author: 'John Katzenbach',
    publishedYear: 2002,
    categories: ['Thriller', 'Suspense', 'Bestseller'],
    coverUrl: 'https://books.google.com/books/content?id=wbDLDwAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535914985',
    pageCount: 416,
    fallbackSynopsis: 'Dr. Frederick Starks recebe ameaça: tem 15 dias para descobrir quem quer matá-lo, ou morrerá. O jogo mental entre psiquiatra e perseguidor desconhecido.',
    fallbackMatchReason: 'A mente do analista virada contra si mesmo em jogo de gato e rato reflete o fascínio pelo inconsciente e suas armadilhas.'
  },
  {
    id: 'o-silencio-dos-inocentes',
    title: 'O Silêncio dos Inocentes',
    author: 'Thomas Harris',
    publishedYear: 1988,
    categories: ['Thriller', 'Suspense', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=3VwKAAAAYAAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535915005',
    pageCount: 368,
    fallbackSynopsis: 'Clarice Starling entrevista Hannibal Lecter para capturar Buffalo Bill. A dança psicológica entre agente e canibal refinado. O thriller que definiu o gênero serial killer.',
    fallbackMatchReason: 'A inteligência perversa de Lecter e a vulnerabilidade controlada de Starling criam a tensão psicológica sofisticada que você aprecia.'
  },
  {
    id: 'a-menina-que-roubava-livros',
    title: 'A Menina que Roubava Livros',
    author: 'Markus Zusak',
    publishedYear: 2005,
    categories: ['Romance', 'Guerra', 'Bestseller'],
    coverUrl: 'https://books.google.com/books/content?id=1M2sEAAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535915029',
    pageCount: 480,
    fallbackSynopsis: 'Narrada pela Morte, a história de Liesel na Alemanha nazista. Livros roubados, amizade com um judeu escondido, o poder das palavras na escuridão.',
    fallbackMatchReason: 'A Morte como narradora compassiva e os livros como resistência ao horror ecoam a visão de que a literatura salva mesmo nas trevas.'
  },
  {
    id: 'educada',
    title: 'Educada',
    author: 'Tara Westover',
    publishedYear: 2018,
    categories: ['Memórias', 'Biografia', 'Bestseller'],
    coverUrl: 'https://books.google.com/books/content?id=Zz4tDwAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535915043',
    pageCount: 352,
    fallbackSynopsis: 'Crescida em família mórmon survivalista sem escola nem médicos, Tara educa-se sozinha até o PhD em Cambridge. O preço da emancipação intelectual: a ruptura familiar.',
    fallbackMatchReason: 'A educação como ato de rebeldia e reconstrução de identidade reflete o poder transformador do conhecimento que suas leituras representam.'
  },
  {
    id: 'o-homem-em-busca-de-sentido',
    title: 'O Homem em Busca de Sentido',
    author: 'Viktor Frankl',
    publishedYear: 1946,
    categories: ['Psicologia', 'Filosofia', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=0zVLAAAAYAAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535915067',
    pageCount: 184,
    fallbackSynopsis: 'Psiquiatra sobrevive a Auschwitz e cria a logoterapia: o ser humano é movido pela busca de sentido, não prazer. Mesmo no sofrimento, podemos escolher nossa atitude.',
    fallbackMatchReason: 'A descoberta de significado no sofrimento extremo é a síntese final da resiliência humana que todas as suas leituras, de formas diferentes, celebram.'
  }
];

export function searchCuratedBooks(query: string): SeedBook[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];

  return CURATED_BOOKS.filter(book =>
    book.title.toLowerCase().includes(normalized) ||
    book.author.toLowerCase().includes(normalized) ||
    book.categories.some(cat => cat.toLowerCase().includes(normalized))
  ).slice(0, 8);
}

export function getCuratedBookById(id: string): SeedBook | undefined {
  return CURATED_BOOKS.find(book => book.id === id);
}

export function getRandomCuratedBooks(count: number): SeedBook[] {
  const shuffled = [...CURATED_BOOKS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}