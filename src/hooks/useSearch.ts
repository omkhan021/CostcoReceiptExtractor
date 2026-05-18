import {useState, useCallback, useRef, useEffect} from 'react';
import {searchItems} from '../search/searchService';
import {
  getSearchesUsedToday,
  incrementSearchCount,
} from '../db/configRepository';
import {usePremiumStore} from '../store/premiumStore';
import type {SearchResult} from '../types';
import {SEARCH_DEBOUNCE_MS, FREE_SEARCH_LIMIT, FREE_HISTORY_MONTHS} from '../utils/constants';
import dayjs from 'dayjs';

function getFreeCutoff(): string {
  return dayjs().subtract(FREE_HISTORY_MONTHS, 'month').format('YYYY-MM-DD');
}

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchesUsed, setSearchesUsed] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevQueryWasEmpty = useRef(true);
  const {isPremium} = usePremiumStore();

  useEffect(() => {
    getSearchesUsedToday().then(setSearchesUsed);
  }, []);

  const search = useCallback(
    (text: string) => {
      setQuery(text);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      if (!text.trim()) {
        setResults([]);
        prevQueryWasEmpty.current = true;
        return;
      }

      debounceTimer.current = setTimeout(async () => {
        // Starting a new search session (came from empty query)
        const isNewSession = prevQueryWasEmpty.current;
        prevQueryWasEmpty.current = false;

        if (!isPremium && isNewSession) {
          const used = await getSearchesUsedToday();
          if (used >= FREE_SEARCH_LIMIT) {
            setLimitReached(true);
            return;
          }
          const newCount = await incrementSearchCount();
          setSearchesUsed(newCount);
        }

        setIsSearching(true);
        try {
          const since = isPremium ? undefined : getFreeCutoff();
          const found = await searchItems(text, since);
          setResults(found);
        } finally {
          setIsSearching(false);
        }
      }, SEARCH_DEBOUNCE_MS);
    },
    [isPremium],
  );

  const dismissLimit = useCallback(() => {
    setLimitReached(false);
    setQuery('');
    setResults([]);
    prevQueryWasEmpty.current = true;
  }, []);

  return {query, results, isSearching, search, searchesUsed, limitReached, dismissLimit};
}
