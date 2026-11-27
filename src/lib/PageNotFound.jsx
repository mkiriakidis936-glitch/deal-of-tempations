import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Σελίδα 404 — καθαρή, iOS 27, με επιστροφή στο Site.
export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'prerender-status-code';
    meta.content = '404';
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-6 text-center text-white">
      <div className="w-full max-w-sm space-y-6">
        <img src="/icons/icon-192.png" alt="" className="mx-auto h-16 w-16 rounded-2xl" />
        <div className="space-y-2">
          <div className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[#E8C26B]">Σφάλμα 404</div>
          <h1 className="text-3xl font-bold tracking-tight">Η σελίδα δεν βρέθηκε</h1>
          <p className="text-[15px] text-white/60">Η διαδρομή <span className="font-semibold text-white/85">/{pageName}</span> δεν υπάρχει.</p>
        </div>
        <a href="/site" className="inline-flex h-12 items-center justify-center rounded-full bg-[#E8C26B] px-6 text-[15px] font-bold text-black">Στο Deal of Temptation</a>
      </div>
    </div>
  );
}
