import { useMemo } from 'react';

interface EditorialCoverProps {
  title: string;
  author: string;
  category?: string;
  className?: string;
}

const PALETTES = [
  { bg: '#C65D3A', accent: '#8B3E25', ornament: '#F5E6D3' },
  { bg: '#2C3E4A', accent: '#1A2A34', ornament: '#D4C4A8' },
  { bg: '#3D5A4A', accent: '#284030', ornament: '#E8DCC8' },
  { bg: '#6B2D3A', accent: '#4A1F28', ornament: '#F0E0E3' },
  { bg: '#2D2D35', accent: '#1A1A20', ornament: '#C9C4B8' },
  { bg: '#4A4038', accent: '#352D26', ornament: '#E5DCC8' },
  { bg: '#3A4D5C', accent: '#283844', ornament: '#D0DCE8' },
  { bg: '#5C4033', accent: '#422D24', ornament: '#E8DDD4' },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function EditorialCover({ title, author, category, className = '' }: EditorialCoverProps) {
  const palette = useMemo(() => {
    const idx = hashString(title + author) % PALETTES.length;
    return PALETTES[idx];
  }, [title, author]);

  const shortTitle = useMemo(() => {
    if (title.length <= 22) return title;
    const words = title.split(' ');
    if (words.length > 1 && words[0].length < 15) {
      return words.slice(0, 2).join(' ');
    }
    return title.slice(0, 22) + '…';
  }, [title]);

  const shortAuthor = useMemo(() => {
    return author.length > 18 ? author.slice(0, 18) + '…' : author;
  }, [author]);

  const ornament = useMemo(() => {
    const ornaments = ['◆', '◇', '◈', '◆', '▣', '▢', '⬟', '⬡'];
    return ornaments[hashString(title) % ornaments.length];
  }, [title]);

  return (
    <div
      className={`book-cover-frame flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden ${className}`}
      style={{
        backgroundColor: palette.bg,
        color: palette.ornament,
      }}
      role="img"
      aria-label={`Capa editorial de ${title} por ${author}`}
    >
      <div className="absolute inset-0 opacity-5" aria-hidden="true">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <pattern id="dots" x="0" y="0" width="15" height="15" patternUnits="userSpaceOnUse">
              <circle cx="7.5" cy="7.5" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#dots)" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
        <div className="mb-3 sm:mb-4 flex items-center justify-center">
          <span
            style={{ fontSize: '2.5rem', lineHeight: 1, color: palette.accent }}
            aria-hidden="true"
          >
            {ornament}
          </span>
        </div>

        <h3 className="font-display italic text-base sm:text-lg md:text-xl lg:text-2xl leading-tight mb-2 sm:mb-3 px-2">
          {shortTitle}
        </h3>

        <div className="h-px w-1/3 mx-auto mb-3 sm:mb-4" style={{ backgroundColor: palette.accent }} aria-hidden="true" />

        <p className="font-mono text-[0.65rem] sm:text-[0.7rem] uppercase tracking-wider opacity-80">
          {shortAuthor}
        </p>

        {category && (
          <p className="mt-2 text-[0.55rem] sm:text-[0.6rem] uppercase tracking-widest opacity-60">
            {category}
          </p>
        )}

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-30" aria-hidden="true">
          <span style={{ fontSize: '0.5rem' }}>{ornament}</span>
          <span className="h-px w-8" style={{ backgroundColor: 'currentColor' }} />
          <span style={{ fontSize: '0.5rem' }}>{ornament}</span>
        </div>
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute left-0 top-0 bottom-0 w-2" style={{
          background: `linear-gradient(90deg, ${palette.accent}80, transparent)`,
        }} />
        <div className="absolute right-0 top-0 bottom-0 w-1" style={{
          background: `linear-gradient(270deg, ${palette.ornament}20, transparent)`,
        }} />
      </div>
    </div>
  );
}