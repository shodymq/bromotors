'use client';
import { useMemo, useState } from 'react';
import { money } from '../lib/api';
import { CreditSetting } from '../lib/types';

export function CreditCalculator({ price, credit }: { price: number; credit?: CreditSetting }) {
  const cs = credit || { rate: 22, minDownPercent: 20, maxMonths: 84 };
  const minDown = Math.round(price * (cs.minDownPercent / 100));
  const maxDown = Math.round(price * 0.9);
  const [down, setDown] = useState(minDown);
  const [months, setMonths] = useState(cs.maxMonths);
  const [rate, setRate] = useState(cs.rate);

  const downPct = Math.round((down / price) * 100);

  const payment = useMemo(() => {
    const principal = Math.max(0, price - down);
    const monthlyRate = rate / 100 / 12;
    if (monthlyRate === 0) return Math.round(principal / months);
    return Math.round((principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months)));
  }, [price, down, months, rate]);

  const monthOptions = [12, 24, 36, 48, 60, 84].filter((m) => m <= cs.maxMonths);
  if (!monthOptions.includes(cs.maxMonths)) monthOptions.push(cs.maxMonths);

  return (
    <div className="panel">
      <h3>Кредитный калькулятор</h3>

      <div className="calc-row">
        <div className="calc-label">
          <span>Первоначальный взнос</span>
          <strong>{money(down)} <span className="muted-pct">({downPct}%)</span></strong>
        </div>
        <input
          className="calc-slider"
          type="range"
          min={minDown}
          max={maxDown}
          step={10_000}
          value={down}
          onChange={(e) => setDown(Number(e.target.value))}
        />
      </div>

      <div className="form-grid" style={{ marginTop: 16 }}>
        <label>
          Срок
          <select className="select" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
            {monthOptions.map((m) => <option key={m} value={m}>{m} месяцев</option>)}
          </select>
        </label>
        <label>
          Ставка, % годовых
          <input className="field" type="number" min={1} max={100} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
        </label>
      </div>

      <div className="price" style={{ marginTop: 20 }}>{money(payment)} / месяц</div>
      <p className="meta">Расчет предварительный. Точные условия зависят от банка и кредитной истории.</p>
    </div>
  );
}
