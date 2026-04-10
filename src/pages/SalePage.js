import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { PropertyCard, SectionHeader, EmptyState, Footer } from '../components/SharedComponents';

const SALE_CSS = `
@media (max-width: 768px) {
  .lp-hero-content { padding: 0 20px !important; }
  .lp-inner        { padding: 0 16px !important; }
  .lp-filter-bar   { padding: 14px 16px !important; gap: 8px !important; }
  .lp-fsel         { min-width: unset !important; width: 100% !important; }
  .lp-filter-count { margin-left: 0 !important; }
  .lp-grid         { grid-template-columns: 1fr !important; }
  .lp-section      { padding: 40px 0 64px !important; }
  .lp-page-hero    { padding: 56px 0 44px !important; }
}
@media (max-width: 480px) {
  .lp-filter-bar   { flex-direction: column !important; }
  .lp-filter-btn   { width: 100% !important; }
}
`;

function injectOnce(id, css) {
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
}

function ListingPage({ pageKey, hero, filterConfig, matchFn, emptyIcon, emptyTitle, emptyDesc }) {
  injectOnce('sale-page-css', SALE_CSS);
  const { listings, showPage } = useContext(AppContext);
  const [filters, setFilters] = useState({});
  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const filtered = listings.filter(l => matchFn(l, filters));

  return (
    <div>
      {/* Page Hero */}
      <div style={s.pageHero} className="lp-page-hero">
        <div style={s.heroGradient} />
        <div style={s.heroOrb} />
        <div style={s.heroContent} className="lp-hero-content">
          <div style={s.eyebrow}>{hero.eyebrow}</div>
          <h1 style={s.h1}>{hero.title} <em style={s.em}>{hero.em}</em></h1>
          <p style={s.sub}>{hero.sub}</p>
        </div>
      </div>

      {/* Listings */}
      <section style={s.section} className="lp-section">
        <div style={s.inner} className="lp-inner">
          {/* Filter bar */}
          <div style={s.filterBar} className="lp-filter-bar">
            {filterConfig.map(f => (
              <select
                key={f.key}
                style={s.fsel}
                className="lp-fsel"
                value={filters[f.key] || ''}
                onChange={e => setFilter(f.key, e.target.value)}
              >
                {f.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ))}
            <button style={s.filterBtn} className="lp-filter-btn" onClick={() => setFilters({})}>Reset</button>
            <span style={s.filterCount} className="lp-filter-count">
              {filtered.length} listing{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filtered.length > 0 ? (
            <div style={s.grid} className="lp-grid">
              {filtered.map((l, i) => <PropertyCard key={l.id} listing={l} index={i} />)}
            </div>
          ) : (
            <EmptyState icon={emptyIcon} title={emptyTitle} desc={emptyDesc} ctaLabel="Add Listing →" />
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ─── For Sale ────────────────────────────────────────────────────────────────
export function SalePage() {
  return (
    <ListingPage
      pageKey="sale"
      hero={{ eyebrow: 'Ready to Own', title: 'Properties', em: 'For Sale', sub: 'Premium ready-to-occupy homes across Nairobi, Mombasa and the outskirts.' }}
      filterConfig={[
        { key: 'region', options: [{ value: '', label: 'All Regions' }, { value: 'Nairobi', label: 'Nairobi' }, { value: 'Mombasa', label: 'Mombasa' }, { value: 'Nairobi Outskirts', label: 'Outskirts' }] },
        { key: 'beds', options: [{ value: '', label: 'Any Bedrooms' }, { value: '2', label: '2 Bed' }, { value: '3', label: '3 Bed' }, { value: '4', label: '4 Bed' }, { value: '5', label: '5+ Bed' }] },
        { key: 'price', options: [{ value: '', label: 'Any Price' }, { value: 'u10', label: 'Under 10M' }, { value: '10-30', label: '10M – 30M' }, { value: '30-60', label: '30M – 60M' }, { value: 'o60', label: '60M+' }] },
      ]}
      matchFn={(l, f) => {
        if (!l.category?.toLowerCase().includes('for sale')) return false;
        if (f.region && l.region !== f.region) return false;
        if (f.beds && parseInt(l.beds) !== parseInt(f.beds)) return false;
        if (f.price) {
          const p = parseFloat(l.price || 0);
          if (f.price === 'u10' && p >= 10000000) return false;
          if (f.price === '10-30' && (p < 10000000 || p > 30000000)) return false;
          if (f.price === '30-60' && (p < 30000000 || p > 60000000)) return false;
          if (f.price === 'o60' && p < 60000000) return false;
        }
        return true;
      }}
      emptyIcon="🏠" emptyTitle="No Sale Listings Found" emptyDesc="No sale listings match your criteria, or none have been added yet."
    />
  );
}

// ─── Off-Plan ─────────────────────────────────────────────────────────────────
export function OffPlanPage() {
  return (
    <ListingPage
      pageKey="offplan"
      hero={{ eyebrow: 'Invest Early · Best Prices', title: 'Off-Plan', em: 'Developments', sub: "Secure your property at pre-launch prices across Kenya's fastest-growing corridors." }}
      filterConfig={[
        { key: 'region', options: [{ value: '', label: 'All Regions' }, { value: 'Nairobi', label: 'Nairobi' }, { value: 'Mombasa', label: 'Mombasa' }, { value: 'Nairobi Outskirts', label: 'Outskirts' }] },
        { key: 'beds', options: [{ value: '', label: 'Any Bedrooms' }, { value: '1', label: '1 Bed' }, { value: '2', label: '2 Bed' }, { value: '3', label: '3 Bed' }, { value: '4', label: '4+ Bed' }] },
        { key: 'price', options: [{ value: '', label: 'Any Price' }, { value: 'u10', label: 'Under 10M' }, { value: '10-30', label: '10M – 30M' }, { value: '30-60', label: '30M – 60M' }] },
      ]}
      matchFn={(l, f) => {
        if (!l.category?.toLowerCase().includes('off-plan')) return false;
        if (f.region && l.region !== f.region) return false;
        if (f.beds && parseInt(l.beds) !== parseInt(f.beds)) return false;
        if (f.price) {
          const p = parseFloat(l.price || 0);
          if (f.price === 'u10' && p >= 10000000) return false;
          if (f.price === '10-30' && (p < 10000000 || p > 30000000)) return false;
          if (f.price === '30-60' && (p < 30000000 || p > 60000000)) return false;
        }
        return true;
      }}
      emptyIcon="🏗️" emptyTitle="No Off-Plan Listings" emptyDesc="Off-plan developments will appear here once added."
    />
  );
}

// ─── Rentals ──────────────────────────────────────────────────────────────────
export function RentalsPage() {
  return (
    <ListingPage
      pageKey="rentals"
      hero={{ eyebrow: 'Monthly & Short-Stay', title: 'Properties', em: 'For Rent', sub: 'Furnished and unfurnished rentals across Nairobi and Mombasa.' }}
      filterConfig={[
        { key: 'region', options: [{ value: '', label: 'All Regions' }, { value: 'Nairobi', label: 'Nairobi' }, { value: 'Mombasa', label: 'Mombasa' }, { value: 'Nairobi Outskirts', label: 'Outskirts' }] },
        { key: 'furnish', options: [{ value: '', label: 'Furnished / Unfurnished' }, { value: 'Rental · Furnished', label: 'Furnished' }, { value: 'Rental · Unfurnished', label: 'Unfurnished' }] },
        { key: 'beds', options: [{ value: '', label: 'Any Bedrooms' }, { value: '1', label: '1 Bed' }, { value: '2', label: '2 Bed' }, { value: '3', label: '3 Bed' }, { value: '4', label: '4+ Bed' }] },
        { key: 'price', options: [{ value: '', label: 'Any Rent' }, { value: 'u50', label: 'Under 50K/mo' }, { value: '50-100', label: '50K – 100K/mo' }, { value: 'o100', label: '100K+/mo' }] },
      ]}
      matchFn={(l, f) => {
        if (!l.category?.toLowerCase().includes('rental')) return false;
        if (f.region && l.region !== f.region) return false;
        if (f.furnish && l.category !== f.furnish) return false;
        if (f.beds && parseInt(l.beds) !== parseInt(f.beds)) return false;
        if (f.price) {
          const p = parseFloat(l.price || 0);
          if (f.price === 'u50' && p >= 50000) return false;
          if (f.price === '50-100' && (p < 50000 || p > 100000)) return false;
          if (f.price === 'o100' && p < 100000) return false;
        }
        return true;
      }}
      emptyIcon="🔑" emptyTitle="No Rental Listings" emptyDesc="Rental properties will appear here once added."
    />
  );
}

const s = {
  pageHero: { background: 'var(--obsidian)', padding: '80px 0 64px', position: 'relative', overflow: 'hidden' },
  heroGradient: { position: 'absolute', inset: 0, background: 'linear-gradient(140deg, #08060300 0%, #0E0B08 50%, #1A1208 100%)' },
  heroOrb: { position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 80% 50%, rgba(192,154,60,.1) 0%, transparent 60%)' },
  heroContent: { position: 'relative', zIndex: 2, maxWidth: '1280px', margin: '0 auto', padding: '0 56px' },
  eyebrow: { fontFamily: 'var(--sans)', fontSize: '9.5px', fontWeight: '700', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' },
  h1: { fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 5.5vw, 72px)', fontWeight: '300', color: 'var(--cream)', lineHeight: '1.08', marginBottom: '12px', letterSpacing: '-0.02em' },
  em: { fontStyle: 'italic', color: 'var(--gold-bright)', fontWeight: '400' },
  sub: { fontFamily: 'var(--sans)', fontSize: '14px', color: 'rgba(250,247,242,.44)', maxWidth: '480px', fontWeight: '300', lineHeight: '1.7' },
  section: { padding: '72px 0 96px' },
  inner: { maxWidth: '1280px', margin: '0 auto', padding: '0 56px' },
  filterBar: {
    background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '2px',
    padding: '18px 24px', display: 'flex', gap: '12px', flexWrap: 'wrap',
    alignItems: 'center', marginBottom: '44px', boxShadow: 'var(--shadow-sm)',
  },
  fsel: { fontFamily: 'var(--sans)', fontSize: '12.5px', color: 'var(--ink)', background: 'var(--parchment)', border: '1px solid var(--border)', padding: '9px 13px', borderRadius: '1px', outline: 'none', cursor: 'pointer', WebkitAppearance: 'none', minWidth: '130px' },
  filterBtn: { background: 'none', border: '1px solid var(--border-mid)', color: 'var(--stone)', padding: '9px 20px', borderRadius: '1px', fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' },
  filterCount: { marginLeft: 'auto', fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--stone)', letterSpacing: '0.04em' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '26px' },
};

export default SalePage;
