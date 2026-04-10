import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';

const WA_NUMBER = '254739101811';

// ─── Helper: parse images from backend ───────────────────────────────────────
// Backend returns images as array of objects: [{ id, url, public_id, ... }]
// Fallback: comma-separated image_url string or legacy { dataUrl } objects
function getImages(listing) {
  if (listing.images?.length) {
    return listing.images.map(i => i.url || i.dataUrl || i).filter(Boolean);
  }
  if (listing.image_url) {
    return listing.image_url.split(',').map(u => u.trim()).filter(Boolean);
  }
  return [];
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80';

// ─── Floating WhatsApp ────────────────────────────────────────────────────────
export function FloatingWhatsApp() {
  return (
    <a href={`https://wa.me/${WA_NUMBER}?text=Hello%2C%20I%27m%20interested%20in%20a%20property%20on%20Popote%20Estate.`}
      target="_blank" rel="noopener noreferrer" style={fwS.btn} title="Chat on WhatsApp">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}
const fwS = {
  btn: {
    position: 'fixed', bottom: '36px', right: '36px', zIndex: 999,
    width: '56px', height: '56px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #25D366, #1FAD55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 10px 36px rgba(37,211,102,.38), 0 2px 8px rgba(0,0,0,.14)',
    textDecoration: 'none', animation: 'pulse-gold 3.5s ease-in-out infinite',
  },
};

// ─── Toast ────────────────────────────────────────────────────────────────────
export function Toast({ msg, isError }) {
  const [vis, setVis] = useState(true);
  useEffect(() => { const t = setTimeout(() => setVis(false), 3800); return () => clearTimeout(t); }, []);
  if (!vis) return null;
  return (
    <div style={tS.wrap(isError)}>
      <span style={{ color: isError ? '#F87171' : 'var(--gold-bright)', fontSize: '10px' }}>{isError ? '▲' : '◆'}</span>
      {msg}
    </div>
  );
}
const tS = {
  wrap: (err) => ({
    position: 'fixed', bottom: '36px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
    background: err ? '#1A0A0A' : 'var(--carbon)', color: 'var(--cream)',
    padding: '15px 30px', borderRadius: '1px', fontSize: '12px',
    fontFamily: 'var(--sans)', letterSpacing: '0.05em',
    boxShadow: '0 16px 48px rgba(0,0,0,.35)',
    display: 'flex', alignItems: 'center', gap: '12px',
    borderBottom: `2px solid ${err ? '#F87171' : 'var(--gold)'}`,
    animation: 'fadeInUp 0.3s ease', whiteSpace: 'nowrap',
  }),
};

// ─── Property Card ────────────────────────────────────────────────────────────
export function PropertyCard({ listing }) {
  const { showPage } = useContext(AppContext);
  const [saved, setSaved] = useState(false);
  const [hovered, setHovered] = useState(false);

  // ✅ Reads from backend images array (objects with url) or fallback formats
  const imgs = getImages(listing);
  const img = imgs[0] || PLACEHOLDER;

  const isMombasa = listing.region === 'Mombasa';
  const isOffplan = listing.category?.toLowerCase().includes('off-plan');
  const isRental = listing.category?.toLowerCase().includes('rental');
  const badgeColor = isRental ? 'var(--green)' : isOffplan ? '#4A3014' : 'var(--obsidian)';
  const badgeLabel = isRental ? 'For Rent' : isOffplan ? 'Off-Plan' : 'For Sale';
  const priceDisplay = listing.priceDisplay || `KES ${parseFloat(listing.price || 0).toLocaleString()}`;
  const source = isOffplan ? 'offplan' : isRental ? 'rentals' : 'sale';

  return (
    <article
      style={cS.card(hovered)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => showPage('detail', { id: listing.id, source })}
    >
      <div style={cS.imgWrap}>
        <img src={img} alt={listing.title} style={cS.img(hovered)} loading="lazy" />
        <div style={cS.overlay} />
        <div style={cS.badge(badgeColor)}>{badgeLabel}</div>
        {listing.region && <div style={cS.region(isMombasa)}>{listing.region}</div>}
        <button style={cS.heart(saved)} onClick={e => { e.stopPropagation(); setSaved(v => !v); }}>{saved ? '♥' : '♡'}</button>
        <div style={cS.pricePill}><span style={cS.priceNum}>{priceDisplay}</span></div>
      </div>
      <div style={cS.body}>
        <div style={cS.loc}>{listing.location || listing.region}</div>
        <h3 style={cS.title}>{listing.title}</h3>
        <div style={cS.specs}>
          {listing.beds && <span style={cS.spec}>🛏 {listing.beds} Bed</span>}
          {listing.baths && <span style={cS.spec}>🚿 {listing.baths} Bath</span>}
          {listing.sqm && <span style={cS.spec}>◻ {listing.sqm} m²</span>}
        </div>
        <div style={cS.foot}>
          <span style={cS.cta}>
            View Details
            <span style={{ display: 'inline-block', transform: hovered ? 'translateX(5px)' : 'none', transition: 'transform .3s', marginLeft: '6px' }}>→</span>
          </span>
        </div>
      </div>
    </article>
  );
}

const cS = {
  card: (hov) => ({
    background: 'var(--white)', borderRadius: '2px', overflow: 'hidden',
    border: '1px solid var(--border)', cursor: 'pointer',
    transition: 'transform .4s cubic-bezier(.34,.86,.64,1), box-shadow .4s',
    transform: hov ? 'translateY(-9px)' : 'none',
    boxShadow: hov ? '0 32px 72px rgba(10,8,6,.18), 0 0 0 1px rgba(184,144,42,.18)' : 'var(--shadow-sm)',
    height: '100%', display: 'flex', flexDirection: 'column',
  }),
  imgWrap: { position: 'relative', height: '244px', overflow: 'hidden', background: 'var(--parchment)', flexShrink: 0 },
  img: (hov) => ({ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .75s cubic-bezier(.25,.46,.45,.94)', transform: hov ? 'scale(1.09)' : 'scale(1)' }),
  overlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,8,6,.72) 0%, rgba(10,8,6,.08) 55%, transparent)' },
  badge: (col) => ({ position: 'absolute', top: '13px', left: '13px', background: col, color: 'var(--cream)', fontFamily: 'var(--sans)', fontSize: '8.5px', fontWeight: '600', letterSpacing: '0.16em', textTransform: 'uppercase', padding: '5px 11px', borderRadius: '1px' }),
  region: (msa) => ({ position: 'absolute', top: '13px', right: '13px', background: msa ? 'rgba(24,50,63,.88)' : 'rgba(20,18,16,.78)', backdropFilter: 'blur(10px)', color: 'rgba(248,244,238,.88)', fontFamily: 'var(--sans)', fontSize: '8.5px', fontWeight: '500', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '1px' }),
  heart: (saved) => ({ position: 'absolute', bottom: '52px', right: '13px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(253,250,246,.94)', border: '1px solid rgba(184,144,42,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', cursor: 'pointer', color: saved ? 'var(--gold)' : 'var(--stone)', transition: 'all .2s' }),
  pricePill: { position: 'absolute', bottom: '13px', left: '13px', right: '52px' },
  priceNum: { fontFamily: 'var(--serif)', fontSize: '21px', fontWeight: '400', color: 'var(--cream)', letterSpacing: '-0.01em' },
  body: { padding: '19px 21px 22px', display: 'flex', flexDirection: 'column', flex: 1 },
  loc: { fontFamily: 'var(--sans)', fontSize: '8.5px', fontWeight: '600', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '6px' },
  title: { fontFamily: 'var(--serif)', fontSize: '19px', fontWeight: '400', color: 'var(--ink)', marginBottom: '11px', lineHeight: '1.28', flex: 1 },
  specs: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' },
  spec: { fontFamily: 'var(--sans)', fontSize: '11px', color: 'var(--stone)' },
  foot: { borderTop: '1px solid var(--border)', paddingTop: '13px', display: 'flex', justifyContent: 'flex-end' },
  cta: { fontFamily: 'var(--sans)', fontSize: '10px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', display: 'flex', alignItems: 'center' },
};

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ eyebrow, title, subtitle, centered = false }) {
  return (
    <div style={{ textAlign: centered ? 'center' : 'left', marginBottom: '52px' }}>
      <div style={shS.ey(centered)}>{eyebrow}</div>
      <h2 style={shS.h2} dangerouslySetInnerHTML={{ __html: title }} />
      {subtitle && <p style={shS.sub(centered)}>{subtitle}</p>}
    </div>
  );
}
const shS = {
  ey: (c) => ({ fontFamily: 'var(--sans)', fontSize: '9px', fontWeight: '700', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: c ? 'center' : 'flex-start' }),
  h2: { fontFamily: 'var(--serif)', fontSize: 'clamp(34px, 4.5vw, 58px)', fontWeight: '400', lineHeight: '1.1', color: 'var(--ink)', letterSpacing: '-0.02em' },
  sub: (c) => ({ fontFamily: 'var(--sans)', fontSize: '13.5px', color: 'var(--stone)', lineHeight: '1.8', marginTop: '14px', fontWeight: '300', maxWidth: c ? '520px' : 'none', margin: c ? '14px auto 0' : '14px 0 0' }),
};

