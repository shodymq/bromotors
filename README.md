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

Локальный `.env` должен оставлять `DATABASE_URL` и `DIRECT_URL` на Docker Postgres:

```env
DATABASE_URL="postgresql://bromotors:bromotors@localhost:5433/bromotors?schema=public"
DIRECT_URL="postgresql://bromotors:bromotors@localhost:5433/bromotors?schema=public"
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

Admin auth реализован в NestJS через JWT cookie `admin_token`. Supabase Auth в проекте не используется.

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

## Supabase

Supabase используется только как Postgres database и Storage для фото автомобилей. Supabase Auth не используется: вход в админку остаётся через NestJS JWT cookie `admin_token`.

### Supabase database

1. Создайте Supabase project.
2. В Supabase Dashboard возьмите connection strings:
   - pooled/runtime URL -> `DATABASE_URL`
   - direct URL -> `DIRECT_URL`
3. Для локальной разработки продолжайте использовать Docker Postgres. Для Supabase deployment укажите:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

`DIRECT_URL` используется Prisma migrations. Запускайте migrations против Supabase осознанно, когда уверены в целевом проекте и env.

### Supabase Storage

Создайте public bucket:

```text
car-images
```

Фото автомобилей публичные для каталога, но upload/delete выполняются только через защищённые admin endpoints backend API. Service role key нужен только backend и не должен попадать во frontend.

Env для Storage:

```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="..."
SUPABASE_STORAGE_BUCKET="car-images"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET="car-images"
```

Не коммитьте `.env` и реальные Supabase secrets. Не создавайте `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`.

### Supabase setup commands

```bash
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Для local dev:

```bash
npm ci
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Если Supabase Storage env не заполнены, сайт и build продолжают работать, а admin upload фото вернёт понятную ошибку конфигурации.

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
