import { describe, it, expect, beforeEach } from 'vitest';
import { addRecentSeeds, getRecentSeeds, removeRecentSeedById } from '../utils/storage';
import type { SeedBook } from '../types/book';

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? (map.get(key) ?? null) : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

function makeBook(id: string, title: string, author = 'Autor'): SeedBook {
  return { id, title, author, categories: ['Ficção'] };
}

describe('recentSeeds storage history', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
  });

  it('caps recent seeds at 5 unique items ordered most-recent-first', () => {
    addRecentSeeds([makeBook('1', 'Livro 1'), makeBook('2', 'Livro 2'), makeBook('3', 'Livro 3')]);
    addRecentSeeds([makeBook('4', 'Livro 4'), makeBook('5', 'Livro 5'), makeBook('6', 'Livro 6')]);
    addRecentSeeds([makeBook('2', 'Livro 2')]);

    const recent = getRecentSeeds();
    expect(recent).toHaveLength(5);
    expect(recent.map((b) => b.id)).toEqual(['2', '4', '5', '6', '1']);
  });

  it('removes a specific book from recent history by id', () => {
    addRecentSeeds([makeBook('a', 'Dom Casmurro'), makeBook('b', '1984'), makeBook('c', 'Duna')]);
    const remaining = removeRecentSeedById('b');

    expect(remaining.map((b) => b.id)).toEqual(['a', 'c']);
    expect(getRecentSeeds().map((b) => b.id)).toEqual(['a', 'c']);
  });
});
