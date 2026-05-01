import { Car, Brand, Model } from './types';
import { demoBrands, demoCars, demoModels, getDemoCar } from './demo-cars';

const configuredApi = process.env.NEXT_PUBLIC_API_URL;
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
export const API = configuredApi || (isDemoMode || process.env.NODE_ENV === 'production' ? '' : 'http://127.0.0.1:4000/api');
export const phone = '8 775 666 99 88';
export const wa = 'https://wa.me/77756669988';
export const address = 'Астана даңғылы 30, Қызылорда';
export const hours = '09:00–20:00';

function warnFallback(message: string) {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
    console.warn(`[BRO MOTORS demo fallback] ${message}`);
  }
}

function shouldUseDemo() {
  return isDemoMode || !API;
}

function demoCarsResult(): { cars: Car[]; demo: true } {
  return { cars: demoCars, demo: true };
}

export function money(value: number) {
  return new Intl.NumberFormat('ru-KZ').format(value) + ' ₸';
}

export function statusLabel(status: Car['status']) {
  return { available: 'В наличии', on_way: 'В пути', reserved: 'Забронировано', sold: 'SOLD' }[status];
}

export function img(path: string) {
  return path.startsWith('http') ? path : path;
}

export function carWhatsapp(car: Car) {
  return `${wa}?text=${encodeURIComponent(`Здравствуйте! Интересует ${car.brand.name} ${car.model.name} ${car.year} за ${money(car.price)}. Можно подробнее?`)}`;
}

export async function getCars(query = ''): Promise<Car[]> {
  const result = await getCarsResult(query);
  return result.cars;
}

export async function getCarsResult(query = ''): Promise<{ cars: Car[]; error?: string }> {
  if (shouldUseDemo()) return demoCarsResult();
  try {
    const res = await fetch(`${API}/cars${query}`, { next: { revalidate: 30 } });
    if (!res.ok) {
      warnFallback(`GET /cars returned ${res.status}; using demo cars.`);
      return demoCarsResult();
    }
    return { cars: await res.json() };
  } catch (error) {
    warnFallback(`GET /cars failed (${error instanceof Error ? error.message : 'unknown error'}); using demo cars.`);
    return demoCarsResult();
  }
}

export async function getCar(slug: string): Promise<Car | null> {
  if (shouldUseDemo()) return getDemoCar(slug);
  try {
    const res = await fetch(`${API}/cars/${slug}`, { next: { revalidate: 30 } });
    if (!res.ok) {
      warnFallback(`GET /cars/${slug} returned ${res.status}; using demo car.`);
      return getDemoCar(slug);
    }
    const car = await res.json();
    return car || getDemoCar(slug);
  } catch (error) {
    warnFallback(`GET /cars/${slug} failed (${error instanceof Error ? error.message : 'unknown error'}); using demo car.`);
    return getDemoCar(slug);
  }
}

export async function getBrands(): Promise<Brand[]> {
  if (shouldUseDemo()) return demoBrands;
  try {
    const res = await fetch(`${API}/brands`, { next: { revalidate: 60 } });
    if (!res.ok) return demoBrands;
    return res.json();
  } catch {
    return demoBrands;
  }
}

export async function getModels(): Promise<Model[]> {
  if (shouldUseDemo()) return demoModels;
  try {
    const res = await fetch(`${API}/models`, { next: { revalidate: 60 } });
    if (!res.ok) return demoModels;
    return res.json();
  } catch {
    return demoModels;
  }
}
