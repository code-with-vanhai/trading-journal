"use client";

import useSWR from 'swr';

const fetcher = async (url) => {
  const start = Date.now();
  const res = await fetch(url, { cache: 'no-store' });
  const ms = Date.now() - start;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text} (${ms}ms)`);
  }
  return res.json();
};

export function useMarketData(tickers, options = {}) {
  const list = Array.isArray(tickers)
    ? tickers.filter(Boolean).map((t) => t.toUpperCase())
    : [];
  const key = list.length > 0 ? `/api/market-data?tickers=${list.join(',')}` : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000, // 60s: khớp TTL memory cache server
    errorRetryCount: 2,
    ...options,
  });

  return {
    data: data || {},
    error,
    isLoading,
    mutate,
  };
}


