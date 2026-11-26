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
    fallbackSynopsis: 'Bentinho narra sua obsessão por Capitu, a mulher que pode ou não ter o traído com seu melhor amigo Escobar. Entre lembranças do seminário e do Rio de Janeiro oitocentista, um estudo magistral sobre ciúme, memória seletiva e a impossibilidade de conhecer o outro.',
    fallbackMatchReason: 'Como em "Dom Casmurro", a narrativa em primeira pessoa expõe as armadilhas da memória e do ciúme, transformando o leitor em cúmplice da dúvida.'
  },
  {
    id: '1984',
    title: '1984',
    originalTitle: 'Nineteen Eighty-Four',
    author: 'George Orwell',
    publishedYear: 1949,
    categories: ['Distopia', 'Ficção Científica', 'Clássico'],
    isbn: '9788535914849',
    pageCount: 328,
    fallbackSynopsis: 'Em um Estado totalitário onde o Grande Irmão tudo vigia e a Novilíngua reescreve o passado, Winston Smith arrisca a vida ao iniciar um diário e um romance proibido. O clássico definitivo sobre vigilância estatal, propaganda e resistência da consciência individual.',
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
    fallbackSynopsis: 'Santiago, um jovem pastor andaluz, abandona sua rotina após um sonho recorrente e parte rumo às pirâmides do Egito. Pelo deserto, entre mestres e provações, uma parábola poética sobre ouvir o coração, ler os sinais do universo e realizar a lenda pessoal.',
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
    fallbackSynopsis: 'Um defunto autor decide narrar suas memórias do além-túmulo com ironia devastadora e humor ácido. Em capítulos curtos e digressivos, Brás Cubas expõe as vaidades, paixões e hipocrisias da elite carioca do século XIX.',
    fallbackMatchReason: 'A ironia machadiana e o narrador pós-morte criam o mesmo distanciamento crítico que você aprecia, transformando a leitura em jogo intelectual.'
  },
  {
    id: 'o-hobbit',
    title: 'O Hobbit',
    originalTitle: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    publishedYear: 1937,
    categories: ['Fantasia', 'Aventura', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=BQYxAQAAIAAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788595084742',
    pageCount: 320,
    fallbackSynopsis: 'Bilbo Bolseiro deixa a tranquilidade de seu Condado ao ser recrutado por Gandalf e treze anões para recuperar um reino e um tesouro guardados pelo dragão Smaug. Uma aventura encantadora que deu origem à mitologia moderna da Terra-média.',
    fallbackMatchReason: 'A relutância do herói comum diante do extraordinário ecoa a transformação dos protagonistas que você escolheu, do conforto à aventura.'
  },
  {
    id: 'duna',
    title: 'Duna',
    originalTitle: 'Dune',
    author: 'Frank Herbert',
    publishedYear: 1965,
    categories: ['Ficção Científica', 'Épico', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=B1hSG45JCX4C&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788576573201',
    pageCount: 688,
    fallbackSynopsis: 'No hostil planeta desértico Arrakis, fonte da cobiçada especiaria melange, o jovem Paul Atreides enfrenta conspirações imperiais, vermes gigantes e um destino messiânico inevitável. Obra-prima monumental que une ecologia, religião, política e poder.',
    fallbackMatchReason: 'A construção de mundo densa e a política interestelar de Duna expandem a escala épica que você valoriza, unindo ecologia, religião e poder.'
  },
  {
    id: 'habitos-atomicos',
    title: 'Hábitos Atômicos',
    originalTitle: 'Atomic Habits',
    author: 'James Clear',
    publishedYear: 2018,
    categories: ['Autoajuda', 'Produtividade', 'Bestseller'],
    isbn: '9788551004612',
    pageCount: 304,
    fallbackSynopsis: 'Pequenas melhorias diárias de 1% produzem resultados extraordinários ao longo do tempo. Com base em psicologia comportamental e neurociência, James Clear apresenta um método prático para construir bons hábitos, quebrar vícios e redesenhar o ambiente.',
    fallbackMatchReason: 'A abordagem sistêmica e prática de Clear complementa a busca por autoconhecimento estruturado presente nas suas escolhas.'
  },
  {
    id: 'crime-e-castigo',
    title: 'Crime e Castigo',
    originalTitle: 'Crime and Punishment',
    author: 'Fiódor Dostoiévski',
    publishedYear: 1866,
    categories: ['Romance', 'Clássico', 'Filosofia'],
    isbn: '9788535914764',
    pageCount: 576,
    fallbackSynopsis: 'Em São Petersburgo, o ex-estudante empobrecido Raskólnikov comete um assassinato para testar sua teoria de que indivíduos extraordinários estão acima da moral comum. Assombrado pela culpa e perseguido pelo astuto juiz Porfiri, mergulha em um intenso labirinto psicológico.',
    fallbackMatchReason: 'O tormento moral de Raskólnikov espelha a profundidade existencial que você busca, onde cada escolha carrega o peso da consciência.'
  },
  {
    id: 'o-pequeno-principe',
    title: 'O Pequeno Príncipe',
    originalTitle: 'Le Petit Prince',
    author: 'Antoine de Saint-Exupéry',
    publishedYear: 1943,
    categories: ['Fábula', 'Clássico', 'Infantojuvenil'],
    coverUrl: 'https://books.google.com/books/content?id=1M2sEAAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788572329513',
    pageCount: 96,
    fallbackSynopsis: 'Um aviador perdido no deserto do Saara encontra um menino vindo de um pequeno asteroide. Através de relatos sobre planetas solitários, uma rosa vaidosa e uma raposa sábia, a fábula revela com delicadeza que "o essencial é invisível aos olhos".',
    fallbackMatchReason: 'A simplicidade enganosa que esconde verdades profundas reflete a capacidade de ver além das aparências que suas leituras cultivam.'
  },
  {
    id: 'a-hora-da-estrela',
    title: 'A Hora da Estrela',
    author: 'Clarice Lispector',
    publishedYear: 1977,
    categories: ['Romance', 'Literatura Brasileira', 'Clássico'],
    isbn: '9788535914740',
    pageCount: 96,
    fallbackSynopsis: 'Macabéa, uma datilógrafa alagoana ingênua e invisível no Rio de Janeiro, sobrevive à margem de tudo enquanto sonha em ser estrela de cinema. Narrada pelo escritor Rodrigo S.M., a novela transforma a precariedade cotidiana em alta literatura.',
    fallbackMatchReason: 'A escrita que nasce do silêncio e da invisibilidade dialoga com a sensibilidade para o humano e o marginal que suas escolhas revelam.'
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
    fallbackSynopsis: 'Em Salvador dos anos 1930, um grupo de meninos abandonados vive em um trapiche abandonado sob a liderança de Pedro Bala. Entre pequenos furtos, amizades leais, primeiros amores e a repressão policial, um retrato vibrante e emocionante de liberdade e desigualdade.',
    fallbackMatchReason: 'O retrato cru da infância roubada e da solidariedade na margem ressoa com o olhar humanista presente nas suas leituras.'
  },
  {
    id: 'torto-arado',
    title: 'Torto Arado',
    author: 'Itamar Vieira Junior',
    publishedYear: 2019,
    categories: ['Romance', 'Literatura Brasileira', 'Bestseller'],
    isbn: '9788535932645',
    pageCount: 264,
    fallbackSynopsis: 'Nas profundezas do sertão baiano, as irmãs Bibiana e Belonísia encontram uma misteriosa faca na mala da avó e têm suas vidas ligadas para sempre por um acidente. Contada por três vozes marcantes, uma saga poderosa sobre terra, ancestralidade e resistência quilombola.',
    fallbackMatchReason: 'A oralidade ancestral e a denúncia social entrelaçadas ecoam a força da narrativa brasileira que emociona e provoca reflexão.'
  },
  {
    id: 'sapiens',
    title: 'Sapiens: Uma Breve História da Humanidade',
    originalTitle: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    publishedYear: 2011,
    categories: ['História', 'Ciência', 'Bestseller'],
    isbn: '9788551002670',
    pageCount: 448,
    fallbackSynopsis: 'Da Revolução Cognitiva há 70 mil anos aos dilemas da biotecnologia e da inteligência artificial, Harari investiga como o Homo sapiens conquistou o planeta graças à capacidade única de criar e acreditar em ficções coletivas como religiões, nações e dinheiro.',
    fallbackMatchReason: 'A visão macro-histórica que conecta biologia, cultura e tecnologia expande o mesmo pensamento sistêmico que você cultiva.'
  },
  {
    id: 'o-nome-do-vento',
    title: 'O Nome do Vento',
    originalTitle: 'The Name of the Wind',
    author: 'Patrick Rothfuss',
    publishedYear: 2007,
    categories: ['Fantasia', 'Épico', 'Bestseller'],
    isbn: '9788581634028',
    pageCount: 672,
    fallbackSynopsis: 'Escondido como um simples hospedeiro em uma vila pacata, o lendário mago e músico Kvothe decide contar sua verdadeira história em três dias: da infância trágica em uma trupe de artistas aos desafios na misteriosa Universidade de magia e nomeação.',
    fallbackMatchReason: 'A narrativa em camadas de um contador de histórias que molda sua própria lenda reflete o poder da palavra e da imaginação que você valoriza.'
  },
  {
    id: 'a-revolucao-dos-bichos',
    title: 'A Revolução dos Bichos',
    originalTitle: 'Animal Farm',
    author: 'George Orwell',
    publishedYear: 1945,
    categories: ['Fábula', 'Política', 'Clássico'],
    isbn: '9788535909551',
    pageCount: 112,
    fallbackSynopsis: 'Cansados da exploração humana, os animais da Granja do Solar expulsam o fazendeiro e fundam uma sociedade igualitária. Aos poucos, os porcos assumem o controle e corrompem os ideais da revolução nesta sátira mordaz e atemporal sobre o poder.',
    fallbackMatchReason: 'A alegoria política que desmascara a corrupção do poder ecoa o olhar crítico em relação a ideologias presente nas suas leituras.'
  },
  {
    id: 'cem-anos-solidao',
    title: 'Cem Anos de Solidão',
    originalTitle: 'Cien años de soledad',
    author: 'Gabriel García Márquez',
    publishedYear: 1967,
    categories: ['Realismo Mágico', 'Romance', 'Clássico'],
    isbn: '9788535914702',
    pageCount: 416,
    fallbackSynopsis: 'A saga épica de sete gerações da família Buendía na mítica aldeia de Macondo: da fundação cheia de maravilhas às paixões obsessivas, guerras civis, pragas de insônia e o destino profetizado em pergaminhos. O auge do realismo mágico latino-americano.',
    fallbackMatchReason: 'O tempo circular e o realismo mágico dialogam com a percepção de que memória, história e mito se entrelaçam.'
  },
  {
    id: 'a-metamorfose',
    title: 'A Metamorfose',
    originalTitle: 'Die Verwandlung',
    author: 'Franz Kafka',
    publishedYear: 1915,
    categories: ['Clássico', 'Ficção', 'Existencialismo'],
    isbn: '9788535914788',
    pageCount: 96,
    fallbackSynopsis: 'Ao despertar de sonhos intranquilos, o caixeiro-viajante Gregor Samsa descobre que foi transformado em um inseto monstruoso. Preso no quarto enquanto a família passa da compaixão ao desprezo, a novela retrata com precisão cirúrgica a alienação moderna.',
    fallbackMatchReason: 'O absurdo cotidiano e a solidão existencial refletem a intensidade psicológica que permeia suas leituras.'
  },
  {
    id: 'orgulho-e-preconceito',
    title: 'Orgulho e Preconceito',
    originalTitle: 'Pride and Prejudice',
    author: 'Jane Austen',
    publishedYear: 1813,
    categories: ['Romance', 'Clássico', 'Literatura Inglesa'],
    isbn: '9788535914800',
    pageCount: 352,
    fallbackSynopsis: 'Na Inglaterra rural do início do século XIX, a espirituosa Elizabeth Bennet enfrenta as pressões familiares por casamento enquanto entra em rota de colisão com o reservado Sr. Darcy. Uma comédia de costumes afiada sobre julgamentos precipitados e afeto verdadeiro.',
    fallbackMatchReason: 'A ironia social e uma protagonista que pensa por si mesma espelham a inteligência narrativa que você aprecia.'
  },
  {
    id: 'rapido-e-devagar',
    title: 'Rápido e Devagar: Duas Formas de Pensar',
    originalTitle: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    publishedYear: 2011,
    categories: ['Psicologia', 'Economia', 'Bestseller'],
    coverUrl: 'https://books.google.com/books/content?id=ZmJwCwAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535922615',
    pageCount: 512,
    fallbackSynopsis: 'O Nobel Daniel Kahneman revela os dois sistemas que governam nossa mente: o Sistema 1, rápido e intuitivo; e o Sistema 2, lento e analítico. Uma jornada fascinante pelos vieses cognitivos e armadilhas invisíveis que moldam nossas decisões.',
    fallbackMatchReason: 'A dissecação da mente humana entre intuição e razão complementa o olhar analítico presente nas suas escolhas.'
  },
  {
    id: 'codigo-limpo',
    title: 'Código Limpo',
    originalTitle: 'Clean Code',
    author: 'Robert C. Martin',
    publishedYear: 2008,
    categories: ['Tecnologia', 'Programação', 'Referência'],
    isbn: '9788576082675',
    pageCount: 464,
    fallbackSynopsis: 'Um guia essencial sobre a arte de escrever software legível, expressivo e sustentável. Através de estudos de caso e heurísticas práticas sobre nomes, funções, testes e refatoração, Robert Martin mostra como transformar código confuso em engenharia sólida.',
    fallbackMatchReason: 'A busca pela clareza estrutural e excelência técnica ressoa com o rigor analítico que você valoriza.'
  },
  {
    id: 'entendendo-algoritmos',
    title: 'Entendendo Algoritmos',
    originalTitle: 'Grokking Algorithms',
    author: 'Aditya Bhargava',
    publishedYear: 2016,
    categories: ['Tecnologia', 'Algoritmos', 'Educação'],
    isbn: '9788575225639',
    pageCount: 256,
    fallbackSynopsis: 'Uma introdução totalmente ilustrada e intuitiva aos algoritmos que movem a computação moderna. De busca binária e recursão a grafos, árvores e programação dinâmica, cada conceito complexo é explicado de forma visual e aplicável no dia a dia.',
    fallbackMatchReason: 'A clareza didática para destrinchar sistemas complexos combina com seu apreço por conteúdo objetivo e bem estruturado.'
  },
  {
    id: 'harry-potter-pedra-filosofal',
    title: 'Harry Potter e a Pedra Filosofal',
    originalTitle: 'Harry Potter and the Philosopher\'s Stone',
    author: 'J.K. Rowling',
    publishedYear: 1997,
    categories: ['Fantasia', 'Infantojuvenil', 'Bestseller'],
    coverUrl: 'https://books.google.com/books/content?id=wrOQLV6xB-wC&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788532530780',
    pageCount: 264,
    fallbackSynopsis: 'Criado pelos tios sem saber de sua verdadeira origem, Harry descobre aos 11 anos que é um bruxo convidado para a Escola de Magia e Bruxaria de Hogwarts. Entre amizades leais, segredos ocultos e um perigo antigo, começa uma das maiores sagas da fantasia moderna.',
    fallbackMatchReason: 'A jornada do herói que descobre pertencimento e coragem em um novo mundo dialoga com a força emocional das suas escolhas.'
  },
  {
    id: 'o-senhor-dos-aneis',
    title: 'O Senhor dos Anéis: A Sociedade do Anel',
    originalTitle: 'The Fellowship of the Ring',
    author: 'J.R.R. Tolkien',
    publishedYear: 1954,
    categories: ['Fantasia', 'Épico', 'Clássico'],
    isbn: '9788595084704',
    pageCount: 576,
    fallbackSynopsis: 'Ao herdar o misterioso Um Anel forjado pelo Senhor do Escuro Sauron, o jovem hobbit Frodo Bolseiro precisa deixar o Condado ao lado de oito companheiros rumo à Montanha da Perdição. O início da trilogia que moldou toda a fantasia épica contemporânea.',
    fallbackMatchReason: 'A missão impossível carregada por alguém comum reflete o tema da coragem silenciosa diante de grandes provações.'
  },
  {
    id: 'neuromancer',
    title: 'Neuromancer',
    originalTitle: 'Neuromancer',
    author: 'William Gibson',
    publishedYear: 1984,
    categories: ['Cyberpunk', 'Ficção Científica', 'Clássico'],
    isbn: '9788535914824',
    pageCount: 272,
    fallbackSynopsis: 'Case, um hacker decadente impedido de acessar a matriz, recebe a chance de recuperar suas habilidades se aceitar uma missão quase suicida contra uma poderosa inteligência artificial corporativa. O romance visionário que fundou o gênero cyberpunk.',
    fallbackMatchReason: 'A fusão de alta tecnologia e dilemas humanos antecipa questões de identidade e poder presentes em suas escolhas.'
  },
  {
    id: 'fundacao',
    title: 'Fundação',
    originalTitle: 'Foundation',
    author: 'Isaac Asimov',
    publishedYear: 1951,
    categories: ['Ficção Científica', 'Épico', 'Clássico'],
    coverUrl: 'https://books.google.com/books/content?id=5Y0tDwAAQBAJ&printsec=frontcover&img=1&zoom=1&fife=w800-h1200',
    isbn: '9788535914862',
    pageCount: 320,
    fallbackSynopsis: 'Usando a ciência matemática da psico-história, Hari Seldon prevê o colapso inevitável do Império Galáctico e trinta mil anos de barbárie. Para encurtar a era das trevas, ele funda uma colônia de cientistas nos confins da galáxia para preservar o conhecimento humano.',
    fallbackMatchReason: 'A ideia de modelar grandes movimentos históricos dialoga com o alcance épico e reflexivo que você valoriza.'
  },
  {
    id: 'vidas-secas',
    title: 'Vidas Secas',
    author: 'Graciliano Ramos',
    publishedYear: 1938,
    categories: ['Romance', 'Literatura Brasileira', 'Clássico'],
    isbn: '9788535914726',
    pageCount: 160,
    fallbackSynopsis: 'Em meio à seca implacável do sertão nordestino, o vaqueiro Fabiano, Sinhá Vitória, seus dois filhos e a cadela Baleia lutam para sobreviver à fome, à injustiça e à falta de palavras. Com prosa seca e precisa, um dos maiores monumentos da literatura brasileira.',
    fallbackMatchReason: 'A linguagem enxuta que espelha a dureza do sertão e a dignidade humana ressoa com a profundidade da ficção nacional.'
  },
  {
    id: 'grande-sertao-veredas',
    title: 'Grande Sertão: Veredas',
    author: 'João Guimarães Rosa',
    publishedYear: 1956,
    categories: ['Romance', 'Literatura Brasileira', 'Clássico'],
    isbn: '9788535910663',
    pageCount: 608,
    fallbackSynopsis: 'Em um longo monólogo a um interlocutor silencioso, o ex-jagunço Riobaldo revisita suas travessias pelo sertão mineiro, os combates sangrentos, o suposto pacto com o demônio e o amor secreto e dilacerante por Diadorim. Uma reinvenção épica da língua portuguesa.',
    fallbackMatchReason: 'A invenção linguística e a ambiguidade moral de Riobaldo ecoam a complexidade literária e filosófica que você aprecia.'
  },
  {
    id: 'ensaio-cegueira',
    title: 'Ensaio sobre a Cegueira',
    author: 'José Saramago',
    publishedYear: 1995,
    categories: ['Romance', 'Distopia', 'Prêmio Nobel'],
    isbn: '9788535914886',
    pageCount: 312,
    fallbackSynopsis: 'Uma misteriosa "treva branca" cega subitamente toda a população de uma cidade, levando o governo a isolar os primeiros infectados em um manicômio abandonado. Apenas uma mulher mantém a visão e testemunha a queda vertiginosa da civilização e da ética humana.',
    fallbackMatchReason: 'O colapso social visto por dentro expõe a fragilidade da empatia e da moralidade, conectando-se às suas escolhas mais intensas.'
  },
  {
    id: 'retrato-dorian-gray',
    title: 'O Retrato de Dorian Gray',
    originalTitle: 'The Picture of Dorian Gray',
    author: 'Oscar Wilde',
    publishedYear: 1890,
    categories: ['Romance', 'Clássico', 'Filosofia'],
    isbn: '9788535914909',
    pageCount: 256,
    fallbackSynopsis: 'Deslumbrado pela própria juventude pintada em uma tela, o belo Dorian Gray deseja permanecer eternamente jovem enquanto seu retrato envelhece em seu lugar. Atendido o pacto, mergulha em hedonismo e crueldade enquanto a pintura oculta revela sua alma corrompida.',
    fallbackMatchReason: 'A dualidade entre aparência e essência reflete a tensão psicológica e moral que atravessa suas obras favoritas.'
  },
  {
    id: 'meditacoes',
    title: 'Meditações',
    originalTitle: 'Meditations',
    author: 'Marco Aurélio',
    publishedYear: 180,
    categories: ['Filosofia', 'Estoicismo', 'Clássico'],
    isbn: '9788535914923',
    pageCount: 304,
    fallbackSynopsis: 'Escrito em tendas militares pelo imperador romano Marco Aurélio apenas para si mesmo, este diário filosófico reúne reflexões diretas sobre autocontrole, dever, aceitação do destino e serenidade diante da efemeridade da vida.',
    fallbackMatchReason: 'A filosofia como exercício prático de lucidez e equilíbrio interior conversa diretamente com leituras sobre propósito e caráter.'
  },
  {
    id: 'o-conto-da-aia',
    title: 'O Conto da Aia',
    originalTitle: 'The Handmaid\'s Tale',
    author: 'Margaret Atwood',
    publishedYear: 1985,
    categories: ['Distopia', 'Ficção Científica', 'Clássico'],
    isbn: '9788535914947',
    pageCount: 336,
    fallbackSynopsis: 'Na teocracia totalitária de Gilead, onde a fertilidade despencou, mulheres férteis como Offred são reduzidas a "aias" obrigadas a gerar filhos para os comandantes do regime. Entre memórias do passado e gestos secretos de resistência, um relato sufocante sobre liberdade.',
    fallbackMatchReason: 'O retrato íntimo da resistência sob um regime opressor dialoga com a força emocional e crítica das suas escolhas.'
  },
  {
    id: 'a-sombra-do-vento',
    title: 'A Sombra do Vento',
    originalTitle: 'La sombra del viento',
    author: 'Carlos Ruiz Zafón',
    publishedYear: 2001,
    categories: ['Mistério', 'Romance', 'Bestseller'],
    isbn: '9788535914961',
    pageCount: 480,
    fallbackSynopsis: 'Na Barcelona sombria do pós-guerra em 1945, o jovem Daniel Sempere é levado ao secreto Cemitério dos Livros Esquecidos e escolhe um romance raro de Julián Carax. Logo descobre que uma figura sinistra está queimando todos os exemplares da obra e ameaçando sua vida.',
    fallbackMatchReason: 'O mistério gótico envolvendo livros proibidos e memória celebra a paixão pela leitura presente no seu perfil.'
  },
  {
    id: 'o-psicanalista',
    title: 'O Psicanalista',
    originalTitle: 'The Analyst',
    author: 'John Katzenbach',
    publishedYear: 2002,
    categories: ['Thriller', 'Suspense', 'Bestseller'],
    isbn: '9788535914985',
    pageCount: 416,
    fallbackSynopsis: 'No dia de seu aniversário, o psicanalista Frederick Starks recebe uma carta anônima impiedosa: ele tem exatamente quinze dias para descobrir a identidade do remetente vingativo, ou terá que escolher entre o suicídio e a destruição de seus familiares.',
    fallbackMatchReason: 'O duelo psicológico em ritmo acelerado explora os labirintos da mente e da tensão narrativa.'
  },
  {
    id: 'o-silencio-dos-inocentes',
    title: 'O Silêncio dos Inocentes',
    originalTitle: 'The Silence of the Lambs',
    author: 'Thomas Harris',
    publishedYear: 1988,
    categories: ['Thriller', 'Suspense', 'Clássico'],
    isbn: '9788535915005',
    pageCount: 368,
    fallbackSynopsis: 'Para capturar o assassino em série conhecido como Buffalo Bill antes que outra vítima morra, a jovem recrutada do FBI Clarice Starling precisa entrevistar o brilhante e manipulador psiquiatra canibal Hannibal Lecter em sua cela de segurança máxima.',
    fallbackMatchReason: 'O jogo mental sofisticado entre investigador e antagonista entrega tensão psicológica de alto nível.'
  },
  {
    id: 'a-menina-que-roubava-livros',
    title: 'A Menina que Roubava Livros',
    originalTitle: 'The Book Thief',
    author: 'Markus Zusak',
    publishedYear: 2005,
    categories: ['Romance', 'Guerra', 'Bestseller'],
    isbn: '9788535915029',
    pageCount: 480,
    fallbackSynopsis: 'Narrado com ironia e ternura pela própria Morte, o romance acompanha Liesel Meminger na Alemanha nazista. Em meio aos horrores da guerra, a garota aprende a ler com o pai adotivo, resgata livros salvos das fogueiras e compartilha histórias no porão com um judeu escondido.',
    fallbackMatchReason: 'A sensibilidade humana diante da adversidade e o poder transformador das palavras conectam-se diretamente às suas escolhas.'
  },
  {
    id: 'educada',
    title: 'Educada',
    originalTitle: 'Educated',
    author: 'Tara Westover',
    publishedYear: 2018,
    categories: ['Memórias', 'Biografia', 'Bestseller'],
    isbn: '9788535915043',
    pageCount: 352,
    fallbackSynopsis: 'Criada nas montanhas de Idaho por pais fundamentalistas e isolacionistas que rejeitavam escolas e hospitais, Tara só pisou em uma sala de aula aos 17 anos. Sua autobiografia comovente narra a jornada autodidata até o doutorado em Cambridge e o doloroso preço da emancipação.',
    fallbackMatchReason: 'Uma história real de superação, memória e construção da própria voz, com forte ressonância biográfica e emocional.'
  },
  {
    id: 'o-homem-em-busca-de-sentido',
    title: 'O Homem em Busca de Sentido',
    originalTitle: 'Man\'s Search for Meaning',
    author: 'Viktor Frankl',
    publishedYear: 1946,
    categories: ['Psicologia', 'Filosofia', 'Clássico'],
    isbn: '9788535915067',
    pageCount: 184,
    fallbackSynopsis: 'Sobrevivente dos campos de concentração nazistas, o psiquiatra austríaco Viktor Frankl relata suas memórias extremas e apresenta os fundamentos da logoterapia: a tese de que o motor humano essencial não é o prazer, mas a busca por significado mesmo diante do sofrimento.',
    fallbackMatchReason: 'A combinação de relato biográfico real e reflexão profunda sobre resiliência e propósito dialoga com todo o seu trio de livros.'
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
