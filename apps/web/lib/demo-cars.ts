import { Brand, Car, Model } from './types';

const hyundai: Brand = { id: 'demo-brand-hyundai', name: 'Hyundai', slug: 'hyundai' };

const models: Record<string, Model> = {
  grandeur: { id: 'demo-model-grandeur', brandId: hyundai.id, name: 'Grandeur', slug: 'grandeur', brand: hyundai },
  sonata: { id: 'demo-model-sonata', brandId: hyundai.id, name: 'Sonata', slug: 'sonata', brand: hyundai },
  creta: { id: 'demo-model-creta', brandId: hyundai.id, name: 'Creta', slug: 'creta', brand: hyundai },
};

function images(slug: string, count: number, title: string) {
  return Array.from({ length: count }, (_, index) => ({
    id: `demo-image-${slug}-${index + 1}`,
    path: `/uploads/cars/${slug}/${index + 1}.jpg`,
    alt: `${title} фото ${index + 1}`,
    sortOrder: index,
    isCover: index === 0,
  }));
}

export const demoBrands: Brand[] = [{ ...hyundai, models: Object.values(models) }];

export const demoModels: Model[] = Object.values(models);

export const demoCars: Car[] = [
  {
    id: 'demo-car-hyundai-grandeur',
    brandId: hyundai.id,
    modelId: models.grandeur.id,
    slug: 'hyundai-grandeur',
    title: 'Hyundai Grandeur',
    year: 2013,
    price: 8_800_000,
    mileage: 185_000,
    engineVolume: '3.0',
    bodyType: 'Седан',
    fuelType: 'Бензин',
    transmission: 'Автомат',
    driveType: 'Передний',
    color: 'Серый металлик',
    description: 'Жайлылық пен статус қатар жүрген бизнес-класс седаны! Hyundai Grandeur — кең салон, жұмсақ жүріс және қуатты қозғалтқышты қалайтындар үшін тамаша таңдау. Келіп көріп, тиімді шарттармен рәсімдеуге болады!',
    status: 'available',
    isNewArrival: true,
    isDiscount: false,
    isPublished: true,
    brand: hyundai,
    model: models.grandeur,
    images: images('hyundai-grandeur', 13, 'Hyundai Grandeur 2013'),
  },
  {
    id: 'demo-car-hyundai-sonata',
    brandId: hyundai.id,
    modelId: models.sonata.id,
    slug: 'hyundai-sonata',
    title: 'Hyundai Sonata',
    year: 2022,
    price: 11_500_000,
    mileage: 47_000,
    engineVolume: '2.0',
    bodyType: 'Седан',
    fuelType: 'Бензин',
    transmission: 'Автомат',
    driveType: 'Передний',
    color: 'Белый перламутр',
    description: 'Стильді, үнемді әрі жайлы седан. Қалаға да, күнделікті мінуге де тамаша таңдау. Тиімді рәсімдеу және бөліп төлеу мүмкіндігі бар.',
    status: 'available',
    isNewArrival: true,
    isDiscount: false,
    isPublished: true,
    brand: hyundai,
    model: models.sonata,
    images: images('hyundai-sonata', 8, 'Hyundai Sonata 2022'),
  },
  {
    id: 'demo-car-hyundai-creta',
    brandId: hyundai.id,
    modelId: models.creta.id,
    slug: 'hyundai-creta',
    title: 'Hyundai Creta',
    year: 2022,
    price: 10_300_000,
    mileage: 38_000,
    engineVolume: '1.6',
    bodyType: 'Кроссовер',
    fuelType: 'Бензин',
    transmission: 'Автомат',
    driveType: 'Полный',
    color: 'Синий металлик',
    description: 'Ықшам, үнемді және жоғары сұраныстағы кроссовер. Қалаға да, күнделікті мінуге де өте ыңғайлы. Тиімді рәсімдеу және бөліп төлеу мүмкіндігі бар.',
    status: 'available',
    isNewArrival: true,
    isDiscount: false,
    isPublished: true,
    brand: hyundai,
    model: models.creta,
    images: images('hyundai-creta', 10, 'Hyundai Creta 2022'),
  },
];

export function getDemoCar(slug: string) {
  const car = demoCars.find((item) => item.slug === slug);
  if (!car) return null;
  return { ...car, similar: demoCars.filter((item) => item.slug !== slug).slice(0, 3) };
}
