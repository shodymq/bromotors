'use client';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { API, money, statusLabel } from '../lib/api';
import { Brand, Car, Model } from '../lib/types';

type AdminUser = { email: string };
type Lead = { id: string; type: 'question' | 'trade_in' | 'credit'; name: string; phone: string; message?: string | null; payload?: unknown; status: 'new' | 'contacted' | 'in_progress' | 'closed' | 'lost'; createdAt: string; car?: Car | null };
type CountedBrand = Brand & { _count?: { cars: number; models: number } };
type CountedModel = Model & { _count?: { cars: number } };

class AdminApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } });
  if (!res.ok) throw new AdminApiError(res.status, await res.text());
  return res.json();
}

function isUnauthorized(error: unknown) {
  return error instanceof AdminApiError && error.status === 401;
}

function redirectToLogin() {
  const next = `${location.pathname}${location.search}`;
  location.replace(`/admin/login?next=${encodeURIComponent(next)}`);
}

function leadType(type: Lead['type']) {
  return { question: 'Заявка', trade_in: 'Trade-in', credit: 'Кредит' }[type];
}

function leadStatus(status: Lead['status']) {
  const labels: Record<Lead['status'], string> = { new: 'Новый', contacted: 'Связались', in_progress: 'В работе', closed: 'Закрыт', lost: 'Потерян' };
  return labels[status] ?? status;
}

function asCarDto(car: Car, patch: Partial<Car> = {}) {
  const next = { ...car, ...patch };
  return {
    brandId: next.brandId,
    modelId: next.modelId,
    title: next.title,
    year: next.year,
    price: next.price,
    mileage: next.mileage || undefined,
    engineVolume: next.engineVolume,
    bodyType: next.bodyType || undefined,
    fuelType: next.fuelType || undefined,
    transmission: next.transmission || undefined,
    driveType: next.driveType || undefined,
    color: next.color || undefined,
    description: next.description,
    status: next.status,
    isNewArrival: next.isNewArrival,
    isPublished: next.isPublished,
  };
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

function AdminTopbar({ user }: { user: AdminUser | null }) {
  const [health, setHealth] = useState('checking');
  useEffect(() => {
    fetch(`${API}/health`).then((res) => res.ok ? res.json() : Promise.reject()).then((data) => setHealth(data.db === 'ok' ? 'ok' : 'down')).catch(() => setHealth('down'));
  }, []);
  async function logout() {
    await api('/admin/auth/logout', { method: 'POST' }).catch(() => null);
    location.href = '/admin/login';
  }
  return (
    <header className="admin-topbar">
      <div><p className="eyebrow">BRO MOTORS Admin</p><strong>Операционная панель</strong></div>
      <div className="admin-userbar"><span className={`admin-status ${health}`}>API/DB {health === 'checking' ? '...' : health}</span><span className="meta">{user?.email || 'admin'}</span><button className="btn ghost compact" onClick={logout}>Logout</button></div>
    </header>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [authState, setAuthState] = useState<'checking' | 'ready' | 'error'>('checking');
  const [authError, setAuthError] = useState('');
  useEffect(() => {
    let active = true;
    api('/admin/me')
      .then((data) => {
        if (!active) return;
        setUser(data);
        setAuthState('ready');
      })
      .catch((error) => {
        if (!active) return;
        if (isUnauthorized(error)) {
          redirectToLogin();
          return;
        }
        setAuthError('Не удалось проверить сессию администратора. Проверьте API и базу данных.');
        setAuthState('error');
      });
    return () => { active = false; };
  }, []);
  const links = [['Dashboard', '/admin'], ['Cars', '/admin/cars'], ['Brands', '/admin/brands'], ['Models', '/admin/models'], ['Leads', '/admin/leads']];
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="admin-brand" href="/admin"><span>BRO</span><strong>MOTORS</strong></Link>
        <nav className="admin-nav">
          {links.map(([label, href]) => <Link key={href} href={href} className={pathname === href ? 'active' : ''}>{label}</Link>)}
          <button onClick={() => api('/admin/auth/logout', { method: 'POST' }).finally(() => location.href = '/admin/login')}>Logout</button>
        </nav>
      </aside>
      <main className="admin-main">
        <AdminTopbar user={user} />
        <div className="admin-content">
          {authState === 'checking' && <div className="admin-skeleton" />}
          {authState === 'error' && <div className="empty-state">{authError}</div>}
          {authState === 'ready' && children}
        </div>
      </main>
    </div>
  );
}

export function LoginForm() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    api('/admin/me')
      .then(() => {
        const next = new URLSearchParams(location.search).get('next') || '/admin';
        location.replace(next.startsWith('/admin/login') ? '/admin' : next);
      })
      .catch((err) => {
        if (!isUnauthorized(err)) setError('Не удалось проверить API. Проверьте, что сервер и база данных запущены.');
      });
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api('/admin/auth/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
      const next = new URLSearchParams(location.search).get('next') || '/admin';
      location.href = next.startsWith('/admin/login') ? '/admin' : next;
    } catch (err) {
      setError(isUnauthorized(err) || err instanceof AdminApiError && err.status === 400 ? 'Неверный логин или пароль' : 'Не удалось войти. Проверьте API и базу данных.');
      setLoading(false);
    }
  }
  return (
    <main className="admin-login">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">BRO MOTORS</div>
        <p className="eyebrow">Ночной шоурум</p>
        <h1>Admin</h1>
        <input className="field" name="email" type="email" placeholder="admin@example.com" required />
        <input className="field" name="password" type="password" placeholder="Password" required />
        {error && <p className="form-error">{error}</p>}
        <button className="btn primary" disabled={loading}>{loading ? 'Вход...' : 'Войти'}</button>
      </form>
    </main>
  );
}

