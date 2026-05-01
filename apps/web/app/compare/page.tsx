import { Header } from '../../components/Header';
import { CompareTable } from '../../components/Compare';
import { getCars } from '../../lib/api';

export const dynamic = 'force-dynamic';

export default async function ComparePage() {
  const cars = await getCars();
  return <><Header /><main className="section"><div className="container"><h1 style={{ fontSize: 54 }}>Сравнение авто</h1><CompareTable cars={cars} /></div></main></>;
}
