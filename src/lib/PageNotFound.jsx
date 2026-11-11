import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';


export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    useEffect(() => {
        const meta = document.createElement('meta');
        meta.name = 'prerender-status-code';
        meta.content = '404';
        document.head.appendChild(meta);
        return () => {
            document.head.removeChild(meta);
        };
    }, []);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });
    
    return (
        <div className="flex min-h-screen items-center justify-center p-6 comic-dots-dark">
            <div className="w-full max-w-md">
                <div className="space-y-8 text-center">
                    <div className="space-y-3">
                        <div className="ds-eyebrow text-primary/70">Σφάλμα 404</div>
                        <h1 className="ds-title text-6xl text-foreground/30">404</h1>
                        <div className="ds-rule mx-auto w-16"></div>
                    </div>
                    
                    <div className="space-y-3">
                        <h2 className="ds-title text-2xl">
                            Η σελίδα δεν βρέθηκε
                        </h2>
                        <p className="ds-lede text-sm">
                            Η διαδρομή <span className="ds-value text-foreground/80">/{pageName}</span> δεν υπάρχει σε αυτή την εφαρμογή.
                        </p>
                    </div>
                    
                    {isFetched && authData.isAuthenticated && authData.user?.role === 'admin' && (
                        <div className="rounded-sm border border-primary/12 bg-surface-2/60 p-4 text-left">
                            <div className="ds-label mb-1 text-primary/80">Σημείωση διαχειριστή</div>
                            <p className="font-body text-sm leading-relaxed text-foreground/65">
                                Η σελίδα δεν έχει υλοποιηθεί ακόμα. Ζήτησέ την από τον builder στο chat.
                            </p>
                        </div>
                    )}
                    
                    <div className="pt-2">
                        <button 
                            onClick={() => window.location.href = '/'} 
                            className="comic-boom inline-flex items-center gap-2 bg-primary px-5 py-2.5 font-ui text-[11px] uppercase tracking-label text-primary-foreground"
                        >
                            Επιστροφή στην αρχή
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}