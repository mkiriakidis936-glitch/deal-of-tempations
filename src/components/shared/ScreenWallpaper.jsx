import { useEffect } from 'react';
import { createPortal } from 'react-dom';

// Wallpaper οθόνης (κινητό 9:16, tablet 4:3, TV 16:9) που ορίζεται από το Admin → Βιβλιοθήκη πολυμέσων.
// Ζωγραφίζεται σε ξεχωριστό στρώμα πίσω από το περιεχόμενο, ώστε να μην το καλύπτουν τα καθολικά
// `body { background: … !important }` και τα αδιαφανή φόντα `.comic-dots`. Αν δεν υπάρχει εικόνα, δεν κάνει τίποτα.
export default function ScreenWallpaper({ src }) {
  useEffect(() => {
    if (!src) return undefined;
    document.body.setAttribute('data-wallpaper', '1');
    return () => document.body.removeAttribute('data-wallpaper');
  }, [src]);

  if (!src || typeof document === 'undefined') return null;
  return createPortal(
    <div aria-hidden="true" className="dot-wallpaper" style={{ backgroundImage: `url("${src}")` }} />,
    document.body,
  );
}
