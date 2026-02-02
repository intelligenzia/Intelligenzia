'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { searchVocabulary, type VocabularyTerm } from '@/lib/vocabulary-data';

interface VocabularySearchProps {
  locale?: 'fi' | 'en';
}

export function VocabularySearch({ locale = 'fi' }: VocabularySearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VocabularyTerm[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const isEnglish = locale === 'en';
  const basePath = isEnglish ? '/vocabulary' : '/sanasto';

  // Search when query changes
  useEffect(() => {
    if (query.length >= 2) {
      const searchResults = searchVocabulary(query);
      setResults(searchResults.slice(0, 8)); // Limit to 8 results
      setIsOpen(searchResults.length > 0);
      setSelectedIndex(-1);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigateToTerm = useCallback(
    (term: VocabularyTerm) => {
      // Use English slug for English locale (v-z instead of v-o)
      const slug = isEnglish && term.slug === 'v-o' ? 'v-z' : term.slug;
      const anchor = isEnglish
        ? term.english.toLowerCase().replace(/\s+/g, '-')
        : term.finnish.toLowerCase().replace(/\s+/g, '-');
      router.push(`${basePath}/${slug}#${anchor}`);
      setIsOpen(false);
      setQuery('');
    },
    [router, basePath, isEnglish]
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          navigateToTerm(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={
            isEnglish
              ? 'Search terms in English or Finnish...'
              : 'Etsi käsitettä suomeksi tai englanniksi...'
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="w-full"
          aria-label={isEnglish ? 'Search glossary' : 'Hae sanastosta'}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          role="combobox"
        />
        <svg
          className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {isOpen && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg"
          role="listbox"
        >
          {results.map((term, index) => (
            <button
              key={`${term.finnish}-${term.slug}`}
              className={`flex w-full flex-col items-start px-4 py-3 text-left transition-colors hover:bg-accent ${
                index === selectedIndex ? 'bg-accent' : ''
              }`}
              onClick={() => navigateToTerm(term)}
              onMouseEnter={() => setSelectedIndex(index)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="flex items-baseline gap-2">
                {isEnglish ? (
                  <>
                    <span className="font-medium">{term.english}</span>
                    <span className="text-sm text-muted-foreground">({term.finnish})</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium">{term.finnish}</span>
                    <span className="text-sm text-muted-foreground">({term.english})</span>
                  </>
                )}
              </div>
              <span className="mt-0.5 text-sm text-muted-foreground">{term.description}</span>
              <span className="mt-1 text-xs text-muted-foreground/70">{term.section}</span>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card p-4 text-center text-sm text-muted-foreground shadow-lg">
          {isEnglish ? `No results for "${query}"` : `Ei tuloksia haulle "${query}"`}
        </div>
      )}
    </div>
  );
}
