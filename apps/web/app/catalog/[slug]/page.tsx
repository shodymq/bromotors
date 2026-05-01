import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '../../../components/Header';
import { CarCard } from '../../../components/CarCard';
import { CreditCalculator } from '../../../components/CreditCalculator';
import { TradeInForm } from '../../../components/TradeInForm';
import { Gallery } from './gallery';
import { carWhatsapp, getCar, money, phone, statusLabel } from '../../../lib/api';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const car = await getCar(slug);
  if (!car) return {};
  return {
    title: `${car.brand.name} ${car.model.name} ${car.year} купить в Қызылорде — BRO MOTORS`,
    description: `${car.brand.name} ${car.model.name} ${car.year} за ${money(car.price)}. BRO MOTORS, Қызылорда.`,
  };
}

export default async function CarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const car = await getCar(slug);
  if (!car) notFound();
  const specs = [
    ['Марка', car.brand.name], ['Модель', car.model.name], ['Год', car.year], ['Цена', money(car.price)],
    ['Пробег', car.mileage ? `${car.mileage} км` : 'уточнить'], ['Двигатель', car.engineVolume],
    ['Топливо', car.fuelType || 'уточнить'], ['Коробка', car.transmission || 'уточнить'],
    ['Кузов', car.bodyType || 'уточнить'], ['Привод', car.driveType || 'уточнить'],
    ['Цвет', car.color || 'уточнить'], ['Статус', statusLabel(car.status)],
  ];
  return (
    <>
      <Header />
      <main className="section">
        <div className="container detail">
          <Gallery car={car} />
          <aside className="panel">
            <span className={`badge ${car.status}`}>{statusLabel(car.status)}</span>
            <h1 style={{ fontSize: 46 }}>{car.brand.name} {car.model.name} {car.year}</h1>
            <div className="price">{money(car.price)}</div>
            <div className="row">
              <a className="btn primary" href={carWhatsapp(car)}>WhatsApp</a>
              <a className="btn" href={`tel:${phone.replace(/\D/g, '')}`}>Позвонить</a>
              <Link className="btn" href={`/trade-in?car=${car.id}`}>Trade-in</Link>
            </div>
          </aside>
        </div>
        <div className="container section">
          <div className="detail">
            <div className="panel">
              <h2>Характеристики</h2>
              <div className="specs">{specs.map(([k, v]) => <div className="spec" key={k}><span>{k}</span><strong>{v}</strong></div>)}</div>
              <h2 style={{ marginTop: 28 }}>Описание</h2>
              <p className="lead">{car.description}</p>
            </div>
            <CreditCalculator price={car.price} />
          </div>
        </div>
        <div className="container section">
          <TradeInForm carId={car.id} />
        </div>
        {!!car.similar?.length && <div className="container section"><h2>Похожие авто</h2><div className="grid">{car.similar.map((item) => <CarCard key={item.id} car={item} />)}</div></div>}
      </main>
    </>
  );
}
