'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, GitCompare, Info, FileText } from 'lucide-react';
import { Car, CreditSetting } from '../lib/types';
import { carWhatsapp, calcMonthlyPayment, DEFAULT_CREDIT, money, statusLabel } from '../lib/api';
import { LeadForm } from './LeadForm';

export function CarCard({ car, compare = true, credit }: { car: Car; compare?: boolean; credit?: CreditSetting }) {
  const cover = car.images.find((i) => i.isCover) || car.images[0];
  const [showLead, setShowLead] = useState(false);
  const cs = credit || DEFAULT_CREDIT;
  const monthly = calcMonthlyPayment(car.price, cs);
  return (
    <article className="card">
      <Link className="photo" href={`/catalog/${car.slug}`}>
        {cover && <Image src={cover.path} alt={cover.alt} width={720} height={540} sizes="(max-width: 620px) 100vw, (max-width: 900px) 50vw, 33vw" style={{ objectFit: 'contain', width: '100%', height: '100%' }} />}
      </Link>
      <div className="card-body">
        <div className="row">
          <span className={`badge ${car.status}`}>{statusLabel(car.status)}</span>
          {car.isNewArrival && <span className="badge new">NEW</span>}
          {car.isDiscount && <span className="badge discount">ВЫГОДНО</span>}
        </div>
        <h3>{car.brand.name} {car.model.name}</h3>
        <div className="meta">{car.year} · {car.engineVolume} · {car.mileage ? `${car.mileage} км` : 'уточнить'}</div>
        <div className="price">{money(car.price)}</div>
        <div className="card-monthly">от {money(monthly)}/мес</div>
        <div className="row">
          <Link className="btn" href={`/catalog/${car.slug}`}><Info size={17} /> Подробнее</Link>
          <a className="btn primary" href={carWhatsapp(car)} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} /> WhatsApp</a>
          <button className="btn ghost" onClick={() => setShowLead((v) => !v)}><FileText size={17} /> Заявка</button>
          {compare && <button className="btn ghost" data-compare={car.id}><GitCompare size={17} /></button>}
        </div>
        {showLead && (
          <div style={{ marginTop: 12 }}>
            <LeadForm car={car} compact />
          </div>
        )}
      </div>
    </article>
  );
}
