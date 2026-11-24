import { describe, it, expect } from 'vitest';
import { normalizeRecommendations } from '../../server/routes/recommendations';
import { generateFallbackRecommendations } from '../services/groqService';
import type { SeedBook } from '../types/book';

const SAMPLE_SEEDS: SeedBook[] = [
  {
    id: '1984',
    title: '1984',
    author: 'George Orwell',
    publishedYear: 1949,
    categories: ['Distopia', 'Ficção Científica', 'Clássico'],
  },
  {
    id: 'duna',
    title: 'Duna',
    author: 'Frank Herbert',
    publishedYear: 1965,
    categories: ['Ficção Científica', 'Épico'],
  },
  {
    id: 'crime-e-castigo',
    title: 'Crime e Castigo',
    author: 'Fiódor Dostoiévski',
    publishedYear: 1866,
    categories: ['Romance', 'Clássico', 'Filosofia'],
  },
];

describe('normalizeRecommendations', () => {
  it('generates deterministic IDs, clamps matchPercentage, and sorts descending', () => {
    const raw = [
      {
        title: 'Admirável Mundo Novo',
        author: 'Aldous Huxley',
        publishedYear: 1932,
        pageCount: 312,
        categories: ['Distopia', 'Clássico'],
        matchPercentage: 105,
        synopsis: 'Uma sociedade futurista condicionada pela engenharia genética.',
        matchReason: 'Dialoga diretamente com o controle social de 1984.',
      },
      {
        title: 'Fahrenheit 451',
        author: 'Ray Bradbury',
        publishedYear: '1953',
        pageCount: '216',
        categories: ['Distopia', 'Ficção Científica'],
        matchPercentage: 70,
        synopsis: 'Um bombeiro encarregado de queimar livros questiona o sistema.',
        matchReason: 'Compartilha o alerta sobre censura presente em 1984.',
      },
    ];

    const result = normalizeRecommendations(raw, SAMPLE_SEEDS, []);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('ai-admiravel-mundo-novo-aldous-huxley');
    expect(result[0].matchPercentage).toBe(99);
    expect(result[1].id).toBe('ai-fahrenheit-451-ray-bradbury');
    expect(result[1].matchPercentage).toBe(80);
    expect(result[1].publishedYear).toBe(1953);
    expect(result[1].pageCount).toBe(216);
  });

  it('filters out seed books, excluded titles, and duplicate recommendations', () => {
    const raw = [
      { title: '1984', author: 'George Orwell', matchPercentage: 99 },
      { title: 'Neuromancer', author: 'William Gibson', matchPercentage: 95 },
      { title: 'Neuromancer', author: 'William Gibson', matchPercentage: 92 },
      { title: 'Fundação', author: 'Isaac Asimov', matchPercentage: 94 },
    ];

    const result = normalizeRecommendations(raw, SAMPLE_SEEDS, ['Fundação']);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Neuromancer');
  });
});

describe('generateFallbackRecommendations', () => {
  it('returns up to 10 curated books excluding seeds and excluded titles with unique IDs', () => {
    const result = generateFallbackRecommendations(SAMPLE_SEEDS, ['Dom Casmurro']);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(10);

    const titles = result.map((r) => r.title.toLowerCase());
    expect(titles).not.toContain('1984');
    expect(titles).not.toContain('duna');
    expect(titles).not.toContain('dom casmurro');

    const ids = new Set(result.map((r) => r.id));
    expect(ids.size).toBe(result.length);
  });
});
