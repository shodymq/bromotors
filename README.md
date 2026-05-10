# BRO MOTORS

Рабочий каталог авто BRO MOTORS: Next.js frontend, NestJS API, PostgreSQL + Prisma.

## Local setup

Требуется Node.js 22+:

```bash
nvm use
```

Быстрее всего поднять локальный PostgreSQL через Docker Compose:

```bash
cp .env.example .env
npm run docker:up
```

По умолчанию база доступна на `localhost:5433`. Если Docker недоступен, поднимите PostgreSQL вручную и создайте пользователя и базу под значения из `.env.example`:

```bash
psql -d postgres -c "CREATE ROLE bromotors WITH LOGIN PASSWORD 'bromotors' CREATEDB;"
psql -d postgres -c "CREATE DATABASE bromotors OWNER bromotors;"
```

```bash
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

После запуска:

- Site: http://localhost:3000
- API: http://localhost:4000/api
- Admin URL: http://localhost:3000/admin/login

Dev login:

```text
admin@example.com
```

Dev password:

```text
Br0Motors!2026_Admin#KZ
```

Dev credentials нужны только для local development. Seed хеширует пароль перед записью в БД. Для local seed задавайте `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` и сильный `JWT_SECRET` через env.

## Быстрый setup

После установки Node 22 и настройки `.env` можно выполнить:

```bash
npm run setup:local
```

Команда поднимает Docker Compose и выполняет `prisma generate`, `prisma migrate dev` и seed.

## Seed

Seed создает:

- Admin: `admin@example.com`
- Brand: Hyundai
- Models: Grandeur, Sonata, Creta
- Cars: Hyundai Grandeur, Hyundai Sonata, Hyundai Creta

Фото берутся из корневых папок проекта с похожими названиями авто и копируются в:

```text
apps/web/public/uploads/cars/[car-slug]/
```

Файл `1.*` становится cover. Пути в БД остаются web path вида:

```text
/uploads/cars/hyundai-sonata/1.jpg
```

## Smoke check

Когда `npm run dev` уже запущен:

```bash
npm run smoke:local
```

Smoke проверяет:

- `GET /api/health`
- `GET /api/cars`
- минимум 3 авто
- Hyundai Grandeur, Hyundai Sonata, Hyundai Creta
- cover image у каждого авто
- admin user в БД
