import React, { useContext, useState } from 'react';
import { AppContext } from '../App';

// ═══ BACKEND CONNECTION ═══
const API_BASE_URL = "https://popote-backend-7lqq.onrender.com/api";
const WA_NUMBER = '254739101811';

const LWU_CSS = `
@media (max-width: 900px) {
  .lwu-layout      { grid-template-columns: 1fr !important; }
  .lwu-sidebar     { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 16px !important; }
}
@media (max-width: 768px) {
  .lwu-hero        { padding: 64px 0 48px !important; }
  .lwu-hero-content{ padding: 0 20px !important; }
  .lwu-steps       { gap: 0 !important; flex-direction: column !important; align-items: flex-start !important; padding: 0 20px !important; }
  .lwu-step        { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,.08) !important; padding: 12px 0 !important; width: 100% !important; }
  .lwu-form-section{ padding: 40px 16px !important; }
  .lwu-layout      { gap: 32px !important; }
  .lwu-form-card   { padding: 24px 20px !important; }
  .lwu-row         { grid-template-columns: 1fr !important; }
  .lwu-row3        { grid-template-columns: 1fr 1fr !important; }
  .lwu-sidebar     { grid-template-columns: 1fr !important; }
}
@media (max-width: 480px) {
  .lwu-row3        { grid-template-columns: 1fr !important; }
}
`;

function injectOnce(id, css) {
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id; el.textContent = css;
    document.head.appendChild(el);
  }
}

const AMENITIES = ['Swimming Pool', 'Gym', '24hr Security', 'Parking', 'Solar Power', 'Borehole', 'Generator', 'CCTV', 'Garden', 'Ensuite Rooms', 'Staff Quarters', 'Ocean View', 'Beach Access', 'Gated Estate', 'DSQ'];

// 🛠️ FIX: Moved Field component OUTSIDE so it doesn't lose focus
const Field = ({ label, id, form, set, type = 'text', ph, max, as: As = 'input', children, style: extraStyle }) => (
  <div style={{ ...s.fgrp, ...extraStyle }}>
    <label style={s.flabel}>{label}</label>
    {As === 'input' ? (
      <input type={type} value={form[id] || ''} onChange={e => set(id, e.target.value)} placeholder={ph} maxLength={max} style={s.ai} />
    ) : As === 'select' ? (
      <select value={form[id] || ''} onChange={e => set(id, e.target.value)} style={s.ai}>{children}</select>
    ) : (
      <textarea value={form[id] || ''} onChange={e => set(id, e.target.value)} placeholder={ph} maxLength={max} style={{ ...s.ai, minHeight: '88px', resize: 'vertical' }} />
    )}
  </div>
);

