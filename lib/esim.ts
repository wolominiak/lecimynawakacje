import esim from '@/data/esim.json';
import type { Country } from './types';

export type EsimInfo = { package?: number; unlimited?: number };

export function esimFor(c: Country): EsimInfo | null {
  return (esim.countries as Record<string, EsimInfo>)[c.code.toLowerCase()] || null;
}

/** Zamaskowany link do karty eSIM danego kraju w sklepie esimgo.is (wersja PL) */
export function esimUrl(c: Country, kind: 'package' | 'unlimited' = 'package') {
  return `/go/esim/${c.code.toLowerCase()}_${kind}/`;
}

export const usd = (n: number) => n.toFixed(2).replace('.', ',') + ' USD';
