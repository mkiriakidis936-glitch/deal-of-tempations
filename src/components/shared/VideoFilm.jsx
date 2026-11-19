import React from 'react';

// slot = id του σημείου στο brandArt/FILM (χρησιμοποιείται από την «Αλλαγή φωτογραφιών» στις σελίδες)
export default function VideoFilm({ src, poster, className = '', slot }) {
  return (
    <video
      className={className}
      src={src}
      poster={poster}
      data-media={slot}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
}
