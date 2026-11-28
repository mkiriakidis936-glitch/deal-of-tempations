import React from 'react';
import { useVideoManual } from '@/lib/videoPolicy';

// slot = id του σημείου στο brandArt/FILM (χρησιμοποιείται από την «Αλλαγή φωτογραφιών» στις σελίδες)
export default function VideoFilm({ src, poster, className = '', slot, onError }) {
  const manual = useVideoManual(); // TV σε «Μόνο με Play»: ακίνητο πρώτο καρέ
  return (
    <video
      className={className}
      src={src}
      poster={poster}
      data-media={slot}
      autoPlay={!manual}
      muted
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      onError={onError}
    />
  );
}
