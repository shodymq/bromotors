import { Header } from '../components/Header';
import { CarCard } from '../components/CarCard';
import { getCarsResult, address, hours, wa } from '../lib/api';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { cars, error } = await getCarsResult();
  const hero = cars[0]?.images.find((i) => i.isCover) || cars[0]?.images[0];
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <div className="eyebrow">Сатылымда · BRO MOTORS · Қызылорда</div>
              <h1>Твой статус — наша репутация</h1>
              <p className="lead">Жаңа және жүрілген сенімді көліктер Қызылордада. Тиімді рәсімдеу және бөліп төлеу мүмкіндігі бар.</p>
              <div className="row" style={{ marginTop: 26 }}>
                <Link className="btn primary" href="/catalog">Смотреть каталог</Link>
                <a className="btn" href={`${wa}?text=${encodeURIComponent('Здравствуйте! Хочу узнать подробнее про автомобили BRO MOTORS.')}`}>Написать в WhatsApp</a>
              </div>
              <p className="meta" style={{ marginTop: 20 }}>{address} · {hours}</p>
            </div>
            <div className="showroom-car">{hero && <Image src={hero.path} width={900} height={650} alt={hero.alt} priority />}</div>
          </div>
        </section>
        <section className="section">
          <div className="container">
            <h2>Авто в продаже</h2>
            {error && <div className="panel" style={{ marginBottom: 18 }}>{error}. После `npm run db:seed` здесь появятся авто.</div>}
            <div className="grid">{cars.slice(0, 3).map((car) => <CarCard key={car.id} car={car} />)}</div>
          </div>
        </section>
      </main>
    </>
  );
}
