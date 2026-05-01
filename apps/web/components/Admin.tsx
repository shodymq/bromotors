'use client';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { API, money } from '../lib/api';
import { Brand, Car, Model } from '../lib/types';

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="logo" href="/admin">BRO MOTORS</Link>
        <div className="specs" style={{ marginTop: 24 }}>
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/brands">Brands</Link>
          <Link href="/admin/models">Models</Link>
          <Link href="/admin/cars">Cars</Link>
          <Link href="/admin/leads">Leads</Link>
        </div>
      </aside>
      <main className="section"><div className="container">{children}</div></main>
    </div>
  );
}

export function LoginForm() {
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api('/admin/auth/login', { method: 'POST', body: JSON.stringify(data) });
      location.href = '/admin';
    } catch {
      setError('Неверный логин или пароль');
    }
  }
  return <form className="panel" onSubmit={submit} style={{ maxWidth: 420, margin: '80px auto' }}><h1 style={{ fontSize: 42 }}>Admin login</h1><input className="field" name="email" type="email" placeholder="Email" required /><br /><br /><input className="field" name="password" type="password" placeholder="Password" required /><br /><br /><button className="btn primary">Войти</button>{error && <p className="meta">{error}</p>}</form>;
}

export function Dashboard() {
  const [me, setMe] = useState<{ email: string } | null>(null);
  useEffect(() => { api('/admin/me').then(setMe).catch(() => location.href = '/admin/login'); }, []);
  return <AdminLayout><h1 style={{ fontSize: 46 }}>Админка</h1><p className="lead">Вы вошли как {me?.email || '...'}. Управляйте каталогом, фото и лидами.</p></AdminLayout>;
}

