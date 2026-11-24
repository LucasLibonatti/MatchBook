import { describe, it, expect } from 'vitest';
import { upgradeGoogleBookCover, deduplicateResults } from '../services/bookCoverService';
import type { BookSearchResult } from '../types/book';

describe('upgradeGoogleBookCover', () => {
  it('upgrades http to https, strips edge=curl, and appends fife high-res param', () => {
    const input = 'http://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=1&edge=curl';
    const output = upgradeGoogleBookCover(input);
    expect(output).toBe(
      'https://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=1&fife=w800-h1200'
    );
  });

  it('does not duplicate fife parameter if already present', () => {
    const input = 'https://books.google.com/books/content?id=abc&fife=w800-h1200';
    expect(upgradeGoogleBookCover(input)).toBe(input);
  });
});

describe('deduplicateResults', () => {
  it('deduplicates books ignoring accents, punctuation, and case', () => {
    const list: BookSearchResult[] = [
      { id: '1', title: 'Memórias Póstumas', author: 'Machado de Assis', categories: [], source: 'curated' },
      { id: '2', title: 'Memorias Postumas!', author: 'machado de assis', categories: [], source: 'google' },
      { id: '3', title: 'Dom Casmurro', author: 'Machado de Assis', categories: [], source: 'openlibrary' },
    ];

    const deduped = deduplicateResults(list);
    expect(deduped).toHaveLength(2);
    expect(deduped[0].id).toBe('1');
    expect(deduped[1].id).toBe('3');
  });
});
