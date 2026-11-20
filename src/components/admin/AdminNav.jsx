import React, { useState } from 'react';
import { LayoutDashboard, Inbox, Radio, Layers, LayoutGrid, X } from 'lucide-react';

export default function AdminNav({ groups, active, onChange }) {
  return (
    <nav aria-label="Πλοήγηση διαχείρισης">
      {groups.map((group) => (
        <div key={group.id} className="adm-group">
          <div className="adm-group-label">{group.label}</div>
          {group.tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange(t.id)}
                aria-current={active === t.id ? 'page' : undefined}
                className="adm-navitem"
              >
                {Icon && <Icon aria-hidden="true" />}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

const PRIMARY_TABS = [
  { id: 'dashboard', label: 'Αρχική', icon: LayoutDashboard },
  { id: 'show', label: 'Live', icon: Radio },
  { id: 'modes', label: 'Κάρτες', icon: Layers },
  { id: 'inbox', label: 'Αιτήσεις', icon: Inbox },
];

export function AdminTabBar({ groups, active, onChange }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const inPrimary = PRIMARY_TABS.some((tab) => tab.id === active);

  const selectTab = (id) => {
    onChange(id);
    setMoreOpen(false);
  };

  return (
    <div className="adm-tabbar" role="tablist" aria-label="Κύρια πλοήγηση">
      {moreOpen && (
        <div className="adm-more">
          <div className="adm-more-head">
            <div className="adm-more-title">Όλες οι ενότητες</div>
            <button type="button" onClick={() => setMoreOpen(false)} className="adm-pill adm-pill--icon" aria-label="Κλείσιμο">
              <X size={16} strokeWidth={2.2} />
            </button>
          </div>
          {groups.map((group) => (
            <section key={group.id} className="adm-group">
              <div className="adm-group-label">{group.label}</div>
              {group.tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTab(t.id)}
                    aria-current={active === t.id ? 'page' : undefined}
                    className="adm-navitem"
                  >
                    {Icon && <Icon aria-hidden="true" />}
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </section>
          ))}
        </div>
      )}
      {PRIMARY_TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button key={tab.id} type="button" role="tab" aria-selected={active === tab.id && !moreOpen} onClick={() => selectTab(tab.id)} className="adm-tab">
            <Icon aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        );
      })}
      <button
        type="button"
        role="tab"
        aria-selected={moreOpen || !inPrimary}
        aria-expanded={moreOpen}
        onClick={() => setMoreOpen((open) => !open)}
        className="adm-tab"
      >
        <LayoutGrid aria-hidden="true" />
        <span>Περισσότερα</span>
      </button>
    </div>
  );
}
