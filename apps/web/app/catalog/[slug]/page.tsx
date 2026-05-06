import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '../../../components/Header';
import { CarCard } from '../../../components/CarCard';
import { CreditCalculator } from '../../../components/CreditCalculator';
import { LeadForm } from '../../../components/LeadForm';
import { Gallery } from './gallery';
import { calcMonthlyPayment, carWhatsapp, getCar, getCreditSettings, money, phone, statusLabel } from '../../../lib/api';

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
  const [car, credit] = await Promise.all([getCar(slug), getCreditSettings()]);
  if (!car) notFound();

  const specs = [
    ['Марка', car.brand.name], ['Модель', car.model.name], ['Год', car.year], ['Цена', money(car.price)],
    car.mileage ? ['Пробег', `${car.mileage} км`] : null,
    ['Двигатель', car.engineVolume],
    car.fuelType ? ['Топливо', car.fuelType] : null,
    car.transmission ? ['Коробка', car.transmission] : null,
    car.bodyType ? ['Кузов', car.bodyType] : null,
    car.driveType ? ['Привод', car.driveType] : null,
    car.color ? ['Цвет', car.color] : null,
    ['Статус', statusLabel(car.status)],
  ].filter(Boolean) as [string, string | number][];

  return (
    <>
      <Header />
      <main className="section">
        <div className="container detail">
          <Gallery car={car} />
          <aside className="panel car-aside">
            <span className={`badge ${car.status}`}>{statusLabel(car.status)}</span>
            <h1 className="car-title">{car.brand.name} {car.model.name} {car.year}</h1>
            <div className="car-price">{money(car.price)}</div>
            <div className="car-monthly">от {money(calcMonthlyPayment(car.price, credit))}/мес в рассрочку</div>

            <div className="trust-badges">
              <div className="trust-item">✔ В наличии</div>
              <div className="trust-item">✔ Можно в рассрочку</div>
              <div className="trust-item">✔ Trade-in</div>
            </div>

            <div className="car-cta-row">
              <a className="btn primary" href={carWhatsapp(car)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              <a className="btn" href={`tel:${phone.replace(/\D/g, '')}`}>Позвонить</a>
              <Link className="btn ghost" href={`/trade-in?car=${car.id}`}>Trade-in</Link>
            </div>

            <div className="lead-form-wrap">
              <LeadForm car={car} compact />
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
            <CreditCalculator price={car.price} credit={credit} />
          </div>
        </div>

        {!!car.similar?.length && (
          <div className="container section">
            <h2>Похожие авто</h2>
            <div className="grid">{car.similar.map((item) => <CarCard key={item.id} car={item} />)}</div>
          </div>
        )}
      </main>

      <div className="sticky-cta">
        <a className="btn" href={`tel:${phone.replace(/\D/g, '')}`}>Позвонить</a>
        <a className="btn primary" href={carWhatsapp(car)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      </div>
    </>
  );
}
