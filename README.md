# BRO MOTORS

Рабочий каталог авто BRO MOTORS: Next.js frontend, NestJS API, PostgreSQL + Prisma.

## Local setup

Нужен локальный PostgreSQL на `localhost:5432`. Создайте пользователя и базу под значения из `.env.example`:

```bash
psql -d postgres -c "CREATE ROLE bromotors WITH LOGIN PASSWORD 'bromotors' CREATEDB;"
psql -d postgres -c "CREATE DATABASE bromotors OWNER bromotors;"
```

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

После запуска:

- Site: http://localhost:3000
- API: http://localhost:4000/api
- Admin URL: http://localhost:3000/admin/login

Dev login:

```text
admin@bromotors.local
```

Dev password:

```text
BroMotors123!
```

Dev credentials нужны только для local development. Seed хеширует пароль перед записью в БД. В production задавайте `ADMIN_EMAIL`, `ADMIN_PASSWORD` и сильный `JWT_SECRET` через env.

## Быстрый setup

После настройки локального PostgreSQL, `cp .env.example .env` и `npm install` можно выполнить:

```bash
npm run setup:local
```

Команда делает `prisma generate`, `prisma migrate dev -- --name init` и `prisma db seed`.

## Seed

Seed создает:

- Admin: `admin@bromotors.local`
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
