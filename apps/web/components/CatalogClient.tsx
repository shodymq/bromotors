'use client';
import { useMemo, useState } from 'react';
import { Car, Brand } from '../lib/types';
import { CarCard } from './CarCard';
import { CompareBinder } from './Compare';

export function CatalogClient({ cars, brands }: { cars: Car[]; brands: Brand[] }) {
  const [q, setQ] = useState('');
  const [brand, setBrand] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const filtered = useMemo(() => {
    const text = q.toLowerCase();
    const list = cars.filter((car) =>
      (!text || `${car.title} ${car.brand.name} ${car.model.name}`.toLowerCase().includes(text)) &&
      (!brand || car.brand.slug === brand) &&
      (!status || car.status === status)
    );
    return [...list].sort((a, b) => {
      if (sort === 'price_asc') return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      if (sort === 'year_desc') return b.year - a.year;
      if (sort === 'mileage_asc') return (a.mileage || 999999999) - (b.mileage || 999999999);
      return 0;
    });
  }, [cars, q, brand, status, sort]);
  return (
    <>
      <div className="toolbar">
        <input className="field" placeholder="Поиск: Sonata, Hyundai..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="">Все бренды</option>
          {brands.map((b) => <option key={b.id} value={b.slug}>{b.name}</option>)}
        </select>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Любой статус</option>
          <option value="available">В наличии</option>
          <option value="on_way">В пути</option>
          <option value="reserved">Забронировано</option>
          <option value="sold">Продано</option>
        </select>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Сначала новые</option>
          <option value="price_asc">Цена по возрастанию</option>
          <option value="price_desc">Цена по убыванию</option>
          <option value="year_desc">Год по убыванию</option>
          <option value="mileage_asc">Пробег по возрастанию</option>
        </select>
      </div>
      {filtered.length ? (
        <div className="grid">{filtered.map((car) => <CarCard key={car.id} car={car} />)}</div>
      ) : (
        <div className="panel">Авто не найдены. Если фильтры пустые, проверьте API, миграции и seed.</div>
      )}
      <CompareBinder cars={cars} />
    </>
  );
}
