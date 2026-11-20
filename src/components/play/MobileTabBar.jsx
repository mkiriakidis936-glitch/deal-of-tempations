import React from 'react';

const TABS = [
  { id: 'status', icon: '🏠', label: 'Status' },
  { id: 'show', icon: '📨', label: 'Show' },
  { id: 'votes', icon: '🗳️', label: 'Ψήφοι' },
  { id: 'mini', icon: '🎮', label: 'Mini' },
  { id: 'scan', icon: '📷', label: 'Scan' },
];

// iOS 27 · πλωτή γυάλινη tab bar στο κάτω μέρος της οθόνης (όπως οι native εφαρμογές).
// Το <TabBarSpacer /> κρατά ελεύθερο χώρο ώστε να μην καλύπτει το περιεχόμενο.
export default function MobileTabBar({ active, onChange, hasScan }) {
  const tabs = hasScan ? TABS : TABS.filter((t) => t.id !== 'scan');
  return (
    <nav className="ios-tabbar" role="tablist" aria-label="Πλοήγηση παίκτη">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => {
            if (active !== t.id && navigator.vibrate) navigator.vibrate(8);
            onChange(t.id);
          }}
          className="ios-tab"
        >
          <span className="ios-tab-icon">{t.icon}</span>
          <span className="ios-tab-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function TabBarSpacer() {
  return <div className="ios-tab-spacer" aria-hidden="true" />;
}
