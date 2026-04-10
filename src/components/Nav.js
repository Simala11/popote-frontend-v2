import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';

const WA_LINK = 'https://wa.me/254739101811?text=Hello%2C%20I%27m%20interested%20in%20a%20property%20on%20Popote%20Listings.';

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'sale', label: 'For Sale' },
  { id: 'offplan', label: 'Off-Plan' },
  { id: 'rentals', label: 'Rentals' },
  { id: 'contact', label: 'Contact' },
];

const NAV_CSS = `
  @media (max-width: 768px) {
    .nav-links   { display: none !important; }
    .nav-right   { display: none !important; }
    .nav-hamburger { display: flex !important; }
    .nav-inner   { padding: 0 20px !important; }
  }
`;

export default function Nav() {
  const { page, showPage } = useContext(AppContext);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = NAV_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 48);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [page]);

  return (
    <nav style={st.nav(scrolled)}>
      {/* ── Gold accent bar ── */}
      <div style={st.topBar} />

      <div style={st.inner} className="nav-inner">
        {/* ── Logo ── */}
        <button style={st.logo} onClick={() => showPage('home')}>
          <img src="/logo.jpeg" alt="Popote Listings" style={st.logoImg} />
        </button>

        {/* ── Desktop links ── */}
        <ul style={st.links} className="nav-links">
          {NAV_ITEMS.map(item => (
            <li key={item.id} style={{ position: 'relative' }}>
              <button style={st.link(page === item.id)} onClick={() => showPage(item.id)}>
                {item.label}
              </button>
              {page === item.id && <span style={st.linkDot} />}
            </li>
          ))}
        </ul>

        {/* ── Right actions ── */}
        <div style={st.right} className="nav-right">
          <button style={st.listBtn} onClick={() => showPage('listwithus')}>
            List a Property
          </button>
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={st.waBtn}>
            <WaIcon />
            WhatsApp
          </a>
          <button style={st.adminBtn} onClick={() => showPage('admin')}>⚙</button>
        </div>

        {/* ── Hamburger ── */}
        <button
          style={st.hamburger}
          className="nav-hamburger"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menu"
        >
          <span style={st.ham(menuOpen, 0)} />
          <span style={st.ham(menuOpen, 1)} />
          <span style={st.ham(menuOpen, 2)} />
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <div style={st.drawer}>
          {[...NAV_ITEMS,
          { id: 'listwithus', label: 'List a Property' },
          { id: 'admin', label: 'Admin ⚙' },
          ].map(item => (
            <button
              key={item.id}
              style={st.drawerLink(page === item.id)}
              onClick={() => { showPage(item.id); setMenuOpen(false); }}
            >
              {item.label}
              {page === item.id && <span style={st.drawerDot} />}
            </button>
          ))}
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={st.drawerWa}>
            <WaIcon /> +254 739 101 811
          </a>
        </div>
      )}
    </nav>
  );
}

function WaIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const st = {
  nav: (scrolled) => ({
    position: 'sticky', top: 0, zIndex: 300,
    background: scrolled ? 'rgba(253,250,246,0.99)' : 'rgba(253,250,246,0.96)',
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    borderBottom: `1px solid ${scrolled ? 'rgba(184,144,42,.16)' : 'rgba(184,144,42,.08)'}`,
    transition: 'all 0.5s ease',
    boxShadow: scrolled ? '0 6px 48px rgba(10,8,6,.09)' : 'none',
  }),
  topBar: {
    height: '3px',
    background: 'linear-gradient(90deg, transparent 0%, var(--gold-dark) 15%, var(--gold) 35%, var(--gold-bright) 50%, var(--gold) 65%, var(--gold-dark) 85%, transparent 100%)',
  },
  inner: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 60px', height: '76px',
    maxWidth: '1480px', margin: '0 auto',
  },
  logo: {
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', padding: 0,
    textDecoration: 'none', flexShrink: 0,
  },
  logoImg: {
    height: '62px',
    width: '62px',
    objectFit: 'cover',
    display: 'block',
    borderRadius: '50%',
    border: '1.5px solid rgba(184,144,42,.25)',
  },
  links: { display: 'flex', gap: '2px', listStyle: 'none', alignItems: 'center' },
  link: (active) => ({
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'var(--sans)', fontSize: '10.5px', fontWeight: '500',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: active ? 'var(--ink)' : 'var(--stone)',
    padding: '8px 15px', transition: 'color 0.25s',
  }),
  linkDot: {
    position: 'absolute', bottom: '-1px', left: '15px', right: '15px', height: '1.5px',
    background: 'linear-gradient(90deg, var(--gold), var(--gold-bright))',
    display: 'block', borderRadius: '1px',
  },
  right: { display: 'flex', alignItems: 'center', gap: '8px' },
  listBtn: {
    background: 'none', border: '1px solid var(--border-mid)', cursor: 'pointer',
    fontFamily: 'var(--sans)', fontSize: '10px', fontWeight: '600',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: 'var(--gold)', padding: '8px 20px', borderRadius: '1px', transition: 'all 0.25s',
  },
  waBtn: {
    display: 'flex', alignItems: 'center', gap: '7px',
    background: '#1FAD55', color: '#fff',
    fontFamily: 'var(--sans)', fontSize: '10px', fontWeight: '600',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    padding: '9px 18px', borderRadius: '1px', textDecoration: 'none', transition: 'opacity 0.2s',
  },
  adminBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'var(--sans)', fontSize: '15px',
    color: 'var(--stone)', padding: '6px 8px', transition: 'color 0.2s',
  },
  hamburger: {
    display: 'none', flexDirection: 'column', gap: '5px',
    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
  },
  ham: (open, i) => ({
    display: 'block', width: '21px', height: '1.5px',
    background: 'var(--ink)', transition: 'all 0.3s',
    transform: open && i === 0 ? 'rotate(45deg) translate(4.5px, 4.5px)'
      : open && i === 1 ? 'scaleX(0)'
        : open && i === 2 ? 'rotate(-45deg) translate(4.5px, -4.5px)'
          : 'none',
    opacity: open && i === 1 ? 0 : 1,
  }),
  drawer: {
    display: 'flex', flexDirection: 'column',
    borderTop: '1px solid var(--border)',
    padding: '14px 20px 24px', gap: '0',
    background: 'var(--white)',
  },
  drawerLink: (active) => ({
    background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
    fontFamily: 'var(--sans)', fontSize: '13px',
    fontWeight: active ? '600' : '400',
    color: active ? 'var(--ink)' : 'var(--stone)',
    padding: '14px 0', textAlign: 'left',
    borderBottom: '1px solid var(--border)',
    letterSpacing: '0.06em', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between',
  }),
  drawerDot: { width: '5px', height: '5px', borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 },
  drawerWa: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginTop: '16px', background: '#1FAD55', color: '#fff',
    padding: '14px 20px', borderRadius: '1px', textDecoration: 'none',
    fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: '600',
    justifyContent: 'center',
  },
};