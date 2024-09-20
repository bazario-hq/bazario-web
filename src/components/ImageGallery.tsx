import { useState } from 'react';
import type { Image } from '../api/types';
import { PLACEHOLDER_IMAGE } from './placeholder';

export function ImageGallery({ images, name }: { images: Image[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  if (images.length === 0) {
    return <img src={PLACEHOLDER_IMAGE} alt={name} className="img-fluid rounded gallery-main" />;
  }

  return (
    <div className="gallery">
      <div className="gallery-main-wrap">
        {/* All large images stay mounted so switching between them is instant. */}
        {images.map((img, i) => (
          <img
            key={img.id}
            src={img.largeUrl}
            alt={img.altText ?? name}
            className="img-fluid rounded gallery-main"
            style={{ display: i === active ? 'block' : 'none' }}
            data-testid={i === active ? 'gallery-main' : undefined}
          />
        ))}
      </div>
      {images.length > 1 && (
        <div className="d-flex gap-2 mt-2 flex-wrap gallery-thumbs">
          {images.map((img, i) => (
            <button
              type="button"
              key={img.id}
              className={`gallery-thumb ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
            >
              <img src={img.mediumUrl} alt="" />
            </button>
          ))}
        </div>
      )}
      <span className="visually-hidden">{current?.altText}</span>
    </div>
  );
}
