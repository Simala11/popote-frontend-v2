import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../App';
import { PropertyCard, EmptyState, Footer } from '../components/SharedComponents';

const CATEGORIES = [
  { title: 'For Sale', sub: 'Ready Homes', page: 'sale', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=90', region: 'Nairobi & Outskirts' },
  { title: 'Off-Plan', sub: 'Invest Early', page: 'offplan', img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=90', region: 'Kenya-Wide' },
  { title: 'Rentals', sub: 'Find Your Home', page: 'rentals', img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=90', region: 'Nairobi & Mombasa' },
];
const STATS = [
  { num: '35+', label: 'Neighbourhoods' },
  { num: '2', label: 'Major Cities' },
  { num: '<2h', label: 'Response Time' },
  { num: '98%', label: 'Satisfaction' },
];
const QUICK_TAGS = {
  Nairobi: ['Karen', 'Kilimani', 'Westlands', 'Lavington', 'Muthaiga', 'Runda'],
  Mombasa: ['Nyali', 'Bamburi', 'Diani', 'Shanzu'],
  Outskirts: ['Ruaka', 'Syokimau', 'Kitengela', 'Ngong'],
};
const KF = `
@keyframes fadeInUp   { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
@keyframes breathe    { 0%,100%{opacity:.14} 50%{opacity:.28} }
@keyframes scrollLine { 0%{transform:scaleY(0);transform-origin:top} 60%{transform:scaleY(1);transform-origin:top} 60.001%{transform-origin:bottom} 100%{transform:scaleY(0);transform-origin:bottom} }
@keyframes panRight   { from{transform:scale(1.07) translateX(0)} to{transform:scale(1.07) translateX(-2.5%)} }
@keyframes shimmerBar { 0%{background-position:-200% center} 100%{background-position:200% center} }

/* ── Responsive ── */
@media (max-width: 768px) {
  .hp-hero-panel   { display: none !important; }
  .hp-hero-vert    { display: none !important; }
  .hp-scroll-cue   { display: none !important; }
  .hp-hero-content { padding: 0 16px !important; max-width: 100% !important; }
  .hp-search-bar   { flex-direction: column !important; max-width: 100% !important; gap: 0 !important; margin: 0 !important; }
  .hp-sf-div       { display: none !important; }
  .hp-sf           { padding: 10px 14px !important; border-bottom: 1px solid rgba(184,144,42,.15) !important; }
  .hp-search-btn   { width: 100% !important; justify-content: center !important; border-radius: 0 0 4px 4px !important; padding: 16px !important; }
  .hp-trust        { justify-content: center !important; }
  .hp-quick-strip  { padding: 10px 16px !important; }
  .hp-stats-inner  { padding: 0 16px !important; flex-wrap: wrap !important; }
  .hp-stat         { min-width: 50% !important; padding: 20px 12px !important; }
  .hp-stat-div     { display: none !important; }
  .hp-inner        { padding: 0 20px !important; }
  .hp-sec-header   { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
  .hp-view-all     { margin-bottom: 8px !important; }
  .hp-feat-grid    { grid-template-columns: 1fr !important; }
  .hp-feat-first   { grid-column: span 1 !important; }
  .hp-cat-grid     { grid-template-columns: 1fr !important; }
  .hp-cat-tall     { min-height: 240px !important; grid-row: span 1 !important; }
  .hp-why-grid     { grid-template-columns: 1fr 1fr !important; }
  .hp-list-banner  { flex-direction: column !important; padding: 28px 20px !important; gap: 20px !important; }
  .hp-list-cta     { width: 100% !important; text-align: center !important; }
  .hp-section      { padding: 60px 0 !important; }
  .hp-why-section  { padding: 60px 0 !important; }
  .hp-cat-section  { padding: 60px 0 !important; }
}
@media (max-width: 480px) {
  .hp-why-grid     { grid-template-columns: 1fr !important; }
  .hp-hero-h1      { font-size: 48px !important; }
}
`;

function useInject(css) {
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = css;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
}

function Counter({ target, suffix = '' }) {
  const [val, setVal] = useState(target);
  const ref = useRef();
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const num = parseFloat(String(target).replace(/[^0-9.]/g, ''));
      if (isNaN(num)) return;
      let cur = 0;
      const step = num / 36;
      const t = setInterval(() => {
        cur += step;
        if (cur >= num) { setVal(target); clearInterval(t); }
        else setVal(String(Math.floor(cur)) + suffix);
      }, 28);
    }, { threshold: .4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, suffix]);
  return <span ref={ref}>{val}</span>;
}

export default function HomePage() {
  useInject(KF);
  const { showPage, listings } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('all');
  const [searchRegion, setSearchRegion] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchBeds, setSearchBeds] = useState('');
  const [searchBudget, setSearchBudget] = useState('');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t); }, []);

  const featured = activeTab === 'all' ? listings.slice(0, 6) : listings.filter(l => l.region === activeTab).slice(0, 6);
  const go = () => {
    if (searchType === 'offplan') showPage('offplan');
    else if (searchType === 'rental') showPage('rentals');
    else showPage('sale');
  };

  return (
    <div style={{ background: 'var(--white)' }}>

      {/* ═══ HERO ═══ */}
      <section style={s.hero}>
        <div style={s.heroBg} /><div style={s.heroGrain} />
        <div style={s.heroOrb1} /><div style={s.heroOrb2} /><div style={s.heroOrb3} />
        <div style={s.heroGrid} />
        <div style={s.heroVertLine} className="hp-hero-vert" />

        {/* Right panel — hidden on mobile */}
        <div style={s.heroPanel} className="hp-hero-panel">
          <img src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&q=90" alt="Luxury property" style={s.heroPanelImg} />
          <div style={s.heroPanelGrade} /><div style={s.heroPanelOverlay} />
          <div style={s.floatingBadge}>
            <div style={s.fbDot} />
            {/*  <div><div style={s.fbLabel}>Featured Property</div><div style={s.fbVal}></div></div>
            {/*<div style={s.fbPrice}></div>*/}
          </div>
        </div>

        {/* Centre content */}
        <div style={s.heroContent} className="hp-hero-content">
          <div style={{ ...s.eyebrow, ...(loaded ? s.anim(0) : s.hidden) }}>
            <span style={s.eyeLine} /> Kenya's Premier Property Marketplace <span style={s.eyeLine} />
          </div>
          <h1 style={{ ...s.heroH1, ...(loaded ? s.anim(130) : s.hidden) }} className="hp-hero-h1">
            Find Your<br /><em style={s.heroEm}>Perfect</em><br />Property
          </h1>
          <p style={{ ...s.heroSub, ...(loaded ? s.anim(260) : s.hidden) }}>
            Curated listings across Nairobi, Mombasa and Kenya's fastest-growing suburbs — from city penthouses to ocean-view villas.
          </p>
          <div style={loaded ? s.anim(390) : s.hidden}>
            <div style={s.searchBar} className="hp-search-bar">
              <SF label="Region" value={searchRegion} onChange={setSearchRegion} className="hp-sf">
                <option value="">All Kenya</option>
                <option>Nairobi</option>
                <option>Mombasa</option>
                <option>Nairobi Outskirts</option>
              </SF>
              <div style={s.sfDiv} className="hp-sf-div" />
              <SF label="Type" value={searchType} onChange={setSearchType} className="hp-sf">
                <option value="">All Types</option>
                <option value="sale">For Sale</option>
                <option value="offplan">Off-Plan</option>
                <option value="rental">Rentals</option>
              </SF>
              <div style={s.sfDiv} className="hp-sf-div" />
              <SF label="Bedrooms" value={searchBeds} onChange={setSearchBeds} className="hp-sf">
                <option value="">Any Beds</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3 Bedrooms</option>
                <option value="4">4 Bedrooms</option>
                <option value="5">5+ Bedrooms</option>
              </SF>
              <div style={s.sfDiv} className="hp-sf-div" />
              <SF label="Budget" value={searchBudget} onChange={setSearchBudget} className="hp-sf">
                <option value="">Any Price</option>
                <option>Under 10M</option>
                <option>10M – 30M</option>
                <option>30M – 60M</option>
                <option>60M+</option>
              </SF>
              <button style={s.searchBtn} className="hp-search-btn" onClick={go}>Search →</button>
            </div>
            <div style={s.trustLine} className="hp-trust">
              {['No Commission', 'Instant WhatsApp', 'Verified Listings'].map((t, i) => (
                <React.Fragment key={t}>
                  <span style={s.trustItem}><span style={s.trustDot}>◆</span> {t}</span>
                  {i < 2 && <span style={s.trustSep} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll cue — hidden on mobile */}
        <div style={s.scrollCue} className="hp-scroll-cue">
          <div style={s.scrollLine} /><span style={s.scrollText}>Scroll</span>
        </div>
      </section>

      {/* ═══ QUICK TAGS ═══ */}
      <div style={s.quickStrip} className="hp-quick-strip">
        <span style={s.qIntro}>Explore →</span>
        {Object.entries(QUICK_TAGS).map(([city, tags]) => (
          <React.Fragment key={city}>
            <span style={s.qLabel}>{city}</span>
            {tags.map(t => (
              <button key={t} style={s.qTag} onClick={() => showPage('sale')}
                onMouseEnter={e => Object.assign(e.currentTarget.style, { background: 'var(--ink)', color: 'var(--cream)', borderColor: 'var(--ink)' })}
                onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'var(--white)', color: 'var(--stone)', borderColor: 'rgba(184,144,42,.2)' })}
              >{t}</button>
            ))}
            <span style={s.qSep}>·</span>
          </React.Fragment>
        ))}
      </div>

      {/* ═══ STATS ═══ */}
      <div style={s.statsStrip}>
        <div style={s.statsInner} className="hp-stats-inner">
          {[...STATS, { num: listings.length, label: 'Active Listings', suffix: '+' }].map((st, i, arr) => (
            <React.Fragment key={st.label}>
              <div style={s.stat} className="hp-stat">
                <div style={s.statNum}><Counter target={st.num} suffix={st.suffix || ''} /></div>
                <div style={s.statLabel}>{st.label}</div>
              </div>
              {i < arr.length - 1 && <div style={s.statDiv} className="hp-stat-div" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ═══ FEATURED ═══ */}
      <section style={s.section} className="hp-section">
        <div style={s.inner} className="hp-inner">
          <div style={s.secHeader} className="hp-sec-header">
            <div>
              <div style={s.secEy}><span style={s.secEyLine} />Handpicked Properties</div>
              <h2 style={s.secH2}>Featured <em style={s.secEm}>Listings</em></h2>
            </div>
            <button style={s.viewAll} className="hp-view-all" onClick={() => showPage('sale')}>View all listings →</button>
          </div>
          <div style={s.tabs}>
            {['all', 'Nairobi', 'Nairobi Outskirts', 'Mombasa'].map(tab => (
              <button key={tab} style={s.tab(activeTab === tab)} onClick={() => setActiveTab(tab)}>
                {tab === 'all' ? 'All Kenya' : tab}
                {activeTab === tab && <span style={s.tabLine} />}
              </button>
            ))}
          </div>
          {featured.length > 0 ? (
            <div style={s.featGrid} className="hp-feat-grid">
              {featured.map((l, i) => (
                <div key={l.id} style={i === 0 ? s.featFirst : {}} className={i === 0 ? 'hp-feat-first' : ''}>
                  <PropertyCard listing={l} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="🏛️" title="No Listings Yet" desc="Properties will appear here once added through the admin panel." ctaLabel="Add First Listing →" />
          )}
        </div>
      </section>

      {/* ═══ CATEGORIES ═══ */}
      <section style={s.catSection} className="hp-cat-section">
        <div style={s.inner} className="hp-inner">
          <div style={s.secHeader} className="hp-sec-header">
            <div>
              <div style={s.secEy}><span style={s.secEyLine} />Browse by Category</div>
              <h2 style={s.secH2}>What are you <em style={s.secEm}>looking for?</em></h2>
            </div>
          </div>
          <div style={s.catGrid} className="hp-cat-grid">
            {CATEGORIES.map((cat, i) => <CatCard key={cat.title} {...cat} index={i} onClick={() => showPage(cat.page)} />)}
          </div>
          <ListBanner onCta={() => showPage('listwithus')} />
        </div>
      </section>

      {/* ═══ WHY POPOTE ═══ */}
      <section style={s.whySection} className="hp-why-section">
        <div style={s.inner} className="hp-inner">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ ...s.secEy, justifyContent: 'center' }}><span style={s.secEyLine} />Our Promise<span style={s.secEyLine} /></div>
            <h2 style={s.secH2}>Why Choose <em style={s.secEm}>Popote Listings?</em></h2>
          </div>
          <div style={s.whyGrid} className="hp-why-grid">
            {[
              { icon: '🎯', title: 'Curated Listings', desc: 'Every property is hand-reviewed by our team before going live — no noise, only quality.' },
              { icon: '⚡', title: 'Instant WhatsApp', desc: 'Connect directly with our agents. Real responses within 2 hours, every day.' },
              { icon: '🔐', title: 'Verified & Trusted', desc: 'Genuine photos and accurate pricing — what you see is what you get.' },
              { icon: '🌍', title: 'Kenya-Wide Reach', desc: 'Nairobi, Mombasa, outskirts and beyond — the broadest property coverage in Kenya.' },
            ].map(w => <WhyCard key={w.title} {...w} />)}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function SF({ label, value, onChange, children, className }) {
  return (
    <div style={s.sf} className={className}>
      <label style={s.sfLabel}>{label}</label>
      <select style={s.sfSelect} value={value} onChange={e => onChange(e.target.value)}>{children}</select>
    </div>
  );
}

function CatCard({ title, sub, img, region, index, onClick }) {
  const [hov, setHov] = useState(false);
  const tall = index === 0;
  return (
    <div
      style={{ ...cS.card(hov), minHeight: tall ? '460px' : '215px', gridRow: tall ? 'span 2' : 'span 1' }}
      className={tall ? 'hp-cat-tall' : ''}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
    >
      <img src={img} alt={title} style={cS.img(hov)} />
      <div style={cS.grade(hov)} /><div style={cS.overlay} /><div style={cS.corner} />
      <div style={cS.body}>
        <div style={cS.tag}>{region}</div>
        <div style={cS.ttl(tall)}>{title}</div>
        <div style={cS.sub}><em>— {sub}</em></div>
        <div style={cS.cta(hov)}>
          <span>Explore</span>
          <span style={{ display: 'inline-block', transform: hov ? 'translateX(6px)' : 'none', transition: 'transform .3s' }}>→</span>
        </div>
      </div>
    </div>
  );
}
const cS = {
  card: (hov) => ({ position: 'relative', borderRadius: '2px', overflow: 'hidden', cursor: 'pointer', background: 'var(--ink)', transition: 'box-shadow .4s, transform .4s', transform: hov ? 'translateY(-5px)' : 'none', boxShadow: hov ? '0 36px 72px rgba(10,8,6,.36), 0 0 0 1px rgba(184,144,42,.22)' : '0 8px 32px rgba(10,8,6,.18)' }),
  // ── UPDATED: raised opacity from .38/.56 → .62/.78 so images read clearly ──
  img: (hov) => ({ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: hov ? .78 : .62, transition: 'opacity .5s, transform .7s', transform: hov ? 'scale(1.07)' : 'scale(1)' }),
  grade: (hov) => ({ position: 'absolute', inset: 0, background: `linear-gradient(135deg, rgba(184,144,42,${hov ? .1 : .04}) 0%, transparent 60%)`, transition: 'all .4s' }),
  overlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,8,6,.88) 0%, rgba(10,8,6,.18) 55%, transparent)' },
  corner: { position: 'absolute', top: 0, right: 0, width: '52px', height: '52px', borderTop: '2px solid rgba(184,144,42,.28)', borderRight: '2px solid rgba(184,144,42,.28)', borderRadius: '0 2px 0 0' },
  body: { position: 'absolute', inset: 0, padding: '28px 30px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' },
  tag: { fontFamily: 'var(--sans)', fontSize: '8.5px', fontWeight: '700', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '10px' },
  ttl: (tall) => ({ fontFamily: 'var(--serif)', fontSize: tall ? '42px' : '28px', fontWeight: '300', color: 'var(--cream)', lineHeight: '1.1', letterSpacing: '-0.01em' }),
  sub: { fontFamily: 'var(--serif)', fontSize: '15px', fontStyle: 'italic', color: 'var(--gold-mid)', margin: '6px 0 14px' },
  cta: (hov) => ({ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--sans)', fontSize: '10px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: hov ? 'var(--gold-bright)' : 'rgba(248,244,238,.38)', transition: 'color .3s' }),
};

function ListBanner({ onCta }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={bS.wrap(hov)} className="hp-list-banner" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onCta}>
      <div style={bS.shimmer(hov)} /><div style={bS.bg} />
      <div style={bS.left}>
        <div style={bS.ey}>Property Owners & Agents</div>
        <div style={bS.ttl}>Have a property to list? <em style={{ color: 'var(--gold-bright)', fontStyle: 'italic' }}>We'll market it for you.</em></div>
        <div style={bS.perks}>
          {['Free listing', 'Wide reach', 'Fast enquiries', '24h response'].map(p => (
            <span key={p} style={bS.perk}><span style={{ color: 'var(--gold)', marginRight: '5px' }}>✦</span>{p}</span>
          ))}
        </div>
      </div>
      <button style={bS.cta(hov)} className="hp-list-cta">List With Us →</button>
    </div>
  );
}
const bS = {
  wrap: (hov) => ({ marginTop: '28px', background: hov ? '#080604' : 'var(--carbon)', borderRadius: '2px', padding: '44px 52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'background .4s, box-shadow .4s', position: 'relative', overflow: 'hidden', border: '1px solid rgba(184,144,42,.09)', boxShadow: hov ? '0 24px 64px rgba(0,0,0,.4), 0 0 0 1px rgba(184,144,42,.2)' : 'none' }),
  shimmer: (hov) => ({ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, transparent 30%, rgba(184,144,42,.05) 50%, transparent 70%)', backgroundSize: '200% 100%', animation: hov ? 'shimmerBar 1.6s linear infinite' : 'none', pointerEvents: 'none' }),
  bg: { position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 85% 50%, rgba(184,144,42,.1) 0%, transparent 55%)', pointerEvents: 'none' },
  left: { position: 'relative', zIndex: 1 },
  ey: { fontFamily: 'var(--sans)', fontSize: '8.5px', fontWeight: '800', letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px' },
  ttl: { fontFamily: 'var(--serif)', fontSize: 'clamp(20px, 2.8vw, 36px)', fontWeight: '300', color: 'var(--cream)', lineHeight: '1.3' },
  perks: { display: 'flex', gap: '22px', marginTop: '14px', flexWrap: 'wrap' },
  perk: { fontFamily: 'var(--sans)', fontSize: '11px', color: 'rgba(248,244,238,.35)', fontWeight: '300', letterSpacing: '0.04em' },
  cta: (hov) => ({ flexShrink: 0, background: hov ? 'var(--gold-bright)' : 'var(--gold)', color: hov ? 'var(--ink)' : '#fff', border: 'none', padding: '16px 40px', borderRadius: '1px', fontFamily: 'var(--sans)', fontSize: '11.5px', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', position: 'relative', zIndex: 1, whiteSpace: 'nowrap', transition: 'all .3s', boxShadow: hov ? '0 8px 24px rgba(184,144,42,.38)' : 'none' }),
};

function WhyCard({ icon, title, desc }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={wS.card(hov)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={wS.iconWrap(hov)}><span style={{ fontSize: '22px' }}>{icon}</span></div>
      <div style={wS.line(hov)} />
      <h3 style={wS.ttl(hov)}>{title}</h3>
      <p style={wS.desc}>{desc}</p>
    </div>
  );
}
const wS = {
  card: (hov) => ({ background: hov ? 'var(--white)' : 'rgba(253,250,246,.6)', border: `1px solid ${hov ? 'rgba(184,144,42,.3)' : 'var(--border)'}`, borderRadius: '2px', padding: '36px 32px', transition: 'all .35s', boxShadow: hov ? '0 16px 48px rgba(10,8,6,.1)' : 'none', transform: hov ? 'translateY(-4px)' : 'none' }),
  iconWrap: (hov) => ({ width: '52px', height: '52px', borderRadius: '50%', background: hov ? 'var(--gold-pale)' : 'var(--parchment)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', transition: 'background .3s' }),
  line: (hov) => ({ width: hov ? '40px' : '18px', height: '2px', background: 'linear-gradient(90deg, var(--gold), var(--gold-bright))', borderRadius: '1px', marginBottom: '16px', transition: 'width .4s' }),
  ttl: (hov) => ({ fontFamily: 'var(--serif)', fontSize: '22px', fontWeight: '400', color: hov ? 'var(--ink)' : 'var(--smoke)', marginBottom: '10px', transition: 'color .3s' }),
  desc: { fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--stone)', lineHeight: '1.82', fontWeight: '300' },
};

const s = {
  hidden: { opacity: 0 },
  anim: (d) => ({ animation: `fadeInUp .85s cubic-bezier(.16,1,.3,1) ${d}ms both` }),
  hero: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },

  // ── UPDATED: lifted from #080604/0D0A07 to warmer, noticeably lighter darks ──
  heroBg: { position: 'absolute', inset: 0, background: 'linear-gradient(145deg, #120E08 0%, #1A1409 35%, #221A0C 68%, #2A1E0E 100%)' },

  heroGrain: { position: 'absolute', inset: 0, opacity: .05, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: '180px' },

  // ── UPDATED: orb1 brightened from .13 → .22 for more visible gold warmth ──
  heroOrb1: { position: 'absolute', width: '1000px', height: '1000px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,144,42,.22) 0%, transparent 68%)', top: '-280px', right: '-180px', pointerEvents: 'none', animation: 'breathe 6s ease-in-out infinite' },
  heroOrb2: { position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,172,80,.1) 0%, transparent 70%)', bottom: '60px', left: '60px', pointerEvents: 'none', animation: 'breathe 8s ease-in-out 2s infinite' },
  heroOrb3: { position: 'absolute', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,144,42,.08) 0%, transparent 70%)', top: '30%', left: '34%', pointerEvents: 'none' },

  heroGrid: { position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(184,144,42,.02) 80px), repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(184,144,42,.02) 80px)' },
  heroVertLine: { position: 'absolute', top: 0, bottom: 0, left: '57%', width: '1px', background: 'linear-gradient(to bottom, transparent, rgba(184,144,42,.22) 40%, rgba(184,144,42,.14) 72%, transparent)' },
  heroPanel: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '44%', overflow: 'hidden', clipPath: 'polygon(8% 0, 100% 0, 100% 100%, 0% 100%)' },

  // ── UPDATED: raised from .54 → .82 so the property photo is clearly visible ──
  heroPanelImg: { width: '100%', height: '100%', objectFit: 'cover', opacity: .82, animation: 'panRight 18s ease-in-out infinite alternate' },

  heroPanelGrade: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(184,144,42,.05) 0%, rgba(10,8,6,.2) 100%)', mixBlendMode: 'multiply' },

  // ── UPDATED: reduced left-edge fade from .92 → .72 so image bleeds through more ──
  heroPanelOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,8,6,.72) 0%, rgba(10,8,6,.22) 36%, rgba(10,8,6,.05) 100%)' },

  floatingBadge: { position: 'absolute', bottom: '52px', right: '40px', background: 'rgba(10,8,6,.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(184,144,42,.22)', borderRadius: '2px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', zIndex: 2, animation: 'fadeInUp .8s .9s both' },
  fbDot: { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold)', flexShrink: 0, boxShadow: '0 0 0 3px rgba(184,144,42,.22)' },
  fbLabel: { fontFamily: 'var(--sans)', fontSize: '8.5px', fontWeight: '700', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(248,244,238,.38)', marginBottom: '2px' },
  fbVal: { fontFamily: 'var(--sans)', fontSize: '12px', fontWeight: '600', color: 'var(--cream)' },
  fbPrice: { fontFamily: 'var(--serif)', fontSize: '19px', fontWeight: '400', color: 'var(--gold-mid)', marginLeft: '8px', paddingLeft: '14px', borderLeft: '1px solid rgba(184,144,42,.2)' },
  heroContent: { position: 'relative', zIndex: 2, padding: '0 24px', maxWidth: '860px', width: '100%', margin: '0 auto', textAlign: 'center' },
  eyebrow: { display: 'inline-flex', alignItems: 'center', gap: '14px', fontFamily: 'var(--sans)', fontSize: '8.5px', fontWeight: '700', letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '32px' },
  eyeLine: { display: 'inline-block', width: '28px', height: '1px', background: 'linear-gradient(90deg, var(--gold), var(--gold-bright))', flexShrink: 0 },
  heroH1: { fontFamily: 'var(--serif)', fontSize: 'clamp(52px, 7.5vw, 108px)', fontWeight: '300', lineHeight: '1.0', color: 'var(--cream)', marginBottom: '28px', letterSpacing: '-0.03em' },
  heroEm: { fontStyle: 'italic', color: 'var(--gold-bright)', fontWeight: '400' },
  heroSub: { fontFamily: 'var(--sans)', fontSize: '14px', color: 'rgba(248,244,238,.55)', lineHeight: '1.95', marginBottom: '44px', maxWidth: '520px', fontWeight: '300', margin: '0 auto 44px' },
  searchBar: { background: '#FFFFFF', borderRadius: '4px', padding: '6px', display: 'flex', alignItems: 'stretch', boxShadow: '0 20px 60px rgba(0,0,0,.45), 0 0 0 1px rgba(184,144,42,.3)', maxWidth: '860px', margin: '0 auto' },
  sf: { flex: 1, display: 'flex', flexDirection: 'column', padding: '10px 14px' },
  sfDiv: { width: '1px', background: 'rgba(184,144,42,.2)', margin: '8px 0' },
  sfLabel: { fontFamily: 'var(--sans)', fontSize: '7.5px', fontWeight: '800', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '5px' },
  sfSelect: { border: 'none', background: 'none', outline: 'none', fontFamily: 'var(--sans)', fontSize: '13px', color: '#1a1510', fontWeight: '600', cursor: 'pointer', WebkitAppearance: 'none' },
  searchBtn: { background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: '2px', padding: '14px 24px', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '10.5px', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 },
  trustLine: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginTop: '18px', flexWrap: 'wrap' },
  trustItem: { fontFamily: 'var(--sans)', fontSize: '10.5px', color: 'rgba(248,244,238,.3)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '300' },
  trustDot: { color: 'var(--gold)', fontSize: '7px' },
  trustSep: { width: '1px', height: '12px', background: 'rgba(255,255,255,.1)' },
  scrollCue: { position: 'absolute', bottom: '36px', left: '72px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2 },
  scrollLine: { width: '1px', height: '44px', background: 'linear-gradient(to bottom, var(--gold), transparent)', animation: 'scrollLine 2s ease-in-out infinite' },
  scrollText: { fontFamily: 'var(--sans)', fontSize: '7.5px', fontWeight: '700', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'rgba(248,244,238,.22)', writingMode: 'vertical-rl' },
  quickStrip: { background: 'var(--parchment)', padding: '11px 64px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', overflowX: 'auto', whiteSpace: 'nowrap' },
  qIntro: { fontFamily: 'var(--sans)', fontSize: '8.5px', fontWeight: '800', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', flexShrink: 0, marginRight: '4px' },
  qLabel: { fontFamily: 'var(--sans)', fontSize: '9.5px', fontWeight: '700', color: 'var(--ash)', letterSpacing: '0.08em', flexShrink: 0, marginLeft: '4px' },
  qTag: { padding: '5px 14px', background: 'var(--white)', border: '1px solid rgba(184,144,42,.2)', borderRadius: '20px', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '11px', color: 'var(--stone)', transition: 'all .2s', flexShrink: 0 },
  qSep: { color: 'var(--stone)', fontSize: '10px', margin: '0 6px', opacity: .35 },
  statsStrip: { background: 'var(--carbon)', borderBottom: '1px solid rgba(184,144,42,.1)' },
  statsInner: { maxWidth: '1280px', margin: '0 auto', padding: '0 64px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  stat: { flex: 1, padding: '36px 28px', textAlign: 'center', maxWidth: '200px' },
  statNum: { fontFamily: 'var(--serif)', fontSize: '48px', fontWeight: '300', color: 'var(--gold-mid)', lineHeight: '1', letterSpacing: '-0.02em' },
  statLabel: { fontFamily: 'var(--sans)', fontSize: '8.5px', fontWeight: '700', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(248,244,238,.2)', marginTop: '10px' },
  statDiv: { width: '1px', height: '44px', background: 'rgba(255,255,255,.06)' },
  section: { padding: '104px 0' },
  catSection: { padding: '104px 0', background: 'var(--parchment)' },
  whySection: { padding: '104px 0', background: 'var(--cream)' },
  inner: { maxWidth: '1280px', margin: '0 auto', padding: '0 64px' },
  secHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' },
  secEy: { fontFamily: 'var(--sans)', fontSize: '8.5px', fontWeight: '800', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '14px' },
  secEyLine: { display: 'inline-block', width: '22px', height: '1px', background: 'linear-gradient(90deg, var(--gold), var(--gold-bright))', flexShrink: 0 },
  secH2: { fontFamily: 'var(--serif)', fontSize: 'clamp(32px, 4.5vw, 62px)', fontWeight: '300', lineHeight: '1.08', color: 'var(--ink)', letterSpacing: '-0.025em' },
  secEm: { fontStyle: 'italic', color: 'var(--ash)', fontWeight: '400' },
  viewAll: { background: 'none', border: 'none', borderBottom: '1px solid rgba(184,144,42,.35)', paddingBottom: '2px', fontFamily: 'var(--sans)', fontSize: '10.5px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: '48px' },
  tabs: { display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '44px', gap: 0, overflowX: 'auto' },
  tab: (active) => ({ position: 'relative', padding: '14px 26px', fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: active ? '700' : '400', letterSpacing: '0.08em', color: active ? 'var(--ink)' : 'var(--stone)', background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .2s', marginBottom: '-1px' }),
  tabLine: { position: 'absolute', bottom: '-2px', left: '26px', right: '26px', height: '2px', background: 'linear-gradient(90deg, var(--gold), var(--gold-bright))', display: 'block' },
  featGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  featFirst: { gridColumn: 'span 2' },
  catGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' },
  whyGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
};