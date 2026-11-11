import React from 'react';

export default function VideoFilm({ src, poster, className = '' }) {
  return (
    <video
      className={className}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
}