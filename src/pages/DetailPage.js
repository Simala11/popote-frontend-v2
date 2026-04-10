import React, { useContext, useState } from 'react';
import { AppContext } from '../App';

const DETAIL_CSS = `
@media (max-width: 768px) {
  .dp-bread-inner  { padding: 14px 16px !important; flex-wrap: wrap !important; gap: 8px !important; }
  .dp-bread-price  { font-size: 18px !important; }
  .dp-section      { padding: 24px 0 60px !important; }
  .dp-inner        { padding: 0 16px !important; }
  .dp-detail-grid  { grid-template-columns: 1fr !important; gap: 32px !important; }
  .dp-gallery-main { height: 260px !important; }
  .dp-thumb-row    { grid-template-columns: repeat(4,1fr) !important; }
  .dp-thumb        { height: 64px !important; }
  .dp-prop-title   { font-size: 30px !important; }
  .dp-specs        { flex-wrap: wrap !important; }
  .dp-spec-item    { min-width: 50% !important; border-bottom: 1px solid var(--border) !important; }
  .dp-amen-grid    { grid-template-columns: 1fr 1fr !important; }
  .dp-enq-card     { position: static !important; }
}
@media (max-width: 480px) {
  .dp-amen-grid    { grid-template-columns: 1fr !important; }
  .dp-thumb-row    { grid-template-columns: repeat(4,1fr) !important; }
}
`;

function injectOnce(id, css) {
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id; el.textContent = css;
    document.head.appendChild(el);
  }
}

// ✅ Backend returns images as array of objects: [{ id, url, public_id, ... }]
// Fallback: comma-separated image_url string or legacy { dataUrl } objects
function getImages(l) {
  if (l.images?.length) {
    return l.images.map(i => i.url || i.dataUrl || i).filter(Boolean);
  }
  if (l.image_url) {
    const imgs = l.image_url.split(',').map(u => u.trim()).filter(Boolean);
    if (imgs.length) return imgs;
  }
  return [];
}

