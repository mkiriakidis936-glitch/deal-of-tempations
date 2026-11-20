import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { applySavedGlobalDesign, GLOBAL_DESIGN_KEY } from '@/lib/globalDesign';

export default function GlobalDesignProvider() {
  useEffect(() => {
    let active = true;
    const apply = (event) => applySavedGlobalDesign(event?.detail);
    window.addEventListener('admin-global-design-updated', apply);
    base44.entities.AppSetting.filter({ key: GLOBAL_DESIGN_KEY }, { limit: 1 })
      .then(({ items }) => {
        if (active && items?.[0]?.value) applySavedGlobalDesign(items[0].value);
      })
      .catch(() => {});
    return () => {
      active = false;
      window.removeEventListener('admin-global-design-updated', apply);
    };
  }, []);
  return null;
}