// ─── Gold Divider ─────────────────────────────────────────────────────────────
export function GoldDivider({ symbol = '◆' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, var(--border-mid), transparent)' }} />
      <span style={{ color: 'var(--gold)', fontSize: '8px', opacity: .65 }}>{symbol}</span>
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, var(--border-mid), transparent)' }} />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, desc, ctaLabel, onCta }) {
  const ctx = useContext(AppContext);
  return (
    <div style={esS.wrap}>
      <div style={esS.icon}>{icon}</div>
      <h3 style={esS.title}>{title}</h3>
      <p style={esS.desc}>{desc}</p>
      {ctaLabel && <button style={esS.cta} onClick={onCta || (() => ctx.showPage('admin'))}>{ctaLabel}</button>}
    </div>
  );
}
const esS = {
  wrap: { textAlign: 'center', padding: '96px 24px', border: '1px dashed var(--border-mid)', borderRadius: '2px', background: 'rgba(184,144,42,.02)' },
  icon: { fontSize: '52px', marginBottom: '20px', opacity: .55 },
  title: { fontFamily: 'var(--serif)', fontSize: '32px', fontWeight: '400', color: 'var(--ink)', marginBottom: '12px' },
  desc: { fontFamily: 'var(--sans)', fontSize: '13.5px', color: 'var(--stone)', lineHeight: '1.75', maxWidth: '420px', margin: '0 auto 28px', fontWeight: '300' },
  cta: { background: 'var(--ink)', color: 'var(--cream)', border: 'none', padding: '13px 32px', borderRadius: '1px', fontFamily: 'var(--sans)', fontSize: '10.5px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' },
};

