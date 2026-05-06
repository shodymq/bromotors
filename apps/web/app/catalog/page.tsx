import type { Metadata } from 'next';
import { Header } from '../../components/Header';
import { CatalogClient } from '../../components/CatalogClient';
import { getBrands, getCarsResult, getCreditSettings } from '../../lib/api';

export const metadata: Metadata = { title: 'Авто в продаже — BRO MOTORS Қызылорда' };
export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const [carsResult, brands, credit] = await Promise.all([getCarsResult(), getBrands(), getCreditSettings()]);
  return (
    <>
      <Header />
      <main className="section">
        <div className="container">
          <h1 style={{ fontSize: 54 }}>Каталог BRO MOTORS</h1>
          <p className="lead">Фильтры, сравнение и быстрый WhatsApp-запрос по конкретному авто.</p>
          {carsResult.error && <div className="panel" style={{ margin: '18px 0' }}>{carsResult.error}. Проверьте, что API запущен и seed применен.</div>}
          <CatalogClient cars={carsResult.cars} brands={brands} credit={credit} />
        </div>
      </main>
    </>
  );
}
