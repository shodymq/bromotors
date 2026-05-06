export type Brand = { id: string; name: string; slug: string; models?: Model[] };
export type Model = { id: string; brandId: string; name: string; slug: string; brand?: Brand };
export type CarImage = { id: string; path: string; alt: string; sortOrder: number; isCover: boolean };
export type Car = {
  id: string; brandId: string; modelId: string; slug: string; title: string; year: number; price: number;
  mileage?: number | null; engineVolume: string; bodyType?: string | null; fuelType?: string | null;
  transmission?: string | null; driveType?: string | null; color?: string | null; description: string;
  status: 'available' | 'on_way' | 'reserved' | 'sold'; isNewArrival: boolean; isDiscount: boolean; isPublished: boolean;
  brand: Brand; model: Model; images: CarImage[]; similar?: Car[];
};
export type CreditSetting = { rate: number; minDownPercent: number; maxMonths: number };