// ─── Footer ───────────────────────────────────────────────────────────────────
export function Footer() {
  const { showPage } = useContext(AppContext);
  return (
    <footer style={ftS.footer}>
      <div style={ftS.inner}>
        <div style={ftS.top}>
          <div>
            <div style={ftS.brandName}>
              <img src="/logo.jpeg" alt="Popote Listings" style={{ height: '68px', width: '68px', objectFit: 'cover', borderRadius: '50%', display: 'block', marginBottom: '12px', border: '1.5px solid rgba(184,144,42,.35)' }} />
            </div>
            <p style={ftS.desc}>Kenya's most refined property marketplace — connecting discerning buyers, investors and renters with exceptional properties across Nairobi, Mombasa and beyond.</p>
            <div style={ftS.contactBlock}>
              {[
                { href: 'https://maps.google.com/?q=Westlands+Nairobi+Kenya', icon: '📍', label: 'Westlands, Nairobi, Kenya' },
                { href: 'tel:+254739101811', icon: '📞', label: '+254 739 101 811' },
                { href: 'mailto:info@popotelistings.co.ke', icon: '✉', label: 'info@popotelistings.co.ke' },
              ].map(c => (
                <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={ftS.contactRow}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--gold-mid)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(248,244,238,.38)'}
                >
                  <span style={ftS.contactIcon}>{c.icon}</span>
                  <span>{c.label}</span>
                </a>
              ))}
            </div>
            <div style={ftS.tags}>
              {['Karen', 'Kilimani', 'Westlands', 'Lavington', 'Nyali', 'Diani', 'Ruaka'].map(t => (
                <span key={t} style={ftS.tag}>{t}</span>
              ))}
            </div>
          </div>
          {[
            { head: 'Buy', links: [{ l: 'Off-Plan', p: 'offplan' }, { l: 'Ready Homes', p: 'sale' }, { l: 'Luxury Villas', p: 'sale' }] },
            { head: 'Rent', links: [{ l: 'Furnished', p: 'rentals' }, { l: 'Unfurnished', p: 'rentals' }, { l: 'Short Stay', p: 'rentals' }] },
            { head: 'Company', links: [{ l: 'Contact Us', p: 'contact' }, { l: 'List With Us', p: 'listwithus' }, { l: 'Admin', p: 'admin' }] },
          ].map(col => (
            <div key={col.head}>
              <div style={ftS.colHead}>{col.head}</div>
              <ul style={ftS.colLinks}>
                {col.links.map(lk => (
                  <li key={lk.l}>
                    <button style={ftS.link} onClick={() => showPage(lk.p)}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--cream)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(248,244,238,.3)'}
                    >{lk.l}</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <GoldDivider />
        <div style={ftS.bottom}>
          <span>© 2026 Popote Listings · All rights reserved · Westlands, Nairobi, Kenya</span>
        </div>
      </div>
    </footer>
  );
}
const ftS = {
  footer: { background: 'var(--obsidian)', borderTop: '1px solid rgba(184,144,42,.1)', paddingTop: '72px' },
  inner: { maxWidth: '1280px', margin: '0 auto', padding: '0 60px 36px' },
  top: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '52px', marginBottom: '52px' },
  brandName: { marginBottom: '16px' },
  desc: { fontFamily: 'var(--sans)', fontSize: '12.5px', color: 'rgba(248,244,238,.26)', lineHeight: '1.82', marginBottom: '20px', fontWeight: '300' },
  contactBlock: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' },
  contactRow: { display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--sans)', fontSize: '11.5px', color: 'rgba(248,244,238,.38)', textDecoration: 'none', letterSpacing: '0.03em', transition: 'color .2s' },
  contactIcon: { fontSize: '12px', flexShrink: 0 },
  tags: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  tag: { fontFamily: 'var(--sans)', fontSize: '9px', color: 'rgba(248,244,238,.18)', background: 'rgba(255,255,255,.04)', padding: '3px 10px', borderRadius: '1px', border: '1px solid rgba(255,255,255,.06)', letterSpacing: '0.06em' },
  colHead: { fontFamily: 'var(--sans)', fontSize: '8.5px', fontWeight: '700', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: '20px' },
  colLinks: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' },
  link: { background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '12.5px', color: 'rgba(248,244,238,.3)', transition: 'color .2s', textAlign: 'left', padding: 0, letterSpacing: '0.02em' },
  bottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', fontFamily: 'var(--sans)', fontSize: '10.5px', color: 'rgba(248,244,238,.16)', letterSpacing: '0.04em' },
};

export default FloatingWhatsApp;