'use client';
import { FormEvent, useState } from 'react';
import { API, carWhatsapp, wa } from '../lib/api';
import { Car } from '../lib/types';

interface Props {
  car?: Car;
  compact?: boolean;
}

export function LeadForm({ car, compact }: Props) {
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError('');
    const data = Object.fromEntries(new FormData(form));
    try {
      const res = await fetch(`${API}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: car?.id,
          name: data.name,
          phone: data.phone,
          message: data.message || undefined,
        }),
      });
      if (!res.ok) throw new Error('Ошибка отправки');
      form.reset();
      setOk(true);
    } catch {
      setError('Ошибка. Попробуйте ещё раз или напишите в WhatsApp.');
    } finally {
      setLoading(false);
    }
  }

  if (ok) {
    return (
      <div className="lead-success">
        <div className="lead-success-icon">✓</div>
        <h3>Заявка отправлена</h3>
        <p className="meta">Заявка отправлена, менеджер скоро свяжется с вами.</p>
        <a
          className="btn primary"
          href={car ? carWhatsapp(car) : `${wa}?text=${encodeURIComponent('Здравствуйте! Хочу узнать подробнее.')}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Написать в WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form className={`lead-form${compact ? ' compact' : ''}`} onSubmit={submit}>
      {!compact && <h3>Оставить заявку</h3>}
      {car && (
        <div className="lead-car-label">
          {car.brand.name} {car.model.name} {car.year}
        </div>
      )}
      <div className="form-grid">
        <input
          className="field"
          name="name"
          placeholder="Ваше имя"
          required
          minLength={2}
          autoComplete="name"
        />
        <input
          className="field"
          name="phone"
          placeholder="+7 775 666 99 88"
          required
          pattern="^\+?7\d{10}$|^8\d{10}$"
          autoComplete="tel"
        />
      </div>
      <textarea
        className="field"
        name="message"
        placeholder="Комментарий (необязательно)"
        rows={compact ? 2 : 3}
        style={{ marginTop: 10 }}
      />
      {error && <p className="form-error">{error}</p>}
      <button className="btn primary" disabled={loading} style={{ marginTop: 12, width: '100%' }}>
        {loading ? 'Отправка...' : 'Оставить заявку'}
      </button>
    </form>
  );
}
