import type { Seller } from '../types';

export const PPAP_RATE = 0.025;

export function computePpap(propertyPrice: number, seller: Seller): number {
  if (seller !== 'INDIVIDUAL') return 0;
  return propertyPrice * PPAP_RATE;
}
