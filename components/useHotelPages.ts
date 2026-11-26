'use client';
import { useEffect, useState } from 'react';

// Mapa id hotelu -> slug karty hotelu (ładowana raz na sesję)
let p: Promise<Record<string, string>> | null = null;
const load = () => (p ||= fetch('/hotels-index.json/').then((r) => (r.ok ? r.json() : {})).catch(() => ({})));

export function useHotelPages() {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => { load().then(setMap); }, []);
  return map;
}
