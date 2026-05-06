'use client';
import { useMemo, useState } from 'react';
import { money } from '../lib/api';
import { CreditSetting } from '../lib/types';

export function CreditCalculator({ price, credit }: { price: number; credit?: CreditSetting }) {
  const cs = credit || { rate: 22, minDownPercent: 20, maxMonths: 84 };
  const [down, setDown] = useState(Math.round(price * (cs.minDownPercent / 100)));
  const [months, setMonths] = useState(Math.min(60, cs.maxMonths));
  const [rate, setRate] = useState(cs.rate);
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
        <label>Срок<select className="select" value={months} onChange={(e) => setMonths(Number(e.target.value))}>{[12,24,36,48,60,84].filter((m) => m <= cs.maxMonths).concat(cs.maxMonths % 12 !== 0 ? [cs.maxMonths] : []).map((m) => <option key={m} value={m}>{m} месяцев</option>)}</select></label>
        <label>Ставка, % годовых<input className="field" type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} /></label>
      </div>
      <div className="price">{money(payment)} / месяц</div>
      <p className="meta">Расчет предварительный. Точные условия зависят от банка и кредитной истории.</p>
    </div>
  );
}
