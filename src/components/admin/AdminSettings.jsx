import React from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import AdminGlobalDesign from '@/components/admin/AdminGlobalDesign';
import packageJson from '../../../package.json';

export default function AdminSettings() {
  return (
    <div className="space-y-3">
      <ComicPanel className="bg-card space-y-1">
        <div className="font-heading text-2xl text-primary">ΡΥΘΜΙΣΕΙΣ ΕΦΑΡΜΟΓΗΣ</div>
        <p className="text-xs text-foreground/70">Κεντρικές ρυθμίσεις χωρίς επιμέρους κατηγορίες.</p>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 mt-3">
          <div><div className="text-[10px] text-foreground/50">ΤΡΕΧΟΥΣΑ ΕΚΔΟΣΗ</div><div className="font-heading text-xl text-primary">{packageJson.version}</div></div>
          <div className="text-[10px] text-foreground/50">DEAL OF TEMPTATION</div>
        </div>
      </ComicPanel>
      <AdminGlobalDesign />
    </div>
  );
}
