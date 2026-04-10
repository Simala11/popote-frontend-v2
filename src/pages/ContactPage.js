import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { Footer } from '../components/SharedComponents';

const WA_LINK = 'https://wa.me/254739101811?text=Hello%2C%20I%27m%20interested%20in%20a%20property%20on%20Popote%20Listings.';

export default function ContactPage() {
  const { showPage, addEnquiry, showToast, WA_NUMBER } = useContext(AppContext);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('');
  const [msg, setMsg] = useState('');

  const submit = () => {
    if (!name.trim()) { showToast('Please enter your name.', true); return; }
    if (!phone.trim()) { showToast('Please enter your phone.', true); return; }
    const text = `Hello Popote Listings,\n\nName: ${name}\nPhone: ${phone}${region ? '\nInterested in: ' + region : ''}${msg ? '\nDetails: ' + msg : ''}\n\nPlease get back to me.`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    addEnquiry({ name, phone, property: region || 'General', region });
    showToast('Opening WhatsApp — we\'ll respond shortly!');
  };

  return (
    <div>
      {/* ── Hero ── */}
      <div style={s.hero}>
        <div style={s.heroBg} />
        <div style={s.heroOrb} />
        <div style={s.heroContent}>
          <div style={s.eyebrow}>
            <span style={s.eyeLine} />Get in Touch<span style={s.eyeLine} />
          </div>
          <h1 style={s.h1}>We'd love to <em style={s.em}>hear from you</em></h1>
          <p style={s.sub}>Reach us on WhatsApp, call, email, or visit our Westlands office. We respond within 2 hours.</p>
          <div style={s.socials}>
            {[
              { href: 'https://www.instagram.com/popotelistings', icon: 'IG', label: 'Instagram' },
              { href: 'https://x.com/popotelistings',            icon: 'X',  label: 'X (Twitter)' },
              { href: 'https://www.facebook.com/popotelistings', icon: 'FB', label: 'Facebook' },
            ].map(soc => (
              <a key={soc.label} href={soc.href} target="_blank" rel="noopener noreferrer" style={s.socialBtn} title={soc.label}>
                {soc.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Info strip ── */}
      <div style={s.infoStrip}>
        {[
          { icon: '📍', label: 'Our Office',        val: 'Westlands, Nairobi',     sub: 'Kenya' },
          { icon: '📱', label: 'WhatsApp & Phone',  val: '+254 739 101 811',       sub: 'Mon–Sat, 8am–7pm EAT' },
          { icon: '✉️', label: 'Email Us',           val: 'info@popotelistings.co.ke', sub: 'We reply within 2 hours' },
          { icon: '⚡', label: 'Response Time',     val: 'Under 2 Hours',          sub: 'WhatsApp prioritised' },
        ].map(item => (
          <div key={item.label} style={s.infoItem}>
            <div style={s.infoIcon}>{item.icon}</div>
            <div style={s.infoLabel}>{item.label}</div>
            <div style={s.infoVal}>{item.val}</div>
            <div style={s.infoSub}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Contact cards ── */}
      <section style={s.section}>
        <div style={s.inner}>
          <div style={s.cardGrid}>
            <ContactCard
              icon="💬"
              title="WhatsApp Us"
              desc="The fastest way to reach us. We respond within minutes to messages about viewings, pricing and availability."
              number="+254 739 101 811"
              numberSub="Tap to open WhatsApp directly"
              cta={<a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={s.waBtn}>Open WhatsApp</a>}
            />
            <ContactCard
              icon="📞"
              title="Call Us"
              desc="Prefer to speak directly? Our team is available Monday to Saturday from 8am to 7pm EAT for all property queries."
              number="+254 739 101 811"
              numberSub="Mon–Sat · 8:00am – 7:00pm EAT"
              cta={<a href="tel:+254739101811" style={s.callBtn}>Call Now</a>}
            />
            <ContactCard
              icon="✉️"
              title="Email Us"
              desc="Send us your property enquiry or listing request by email and we'll get back to you within 2 hours."
              number="info@popotelistings.co.ke"
              numberSub="We respond within 2 hours"
              cta={<a href="mailto:info@popotelistings.co.ke" style={s.callBtn}>Send Email</a>}
            />
            <ContactCard
              icon="📍"
              title="Visit Our Office"
              desc="We're based in Westlands, Nairobi. Feel free to walk in during business hours — no appointment needed."
              number="Westlands, Nairobi"
              numberSub="Kenya · Mon–Sat, 8am–6pm"
              cta={
                <a
                  href="https://maps.google.com/?q=Westlands+Nairobi+Kenya"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={s.callBtn}
                >
                  View on Map
                </a>
              }
            />
          </div>
        </div>
      </section>

      {/* ── Enquiry form ── */}
      <section style={{ ...s.section, background: 'var(--parchment)' }}>
        <div style={s.inner}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div style={s.sectionEyebrow}>Send a Message</div>
            <h2 style={s.sectionTitle}>We'll get back to <em style={s.em}>you quickly</em></h2>
          </div>
          <div style={s.formWrap}>
            <h3 style={s.formTitle}>Send an Enquiry</h3>
            <p style={s.formSub}>Fill in your details and our team will reach out within 2 hours.</p>
            {[
              { val: name,  set: setName,  type: 'text',  ph: 'Your full name',          max: 100 },
              { val: phone, set: setPhone, type: 'tel',   ph: 'Phone number (+254...)',   max: 15  },
              { val: email, set: setEmail, type: 'email', ph: 'Email address',            max: 150 },
            ].map((inp, i) => (
              <input
                key={i}
                type={inp.type}
                value={inp.val}
                onChange={e => inp.set(e.target.value)}
                placeholder={inp.ph}
                maxLength={inp.max}
                style={s.fi}
              />
            ))}
            <select value={region} onChange={e => setRegion(e.target.value)} style={s.fi}>
              <option value="">I'm interested in... (select region)</option>
              {['Nairobi Properties','Mombasa Properties','Nairobi Outskirts','Any / All Kenya'].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <textarea
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder="Tell us what you're looking for — property type, budget, bedrooms..."
              maxLength={500}
              style={{ ...s.fi, minHeight: '100px', resize: 'vertical' }}
            />
            <button style={s.submitBtn} onClick={submit}>Send via WhatsApp</button>

            {/* Contact details footer inside form */}
            <div style={s.formFooter}>
              <span>📍 Westlands, Nairobi, Kenya</span>
              <span style={s.formFooterSep}>·</span>
              <a href="tel:+254739101811" style={s.formFooterLink}>+254 739 101 811</a>
              <span style={s.formFooterSep}>·</span>
              <a href="mailto:info@popotelistings.co.ke" style={s.formFooterLink}>info@popotelistings.co.ke</a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ContactCard({ icon, title, desc, number, numberSub, cta }) {
  return (
    <div style={cardS.card}>
      <div style={cardS.icon}>{icon}</div>
      <h3 style={cardS.title}>{title}</h3>
      <p style={cardS.desc}>{desc}</p>
      <div style={cardS.number}>{number}</div>
      <div style={cardS.numberSub}>{numberSub}</div>
      {cta}
    </div>
  );
}

const cardS = {
  card: {
    background: 'var(--white)', border: '1px solid var(--border)',
    borderRadius: '2px', padding: '40px 36px', textAlign: 'center',
  },
  icon:      { fontSize: '40px', marginBottom: '18px' },
  title:     { fontFamily: 'var(--serif)', fontSize: '26px', fontWeight: '400', color: 'var(--ink)', marginBottom: '12px' },
  desc:      { fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--stone)', lineHeight: '1.8', marginBottom: '24px', fontWeight: '300' },
  number:    { fontFamily: 'var(--serif)', fontSize: '22px', fontWeight: '500', color: 'var(--ink)', marginBottom: '5px', wordBreak: 'break-all' },
  numberSub: { fontFamily: 'var(--sans)', fontSize: '11px', color: 'var(--stone)', letterSpacing: '0.06em', marginBottom: '24px' },
};

const s = {
  hero: { background: 'var(--obsidian)', padding: '96px 0 80px', position: 'relative', overflow: 'hidden', textAlign: 'center' },
  heroBg: { position: 'absolute', inset: 0, background: 'linear-gradient(140deg, #08060300, #0E0B08 50%, #1A1208)' },
  heroOrb: { position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 30% 60%, rgba(192,154,60,.14) 0%, transparent 55%)' },
  heroContent: { position: 'relative', zIndex: 2, maxWidth: '680px', margin: '0 auto', padding: '0 24px' },
  eyebrow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px',
    fontFamily: 'var(--sans)', fontSize: '9px', fontWeight: '700',
    letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)',
    marginBottom: '20px',
  },
  eyeLine: { display: 'inline-block', width: '28px', height: '1px', background: 'var(--gold)', flexShrink: 0 },
  h1: { fontFamily: 'var(--serif)', fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: '300', color: 'var(--cream)', marginBottom: '14px', letterSpacing: '-0.02em', lineHeight: '1.1' },
  em: { fontStyle: 'italic', color: 'var(--gold-bright)' },
  sub: { fontFamily: 'var(--sans)', fontSize: '14px', color: 'rgba(250,247,242,.44)', lineHeight: '1.8', fontWeight: '300', maxWidth: '440px', margin: '0 auto 32px' },
  socials: { display: 'flex', justifyContent: 'center', gap: '12px' },
  socialBtn: {
    width: '44px', height: '44px', borderRadius: '50%', border: '1px solid rgba(255,255,255,.14)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(250,247,242,.4)', textDecoration: 'none',
    fontFamily: 'var(--sans)', fontSize: '10px', fontWeight: '700', letterSpacing: '0.04em',
  },

  infoStrip: {
    background: 'var(--carbon)', padding: '48px 56px',
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '28px', textAlign: 'center',
    borderBottom: '1px solid rgba(192,154,60,.1)',
  },
  infoItem:  {},
  infoIcon:  { fontSize: '28px', marginBottom: '12px' },
  infoLabel: { fontFamily: 'var(--sans)', fontSize: '8.5px', fontWeight: '700', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(250,247,242,.3)', marginBottom: '8px' },
  infoVal:   { fontFamily: 'var(--serif)', fontSize: '18px', fontWeight: '400', color: 'var(--cream)', wordBreak: 'break-word', lineHeight: '1.3' },
  infoSub:   { fontFamily: 'var(--sans)', fontSize: '11px', color: 'rgba(250,247,242,.28)', marginTop: '5px' },

  section: { padding: '80px 0' },
  inner:   { maxWidth: '1100px', margin: '0 auto', padding: '0 56px' },
  cardGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },

  waBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    background: '#25D366', color: '#fff',
    padding: '13px 28px', borderRadius: '2px',
    fontFamily: 'var(--sans)', fontSize: '12.5px', fontWeight: '600',
    textDecoration: 'none', letterSpacing: '0.04em',
  },
  callBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    background: 'var(--ink)', color: 'var(--cream)',
    padding: '13px 28px', borderRadius: '2px',
    fontFamily: 'var(--sans)', fontSize: '12.5px', fontWeight: '600',
    textDecoration: 'none', letterSpacing: '0.04em',
  },

  sectionEyebrow: { fontFamily: 'var(--sans)', fontSize: '9.5px', fontWeight: '700', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '14px' },
  sectionTitle:   { fontFamily: 'var(--serif)', fontSize: 'clamp(30px, 4vw, 52px)', fontWeight: '300', color: 'var(--ink)', lineHeight: '1.1', letterSpacing: '-0.01em' },

  formWrap: {
    background: 'var(--white)', border: '1px solid var(--border)',
    borderRadius: '2px', padding: '48px',
    maxWidth: '600px', margin: '0 auto', boxShadow: 'var(--shadow-md)',
  },
  formTitle: { fontFamily: 'var(--serif)', fontSize: '32px', fontWeight: '400', color: 'var(--ink)', marginBottom: '8px' },
  formSub:   { fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--stone)', marginBottom: '28px', lineHeight: '1.65', fontWeight: '300' },
  fi: {
    width: '100%', fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--ink)',
    background: 'var(--parchment)', border: '1px solid var(--border)',
    padding: '11px 14px', borderRadius: '1px', outline: 'none',
    marginBottom: '11px', display: 'block', WebkitAppearance: 'none',
  },
  submitBtn: {
    width: '100%', background: 'var(--ink)', color: 'var(--cream)',
    border: 'none', padding: '14px', borderRadius: '1px',
    fontFamily: 'var(--sans)', fontSize: '12px', fontWeight: '700',
    letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', marginTop: '4px',
  },
  formFooter: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexWrap: 'wrap', gap: '8px',
    marginTop: '24px', paddingTop: '20px',
    borderTop: '1px solid var(--border)',
    fontFamily: 'var(--sans)', fontSize: '11px',
    color: 'var(--stone)', letterSpacing: '0.03em',
  },
  formFooterSep:  { color: 'var(--border-strong)' },
  formFooterLink: { color: 'var(--gold)', textDecoration: 'none', fontWeight: '500' },
};
