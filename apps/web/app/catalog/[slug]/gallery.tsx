'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Car } from '../../../lib/types';

export function Gallery({ car }: { car: Car }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const touchStart = useRef<number | null>(null);
  const images = car.images;
  const image = images[active] || images[0];

  function prev() { setActive((i) => (i - 1 + images.length) % images.length); }
  function next() { setActive((i) => (i + 1) % images.length); }

  function onTouchStart(e: React.TouchEvent) { touchStart.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    touchStart.current = null;
  }

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className="gallery-wrap">
      <button
        className="gallery-main"
        onClick={() => setOpen(true)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-label="Открыть галерею"
      >
        {image && (
          <Image
            src={image.path}
            alt={image.alt}
            fill
            sizes="(max-width: 900px) 100vw, 700px"
            style={{ objectFit: 'contain' }}
            priority
          />
        )}
        {images.length > 1 && (
          <span className="gallery-counter">{active + 1} / {images.length}</span>
        )}
      </button>

      {images.length > 1 && (
        <div className="thumbs-scroll">
          {images.map((item, index) => (
            <button
              key={item.id}
              className={`thumb${index === active ? ' active' : ''}`}
              onClick={() => setActive(index)}
            >
              <Image src={item.path} alt={item.alt} width={120} height={90} style={{ objectFit: 'contain' }} />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="gallery-modal" onClick={() => setOpen(false)} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <button className="gallery-close" onClick={() => setOpen(false)} aria-label="Закрыть">✕</button>
          {images.length > 1 && (
            <>
              <button className="gallery-nav prev" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Назад">‹</button>
              <button className="gallery-nav next" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Вперёд">›</button>
            </>
          )}
          <div className="gallery-modal-img" onClick={(e) => e.stopPropagation()}>
            {image && (
              <Image
                src={image.path}
                alt={image.alt}
                fill
                sizes="100vw"
                style={{ objectFit: 'contain' }}
                priority
              />
            )}
          </div>
          <span className="gallery-modal-counter">{active + 1} / {images.length}</span>
        </div>
      )}
    </div>
  );
}
