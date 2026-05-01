import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, GitCompare, Info } from 'lucide-react';
import { Car } from '../lib/types';
import { carWhatsapp, money, statusLabel } from '../lib/api';

export function CarCard({ car, compare = true }: { car: Car; compare?: boolean }) {
  const cover = car.images.find((i) => i.isCover) || car.images[0];
  return (
    <article className="card">
      <Link className="photo" href={`/catalog/${car.slug}`}>
        {cover && <Image src={cover.path} alt={cover.alt} width={720} height={540} sizes="(max-width: 620px) 100vw, (max-width: 900px) 50vw, 33vw" />}
      </Link>
      <div className="card-body">
        <div className="row">
          <span className={`badge ${car.status}`}>{statusLabel(car.status)}</span>
          {car.isNewArrival && <span className="badge new">NEW ARRIVAL</span>}
        </div>
        <h3>{car.brand.name} {car.model.name}</h3>
        <div className="meta">{car.year} · двигатель {car.engineVolume} · пробег {car.mileage ? `${car.mileage} км` : 'уточнить'}</div>
        <div className="price">{money(car.price)}</div>
        <div className="row">
          <Link className="btn" href={`/catalog/${car.slug}`}><Info size={17} /> Подробнее</Link>
          <a className="btn primary" href={carWhatsapp(car)}><MessageCircle size={17} /> Узнать</a>
          {compare && <button className="btn ghost" data-compare={car.id}><GitCompare size={17} /> Сравнить</button>}
        </div>
      </div>
    </article>
  );
}
