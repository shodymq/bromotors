import { Header } from '../../components/Header';
import { address, hours, phone, wa } from '../../lib/api';

export default function ContactsPage() {
  return <><Header /><main className="section"><div className="container panel"><h1 style={{ fontSize: 54 }}>Контакты</h1><div className="specs"><div className="spec"><span>Адрес</span><strong>{address}</strong></div><div className="spec"><span>Время</span><strong>{hours}</strong></div><div className="spec"><span>Телефон</span><strong>{phone}</strong></div></div><div className="row" style={{ marginTop: 18 }}><a className="btn primary" href={`${wa}?text=${encodeURIComponent('Здравствуйте! Хочу узнать подробнее про автомобили BRO MOTORS.')}`}>WhatsApp</a><a className="btn" href={`tel:${phone.replace(/\D/g, '')}`}>Позвонить</a><a className="btn" href={`https://2gis.kz/search/${encodeURIComponent(address)}`}>Показать адрес</a></div></div></main></>;
}
