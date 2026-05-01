import { Car, Brand, Model } from './types';

export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export const phone = '8 775 666 99 88';
export const wa = 'https://wa.me/77756669988';
export const address = 'Астана даңғылы 30, Қызылорда';
export const hours = '09:00–20:00';

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
  try {
    const res = await fetch(`${API}/cars${query}`, { next: { revalidate: 30 } });
    if (!res.ok) return { cars: [], error: `API вернул статус ${res.status}` };
    return { cars: await res.json() };
  } catch {
    return { cars: [], error: `API недоступен: ${API}` };
  }
}

export async function getCar(slug: string): Promise<Car | null> {
  try {
    const res = await fetch(`${API}/cars/${slug}`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getBrands(): Promise<Brand[]> {
  try {
    const res = await fetch(`${API}/brands`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getModels(): Promise<Model[]> {
  try {
    const res = await fetch(`${API}/models`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
