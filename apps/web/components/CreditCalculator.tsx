'use client';
import { useMemo, useState } from 'react';
import { money } from '../lib/api';

export function CreditCalculator({ price }: { price: number }) {
  const [down, setDown] = useState(Math.round(price * 0.2));
  const [months, setMonths] = useState(60);
  const [rate, setRate] = useState(22);
  const payment = useMemo(() => {
    const principal = Math.max(0, price - down);
    const monthlyRate = rate / 100 / 12;
    return Math.round((principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months)));
  }, [price, down, months, rate]);
  return (
    <div className="panel">
      <h3>Кредитный калькулятор</h3>
      <div className="form-grid">
        <label>Первоначальный взнос<input className="field" type="number" value={down} onChange={(e) => setDown(Number(e.target.value))} /></label>
        <label>Срок<select className="select" value={months} onChange={(e) => setMonths(Number(e.target.value))}>{[12,24,36,48,60,84].map((m) => <option key={m} value={m}>{m} месяцев</option>)}</select></label>
        <label>Ставка, % годовых<input className="field" type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} /></label>
      </div>
      <div className="price">{money(payment)} / месяц</div>
      <p className="meta">Расчет предварительный. Точные условия зависят от банка и кредитной истории.</p>
    </div>
  );
}
