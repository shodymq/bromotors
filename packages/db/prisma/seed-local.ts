import { PrismaClient, CarStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();
const root = path.resolve(__dirname, '../../..');
const uploadRoot = path.resolve(root, 'apps/web/public/uploads/cars');
const devAdminEmail = 'admin@bromotors.local';
const devAdminPassword = 'BroMotors123!';

type SeedCar = {
  brand: string;
  model: string;
  title: string;
  year: number;
  engineVolume: string;
  price: number;
  description: string;
  status: CarStatus;
  isNewArrival: boolean;
  isPublished: boolean;
};

const cars: SeedCar[] = [
  {
    brand: 'Hyundai',
    model: 'Grandeur',
    title: 'Hyundai Grandeur',
    year: 2013,
    engineVolume: '3.0',
    price: 8_800_000,
    description:
      'Жайлылық пен статус қатар жүрген бизнес-класс седаны! Hyundai Grandeur — кең салон, жұмсақ жүріс және қуатты қозғалтқышты қалайтындар үшін тамаша таңдау. Келіп көріп, тиімді шарттармен рәсімдеуге болады!',
    status: CarStatus.available,
    isNewArrival: true,
    isPublished: true,
  },
  {
    brand: 'Hyundai',
    model: 'Sonata',
    title: 'Hyundai Sonata',
    year: 2022,
    engineVolume: '2.0',
    price: 11_500_000,
    description:
      'Стильді, үнемді әрі жайлы седан. Қалаға да, күнделікті мінуге де тамаша таңдау. Тиімді рәсімдеу және бөліп төлеу мүмкіндігі бар.',
    status: CarStatus.available,
    isNewArrival: true,
    isPublished: true,
  },
  {
    brand: 'Hyundai',
    model: 'Creta',
    title: 'Hyundai Creta',
    year: 2022,
    engineVolume: '1.6',
    price: 10_300_000,
    description:
      'Ықшам, үнемді және жоғары сұраныстағы кроссовер. Қалаға да, күнделікті мінуге де өте ыңғайлы. Тиімді рәсімдеу және бөліп төлеу мүмкіндігі бар.',
    status: CarStatus.available,
    isNewArrival: true,
    isPublished: true,
  },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яёәғқңөұүһі]+/giu, '-')
    .replace(/^-|-$/g, '');
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9а-яёәғқңөұүһі]+/giu, '');
}

function imageSort(a: string, b: string) {
  const an = path.parse(a).name;
  const bn = path.parse(b).name;
  if (an === '1') return -1;
  if (bn === '1') return 1;
  return a.localeCompare(b, undefined, { numeric: true });
}

function findPhotoDir(car: SeedCar) {
  const expected = normalize(`${car.brand} ${car.model}`);
  const dirs = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !['apps', 'packages', 'node_modules', '.git'].includes(name));

  const exact = dirs.find((name) => normalize(name).includes(expected));
  if (exact) return path.join(root, exact);

  const tokens = [car.brand, car.model].map(normalize);
  const fuzzy = dirs.find((name) => tokens.every((token) => normalize(name).includes(token)));
  return fuzzy ? path.join(root, fuzzy) : null;
}

function readImages(car: SeedCar) {
  const sourceDir = findPhotoDir(car);
  if (!sourceDir) {
    console.warn(`[seed] Photos folder not found for ${car.title}. Expected folder containing "${car.brand} ${car.model}".`);
    return [];
  }

  const files = fs
    .readdirSync(sourceDir)
    .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
    .sort(imageSort);

  if (!files.length) {
    console.warn(`[seed] No supported photos found for ${car.title} in ${sourceDir}.`);
    return [];
  }

  if (!files.some((file) => path.parse(file).name === '1')) {
    console.warn(`[seed] Cover 1.* not found for ${car.title}; first sorted image will be used as cover.`);
  }

  return files.map((file) => ({ file, sourceDir }));
}

