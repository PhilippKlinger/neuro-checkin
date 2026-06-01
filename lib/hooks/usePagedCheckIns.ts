import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import type { CheckIn } from '../types/checkin';
import { groupCheckInsByDate, HistorySection } from '../utils/groupByDate';

export const PAGE_SIZE = 30;

export type FetchPage = (limit: number, offset: number) => Promise<CheckIn[]>;

interface LoaderState {
  items: CheckIn[];
  hasMore: boolean;
}

export function createPagedLoader(fetchPage: FetchPage) {
  let items: CheckIn[] = [];
  let offset = 0;
  let hasMore = true;

  return {
    async loadFirst(): Promise<LoaderState> {
      items = [];
      offset = 0;
      const page = await fetchPage(PAGE_SIZE, 0);
      items = page;
      hasMore = page.length >= PAGE_SIZE;
      offset = page.length;
      return { items: [...items], hasMore };
    },

    async loadNext(): Promise<LoaderState> {
      if (!hasMore) return { items: [...items], hasMore };
      const page = await fetchPage(PAGE_SIZE, offset);
      items = [...items, ...page];
      hasMore = page.length >= PAGE_SIZE;
      offset += page.length;
      return { items: [...items], hasMore };
    },

    async reset(): Promise<LoaderState> {
      return this.loadFirst();
    },
  };
}

export function usePagedCheckIns(fetchPage: FetchPage) {
  const [items, setItems] = useState<CheckIn[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [loader] = useState(() => createPagedLoader(fetchPage));

  const sections: HistorySection[] = useMemo(() => groupCheckInsByDate(items), [items]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setIsLoading(true);
      loader.loadFirst().then((result) => {
        if (cancelled) return;
        setItems(result.items);
        setHasMore(result.hasMore);
        setIsLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }, [loader])
  );

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    loader.loadNext().then((result) => {
      setItems(result.items);
      setHasMore(result.hasMore);
      setIsLoadingMore(false);
    });
  }, [hasMore, isLoadingMore, loader]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    loader.reset().then((result) => {
      setItems(result.items);
      setHasMore(result.hasMore);
      setIsLoading(false);
    });
  }, [loader]);

  return { items, sections, hasMore, isLoading, isLoadingMore, loadMore, refresh };
}