export default function ListWithUsPage() {
  injectOnce('lwu-css', LWU_CSS);
  const { listings, showToast } = useContext(AppContext);
  const [form, setForm] = useState({});
  const [amenities, setAmenities] = useState(['Swimming Pool', '24hr Security', 'Parking']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateForm = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleAmen = (a) => setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const submit = async () => {
    if (!form.name?.trim()) { showToast('Please enter your name.', true); return; }
    if (!form.phone?.trim()) { showToast('Please enter your phone.', true); return; }
    if (!form.title?.trim()) { showToast('Please enter a property title.', true); return; }
    if (!form.price?.trim()) { showToast('Please enter a price.', true); return; }
    if (!form.region) { showToast('Please select a region.', true); return; }

    setIsSubmitting(true);
    try {
      await fetch(`${API_BASE_URL}/contact/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email || 'not-provided@popote.com',
          message: `LISTING REQUEST: ${form.title} in ${form.region}. Price: ${form.price}. Phone: ${form.phone}`
        })
      });

      let text = `🏠 *NEW PROPERTY LISTING REQUEST*\n\n*Contact*\nName: ${form.name}\nPhone: ${form.phone}${form.email ? '\nEmail: ' + form.email : ''}${form.role ? '\nRole: ' + form.role : ''}`;
      text += `\n\n*Property*\nTitle: ${form.title}${form.listtype ? '\nType: ' + form.listtype : ''}${form.proptype ? '\nProperty: ' + form.proptype : ''}\nRegion: ${form.region}${form.location ? '\nLocation: ' + form.location : ''}`;
      text += `\n\n*Pricing*\nPrice: ${form.price}${form.neg ? ' (' + form.neg + ')' : ''}${form.beds ? '\nBeds: ' + form.beds : ''}${form.baths ? '\nBaths: ' + form.baths : ''}${form.sqm ? '\nSize: ' + form.sqm + ' sqm' : ''}`;
      if (amenities.length) text += `\n\n*Amenities*\n${amenities.join(', ')}`;
      if (form.desc) text += `\n\n*Description*\n${form.desc}`;
      if (form.avail) text += `\nAvailable: ${form.avail}`;
      if (form.notes) text += `\n\n*Notes*\n${form.notes}`;
      text += '\n\nPlease list this property on Popote Listings.';

      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      showToast('Submission saved & WhatsApp opened!');
      setForm({});
    } catch (e) {
      showToast('Database error, opening WhatsApp anyway...', true);
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Listing Request Support Required")}`, '_blank');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={s.hero} className="lwu-hero">
        <div style={s.heroBg} />
        <div style={s.heroOrb} />
        <div style={s.heroContent} className="lwu-hero-content">
          <div style={s.eyebrow}>Property Owners & Agents</div>
          <h1 style={s.h1}>List Your Property<br /><em style={s.em}>Reach More Buyers</em></h1>
          <p style={s.sub}>Submit your property details and our team will contact you to get it live on Popote Listings.</p>
          <div style={s.steps} className="lwu-steps">
            {['Fill in the form', 'We review & call you', 'Property goes live', 'Enquiries come in'].map((step, i) => (
              <div key={i} style={s.step} className="lwu-step">
                <div style={s.stepNum}>{i + 1}</div>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={s.formSection} className="lwu-form-section">
        <div style={s.layout} className="lwu-layout">
          <div style={s.formCard} className="lwu-form-card">
            <h2 style={s.formTitle}>Property Submission Form</h2>
            <p style={s.formSub}>Fields marked * are required. We'll follow up via WhatsApp within 2 hours.</p>

            <div style={s.sectionLabel}>Your Contact Details</div>
            <div style={s.row} className="lwu-row">
              <Field label="Full Name *" id="name" form={form} set={updateForm} ph="e.g. John Kamau" max={100} />
              <Field label="Phone Number *" id="phone" form={form} set={updateForm} type="tel" ph="+254 7XX XXX XXX" max={15} />
            </div>
            <div style={s.row} className="lwu-row">
              <Field label="Email Address" id="email" form={form} set={updateForm} type="email" ph="your@email.com" max={150} />
              <Field label="You Are" id="role" form={form} set={updateForm} as="select">
                <option value="">Select...</option>
                {['Property Owner', 'Real Estate Agent', 'Developer / Off-Plan', 'Property Manager'].map(o => <option key={o}>{o}</option>)}
              </Field>
            </div>

            <div style={s.sectionLabel}>Property Details</div>
            <Field label="Property Title / Name *" id="title" form={form} set={updateForm} ph="e.g. 4-Bed Villa — Karen" max={120} />
            <div style={s.row} className="lwu-row">
              <Field label="Listing Type *" id="listtype" form={form} set={updateForm} as="select">
                <option value="">Select...</option>
                {['For Sale · Ready', 'For Sale · Off-Plan', 'Rental · Furnished', 'Rental · Unfurnished', 'Short Stay / Airbnb', 'Commercial'].map(o => <option key={o}>{o}</option>)}
              </Field>
              <Field label="Property Type" id="proptype" form={form} set={updateForm} as="select">
                <option value="">Select...</option>
                {['Villa / Bungalow', 'Apartment / Flat', 'Townhouse', 'Maisonette', 'Penthouse', 'Studio', 'Commercial Space', 'Land / Plot'].map(o => <option key={o}>{o}</option>)}
              </Field>
            </div>
            <div style={s.row} className="lwu-row">
              <Field label="Region *" id="region" form={form} set={updateForm} as="select">
                <option value="">Select region...</option>
                {['Nairobi', 'Mombasa', 'Nairobi Outskirts', 'Other Kenya'].map(o => <option key={o}>{o}</option>)}
              </Field>
              <Field label="Specific Location / Area" id="location" form={form} set={updateForm} ph="e.g. Karen, Lavington, Nyali..." max={100} />
            </div>

            <div style={s.sectionLabel}>Size & Pricing</div>
            <div style={s.row3} className="lwu-row3">
              <Field label="Bedrooms" id="beds" form={form} set={updateForm} as="select">
                <option value="">—</option>
                {['Studio', '1', '2', '3', '4', '5', '6+'].map(o => <option key={o}>{o}</option>)}
              </Field>
              <Field label="Bathrooms" id="baths" form={form} set={updateForm} as="select">
                <option value="">—</option>
                {['1', '2', '3', '4', '5', '6+'].map(o => <option key={o}>{o}</option>)}
              </Field>
              <Field label="Size (sqm)" id="sqm" form={form} set={updateForm} type="number" ph="e.g. 200" />
            </div>
            <div style={s.row} className="lwu-row">
              <Field label="Asking Price (KES) *" id="price" form={form} set={updateForm} ph="e.g. 18,000,000" max={30} />
              <Field label="Price Negotiable?" id="neg" form={form} set={updateForm} as="select">
                <option value="">Select...</option>
                {['Yes, negotiable', 'Fixed price', 'Open to offers'].map(o => <option key={o}>{o}</option>)}
              </Field>
            </div>

            <div style={s.sectionLabel}>Amenities & Features</div>
            <div style={s.amenChecks}>
              {AMENITIES.map(a => (
                <button key={a} style={s.amenCheck(amenities.includes(a))} onClick={() => toggleAmen(a)} type="button">{a}</button>
              ))}
            </div>

            <div style={{ ...s.sectionLabel, marginTop: '28px' }}>Additional Information</div>
            <Field label="Property Description" id="desc" form={form} set={updateForm} as="textarea" ph="Key selling points..." max={800} />
            <div style={s.row} className="lwu-row">
              <Field label="Available From" id="avail" form={form} set={updateForm} ph="e.g. Immediately" max={60} />
              <Field label="YouTube Link" id="yt" form={form} set={updateForm} type="url" ph="https://youtube.com/..." max={200} />
            </div>
            <Field label="Any Other Notes" id="notes" form={form} set={updateForm} as="textarea" ph="Title deed ready, etc." max={400} style={{ marginBottom: 0 }} />

            <button style={{ ...s.submitBtn, opacity: isSubmitting ? 0.7 : 1 }} onClick={submit} disabled={isSubmitting}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              {isSubmitting ? 'Saving...' : 'Submit via WhatsApp'}
            </button>
          </div>

          <div style={s.sidebar} className="lwu-sidebar">
            <div style={s.accentCard}>
              <h3 style={s.accentTitle}>Why List With Us?</h3>
              {[
                { icon: '🎯', title: 'Targeted Reach', desc: 'Buyers in Nairobi & Mombasa browse daily.' },
                { icon: '⚡', title: 'Fast Turnaround', desc: 'Go live within 24 hours.' },
                { icon: '💬', title: 'Direct Enquiries', desc: 'Straight to your WhatsApp.' },
              ].map(b => (
                <div key={b.title} style={s.benefit}>
                  <span style={s.benefitIcon}>{b.icon}</span>
                  <div>
                    <div style={s.benefitTitle}>{b.title}</div>
                    <div style={s.benefitDesc}>{b.desc}</div>
                  </div>
                </div>
              ))}
              <div style={s.statRow}>
                {[{ n: Array.isArray(listings) ? listings.length + '+' : '20+', l: 'Active' }, { n: '11K+', l: 'Views' }, { n: '<2h', l: 'Response' }].map(st => (
                  <div key={st.l} style={s.statItem}>
                    <div style={s.statN}>{st.n}</div>
                    <div style={s.statL}>{st.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={s.infoCard}>
              <h3 style={s.infoTitle}>What We Need</h3>
              {[
                { icon: '📋', title: 'Basic Details', desc: 'Type, location, price.' },
                { icon: '📷', title: 'Photos', desc: 'WhatsApp them after submitting.' },
              ].map(b => (
                <div key={b.title} style={s.benefit}>
                  <span style={s.benefitIcon}>{b.icon}</span>
                  <div>
                    <div style={{ ...s.benefitTitle, color: 'var(--ink)' }}>{b.title}</div>
                    <div style={{ ...s.benefitDesc, color: 'var(--stone)' }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  hero: { background: 'var(--obsidian)', padding: '96px 0 72px', position: 'relative', overflow: 'hidden', textAlign: 'center' },
  heroBg: { position: 'absolute', inset: 0, background: 'linear-gradient(140deg, #08060300, #0E0B08 50%, #1A1208)' },
  heroOrb: { position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(192,154,60,.16) 0%, transparent 50%)' },
  heroContent: { position: 'relative', zIndex: 2, maxWidth: '760px', margin: '0 auto', padding: '0 24px' },
  eyebrow: { fontSize: '9.5px', fontWeight: '700', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '18px' },
  h1: { fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 6vw, 80px)', color: 'var(--cream)', lineHeight: '1.08', marginBottom: '18px' },
  em: { fontStyle: 'italic', color: 'var(--gold-bright)' },
  sub: { fontSize: '14px', color: 'rgba(250,247,242,.44)', maxWidth: '500px', margin: '0 auto 36px', lineHeight: '1.8' },
  steps: { display: 'flex', justifyContent: 'center', gap: '0', flexWrap: 'wrap' },
  step: { display: 'flex', alignItems: 'center', gap: '9px', fontSize: '11.5px', color: 'rgba(250,247,242,.4)', padding: '0 20px', borderRight: '1px solid rgba(255,255,255,.08)' },
  stepNum: { width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(192,154,60,.18)', border: '1px solid rgba(192,154,60,.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--gold-mid)' },
  formSection: { padding: '80px 56px', background: 'var(--white)' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '56px', maxWidth: '1120px', margin: '0 auto' },
  formCard: { background: 'var(--white)', border: '1px solid var(--border)', padding: '48px', boxShadow: 'var(--shadow-md)' },
  formTitle: { fontFamily: 'var(--serif)', fontSize: '38px', color: 'var(--ink)' },
  formSub: { fontSize: '13px', color: 'var(--stone)', marginBottom: '36px' },
  sectionLabel: { fontSize: '8.5px', fontWeight: '800', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', margin: '28px 0 16px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' },
  fgrp: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '13px' },
  flabel: { fontSize: '8.5px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--stone)' },
  ai: { fontSize: '13px', color: 'var(--ink)', background: 'var(--parchment)', border: '1px solid var(--border)', padding: '10px 14px', width: '100%', boxSizing: 'border-box', outline: 'none' },
  amenChecks: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  amenCheck: (on) => ({ padding: '7px 13px', cursor: 'pointer', border: '1px solid var(--border)', background: on ? 'var(--ink)' : 'var(--parchment)', color: on ? 'var(--cream)' : 'var(--stone)' }),
  submitBtn: { width: '100%', background: 'var(--gold)', color: '#fff', border: 'none', padding: '16px', fontWeight: '700', textTransform: 'uppercase', cursor: 'pointer', marginTop: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' },
  submitNote: { fontSize: '11px', color: 'var(--stone)', textAlign: 'center', marginTop: '12px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '20px' },
  accentCard: { background: 'var(--carbon)', border: '1px solid rgba(192,154,60,.12)', padding: '28px' },
  accentTitle: { fontFamily: 'var(--serif)', fontSize: '26px', color: 'var(--cream)', marginBottom: '20px' },
  benefit: { display: 'flex', gap: '12px', marginBottom: '16px' },
  benefitIcon: { fontSize: '18px' },
  benefitTitle: { fontSize: '12px', fontWeight: '700', color: 'var(--gold-mid)' },
  benefitDesc: { fontSize: '11.5px', color: 'rgba(250,247,242,.44)', lineHeight: '1.6' },
  statRow: { display: 'flex', gap: '10px', marginTop: '20px' },
  statItem: { flex: 1, textAlign: 'center', background: 'rgba(255,255,255,.05)', padding: '14px 8px' },
  statN: { fontFamily: 'var(--serif)', fontSize: '26px', color: 'var(--gold-mid)' },
  statL: { fontSize: '8.5px', textTransform: 'uppercase', color: 'rgba(250,247,242,.3)' },
  waDirect: { background: '#25D366', color: '#fff', padding: '13px', textAlign: 'center', fontWeight: '700', textDecoration: 'none', display: 'block', marginTop: '20px' },
  infoCard: { background: 'var(--white)', border: '1px solid var(--border)', padding: '28px' },
  infoTitle: { fontFamily: 'var(--serif)', fontSize: '24px', color: 'var(--ink)' },
};