// ✅ Convert YouTube watch URL → embed URL
function getYouTubeEmbed(url) {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    let id = u.searchParams.get('v');
    if (!id && u.hostname === 'youtu.be') id = u.pathname.slice(1);
    if (!id) {
      const m = url.match(/(?:embed\/|v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      if (m) id = m[1];
    }
    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch { return null; }
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80';

export default function DetailPage() {
  injectOnce('detail-page-css', DETAIL_CSS);
  const { detailId, detailSource, listings, showPage, addEnquiry, showToast, WA_NUMBER } = useContext(AppContext);
  const [activeImg, setActiveImg] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const l = listings.find(x => x.id === detailId);
  if (!l) return (
    <div style={{ padding: '96px 24px', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--serif)', fontSize: '28px', color: 'var(--stone)' }}>Property not found.</p>
      <button style={s.backBtn} onClick={() => showPage('home')}>← Back to Home</button>
    </div>
  );

  // ✅ Images — from backend images array (objects with url field)
  const allImgs = getImages(l);
  if (!allImgs.length) allImgs.push(PLACEHOLDER);

  // ✅ Field mapping — backend uses description, youtube_url; local used desc, yt
  const description = l.description || l.desc || '';
  const youtubeUrl = l.youtube_url || l.yt || '';
  const embedUrl = getYouTubeEmbed(youtubeUrl);

  const priceDisplay = l.priceDisplay || `KES ${parseFloat(l.price || 0).toLocaleString()}`;
  const waText = encodeURIComponent(`Hello Popote Listings,\n\nI'm interested in: ${l.title} (${priceDisplay})\n\nPlease assist me.`);
  const waLink = `https://wa.me/${WA_NUMBER}?text=${waText}`;

  const submitEnquiry = () => {
    if (!name.trim()) { showToast('Please enter your name.', true); return; }
    if (!phone.trim() && !email.trim()) { showToast('Please enter a phone or email.', true); return; }
    const text = `Hello Popote Listings,\n\nEnquiry about: ${l.title}\nName: ${name}\nPhone: ${phone || 'N/A'}${email ? '\nEmail: ' + email : ''}${msg ? '\nMessage: ' + msg : ''}\n\nPlease get back to me.`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    addEnquiry({ name, phone: phone || email, property: l.title, region: l.region });
    showToast("Opening WhatsApp — we'll respond shortly!");
    setName(''); setPhone(''); setEmail(''); setMsg('');
  };

  const sourceLabel = detailSource === 'offplan' ? 'Off-Plan' : detailSource === 'rentals' ? 'Rentals' : 'For Sale';

  return (
    <div>
      {/* Breadcrumb bar */}
      <div style={s.breadBar}>
        <div style={s.breadInner} className="dp-bread-inner">
          <div style={s.breadcrumb}>
            <button style={s.breadLink} onClick={() => showPage('home')}>Home</button>
            <span style={s.breadSep}>›</span>
            <button style={s.breadLink} onClick={() => showPage(detailSource)}>{sourceLabel}</button>
            <span style={s.breadSep}>›</span>
            <span style={s.breadCurrent}>{l.title}</span>
          </div>
          <div style={s.breadPrice} className="dp-bread-price">{priceDisplay}</div>
        </div>
      </div>

      <section style={s.section} className="dp-section">
        <div style={s.inner} className="dp-inner">
          <div style={s.detailGrid} className="dp-detail-grid">

            {/* Left col */}
            <div>
              {/* Main gallery image */}
              <div style={s.galleryMain} className="dp-gallery-main">
                <img src={allImgs[activeImg] || PLACEHOLDER} alt={l.title} style={s.mainImg} />
                <div style={s.galleryOverlay}>
                  <div style={s.galleryBadge}>{l.category}</div>
                </div>
              </div>

              {/* Thumbnails — only show if more than 1 image */}
              {allImgs.length > 1 && (
                <div style={s.thumbRow} className="dp-thumb-row">
                  {allImgs.slice(0, 6).map((img, i) => (
                    <div key={i} style={s.thumb(activeImg === i)} className="dp-thumb" onClick={() => setActiveImg(i)}>
                      <img src={img} alt={`View ${i + 1}`} style={s.thumbImg} />
                    </div>
                  ))}
                </div>
              )}

              <div style={s.propHead}>
                <h1 style={s.propTitle} className="dp-prop-title">{l.title}</h1>
                <div style={s.propLoc}>📍 {l.location ? `${l.location}, ` : ''}{l.region}</div>
              </div>

              <div style={s.specs} className="dp-specs">
                {[
                  { n: l.beds || '—', l: 'Bedrooms' },
                  { n: l.baths || '—', l: 'Bathrooms' },
                  { n: l.sqm || '—', l: 'Sqm' },
                ].map(sp => (
                  <div key={sp.l} style={s.specItem} className="dp-spec-item">
                    <div style={s.specNum}>{sp.n}</div>
                    <div style={s.specLabel}>{sp.l}</div>
                  </div>
                ))}
              </div>

              {l.amenities && (
                <div style={s.amenSection}>
                  <div style={s.amenTitle}>Amenities & Features</div>
                  <div style={s.amenGrid} className="dp-amen-grid">
                    {l.amenities.split(',').map(a => (
                      <div key={a.trim()} style={s.amen}>
                        <span style={s.amenDot} />{a.trim()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ✅ Description — uses backend field name */}
              <div style={s.descSection}>
                <div style={s.amenTitle}>Property Description</div>
                <p style={s.desc}>
                  {description || 'An exceptional property set in a prime location. Available for viewing by appointment. Contact us to arrange a private tour.'}
                </p>
              </div>

              {/* ✅ YouTube embed — only shown if a valid URL was provided */}
              {embedUrl && (
                <div style={s.ytSection}>
                  <div style={s.amenTitle}>Property Video Tour</div>
                  <div style={s.ytWrap}>
                    <iframe
                      src={embedUrl}
                      title="Property Video Tour"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={s.ytFrame}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right col — enquiry card */}
            <div>
              <div style={s.enquiryCard} className="dp-enq-card">
                <div style={s.eqPrice}>{priceDisplay}</div>
                <div style={s.eqSub}>{l.category}{l.location ? ` · ${l.location}` : ''}</div>

                <a href={waLink} target="_blank" rel="noopener noreferrer" style={s.waBtn}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Chat on WhatsApp
                </a>

                <div style={s.formDivider}><div style={s.divLine} /><span style={s.divText}>or send an enquiry</span><div style={s.divLine} /></div>

                {[
                  { val: name, set: setName, type: 'text', ph: 'Your full name', max: 100 },
                  { val: phone, set: setPhone, type: 'tel', ph: 'Phone (+254...)', max: 15 },
                  { val: email, set: setEmail, type: 'email', ph: 'Email address', max: 150 },
                ].map((inp, i) => (
                  <input key={i} type={inp.type} value={inp.val} onChange={e => inp.set(e.target.value)}
                    placeholder={inp.ph} maxLength={inp.max} style={s.fi} />
                ))}
                <textarea value={msg} onChange={e => setMsg(e.target.value)}
                  placeholder="Message (optional)..." maxLength={500}
                  style={{ ...s.fi, minHeight: '80px', resize: 'vertical' }} />
                <button style={s.submitBtn} onClick={submitEnquiry}>Submit Enquiry</button>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}

const s = {
  breadBar: { background: 'var(--carbon)', borderBottom: '1px solid rgba(192,154,60,.12)' },
  breadInner: { maxWidth: '1280px', margin: '0 auto', padding: '20px 56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--sans)', fontSize: '11.5px', letterSpacing: '0.04em', flexWrap: 'wrap' },
  breadLink: { background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(250,247,242,.38)', fontFamily: 'var(--sans)', fontSize: '11.5px', letterSpacing: '0.04em', padding: 0 },
  breadSep: { color: 'rgba(250,247,242,.2)', fontSize: '14px' },
  breadCurrent: { color: 'var(--cream)', fontWeight: '500' },
  breadPrice: { fontFamily: 'var(--serif)', fontSize: '22px', color: 'var(--gold-mid)', fontWeight: '400', flexShrink: 0 },
  section: { padding: '56px 0 96px' },
  inner: { maxWidth: '1280px', margin: '0 auto', padding: '0 56px' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '52px' },
  galleryMain: { position: 'relative', borderRadius: '2px', overflow: 'hidden', height: '500px', background: 'var(--parchment)' },
  mainImg: { width: '100%', height: '100%', objectFit: 'cover' },
  galleryOverlay: { position: 'absolute', bottom: '16px', left: '16px' },
  galleryBadge: { background: 'rgba(14,11,8,.85)', backdropFilter: 'blur(8px)', color: 'var(--cream)', fontFamily: 'var(--sans)', fontSize: '9px', fontWeight: '600', letterSpacing: '0.14em', textTransform: 'uppercase', padding: '6px 14px', borderRadius: '1px' },
  thumbRow: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginTop: '10px' },
  thumb: (active) => ({ borderRadius: '2px', overflow: 'hidden', height: '72px', cursor: 'pointer', opacity: active ? 1 : 0.55, transition: 'opacity 0.2s', border: active ? '2px solid var(--gold)' : '2px solid transparent' }),
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  propHead: { marginTop: '32px', marginBottom: '4px' },
  propTitle: { fontFamily: 'var(--serif)', fontSize: '44px', fontWeight: '300', color: 'var(--ink)', lineHeight: '1.1', letterSpacing: '-0.02em', marginBottom: '8px' },
  propLoc: { fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--stone)', letterSpacing: '0.04em' },
  specs: { display: 'flex', border: '1px solid var(--border)', borderRadius: '2px', marginTop: '28px' },
  specItem: { flex: 1, textAlign: 'center', padding: '20px 12px', borderRight: '1px solid var(--border)' },
  specNum: { fontFamily: 'var(--serif)', fontSize: '30px', fontWeight: '400', color: 'var(--ink)' },
  specLabel: { fontFamily: 'var(--sans)', fontSize: '9.5px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--stone)', marginTop: '4px' },
  amenSection: { marginTop: '36px' },
  amenTitle: { fontFamily: 'var(--sans)', fontSize: '9.5px', fontWeight: '700', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: '16px' },
  amenGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
  amen: { display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--sans)', fontSize: '12.5px', color: 'var(--stone)', padding: '10px 12px', background: 'var(--parchment)', borderRadius: '1px' },
  amenDot: { width: '5px', height: '5px', borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 },
  descSection: { marginTop: '36px' },
  desc: { fontFamily: 'var(--sans)', fontSize: '14px', lineHeight: '1.9', color: 'var(--mink)', fontWeight: '300' },
  ytSection: { marginTop: '36px' },
  ytWrap: { position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '2px', background: 'var(--obsidian)' },
  ytFrame: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' },
  enquiryCard: { position: 'sticky', top: '92px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '2px', padding: '32px', boxShadow: '0 16px 48px rgba(14,11,8,.1), 0 0 0 1px rgba(192,154,60,.08)' },
  eqPrice: { fontFamily: 'var(--serif)', fontSize: '36px', fontWeight: '500', color: 'var(--ink)', marginBottom: '4px', letterSpacing: '-0.02em' },
  eqSub: { fontFamily: 'var(--sans)', fontSize: '11.5px', color: 'var(--stone)', letterSpacing: '0.06em', marginBottom: '24px' },
  waBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', background: '#25D366', color: '#fff', textDecoration: 'none', padding: '14px', borderRadius: '2px', fontFamily: 'var(--sans)', fontSize: '13.5px', fontWeight: '600', letterSpacing: '0.04em', marginBottom: '16px' },
  formDivider: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' },
  divLine: { flex: 1, height: '1px', background: 'var(--border)' },
  divText: { fontFamily: 'var(--sans)', fontSize: '10.5px', color: 'var(--stone)', letterSpacing: '0.06em', whiteSpace: 'nowrap' },
  fi: { width: '100%', fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--ink)', background: 'var(--parchment)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '1px', outline: 'none', marginBottom: '9px', transition: 'border-color 0.2s', display: 'block', boxSizing: 'border-box' },
  submitBtn: { width: '100%', background: 'var(--ink)', color: 'var(--cream)', border: 'none', padding: '14px', borderRadius: '1px', fontFamily: 'var(--sans)', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s' },
  backBtn: { marginTop: '20px', background: 'var(--ink)', color: 'var(--cream)', border: 'none', padding: '12px 28px', borderRadius: '1px', fontFamily: 'var(--sans)', fontSize: '12px', fontWeight: '600', letterSpacing: '0.08em', cursor: 'pointer' },
};