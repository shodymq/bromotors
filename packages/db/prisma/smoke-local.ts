import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apiBase = process.env.SMOKE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const expectedCars = ['Hyundai Grandeur', 'Hyundai Sonata', 'Hyundai Creta'];
const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function main() {
  const health = await fetchJson<{ ok: boolean }>(`${apiBase}/health`);
  if (!health.ok) throw new Error('API health check failed');

  const cars = await fetchJson<Array<{ title: string; images: Array<{ isCover: boolean; path: string }> }>>(`${apiBase}/cars`);
  if (cars.length < 3) {
    throw new Error(`Expected at least 3 cars, got ${cars.length}`);
  }

  for (const title of expectedCars) {
    const car = cars.find((item) => item.title === title);
    if (!car) throw new Error(`${title} missing from GET /api/cars`);
    if (!car.images.some((image) => image.isCover && image.path.startsWith('/uploads/cars/'))) {
      throw new Error(`${title} has no web-path cover image`);
    }
  }

  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) throw new Error(`Admin user ${adminEmail} not found`);
  if (!admin.passwordHash || admin.passwordHash === 'BroMotors123!') {
    throw new Error('Admin password is not hashed');
  }

  console.log('Smoke check passed:');
  console.log(`- API: ${apiBase}`);
  console.log(`- Cars returned: ${cars.length}`);
  console.log(`- Admin user: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