async function seedAdmin() {
  const isProduction = process.env.NODE_ENV === 'production';
  const email = process.env.ADMIN_EMAIL || (!isProduction ? devAdminEmail : undefined);
  const password = process.env.ADMIN_PASSWORD || (!isProduction ? devAdminPassword : undefined);

  if (!email || !password || !process.env.JWT_SECRET) {
    throw new Error('ADMIN_EMAIL, ADMIN_PASSWORD and JWT_SECRET are required for seed.');
  }
  if (isProduction && password === devAdminPassword) {
    throw new Error('Production seed must not use the local dev admin password.');
  }
  if (password.length < 10) {
    throw new Error('ADMIN_PASSWORD must be at least 10 characters.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });
  return email;
}

async function seedCars() {
  fs.mkdirSync(uploadRoot, { recursive: true });
  let imagesCopied = 0;
  let coverImages = 0;

  for (const item of cars) {
    const brandSlug = slugify(item.brand);
    const modelSlug = slugify(item.model);
    const carSlug = `${brandSlug}-${modelSlug}`;
    const brand = await prisma.brand.upsert({
      where: { slug: brandSlug },
      update: { name: item.brand },
      create: { name: item.brand, slug: brandSlug },
    });
    const model = await prisma.model.upsert({
      where: { brandId_slug: { brandId: brand.id, slug: modelSlug } },
      update: { name: item.model },
      create: { brandId: brand.id, name: item.model, slug: modelSlug },
    });
    const car = await prisma.car.upsert({
      where: { slug: carSlug },
      update: {
        brandId: brand.id,
        modelId: model.id,
        title: item.title,
        year: item.year,
        price: item.price,
        engineVolume: item.engineVolume,
        description: item.description,
        status: item.status,
        isNewArrival: item.isNewArrival,
        isPublished: item.isPublished,
      },
      create: {
        brandId: brand.id,
        modelId: model.id,
        slug: carSlug,
        title: item.title,
        year: item.year,
        price: item.price,
        engineVolume: item.engineVolume,
        description: item.description,
        status: item.status,
        isNewArrival: item.isNewArrival,
        isPublished: item.isPublished,
      },
    });

    const images = readImages(item);
    const targetDir = path.join(uploadRoot, carSlug);
    fs.mkdirSync(targetDir, { recursive: true });
    await prisma.carImage.deleteMany({ where: { carId: car.id } });

    const explicitCoverIndex = images.findIndex(({ file }) => path.parse(file).name === '1');
    const coverIndex = explicitCoverIndex >= 0 ? explicitCoverIndex : 0;

    for (const [index, image] of images.entries()) {
      const ext = path.extname(image.file).toLowerCase();
      const safeName = `${index + 1}${ext}`;
      fs.copyFileSync(path.join(image.sourceDir, image.file), path.join(targetDir, safeName));
      const isCover = index === coverIndex;
      if (isCover) coverImages += 1;
      imagesCopied += 1;
      await prisma.carImage.create({
        data: {
          carId: car.id,
          path: `/uploads/cars/${carSlug}/${safeName}`,
          alt: `${item.brand} ${item.model} ${item.year} фото ${index + 1}`,
          sortOrder: index,
          isCover,
        },
      });
    }
  }

  return { carsCreated: cars.length, imagesCopied, coverImages };
}

function copyLogo() {
  const logoDir = path.resolve(root, 'logo');
  const publicLogoDir = path.resolve(root, 'apps/web/public/uploads/logo');
  fs.mkdirSync(publicLogoDir, { recursive: true });
  if (!fs.existsSync(logoDir)) {
    console.warn('[seed] Logo folder not found.');
    return;
  }
  const logo = fs.readdirSync(logoDir).find((file) => /\.(jpe?g|png|webp|svg)$/i.test(file));
  if (!logo) {
    console.warn('[seed] Logo file not found.');
    return;
  }
  fs.copyFileSync(path.join(logoDir, logo), path.join(publicLogoDir, `bro-motors${path.extname(logo).toLowerCase()}`));
}

async function main() {
  const adminEmail = await seedAdmin();
  const result = await seedCars();
  copyLogo();

  console.log('Seed completed:');
  console.log(`- Admin: ${adminEmail}`);
  console.log(`- Cars created: ${result.carsCreated}`);
  console.log(`- Images copied: ${result.imagesCopied}`);
  console.log(`- Cover images: ${result.coverImages}/${result.carsCreated}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
