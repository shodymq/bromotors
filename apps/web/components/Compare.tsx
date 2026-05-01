'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Car } from '../lib/types';
import { money, statusLabel } from '../lib/api';

const key = 'bro_compare';

export function CompareBinder({ cars }: { cars: Car[] }) {
  const [ids, setIds] = useState<string[]>([]);
  const [toast, setToast] = useState('');
  useEffect(() => setIds(JSON.parse(localStorage.getItem(key) || '[]')), []);
  useEffect(() => {
    const click = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const button = target.closest('[data-compare]') as HTMLElement | null;
      if (!button) return;
      const id = button.dataset.compare!;
      setIds((current) => {
        if (current.includes(id)) return current.filter((x) => x !== id);
        if (current.length >= 3) {
          setToast('Можно сравнить максимум 3 авто');
          setTimeout(() => setToast(''), 2500);
          return current;
        }
        const next = [...current, id];
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    };
    document.addEventListener('click', click);
    return () => document.removeEventListener('click', click);
  }, []);
  useEffect(() => localStorage.setItem(key, JSON.stringify(ids)), [ids]);
  const selected = cars.filter((car) => ids.includes(car.id));
  if (!selected.length && !toast) return null;
  return (
    <>
      {selected.length > 0 && <div className="toast">{selected.length} авто в сравнении · <Link href="/compare">Открыть</Link></div>}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

export function CompareTable({ cars }: { cars: Car[] }) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => setIds(JSON.parse(localStorage.getItem(key) || '[]')), []);
  const selected = useMemo(() => cars.filter((car) => ids.includes(car.id)), [cars, ids]);
  const rows = [
    ['Цена', (c: Car) => money(c.price)],
    ['Год', (c: Car) => c.year],
    ['Пробег', (c: Car) => c.mileage ? `${c.mileage} км` : 'уточнить'],
    ['Двигатель', (c: Car) => c.engineVolume],
    ['Топливо', (c: Car) => c.fuelType || 'уточнить'],
    ['Коробка', (c: Car) => c.transmission || 'уточнить'],
    ['Кузов', (c: Car) => c.bodyType || 'уточнить'],
    ['Статус', (c: Car) => statusLabel(c.status)],
  ] as const;
  return (
    <div className="panel" style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead><tr><th>Параметр</th>{selected.map((c) => <th key={c.id}>{c.brand.name} {c.model.name}</th>)}</tr></thead>
        <tbody>{rows.map(([label, fn]) => <tr key={label}><td>{label}</td>{selected.map((c) => <td key={c.id}>{fn(c)}</td>)}</tr>)}</tbody>
      </table>
      {!selected.length && <p className="meta">Добавьте 2–3 авто из каталога.</p>}
    </div>
  );
}
