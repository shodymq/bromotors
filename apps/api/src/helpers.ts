import { Prisma } from '@bromotors/db';

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яёәғқңөұүһі]+/giu, '-')
    .replace(/^-|-$/g, '');
}

export function publicCarInclude() {
  return {
    brand: true,
    model: true,
    images: { orderBy: { sortOrder: 'asc' as const } },
  };
}

export function carWhere(query: {
  q?: string;
  brand?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  priceFrom?: number;
  priceTo?: number;
  mileageFrom?: number;
  mileageTo?: number;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  status?: string;
}) {
  const where: Prisma.CarWhereInput = { isPublished: true };
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: 'insensitive' } },
      { brand: { name: { contains: query.q, mode: 'insensitive' } } },
      { model: { name: { contains: query.q, mode: 'insensitive' } } },
    ];
  }
  if (query.brand) where.brand = { slug: query.brand };
  if (query.model) where.model = { slug: query.model };
  if (query.status) where.status = query.status as never;
  if (query.bodyType) where.bodyType = { equals: query.bodyType, mode: 'insensitive' };
  if (query.fuelType) where.fuelType = { equals: query.fuelType, mode: 'insensitive' };
  if (query.transmission) where.transmission = { equals: query.transmission, mode: 'insensitive' };
  if (query.yearFrom || query.yearTo) where.year = { gte: query.yearFrom, lte: query.yearTo };
  if (query.priceFrom || query.priceTo) where.price = { gte: query.priceFrom, lte: query.priceTo };
  if (query.mileageFrom || query.mileageTo) where.mileage = { gte: query.mileageFrom, lte: query.mileageTo };
  return where;
}

export function carOrder(sort?: string): Prisma.CarOrderByWithRelationInput {
  if (sort === 'price_asc') return { price: 'asc' };
  if (sort === 'price_desc') return { price: 'desc' };
  if (sort === 'year_desc') return { year: 'desc' };
  if (sort === 'mileage_asc') return { mileage: 'asc' };
  return { createdAt: 'desc' };
}

export function cleanText(value?: string | null) {
  return value?.replace(/[<>]/g, '').trim() || undefined;
}
