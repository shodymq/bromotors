'use client';
import { FormEvent, useState } from 'react';
import { API, wa } from '../lib/api';

export function TradeInForm({ carId }: { carId?: string }) {
  const [ok, setOk] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const res = await fetch(`${API}/leads/trade-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carId, name: data.name, phone: data.phone, message: data.comment, payload: data }),
    });
    setOk(res.ok);
  }
  return (
    <form className="panel" onSubmit={submit}>
      <h3>Trade-in оценка</h3>
      <div className="form-grid">
        <input className="field" name="name" placeholder="Имя" required minLength={2} />
        <input className="field" name="phone" placeholder="+7 775 666 99 88" required pattern="^\\+?7\\d{10}$|^8\\d{10}$" />
        <input className="field" name="brand" placeholder="Марка текущего авто" required />
        <input className="field" name="model" placeholder="Модель" required />
        <input className="field" name="year" type="number" placeholder="Год" required />
        <input className="field" name="mileage" type="number" placeholder="Пробег" required />
      </div>
      <textarea name="comment" placeholder="Состояние / комментарий" />
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn primary">Отправить</button>
        <a className="btn" href={`${wa}?text=${encodeURIComponent('Здравствуйте! Хочу оценить авто по Trade-in.')}`}>WhatsApp fallback</a>
      </div>
      {ok && <p className="meta">Заявка сохранена. Менеджер свяжется с вами.</p>}
    </form>
  );
}
