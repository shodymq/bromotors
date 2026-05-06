import { Header } from '../components/Header';
import { CarCard } from '../components/CarCard';
import { LeadForm } from '../components/LeadForm';
import { getCarsResult, address, hours, wa } from '../lib/api';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { cars, error } = await getCarsResult();
  const hero = cars[0]?.images.find((i) => i.isCover) || cars[0]?.images[0];

  const trustItems = [
    { icon: '✔', text: 'Проверенные авто — история и техосмотр' },
    { icon: '✔', text: 'Работаем с банками — одобрим рассрочку' },
    { icon: '✔', text: 'Оформление за 1 день' },
    { icon: '✔', text: '400+ проданных авто' },
  ];

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
            {cars.length > 3 && (
              <div style={{ textAlign: 'center', marginTop: 28 }}>
                <Link className="btn primary" href="/catalog">Смотреть все {cars.length} авто</Link>
              </div>
            )}
          </div>
        </section>

        <section className="section trust-section">
          <div className="container trust-grid">
            <div>
              <p className="eyebrow">Почему выбирают нас</p>
              <h2>Почему BRO MOTORS</h2>
              <div className="trust-list">
                {trustItems.map((item) => (
                  <div className="trust-row" key={item.text}>
                    <span className="trust-check">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="trust-address">
                <p className="meta">📍 {address}</p>
                <p className="meta">🕐 {hours}</p>
                <a className="btn" style={{ marginTop: 12 }} href={`${wa}?text=${encodeURIComponent('Здравствуйте! Хочу приехать на осмотр.')}`}>Записаться на осмотр</a>
              </div>
            </div>
            <div className="panel">
              <h3>Оставить заявку</h3>
              <p className="meta" style={{ marginBottom: 16 }}>Менеджер перезвонит и подберёт авто под ваш бюджет</p>
              <LeadForm />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
