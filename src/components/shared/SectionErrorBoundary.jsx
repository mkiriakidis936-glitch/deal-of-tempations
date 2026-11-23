import React from 'react';

// Αν μία ενότητα κρασάρει, εμφανίζεται μήνυμα μόνο σε αυτήν — η υπόλοιπη εφαρμογή συνεχίζει να δουλεύει.
export default class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(`[${this.props.name || 'section'}] σφάλμα εμφάνισης`, error, info?.componentStack);
  }

  componentDidUpdate(prev) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="rounded-3xl border border-[#FF453A]/40 bg-[#1A0B0A] p-5 text-[#F5F1E8]">
        <div className="text-lg font-bold">Αυτή η ενότητα δεν φόρτωσε σωστά</div>
        <p className="mt-1 text-sm text-white/70">Οι υπόλοιπες ενότητες λειτουργούν κανονικά. Δοκίμασε ξανά ή άνοιξε άλλη ενότητα.</p>
        <p className="mt-2 break-words font-mono text-xs text-white/45">{String(this.state.error?.message || this.state.error)}</p>
        <button type="button" onClick={() => this.setState({ error: null })} className="mt-3 h-11 rounded-full bg-[#E8C26B] px-5 text-sm font-bold text-black">↻ Ξαναδοκίμασε</button>
      </div>
    );
  }
}
