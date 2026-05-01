import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BRO MOTORS — автосалон в Қызылорде',
  description: 'Жаңа және жүрілген сенімді көліктер. Автосалон BRO MOTORS, Астана даңғылы 30, Қызылорда.',
  openGraph: {
    title: 'BRO MOTORS — автосалон в Қызылорде',
    description: 'Сатылымда: қолжетімді, сенімді жаңа және жүрілген көліктер',
    locale: 'ru_KZ',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="top-glow" />
        {children}
      </body>
    </html>
  );
}