export function BrandsAdmin() {
  const [items, setItems] = useState<Brand[]>([]);
  const [name, setName] = useState('');
  const load = () => api('/admin/brands').then(setItems).catch(() => location.href = '/admin/login');
  useEffect(() => { void load(); }, []);
  async function save() { await api('/admin/brands', { method: 'POST', body: JSON.stringify({ name }) }); setName(''); load(); }
  return <AdminLayout><h1 style={{ fontSize: 46 }}>Brands</h1><div className="row"><input className="field" style={{ maxWidth: 320 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Hyundai" /><button className="btn primary" onClick={save}>Создать</button></div><table className="table"><tbody>{items.map((b) => <tr key={b.id}><td>{b.name}</td><td>{b.slug}</td></tr>)}</tbody></table></AdminLayout>;
}

export function ModelsAdmin() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [items, setItems] = useState<Model[]>([]);
  const [brandId, setBrandId] = useState('');
  const [name, setName] = useState('');
  const load = () => { api('/admin/brands').then((b) => { setBrands(b); setBrandId((b[0] || {}).id || ''); }); api('/admin/models').then(setItems); };
  useEffect(() => { void load(); }, []);
  async function save() { await api('/admin/models', { method: 'POST', body: JSON.stringify({ brandId, name }) }); setName(''); load(); }
  return <AdminLayout><h1 style={{ fontSize: 46 }}>Models</h1><div className="row"><select className="select" style={{ maxWidth: 220 }} value={brandId} onChange={(e) => setBrandId(e.target.value)}>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select><input className="field" style={{ maxWidth: 280 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Sonata" /><button className="btn primary" onClick={save}>Создать</button></div><table className="table"><tbody>{items.map((m) => <tr key={m.id}><td>{m.brand?.name}</td><td>{m.name}</td></tr>)}</tbody></table></AdminLayout>;
}

export function CarsAdmin() {
  const [items, setItems] = useState<Car[]>([]);
  useEffect(() => { api('/admin/cars').then(setItems).catch(() => location.href = '/admin/login'); }, []);
  return <AdminLayout><div className="row" style={{ justifyContent: 'space-between' }}><h1 style={{ fontSize: 46 }}>Cars</h1><Link className="btn primary" href="/admin/cars/new">Новое авто</Link></div><table className="table"><thead><tr><th>Авто</th><th>Цена</th><th>Статус</th><th></th></tr></thead><tbody>{items.map((c) => <tr key={c.id}><td>{c.brand.name} {c.model.name} {c.year}</td><td>{money(c.price)}</td><td>{c.status}</td><td><Link className="btn" href={`/admin/cars/${c.id}/edit`}>Редактировать</Link></td></tr>)}</tbody></table></AdminLayout>;
}

export function CarEditor({ id }: { id?: string }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const car = cars.find((x) => x.id === id);
  useEffect(() => { api('/admin/brands').then(setBrands); api('/admin/models').then(setModels); api('/admin/cars').then(setCars); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(event.currentTarget));
    const body = { ...raw, year: Number(raw.year), price: Number(raw.price), mileage: raw.mileage ? Number(raw.mileage) : undefined, isNewArrival: raw.isNewArrival === 'on', isPublished: raw.isPublished === 'on' };
    const saved = await api(id ? `/admin/cars/${id}` : '/admin/cars', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(body) });
    location.href = `/admin/cars/${saved.id}/edit`;
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;
    const fd = new FormData(event.currentTarget);
    const res = await fetch(`${API}/admin/cars/${id}/images`, { method: 'POST', body: fd, credentials: 'include' });
    if (res.ok) location.reload();
  }
  return <AdminLayout><h1 style={{ fontSize: 46 }}>{id ? 'Редактировать авто' : 'Новое авто'}</h1><form className="panel" onSubmit={submit}><div className="form-grid">
    <select className="select" name="brandId" defaultValue={car?.brandId}>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
    <select className="select" name="modelId" defaultValue={car?.modelId}>{models.map((m) => <option key={m.id} value={m.id}>{m.brand?.name} {m.name}</option>)}</select>
    <input className="field" name="title" defaultValue={car?.title} placeholder="Title" required />
    <input className="field" name="year" type="number" defaultValue={car?.year} placeholder="Year" required />
    <input className="field" name="price" type="number" defaultValue={car?.price} placeholder="Price" required />
    <input className="field" name="mileage" type="number" defaultValue={car?.mileage || ''} placeholder="Mileage" />
    <input className="field" name="engineVolume" defaultValue={car?.engineVolume} placeholder="Engine" required />
    <input className="field" name="bodyType" defaultValue={car?.bodyType || ''} placeholder="Body" />
    <input className="field" name="fuelType" defaultValue={car?.fuelType || ''} placeholder="Fuel" />
    <input className="field" name="transmission" defaultValue={car?.transmission || ''} placeholder="Transmission" />
    <input className="field" name="driveType" defaultValue={car?.driveType || ''} placeholder="Drive" />
    <input className="field" name="color" defaultValue={car?.color || ''} placeholder="Color" />
    <select className="select" name="status" defaultValue={car?.status || 'available'}><option value="available">В наличии</option><option value="on_way">В пути</option><option value="reserved">Забронировано</option><option value="sold">Продано</option></select>
  </div><textarea name="description" defaultValue={car?.description} required placeholder="Описание" /><label><input name="isNewArrival" type="checkbox" defaultChecked={car?.isNewArrival} /> NEW ARRIVAL</label> <label><input name="isPublished" type="checkbox" defaultChecked={car?.isPublished ?? true} /> Published</label><br /><br /><button className="btn primary">Сохранить</button></form>
  {id && <form className="panel" onSubmit={upload} style={{ marginTop: 16 }}><h3>Фото</h3><input className="field" type="file" name="files" multiple accept="image/jpeg,image/png,image/webp" /><button className="btn primary" style={{ marginTop: 12 }}>Загрузить</button><div className="thumbs">{car?.images.map((i) => <img key={i.id} src={i.path} alt={i.alt} />)}</div></form>}</AdminLayout>;
}

export function LeadsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const load = () => api('/admin/leads').then(setItems).catch(() => location.href = '/admin/login');
  useEffect(() => { void load(); }, []);
  async function setStatus(id: string, status: string) { await api(`/admin/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); load(); }
  return <AdminLayout><h1 style={{ fontSize: 46 }}>Leads</h1><table className="table"><thead><tr><th>Дата</th><th>Тип</th><th>Клиент</th><th>Сообщение</th><th>Статус</th></tr></thead><tbody>{items.map((l) => <tr key={l.id}><td>{new Date(l.createdAt).toLocaleString('ru-KZ')}</td><td>{l.type}</td><td>{l.name}<br />{l.phone}</td><td>{l.message}</td><td><select className="select" value={l.status} onChange={(e) => setStatus(l.id, e.target.value)}><option value="new">new</option><option value="in_progress">in_progress</option><option value="closed">closed</option></select></td></tr>)}</tbody></table></AdminLayout>;
}
