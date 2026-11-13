import { useRef, useState } from 'react';

interface Img { url: string; alt: string; focusX: number; focusY: number }

/** Galería deslizable con miniaturas. Todas las fotos comparten la misma proporción, así no hay saltos de scroll. */
export default function Gallery({ images, name, badge }: { images: Img[]; name: string; badge?: string | null }) {
  const track = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * i + 10 * i, behavior: 'smooth' });
  };
  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    setCurrent(Math.round(el.scrollLeft / (el.clientWidth + 10)));
  };

  if (images.length === 0) {
    return (
      <div className="frame" style={{ borderRadius: 28 }}>
        {badge && <span className="badge">{badge}</span>}
        <div className="placeholder">{name}</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ position: 'relative' }}>
        {badge && <span className="badge">{badge}</span>}
        <div className="gallery-track" ref={track} onScroll={onScroll} aria-label={`Fotos de ${name}`} tabIndex={0}>
          {images.map((img, i) => (
            <div className="frame" key={img.url}>
              <img
                src={img.url}
                alt={img.alt}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                style={{ objectPosition: `${img.focusX * 100}% ${img.focusY * 100}%` }}
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <span className="badge badge-off" style={{ left: 'auto', right: 12, top: 'auto', bottom: 12 }} aria-hidden="true">
            {current + 1}/{images.length}
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div className="thumbs">
          {images.map((img, i) => (
            <button key={img.url} type="button" aria-label={`Ver foto ${i + 1}`} aria-current={i === current} onClick={() => goTo(i)}>
              <img src={img.url} alt="" loading="lazy" style={{ objectPosition: `${img.focusX * 100}% ${img.focusY * 100}%` }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
