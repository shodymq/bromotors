'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, Phone, MessageCircle } from 'lucide-react';
import { phone, wa } from '../lib/api';

export function Header() {
  return (
    <header className="header">
      <div className="container nav">
        <Link className="logo" href="/">
          <Image src="/uploads/logo/bro-motors.jpg" width={54} height={54} alt="BRO MOTORS logo" />
          <span>BRO MOTORS</span>
        </Link>
        <nav className="links">
          <Link href="/">Главная</Link>
          <Link href="/catalog">Каталог</Link>
          <Link href="/trade-in">Trade-in</Link>
          <Link href="/contacts">Контакты</Link>
        </nav>
        <div className="actions">
          <a className="btn ghost" href={`${wa}?text=${encodeURIComponent('Здравствуйте! Хочу узнать подробнее про автомобили BRO MOTORS.')}`}><MessageCircle size={18} /> WhatsApp</a>
          <a className="btn primary" href={`tel:${phone.replace(/\D/g, '')}`}><Phone size={18} /> Позвонить</a>
        </div>
        <Link className="btn mobile-menu" href="/catalog"><Menu size={20} /> Меню</Link>
      </div>
    </header>
  );
}
