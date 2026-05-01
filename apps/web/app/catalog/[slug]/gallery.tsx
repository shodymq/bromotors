'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Car } from '../../../lib/types';

export function Gallery({ car }: { car: Car }) {
  const [active, setActive] = useState(0);
  const image = car.images[active] || car.images[0];
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button className="gallery-main" onClick={() => setOpen(true)}>{image && <Image src={image.path} alt={image.alt} width={1100} height={720} priority />}</button>
      <div className="thumbs">{car.images.map((item, index) => <button className="thumb" key={item.id} onClick={() => setActive(index)}><Image src={item.path} alt={item.alt} width={160} height={160} /></button>)}</div>
      {open && <button className="gallery-main" onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, width: '100%', height: '100%', borderRadius: 0 }}>{image && <Image src={image.path} alt={image.alt} width={1800} height={1200} />}</button>}
    </div>
  );
}
