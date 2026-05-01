import type { MetadataRoute } from 'next';
import { getCars } from '../lib/api';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const cars = await getCars();
  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/catalog`, lastModified: new Date() },
    ...cars.map((car) => ({ url: `${base}/catalog/${car.slug}`, lastModified: new Date() })),
  ];
}