export function Dashboard() {
  const [cars, setCars] = useState<Car[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([api('/admin/cars'), api('/admin/leads')]).then(([carData, leadData]) => { setCars(carData); setLeads(leadData); }).catch(() => location.href = '/admin/login').finally(() => setLoading(false));
  }, []);
  const stats = [
    ['Всего авто', cars.length],
    ['В наличии', cars.filter((car) => car.status === 'available').length],
    ['Забронировано', cars.filter((car) => car.status === 'reserved').length],
    ['Продано', cars.filter((car) => car.status === 'sold').length],
    ['Новые лиды', leads.filter((lead) => lead.status === 'new').length],
  ];
  return (
    <AdminLayout>
      <div className="admin-page-head"><div><p className="eyebrow">Dashboard</p><h1>Пульс шоурума</h1></div><div className="row"><Link className="btn primary" href="/admin/cars/new">Добавить авто</Link><Link className="btn" href="/admin/leads">Посмотреть лиды</Link></div></div>
      {loading ? <div className="admin-skeleton" /> : <>
        <section className="admin-stats">{stats.map(([label, value]) => <div className="stat-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
        <section className="admin-grid-2">
          <div className="admin-panel"><h2>Последние 5 лидов</h2>{leads.slice(0, 5).map((lead) => <div className="list-item" key={lead.id}><div><strong>{lead.name}</strong><p>{leadType(lead.type)} · {lead.phone}</p></div><span className={`badge ${lead.status}`}>{leadStatus(lead.status)}</span></div>)}{!leads.length && <EmptyState text="Лидов пока нет" />}</div>
          <div className="admin-panel"><h2>Последние добавленные авто</h2>{cars.slice(0, 5).map((car) => <div className="list-item" key={car.id}><div><strong>{car.brand.name} {car.model.name}</strong><p>{car.year} · {money(car.price)}</p></div><span className={`badge ${car.status}`}>{statusLabel(car.status)}</span></div>)}{!cars.length && <EmptyState text="Каталог пуст. Запустите seed." />}</div>
        </section>
        <section className="quick-actions"><Link className="btn" href="/admin/cars/new">Добавить авто</Link><Link className="btn" href="/admin/brands">Добавить бренд</Link><Link className="btn" href="/admin/models">Добавить модель</Link><Link className="btn" href="/admin/leads">Посмотреть лиды</Link></section>
      </>}
    </AdminLayout>
  );
}

export function CarsAdmin() {
  const [items, setItems] = useState<Car[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [brandId, setBrandId] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = () => Promise.all([api('/admin/cars'), api('/admin/brands')]).then(([cars, brandData]) => { setItems(cars); setBrands(brandData); }).catch(() => location.href = '/admin/login').finally(() => setLoading(false));
  useEffect(() => { void load(); }, []);
  const filtered = useMemo(() => {
    const text = query.toLowerCase();
    const list = items.filter((car) => (!text || `${car.title} ${car.brand.name} ${car.model.name} ${car.year}`.toLowerCase().includes(text)) && (!status || car.status === status) && (!brandId || car.brandId === brandId));
    return [...list].sort((a, b) => sort === 'price_asc' ? a.price - b.price : sort === 'price_desc' ? b.price - a.price : sort === 'year_asc' ? a.year - b.year : sort === 'year_desc' ? b.year - a.year : 0);
  }, [items, query, status, brandId, sort]);
  async function patchCar(car: Car, patch: Partial<Car>) {
    await api(`/admin/cars/${car.id}`, { method: 'PATCH', body: JSON.stringify(asCarDto(car, patch)) }).then(load).catch((err) => setError(err.message));
  }
  return (
    <AdminLayout>
      <div className="admin-page-head"><div><p className="eyebrow">Cars</p><h1>Каталог авто</h1></div><Link className="btn primary" href="/admin/cars/new">Новое авто</Link></div>
      <div className="admin-panel">
        <div className="admin-tools"><input className="field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по названию" /><select className="select" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Все статусы</option><option value="available">В наличии</option><option value="on_way">В пути</option><option value="reserved">Забронировано</option><option value="sold">Продано</option></select><select className="select" value={brandId} onChange={(e) => setBrandId(e.target.value)}><option value="">Все бренды</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select><select className="select" value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Сначала новые</option><option value="price_desc">Цена вниз</option><option value="price_asc">Цена вверх</option><option value="year_desc">Год вниз</option><option value="year_asc">Год вверх</option></select></div>
        {error && <p className="form-error">{error}</p>}
        {loading ? <div className="admin-skeleton" /> : <table className="table admin-table cars-table"><thead><tr><th>Авто</th><th>Цена</th><th>Статус</th><th>Публикация</th><th></th></tr></thead><tbody>{filtered.map((car) => {
          const cover = car.images.find((image) => image.isCover) || car.images[0];
          return <tr key={car.id}><td><div className="car-cell">{cover ? <img src={cover.path} alt={cover.alt} /> : <div className="image-placeholder" />}<div><strong>{car.brand.name} {car.model.name} {car.year}</strong><p className="meta">{car.title} · {car.images.length} фото</p></div></div></td><td>{money(car.price)}</td><td><span className={`badge ${car.status}`}>{statusLabel(car.status)}</span></td><td>{car.isPublished ? 'Published' : 'Hidden'}</td><td className="admin-actions"><Link className="btn compact" href={`/admin/cars/${car.id}/edit`}>Edit</Link><Link className="btn compact ghost" href={`/catalog/${car.slug}`}>View</Link><button className="btn compact ghost" onClick={() => patchCar(car, { status: 'sold' })}>Mark sold</button><button className="btn compact ghost" onClick={() => patchCar(car, { status: 'reserved' })}>Reserve</button><button className="btn compact ghost" onClick={() => patchCar(car, { isPublished: !car.isPublished })}>{car.isPublished ? 'Unpublish' : 'Publish'}</button></td></tr>;
        })}</tbody></table>}
        {!loading && !filtered.length && <EmptyState text="Авто не найдены. Проверьте фильтры или seed." />}
      </div>
    </AdminLayout>
  );
}

export function CarEditor({ id }: { id?: string }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [brandId, setBrandId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const car = cars.find((item) => item.id === id);
  const currentBrandId = brandId || car?.brandId || brands[0]?.id || '';
  const visibleModels = models.filter((model) => model.brandId === currentBrandId);
  const load = () => Promise.all([api('/admin/brands'), api('/admin/models'), api('/admin/cars')]).then(([brandData, modelData, carData]) => { setBrands(brandData); setModels(modelData); setCars(carData); setBrandId((value) => value || carData.find((item: Car) => item.id === id)?.brandId || brandData[0]?.id || ''); });
  useEffect(() => { load().catch(() => location.href = '/admin/login'); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const raw = Object.fromEntries(new FormData(event.currentTarget));
    const body = { ...raw, year: Number(raw.year), price: Number(raw.price), mileage: raw.mileage ? Number(raw.mileage) : undefined, isNewArrival: raw.isNewArrival === 'on', isPublished: raw.isPublished === 'on' };
    try {
      const saved = await api(id ? `/admin/cars/${id}` : '/admin/cars', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(body) });
      location.href = `/admin/cars/${saved.id}/edit`;
    } catch (err) { setError(err instanceof Error ? err.message : 'Ошибка сохранения'); setSaving(false); }
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;
    const res = await fetch(`${API}/admin/cars/${id}/images`, { method: 'POST', body: new FormData(event.currentTarget), credentials: 'include' });
    if (res.ok) await load(); else setError(await res.text());
  }
  async function setCover(imageId: string) { if (id) await api(`/admin/cars/${id}/images/${imageId}/cover`, { method: 'PATCH' }).then(load); }
  async function deleteImage(imageId: string) { if (id && confirm('Удалить фото?')) await api(`/admin/cars/${id}/images/${imageId}`, { method: 'DELETE' }).then(load); }
  async function moveImage(imageId: string, direction: -1 | 1) {
    if (!id || !car) return;
    const sorted = [...car.images].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((image) => image.id === imageId);
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;
    [sorted[index], sorted[target]] = [sorted[target], sorted[index]];
    await api(`/admin/cars/${id}/images/reorder`, { method: 'PATCH', body: JSON.stringify({ order: sorted.map((image) => image.id) }) }).then(load);
  }
  return (
    <AdminLayout>
      <div className="admin-page-head"><div><p className="eyebrow">Cars</p><h1>{id ? 'Редактировать авто' : 'Новое авто'}</h1></div><Link className="btn" href="/admin/cars">Отмена</Link></div>
      {error && <p className="form-error">{error}</p>}
      <form className="admin-form" onSubmit={submit} key={car?.id || 'new'}>
        <section className="admin-panel form-section"><h2>Основное</h2><div className="form-grid"><select className="select" name="brandId" value={currentBrandId} onChange={(e) => setBrandId(e.target.value)}>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select><select className="select" name="modelId" defaultValue={car?.modelId || visibleModels[0]?.id}>{visibleModels.map((model) => <option key={model.id} value={model.id}>{model.brand?.name} {model.name}</option>)}</select><input className="field" name="title" defaultValue={car?.title} placeholder="Hyundai Sonata" required /><input className="field" name="year" type="number" min="1980" max="2035" defaultValue={car?.year} placeholder="Год" required /></div></section>
        <section className="admin-panel form-section"><h2>Характеристики</h2><div className="form-grid"><input className="field" name="mileage" type="number" defaultValue={car?.mileage || ''} placeholder="Пробег" /><input className="field" name="engineVolume" defaultValue={car?.engineVolume} placeholder="Двигатель" required /><input className="field" name="bodyType" defaultValue={car?.bodyType || ''} placeholder="Кузов" /><input className="field" name="fuelType" defaultValue={car?.fuelType || ''} placeholder="Топливо" /><input className="field" name="transmission" defaultValue={car?.transmission || ''} placeholder="Коробка" /><input className="field" name="driveType" defaultValue={car?.driveType || ''} placeholder="Привод" /><input className="field" name="color" defaultValue={car?.color || ''} placeholder="Цвет" /></div></section>
        <section className="admin-panel form-section"><h2>Цена и статус</h2><div className="form-grid"><input className="field" name="price" type="number" defaultValue={car?.price} placeholder="Цена" required /><select className="select" name="status" defaultValue={car?.status || 'available'}><option value="available">В наличии</option><option value="on_way">В пути</option><option value="reserved">Забронировано</option><option value="sold">Продано</option></select></div><div className="row toggle-row"><label><input name="isNewArrival" type="checkbox" defaultChecked={car?.isNewArrival} /> NEW ARRIVAL</label><label><input name="isPublished" type="checkbox" defaultChecked={car?.isPublished ?? true} /> Published</label></div></section>
        <section className="admin-panel form-section"><h2>Описание</h2><textarea name="description" defaultValue={car?.description} required placeholder="Описание авто" /></section>
        <div className="editor-actions"><button className="btn primary" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button><Link className="btn" href="/admin/cars">Отмена</Link></div>
      </form>
      {id && <section className="admin-panel form-section"><h2>Фото</h2><form onSubmit={upload} className="upload-row"><input className="field" type="file" name="files" multiple accept="image/jpeg,image/png,image/webp" /><button className="btn primary">Загрузить</button></form><div className="photo-admin-grid">{car?.images.sort((a, b) => a.sortOrder - b.sortOrder).map((image) => <div className="photo-admin-card" key={image.id}><img src={image.path} alt={image.alt} />{image.isCover && <span className="cover-badge">Cover</span>}<div className="photo-actions"><button className="btn compact ghost" onClick={() => moveImage(image.id, -1)}>Up</button><button className="btn compact ghost" onClick={() => moveImage(image.id, 1)}>Down</button><button className="btn compact" onClick={() => setCover(image.id)}>Cover</button><button className="btn compact ghost" onClick={() => deleteImage(image.id)}>Delete</button></div></div>)}</div></section>}
    </AdminLayout>
  );
}

export function BrandsAdmin() {
  const [items, setItems] = useState<CountedBrand[]>([]);
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<CountedBrand | null>(null);
  const [error, setError] = useState('');
  const load = () => api('/admin/brands').then(setItems).catch(() => location.href = '/admin/login');
  useEffect(() => { void load(); }, []);
  const filtered = items.filter((brand) => brand.name.toLowerCase().includes(query.toLowerCase()));
  async function save() {
    setError('');
    try {
      if (editing) await api(`/admin/brands/${editing.id}`, { method: 'PATCH', body: JSON.stringify({ name }) });
      else await api('/admin/brands', { method: 'POST', body: JSON.stringify({ name }) });
      setName(''); setEditing(null); load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Ошибка сохранения'); }
  }
  async function remove(item: CountedBrand) {
    if (!confirm(`Удалить бренд ${item.name}?`)) return;
    await api(`/admin/brands/${item.id}`, { method: 'DELETE' }).then(load).catch((err) => setError(err.message));
  }
  return <AdminLayout><div className="admin-page-head"><div><p className="eyebrow">Brands</p><h1>Бренды</h1></div></div><div className="admin-panel"><div className="admin-tools"><input className="field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск бренда" /><input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Hyundai" /><button className="btn primary" onClick={save}>{editing ? 'Сохранить' : 'Создать'}</button></div>{error && <p className="form-error">{error}</p>}<table className="table admin-table"><tbody>{filtered.map((brand) => <tr key={brand.id}><td><strong>{brand.name}</strong><p className="meta">{brand.slug}</p></td><td>{brand._count?.models || 0} моделей</td><td>{brand._count?.cars || 0} авто</td><td className="admin-actions"><button className="btn compact" onClick={() => { setEditing(brand); setName(brand.name); }}>Edit</button><button className="btn compact ghost" onClick={() => remove(brand)}>Delete</button></td></tr>)}</tbody></table>{!filtered.length && <EmptyState text="Бренды не найдены" />}</div></AdminLayout>;
}

export function ModelsAdmin() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [items, setItems] = useState<CountedModel[]>([]);
  const [brandId, setBrandId] = useState('');
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<CountedModel | null>(null);
  const [error, setError] = useState('');
  const load = () => { api('/admin/brands').then((data) => { setBrands(data); setBrandId((value) => value || data[0]?.id || ''); }); api('/admin/models').then(setItems).catch(() => location.href = '/admin/login'); };
  useEffect(() => { void load(); }, []);
  const filtered = items.filter((model) => `${model.brand?.name} ${model.name}`.toLowerCase().includes(query.toLowerCase()));
  async function save() {
    setError('');
    try {
      const body = JSON.stringify({ brandId, name });
      if (editing) await api(`/admin/models/${editing.id}`, { method: 'PATCH', body });
      else await api('/admin/models', { method: 'POST', body });
      setName(''); setEditing(null); load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Ошибка сохранения'); }
  }
  async function remove(item: CountedModel) {
    if (!confirm(`Удалить модель ${item.brand?.name || ''} ${item.name}?`)) return;
    await api(`/admin/models/${item.id}`, { method: 'DELETE' }).then(load).catch((err) => setError(err.message));
  }
  return <AdminLayout><div className="admin-page-head"><div><p className="eyebrow">Models</p><h1>Модели</h1></div></div><div className="admin-panel"><div className="admin-tools"><input className="field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск модели" /><select className="select" value={brandId} onChange={(e) => setBrandId(e.target.value)}>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select><input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sonata" /><button className="btn primary" onClick={save}>{editing ? 'Сохранить' : 'Создать'}</button></div>{error && <p className="form-error">{error}</p>}<table className="table admin-table"><tbody>{filtered.map((model) => <tr key={model.id}><td><strong>{model.brand?.name} {model.name}</strong><p className="meta">{model.slug}</p></td><td>{model._count?.cars || 0} авто</td><td className="admin-actions"><button className="btn compact" onClick={() => { setEditing(model); setBrandId(model.brandId); setName(model.name); }}>Edit</button><button className="btn compact ghost" onClick={() => remove(model)}>Delete</button></td></tr>)}</tbody></table>{!filtered.length && <EmptyState text="Модели не найдены" />}</div></AdminLayout>;
}

export function LeadsAdmin() {
  const [items, setItems] = useState<Lead[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [type, setType] = useState('');
  const [status, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Lead | null>(null);
  const [detailMessage, setDetailMessage] = useState('');
  const [detailCarId, setDetailCarId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const load = () => Promise.all([api('/admin/leads'), api('/admin/cars')])
    .then(([leadData, carData]) => { setItems(leadData); setCars(carData); })
    .catch((err) => { if (isUnauthorized(err)) { redirectToLogin(); } else { setError('Не удалось загрузить заявки.'); } });
  useEffect(() => { void load(); }, []);
  const filtered = items.filter((lead) => (!type || lead.type === type) && (!status || lead.status === status));
  async function setStatus(id: string, next: string) {
    await api(`/admin/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) }).catch((err) => setError(err.message));
    load();
  }
  async function openDetails(lead: Lead) {
    setError('');
    try {
      const fresh = await api(`/admin/leads/${lead.id}`);
      setSelected(fresh);
      setDetailMessage(fresh.message || '');
      setDetailCarId(fresh.car?.id || '');
    } catch (err) {
      if (isUnauthorized(err)) redirectToLogin();
      else setError('Не удалось открыть заявку.');
    }
  }
  async function saveDetails() {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const updated = await api(`/admin/leads/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ message: detailMessage, carId: detailCarId }),
      });
      setSelected(updated);
      await load();
    } catch (err) {
      if (isUnauthorized(err)) redirectToLogin();
      else setError(err instanceof Error ? err.message : 'Не удалось сохранить заявку.');
    } finally {
      setSaving(false);
    }
  }
  async function deleteLead(lead: Lead) {
    if (!confirm(`Удалить заявку от ${lead.name}?`)) return;
    await api(`/admin/leads/${lead.id}`, { method: 'DELETE' }).then(load).catch((err) => setError(err.message));
  }
  const statusOptions: { value: Lead['status']; label: string }[] = [
    { value: 'new', label: 'Новый' },
    { value: 'contacted', label: 'Связались' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'closed', label: 'Закрыт' },
    { value: 'lost', label: 'Потерян' },
  ];
  return (
    <AdminLayout>
      <div className="admin-page-head"><div><p className="eyebrow">Leads</p><h1>Заявки</h1></div></div>
      {error && <p className="form-error">{error}</p>}
      <div className="admin-panel">
        <div className="admin-tools">
          <select className="select" value={type} onChange={(e) => setType(e.target.value)}><option value="">Все типы</option><option value="question">Заявка</option><option value="trade_in">Trade-in</option><option value="credit">Кредит</option></select>
          <select className="select" value={status} onChange={(e) => setStatusFilter(e.target.value)}><option value="">Все статусы</option>{statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>
        </div>
        <table className="table admin-table">
          <thead><tr><th>Дата</th><th>Имя</th><th>Телефон</th><th>Авто</th><th>Статус</th><th>Сообщение</th><th>Действия</th></tr></thead>
          <tbody>{filtered.map((lead) => (
            <tr key={lead.id}>
              <td>{new Date(lead.createdAt).toLocaleString('ru-KZ')}<p className="meta">{leadType(lead.type)}</p></td>
              <td><strong>{lead.name}</strong></td>
              <td>{lead.phone}</td>
              <td>{lead.car ? `${lead.car.brand.name} ${lead.car.model.name}` : '—'}</td>
              <td><select className="select compact-select" value={lead.status} onChange={(e) => setStatus(lead.id, e.target.value)}>{statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></td>
              <td>{lead.message ? <span className="lead-message-cell">{lead.message}</span> : <span className="meta">Нет</span>}</td>
              <td className="admin-actions">
                <a className="btn compact primary" href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                <button className="btn compact" onClick={() => openDetails(lead)}>Детали</button>
                <button className="btn compact ghost" onClick={() => deleteLead(lead)}>Удалить</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
        {!filtered.length && <EmptyState text="Заявки не найдены" />}
      </div>
      {selected && (
        <div className="drawer-backdrop" onClick={() => setSelected(null)}>
          <aside className="lead-drawer" onClick={(event) => event.stopPropagation()}>
            <button className="btn ghost compact" onClick={() => setSelected(null)}>Закрыть</button>
            <h2>{selected.name}</h2>
            <p className="meta">{leadType(selected.type)} · {new Date(selected.createdAt).toLocaleString('ru-KZ')}</p>
            <div className="specs">
              <div className="spec"><span>Телефон</span><strong>{selected.phone}</strong></div>
              <div className="spec"><span>Статус</span><strong>{leadStatus(selected.status)}</strong></div>
              <div className="spec"><span>Авто</span><strong>{selected.car ? `${selected.car.brand.name} ${selected.car.model.name}` : 'Без авто'}</strong></div>
            </div>
            <h3>Сообщение</h3>
            <textarea className="field" value={detailMessage} onChange={(event) => setDetailMessage(event.target.value)} rows={5} placeholder="Комментарий клиента или заметка менеджера" />
            <h3>Авто</h3>
            <select className="select" value={detailCarId} onChange={(event) => setDetailCarId(event.target.value)}>
              <option value="">Без авто</option>
              {cars.map((car) => <option key={car.id} value={car.id}>{car.brand.name} {car.model.name} {car.year}</option>)}
            </select>
            <button className="btn primary" onClick={saveDetails} disabled={saving} style={{ marginTop: 12 }}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
            {!!selected.payload && Object.keys(selected.payload as Record<string, unknown>).length > 0 && <><h3>Payload</h3><pre className="payload">{JSON.stringify(selected.payload, null, 2)}</pre></>}
          </aside>
        </div>
      )}
    </AdminLayout>
  );
}
