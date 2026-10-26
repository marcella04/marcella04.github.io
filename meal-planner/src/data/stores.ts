import type { Store } from '../types';
const label = 'Demo address (not a real location)';
export const stores: Store[] = [
  { id: 'demo-market-central', name: 'Demo Market Central', chain: 'Demo Market', areaId: 'central', latitude: 40.012, longitude: -100.01, addressLabel: label, pricingSupport: 'full', dataStatus: 'sample' },
  { id: 'value-grocery-central', name: 'Value Grocery Central', chain: 'Value Grocery', areaId: 'central', latitude: 39.985, longitude: -99.975, addressLabel: label, pricingSupport: 'partial', dataStatus: 'sample' },
  { id: 'value-grocery-north', name: 'Value Grocery North', chain: 'Value Grocery', areaId: 'north', latitude: 40.07, longitude: -100.02, addressLabel: label, pricingSupport: 'partial', dataStatus: 'sample' },
  { id: 'neighborhood-foods-south', name: 'Neighborhood Foods South', chain: 'Neighborhood Foods', areaId: 'south', latitude: 39.93, longitude: -100.015, addressLabel: label, pricingSupport: 'full', dataStatus: 'sample' },
  { id: 'corner-pantry-south', name: 'Corner Pantry South', chain: 'Corner Pantry', areaId: 'south', latitude: 39.955, longitude: -99.985, addressLabel: label, pricingSupport: 'partial', dataStatus: 'sample' },
];
