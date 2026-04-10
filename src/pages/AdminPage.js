import React, { useContext, useState, useCallback } from 'react';
import { listingsAPI, enquiriesAPI } from '../api';
import { AppContext } from '../App';

const ADMIN_CSS = `
@media (max-width: 768px) {
  .adm-wrap        { grid-template-columns: 1fr !important; }
  .adm-sidebar     { display: none !important; }
  .adm-sidebar.open{ display: flex !important; position: fixed !important; inset: 0 !important; z-index: 400 !important; width: 260px !important; box-shadow: 4px 0 40px rgba(0,0,0,.5) !important; }
  .adm-main        { padding: 20px 16px !important; }
  .adm-hdr         { flex-wrap: wrap !important; gap: 10px !important; }
  .adm-kpi-grid    { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
  .adm-table-wrap  { overflow-x: auto !important; }
  .adm-fg          { grid-template-columns: 1fr !important; }
  .adm-span2       { grid-column: span 1 !important; }
  .adm-add-card    { padding: 20px 16px !important; }
  .adm-mobile-bar  { display: flex !important; }
}
.adm-mobile-bar { display: none; position: sticky; top: 71px; z-index: 200;
  background: var(--obsidian); padding: 12px 16px; align-items: center;
  justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,.06); }
.adm-mob-brand { font-family: var(--serif); font-size: 16px; color: var(--cream); font-style: italic; }
.adm-mob-menu-btn { background: none; border: none; color: var(--cream); font-size: 20px; cursor: pointer; padding: 4px 8px; }
.adm-overlay { display: none; }
@media (max-width: 768px) {
  .adm-overlay.open { display: block; position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 399; }
}
`;

function injectOnce(id, css) {
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id; el.textContent = css;
    document.head.appendChild(el);
  }
}

const API_BASE = (process.env.REACT_APP_API_URL || 'https://popote-backend-7lqq.onrender.com') + '/api';

const AMENITIES = ['Pool', 'Gym', 'Parking', 'Solar', 'Security', 'Borehole', 'Generator', 'CCTV', 'Ocean View', 'Beach Access'];
const LOCATIONS_BY_REGION = {
  Nairobi: ['Karen', 'Kilimani', 'Westlands', 'Lavington', 'Muthaiga', 'Runda', 'Parklands', 'Spring Valley'],
  Mombasa: ['Nyali', 'Bamburi', 'Shanzu', 'Mtwapa', 'Diani', 'Likoni', 'Tudor'],
  'Nairobi Outskirts': ['Ruaka', 'Kiambu', 'Syokimau', 'Athi River', 'Kitengela', 'Ngong', 'Rongai', 'Juja'],
};

const TOKEN_KEY = 'popote_admin_token';
let _token = null;
const getToken = () => _token;
const setToken = (t) => { _token = t; localStorage.setItem(TOKEN_KEY, t); };
const clearToken = () => { _token = null; localStorage.removeItem(TOKEN_KEY); };

async function apiLogin(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  });
  if (res.status === 401) throw new Error('Incorrect email or password.');
  if (res.status === 403) throw new Error('Account is disabled.');
  if (!res.ok) throw new Error('Login failed. Please try again.');
  const data = await res.json();
  return data.access_token;
}

async function apiChangePassword(currentPassword, newPassword) {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  if (res.status === 401) throw new Error('Current password is incorrect.');
  if (!res.ok) throw new Error('Failed to update password.');
}

const MAX_ATTEMPTS = 5, LOCK_MS = 30000;
let _attempts = 0, _lockedUntil = 0;

export default function AdminPage() {
  injectOnce('admin-css', ADMIN_CSS);
  const { listings, setListings, enquiries, setEnquiries, showPage, showToast } = useContext(AppContext);
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [authErr, setAuthErr] = useState('');
  const [lockInfo, setLockInfo] = useState(null);
  const [attemptsMsg, setAttemptsMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('dash');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [form, setForm] = useState({ region: 'Nairobi', category: 'For Sale · Ready' });
  const [formAmenities, setFormAmenities] = useState(['Pool', 'Parking', 'Security']);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleFAmen = (a) => setFormAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const doLogin = async () => {
    if (Date.now() < _lockedUntil) return;
    if (!email.trim()) { setAuthErr('Please enter your email.'); return; }
    if (!pw.trim()) { setAuthErr('Please enter your password.'); return; }
    setLoading(true); setAuthErr('');
    try {
      const token = await apiLogin(email.trim(), pw.trim());
      setToken(token); _attempts = 0;
      setAuthed(true); setEmail(''); setPw(''); setAttemptsMsg('');
    } catch (err) {
      _attempts++;
      if (_attempts >= MAX_ATTEMPTS) {
        _lockedUntil = Date.now() + LOCK_MS; _attempts = 0;
        let rem = LOCK_MS / 1000;
        setLockInfo(rem); setAuthErr('');
        const t = setInterval(() => { rem--; setLockInfo(rem); if (rem <= 0) { clearInterval(t); setLockInfo(null); } }, 1000);
      } else {
        setAuthErr(err.message);
        const left = MAX_ATTEMPTS - _attempts;
        if (left <= 2) setAttemptsMsg(`⚠️ ${left} attempt${left !== 1 ? 's' : ''} remaining.`);
      }
      setPw('');
    } finally { setLoading(false); }
  };

  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) { showToast(`"${file.name}" is not an image.`, true); return; }
      if (file.size > 10 * 1024 * 1024) { showToast(`"${file.name}" exceeds 10MB.`, true); return; }
      const r = new FileReader();
      r.onload = e => setUploadedFiles(prev => [...prev, { name: file.name, size: file.size, dataUrl: e.target.result, file }]);
      r.readAsDataURL(file);
    });
  };

  const saveListing = async () => {
    if (!form.title?.trim()) { showToast('Please enter a listing title.', true); return; }
    if (!form.price) { showToast('Please enter a price.', true); return; }
    if (!uploadedFiles.length) { showToast('Please upload at least one image.', true); return; }
    setSaving(true);
    try {
      const saved = await listingsAPI.create({
        title: form.title.trim(), region: form.region || 'Nairobi',
        category: form.category || 'For Sale · Ready', price: parseFloat(form.price),
        description: form.desc || '', youtube_url: form.yt || '',
        beds: form.beds || '', baths: form.baths || '', sqm: form.sqm || '',
        location: form.location || '', files: uploadedFiles.map(f => f.file),
      });
      setListings(prev => [...prev, saved]);
      setForm({ region: 'Nairobi', category: 'For Sale · Ready' });
      setFormAmenities(['Pool', 'Parking', 'Security']);
      setUploadedFiles([]);
      showToast(`"${saved.title}" saved successfully!`);
      setTab('dash');
    } catch (err) {
      showToast('Failed to save listing: ' + err.message, true);
    } finally { setSaving(false); }
  };

  const deleteListing = async (id, title) => {
    if (!window.confirm(`Delete listing: "${title}"? This cannot be undone.`)) return;
    try {
      await listingsAPI.delete(id);
      setListings(prev => prev.filter(l => l.id !== id));
      showToast('Listing deleted.');
    } catch (err) {
      showToast('Delete failed: ' + err.message, true);
    }
  };

  const editListing = async (id, fields) => {
    try {
      const updated = await listingsAPI.update(id, fields);
      setListings(prev => prev.map(l => l.id === id ? updated : l));
      showToast('Listing updated.');
    } catch (err) {
      showToast('Update failed: ' + err.message, true);
    }
  };

  const cycleEnqStatus = async (id) => {
    const cycle = { New: 'Read', Read: 'Replied', Replied: 'New' };
    const enq = enquiries.find(e => e.id === id);
    const nextStatus = cycle[enq?.status] || 'New';
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: nextStatus } : e));
    try {
      await enquiriesAPI.updateStatus(id, nextStatus, null);
    } catch {
      setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: enq?.status } : e));
    }
  };

  const doLogout = () => { clearToken(); setAuthed(false); setTab('dash'); setSidebarOpen(false); showToast('Logged out.'); };
  const navTo = (t) => { setTab(t); setSidebarOpen(false); };

  if (!authed) return (
    <LoginScreen email={email} setEmail={setEmail} pw={pw} setPw={setPw}
      authErr={authErr} lockInfo={lockInfo} attemptsMsg={attemptsMsg}
      loading={loading} onLogin={doLogin} />
  );

  const NAV_ITEMS = [
    { id: 'dash', label: 'Dashboard', icon: '◉' },
    { id: 'add', label: 'Add Listing', icon: '✦' },
    { id: 'manage', label: 'Manage Listings', icon: '☰' },
    { id: 'enq', label: 'Enquiries', icon: '✉' },
    { id: 'security', label: 'Security', icon: '🔐' },
  ];

  return (
    <>
      <div className="adm-mobile-bar">
        <span className="adm-mob-brand">Popote.</span>
        <span style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: 'rgba(250,247,242,.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {NAV_ITEMS.find(n => n.id === tab)?.label}
        </span>
        <button className="adm-mob-menu-btn" onClick={() => setSidebarOpen(v => !v)}>☰</button>
      </div>
      <div className={`adm-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <div style={s.adminWrap} className="adm-wrap">
        <aside style={s.sidebar} className={`adm-sidebar${sidebarOpen ? ' open' : ''}`}>
          <div style={s.sbBrand}>Popote<span style={{ color: 'var(--gold-mid)' }}>.</span></div>
          {NAV_ITEMS.map(item => (
            <button key={item.id} style={s.sbItem(tab === item.id)} onClick={() => navTo(item.id)}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: '16px' }}>
            <button style={s.sbItem(false)} onClick={doLogout}><span>🔓</span> Logout</button>
            <button style={s.sbItem(false)} onClick={() => { showPage('home'); setSidebarOpen(false); }}><span>←</span> Back to Site</button>
          </div>
        </aside>
        <main style={s.main} className="adm-main">
          {tab === 'dash' && <Dashboard listings={listings} enquiries={enquiries} onAdd={() => setTab('add')} onDelete={deleteListing} />}
          {tab === 'add' && <AddForm form={form} setF={setF} formAmenities={formAmenities} toggleFAmen={toggleFAmen} uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles} handleFiles={handleFiles} saveListing={saveListing} saving={saving} />}
          {tab === 'manage' && <ManageListings listings={listings} onAdd={() => setTab('add')} onDelete={deleteListing} onEdit={editListing} />}
          {tab === 'enq' && <EnquiriesInbox enquiries={enquiries} onCycle={cycleEnqStatus} />}
          {tab === 'security' && <ChangePassword showToast={showToast} />}
        </main>
      </div>
    </>
  );
}

/* ─── Login Screen ────────────────────────────────────────────────── */
function LoginScreen({ email, setEmail, pw, setPw, authErr, lockInfo, attemptsMsg, loading, onLogin }) {
  return (
    <div style={ls.wrap}>
      <div style={ls.card}>
        <div style={ls.brand}>Popote Listings<span style={{ color: 'var(--gold)' }}>.</span></div>
        <div style={ls.sub}>Admin Portal — Authorised Access Only</div>
        {lockInfo !== null && <div style={ls.lockWarn}>🔒 Account temporarily locked. Please wait <strong>{lockInfo}s</strong>.</div>}
        {authErr && <div style={ls.errBox}>{authErr}</div>}
        <label style={ls.label}>username</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && onLogin()} placeholder="admin@popotelistings.co.ke" maxLength={150} style={ls.input} autoComplete="email" />
        <label style={ls.label}>Password</label>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && onLogin()} placeholder="Enter admin password" maxLength={60} style={ls.input} autoComplete="current-password" />
        <button style={ls.btn} onClick={onLogin} disabled={loading || lockInfo !== null}>{loading ? 'Signing in...' : 'Sign In →'}</button>
        <div style={ls.rateNote}>🔐 Authenticated via secure backend</div>
        {attemptsMsg && <div style={ls.attemptsMsg}>{attemptsMsg}</div>}
      </div>
    </div>
  );
}

/* ─── Change Password ─────────────────────────────────────────────── */
function ChangePassword({ showToast }) {
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confPw, setConfPw] = useState('');
  const [show, setShow] = useState({ cur: false, new: false, conf: false });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const toggleShow = (k) => setShow(p => ({ ...p, [k]: !p[k] }));
  const checks = { len: newPw.length >= 8, upp: /[A-Z]/.test(newPw), num: /[0-9]/.test(newPw), sym: /[^A-Za-z0-9]/.test(newPw) };
  const strength = Object.values(checks).filter(Boolean).length;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#E24B4A', '#EF9F27', '#1D9E75', '#0F6E56'][strength];
  const handleSave = async () => {
    const errs = {};
    if (!curPw) errs.cur = 'Enter your current password.';
    if (!Object.values(checks).every(Boolean)) errs.new = 'Password does not meet all requirements.';
    if (newPw !== confPw) errs.conf = 'Passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await apiChangePassword(curPw.trim(), newPw.trim());
      setCurPw(''); setNewPw(''); setConfPw(''); setErrors({});
      showToast('Password updated successfully.');
    } catch (err) {
      if (err.message.includes('Current')) { setErrors({ cur: err.message }); setCurPw(''); }
      else showToast(err.message, true);
    } finally { setSaving(false); }
  };
  const fi = (label, value, setter, showKey, errKey, placeholder) => (
    <div style={cp.fgrp}>
      <label style={cp.label}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input type={show[showKey] ? 'text' : 'password'} value={value}
          onChange={e => { setter(e.target.value); setErrors(p => ({ ...p, [errKey]: undefined })); }}
          placeholder={placeholder}
          style={{ ...s.ai, paddingRight: '44px', borderColor: errors[errKey] ? '#FCA5A5' : undefined }}
          autoComplete={showKey === 'cur' ? 'current-password' : 'new-password'} />
        <button type="button" onClick={() => toggleShow(showKey)} style={cp.eyeBtn} tabIndex={-1}>{show[showKey] ? '🙈' : '👁'}</button>
      </div>
      {errors[errKey] && <div style={cp.errMsg}>{errors[errKey]}</div>}
    </div>
  );
  return (
    <div>
      <div style={s.hdr} className="adm-hdr"><div style={s.pageTitle}>Security</div></div>
      <div style={{ ...s.addCard, maxWidth: '540px' }} className="adm-add-card">
        <div style={cp.sectionTitle}>Change Admin Password</div>
        <div style={cp.sectionSub}>Your new password takes effect immediately on the server.</div>
        <div style={{ marginTop: '24px' }}>
          {fi('Current Password', curPw, setCurPw, 'cur', 'cur', 'Enter current password')}
          {fi('New Password', newPw, setNewPw, 'new', 'new', 'At least 8 characters')}
          {newPw && (
            <div style={{ marginTop: '-8px', marginBottom: '16px' }}>
              <div style={cp.strengthTrack}><div style={{ ...cp.strengthFill, width: `${strength * 25}%`, background: strengthColor }} /></div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: '11px', color: strengthColor, marginTop: '5px', fontWeight: '600' }}>{strengthLabel}</div>
              <div style={cp.reqs}>
                {[{ k: 'len', l: '8+ characters' }, { k: 'upp', l: 'Uppercase letter' }, { k: 'num', l: 'Number' }, { k: 'sym', l: 'Special character' }].map(({ k, l }) => (
                  <div key={k} style={{ ...cp.req, color: checks[k] ? '#065F46' : 'var(--stone)' }}>
                    <span style={{ ...cp.reqDot, background: checks[k] ? '#065F46' : 'var(--stone)' }} />{l}
                  </div>
                ))}
              </div>
            </div>
          )}
          {fi('Confirm New Password', confPw, setConfPw, 'conf', 'conf', 'Repeat new password')}
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'center' }}>
          <button style={{ ...s.saveBtn, opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }} onClick={handleSave} disabled={saving}>{saving ? 'Updating...' : 'Update Password'}</button>
          <button style={cp.cancelBtn} onClick={() => { setCurPw(''); setNewPw(''); setConfPw(''); setErrors({}); }} disabled={saving}>Clear</button>
        </div>
        <div style={cp.secNote}>🔐 Password is securely updated via the backend API. No plain text is stored.</div>
      </div>
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────────── */
function Dashboard({ listings, enquiries, onAdd, onDelete }) {
  const newEnq = enquiries.filter(e => e.status === 'New').length;
  return (
    <div>
      <div style={s.hdr} className="adm-hdr">
        <div style={s.pageTitle}>Dashboard</div>
        <button style={s.addBtn} onClick={onAdd}>+ Add Listing</button>
      </div>
      <div style={s.kpiGrid} className="adm-kpi-grid">
        {[
          { n: listings.length, l: 'Active Listings', sub: listings.length ? `${listings.length} total` : 'None yet' },
          { n: enquiries.length, l: 'Enquiries', sub: enquiries.length ? `${enquiries.length} total` : 'None yet' },
          { n: newEnq, l: 'New Enquiries', sub: newEnq > 0 ? 'Needs attention' : 'Up to date', subColor: newEnq > 0 ? 'var(--gold)' : 'var(--green)' },
          { n: '—', l: 'Page Views', sub: 'Connect analytics' },
        ].map(k => (
          <div key={k.l} style={s.kpi}>
            <div style={s.kpiN}>{k.n}</div>
            <div style={s.kpiL}>{k.l}</div>
            <div style={{ ...s.kpiSub, color: k.subColor || 'var(--stone)' }}>{k.sub}</div>
          </div>
        ))}
      </div>
      <ListingsTable listings={listings} onAdd={onAdd} onDelete={onDelete} />
    </div>
  );
}

/* ─── Listings Table ─────────────────────────────────────────────── */
function ListingsTable({ listings, onAdd, onDelete, onEdit }) {
  return (
    <div style={s.tableWrap} className="adm-table-wrap">
      <table style={s.table}>
        <thead>
          <tr>{['#', 'Listing', 'Region', 'Category', 'Price', 'Status', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {!listings.length ? (
            <tr><td colSpan={7} style={{ ...s.td, textAlign: 'center', padding: '40px', color: 'var(--stone)', fontSize: '13.5px' }}>
              No listings yet.{' '}<button style={s.tblLink} onClick={onAdd}>Add your first listing →</button>
            </td></tr>
          ) : listings.map((l, i) => (
            <tr key={l.id}>
              <td style={s.td}>{String(i + 1).padStart(3, '0')}</td>
              <td style={{ ...s.td, fontWeight: '500', minWidth: '160px' }}>{l.title}</td>
              <td style={s.td}>{l.region}</td>
              <td style={{ ...s.td, minWidth: '120px' }}>{l.category}</td>
              <td style={s.td}>{l.priceDisplay || l.price}</td>
              <td style={s.td}><span style={s.activeBadge}>Active</span></td>
              <td style={s.td}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {onDelete && <button style={s.delBtn} onClick={() => onDelete(l.id, l.title)}>Delete</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Add Form ───────────────────────────────────────────────────── */
function AddForm({ form, setF, formAmenities, toggleFAmen, uploadedFiles, setUploadedFiles, handleFiles, saveListing, saving }) {
  const locs = LOCATIONS_BY_REGION[form.region] || [];
  const [drag, setDrag] = useState(false);
  const fi = (k, label, type = 'text', ph = '') => (
    <div style={s.fgrp}><label style={s.flabel}>{label}</label>
      <input type={type} value={form[k] || ''} onChange={e => setF(k, e.target.value)} placeholder={ph} style={s.ai} />
    </div>
  );
  const fs = (k, label, opts) => (
    <div style={s.fgrp}><label style={s.flabel}>{label}</label>
      <select value={form[k] || ''} onChange={e => setF(k, e.target.value)} style={s.ai}>
        {opts.map(o => <option key={o.v || o} value={o.v !== undefined ? o.v : o}>{o.l || o}</option>)}
      </select>
    </div>
  );
  return (
    <div>
      <div style={s.hdr} className="adm-hdr"><div style={s.pageTitle}>Add New Listing</div></div>
      <div style={s.addCard} className="adm-add-card">
        <div style={s.fg} className="adm-fg">
          <div style={{ gridColumn: 'span 2' }} className="adm-span2">{fi('title', 'Listing Title', 'text', 'e.g. Luxury Villa — Karen')}</div>
          {fs('region', 'Region', ['Nairobi', 'Mombasa', 'Nairobi Outskirts'])}
          {fs('location', 'Location', locs)}
          {fs('category', 'Category', ['For Sale · Ready', 'For Sale · Off-Plan', 'Rental · Furnished', 'Rental · Unfurnished'])}
          {fi('price', 'Price (KES)', 'number', '45000000')}
          {fi('priceDisplay', 'Price Display', 'text', 'e.g. KES 45,000,000')}
          {fi('beds', 'Bedrooms', 'number', '4')}
          {fi('baths', 'Bathrooms', 'number', '4')}
          {fi('sqm', 'Size (sqm)', 'number', '280')}
          {fi('yt', 'YouTube URL', 'url', 'https://youtube.com/watch?v=...')}
          <div style={{ gridColumn: 'span 2' }} className="adm-span2">
            <div style={s.fgrp}><label style={s.flabel}>Description</label>
              <textarea value={form.desc || ''} onChange={e => setF('desc', e.target.value)} placeholder="Property description..." maxLength={1000} style={{ ...s.ai, minHeight: '88px', resize: 'vertical' }} />
            </div>
          </div>
          <div style={{ gridColumn: 'span 2' }} className="adm-span2">
            <label style={s.flabel}>Amenities</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {AMENITIES.map(a => <button key={a} type="button" style={amS.check(formAmenities.includes(a))} onClick={() => toggleFAmen(a)}>{a}</button>)}
            </div>
          </div>
          <div style={{ gridColumn: 'span 2' }} className="adm-span2">
            <label style={s.flabel}>Property Images</label>
            <div style={amS.dropzone(drag)}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => document.getElementById('img-input').click()}>
              <input type="file" id="img-input" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📸</div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: '12.5px', color: 'var(--stone)' }}>Click or drag & drop images</div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: '11px', color: 'var(--stone)', marginTop: '4px', opacity: 0.6 }}>JPEG, PNG, WebP · Max 10MB each</div>
            </div>
            {uploadedFiles.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: '10px', marginTop: '14px' }}>
                {uploadedFiles.map((f, idx) => (
                  <div key={idx} style={{ position: 'relative', borderRadius: '2px', overflow: 'hidden', aspectRatio: '1', background: 'var(--parchment)' }}>
                    <img src={f.dataUrl} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(14,11,8,.85)', color: '#fff', border: 'none', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}>✕</button>
                  </div>
                ))}
              </div>
            )}
            {uploadedFiles.length > 0 && <div style={{ fontFamily: 'var(--sans)', fontSize: '11.5px', color: 'var(--gold)', marginTop: '10px', fontWeight: '600' }}>{uploadedFiles.length} image{uploadedFiles.length !== 1 ? 's' : ''} selected</div>}
          </div>
        </div>
        <button style={{ ...s.saveBtn, opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }} onClick={saveListing} disabled={saving}>
          {saving ? 'Uploading...' : 'Save Listing'}
        </button>
      </div>
    </div>
  );
}

/* ─── Manage Listings (with Edit Modal) ─────────────────────────── */
function ManageListings({ listings, onAdd, onDelete, onEdit }) {
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const openEdit = (l) => {
    setEditTarget(l);
    setEditForm({
      title: l.title || '', region: l.region || '', category: l.category || '',
      price: l.price || '', location: l.location || '', beds: l.beds || '',
      baths: l.baths || '', sqm: l.sqm || '', description: l.description || '',
      youtube_url: l.youtube_url || '',
    });
  };
  const closeEdit = () => { setEditTarget(null); setEditForm({}); };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await onEdit(editTarget.id, {
        title: editForm.title, region: editForm.region, category: editForm.category,
        price: parseFloat(editForm.price), location: editForm.location || '',
        beds: editForm.beds ? parseInt(editForm.beds) : null,
        baths: editForm.baths ? parseInt(editForm.baths) : null,
        sqm: editForm.sqm ? parseFloat(editForm.sqm) : null,
        description: editForm.description || '', youtube_url: editForm.youtube_url || '',
      });
      closeEdit();
    } finally { setSaving(false); }
  };

  const ef = (k, label, type = 'text') => (
    <div style={s.fgrp}><label style={s.flabel}>{label}</label>
      <input type={type} value={editForm[k] || ''} onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))} style={s.ai} />
    </div>
  );

  return (
    <div>
      <div style={s.hdr} className="adm-hdr">
        <div style={s.pageTitle}>Manage Listings</div>
        <button style={s.addBtn} onClick={onAdd}>+ Add New</button>
      </div>

      {editTarget && (
        <div style={editS.overlay} onClick={closeEdit}>
          <div style={editS.modal} onClick={e => e.stopPropagation()}>
            <div style={editS.modalHdr}>
              <div style={editS.modalTitle}>Edit Listing</div>
              <button style={editS.closeBtn} onClick={closeEdit}>✕</button>
            </div>
            <div style={s.fg} className="adm-fg">
              <div style={{ gridColumn: 'span 2' }} className="adm-span2">{ef('title', 'Title')}</div>
              {ef('region', 'Region')}
              {ef('location', 'Location')}
              {ef('category', 'Category')}
              {ef('price', 'Price (KES)', 'number')}
              {ef('beds', 'Bedrooms', 'number')}
              {ef('baths', 'Bathrooms', 'number')}
              {ef('sqm', 'Size (sqm)', 'number')}
              {ef('youtube_url', 'YouTube URL')}
              <div style={{ gridColumn: 'span 2' }} className="adm-span2">
                <label style={s.flabel}>Description</label>
                <textarea value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  style={{ ...s.ai, minHeight: '80px', resize: 'vertical', marginTop: '5px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button style={{ ...s.saveBtn, opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer', marginTop: 0 }}
                onClick={saveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              <button style={editS.cancelBtn} onClick={closeEdit} disabled={saving}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <ListingsTable listings={listings} onAdd={onAdd} onDelete={onDelete} onEdit={openEdit} />
    </div>
  );
}

/* ─── Enquiries Inbox ────────────────────────────────────────────── */
function EnquiriesInbox({ enquiries, onCycle }) {
  const statusColor = { New: ['#FEF3C7', '#92400E'], Read: ['#DBEAFE', '#1E40AF'], Replied: ['#D1FAE5', '#065F46'] };
  return (
    <div>
      <div style={s.hdr} className="adm-hdr">
        <div style={s.pageTitle}>Enquiries Inbox</div>
        <span style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--stone)' }}>{enquiries.length} enquir{enquiries.length !== 1 ? 'ies' : 'y'}</span>
      </div>
      <div style={s.tableWrap} className="adm-table-wrap">
        <table style={s.table}>
          <thead>
            <tr>{['#', 'Name', 'Phone', 'Property', 'Region', 'Date', 'Status'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {!enquiries.length ? (
              <tr><td colSpan={7} style={{ ...s.td, textAlign: 'center', padding: '40px', color: 'var(--stone)' }}>No enquiries yet.</td></tr>
            ) : enquiries.map((e, i) => {
              const [bg, color] = statusColor[e.status] || statusColor.New;
              return (
                <tr key={e.id}>
                  <td style={s.td}>{String(i + 1).padStart(3, '0')}</td>
                  <td style={{ ...s.td, fontWeight: '500', minWidth: '120px' }}>{e.name}</td>
                  <td style={s.td}>{e.phone}</td>
                  <td style={{ ...s.td, minWidth: '140px' }}>{e.property}</td>
                  <td style={s.td}>{e.region || '—'}</td>
                  <td style={s.td}>{e.date}</td>
                  <td style={s.td}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: '600', fontFamily: 'var(--sans)', background: bg, color, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      onClick={() => onCycle(e.id)}>{e.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────── */
const ls = {
  wrap: { minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(140deg, var(--obsidian), var(--carbon) 60%, var(--smoke))', padding: '24px 16px' },
  card: { background: 'var(--white)', borderRadius: '2px', padding: '48px 36px', width: '100%', maxWidth: '420px', boxShadow: '0 32px 80px rgba(0,0,0,.3), 0 0 0 1px rgba(192,154,60,.12)' },
  brand: { fontFamily: 'var(--serif)', fontSize: '26px', fontWeight: '400', color: 'var(--ink)', textAlign: 'center', marginBottom: '4px' },
  sub: { fontFamily: 'var(--sans)', fontSize: '11.5px', color: 'var(--stone)', textAlign: 'center', marginBottom: '36px', letterSpacing: '0.06em' },
  lockWarn: { background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '1px', padding: '10px 14px', fontFamily: 'var(--sans)', fontSize: '12px', color: '#92400E', marginBottom: '12px' },
  errBox: { background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '1px', padding: '10px 14px', fontFamily: 'var(--sans)', fontSize: '12.5px', color: '#991B1B', marginBottom: '12px' },
  label: { display: 'block', fontFamily: 'var(--sans)', fontSize: '9px', fontWeight: '700', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: '8px' },
  input: { width: '100%', fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--ink)', background: 'var(--parchment)', border: '1px solid var(--border)', padding: '13px 15px', borderRadius: '1px', outline: 'none', marginBottom: '14px', boxSizing: 'border-box' },
  btn: { width: '100%', background: 'var(--ink)', color: 'var(--cream)', border: 'none', padding: '14px', borderRadius: '1px', fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' },
  rateNote: { fontFamily: 'var(--sans)', fontSize: '10.5px', color: 'var(--stone)', textAlign: 'center', marginTop: '16px' },
  attemptsMsg: { fontFamily: 'var(--sans)', fontSize: '11px', color: '#B45309', textAlign: 'center', marginTop: '8px' },
};

const s = {
  adminWrap: { display: 'grid', gridTemplateColumns: '248px 1fr', minHeight: 'calc(100vh - 72px)' },
  sidebar: { background: 'var(--obsidian)', padding: '28px 0', display: 'flex', flexDirection: 'column' },
  sbBrand: { fontFamily: 'var(--serif)', fontSize: '18px', color: 'var(--cream)', padding: '0 28px 24px', borderBottom: '1px solid rgba(255,255,255,.06)', marginBottom: '12px', fontStyle: 'italic' },
  sbItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 28px',
    fontFamily: 'var(--sans)', fontSize: '12.5px', color: active ? 'var(--cream)' : 'rgba(250,247,242,.4)',
    background: active ? 'rgba(192,154,60,.1)' : 'none', border: 'none',
    borderRight: active ? '2px solid var(--gold)' : '2px solid transparent',
    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%',
  }),
  main: { padding: '40px 44px', background: 'var(--parchment)', overflowY: 'auto' },
  hdr: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  pageTitle: { fontFamily: 'var(--serif)', fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: '400', color: 'var(--ink)' },
  addBtn: { background: 'var(--gold)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '1px', fontFamily: 'var(--sans)', fontSize: '11.5px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', flexShrink: 0 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginBottom: '36px' },
  kpi: { background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '2px', padding: '24px' },
  kpiN: { fontFamily: 'var(--serif)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '400', color: 'var(--ink)' },
  kpiL: { fontFamily: 'var(--sans)', fontSize: '11px', color: 'var(--stone)', marginTop: '4px', letterSpacing: '0.06em' },
  kpiSub: { fontFamily: 'var(--sans)', fontSize: '11.5px', marginTop: '8px' },
  tableWrap: { background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '2px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '580px' },
  th: { background: 'var(--carbon)', color: 'rgba(250,247,242,.5)', fontFamily: 'var(--sans)', fontSize: '9px', letterSpacing: '0.16em', fontWeight: '700', textTransform: 'uppercase', padding: '14px 16px', textAlign: 'left', whiteSpace: 'nowrap' },
  td: { padding: '14px 16px', fontFamily: 'var(--sans)', fontSize: '12.5px', color: 'var(--ink)', borderBottom: '1px solid var(--border)' },
  tblLink: { background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '13.5px' },
  activeBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: '20px', background: '#D1FAE5', color: '#065F46', fontFamily: 'var(--sans)', fontSize: '10.5px', fontWeight: '600', whiteSpace: 'nowrap' },
  editBtn: { background: 'none', border: '1px solid var(--border)', color: 'var(--ink)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '11.5px', padding: '4px 10px', borderRadius: '1px' },
  delBtn: { background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '11.5px', padding: '4px 10px', borderRadius: '1px', fontWeight: '600' },
  addCard: { background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '2px', padding: '36px' },
  fg: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  fgrp: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '4px' },
  flabel: { fontFamily: 'var(--sans)', fontSize: '8.5px', fontWeight: '700', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--stone)' },
  ai: { fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--ink)', background: 'var(--parchment)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '1px', outline: 'none', WebkitAppearance: 'none', width: '100%', boxSizing: 'border-box' },
  saveBtn: { background: 'var(--gold)', color: '#fff', border: 'none', padding: '13px 36px', borderRadius: '1px', fontFamily: 'var(--sans)', fontSize: '12.5px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', marginTop: '22px' },
};

const amS = {
  check: (on) => ({ padding: '7px 13px', borderRadius: '1px', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '11.5px', fontWeight: '500', transition: 'all 0.2s', border: '1px solid var(--border)', background: on ? 'var(--ink)' : 'var(--parchment)', color: on ? 'var(--cream)' : 'var(--stone)' }),
  dropzone: (drag) => ({ border: `2px dashed ${drag ? 'var(--gold)' : 'rgba(192,154,60,.3)'}`, borderRadius: '2px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: drag ? 'rgba(192,154,60,.06)' : 'rgba(192,154,60,.02)', transition: 'all 0.2s', marginTop: '8px' }),
};

const cp = {
  fgrp: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '16px' },
  label: { fontFamily: 'var(--sans)', fontSize: '8.5px', fontWeight: '700', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--stone)' },
  eyeBtn: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: '2px' },
  errMsg: { fontFamily: 'var(--sans)', fontSize: '11px', color: '#991B1B', marginTop: '3px' },
  strengthTrack: { height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden', marginTop: '8px' },
  strengthFill: { height: '100%', borderRadius: '2px', transition: 'width 0.3s ease, background 0.3s ease' },
  reqs: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 16px', marginTop: '10px' },
  req: { display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--sans)', fontSize: '11px', transition: 'color 0.2s' },
  reqDot: { display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0, transition: 'background 0.2s' },
  sectionTitle: { fontFamily: 'var(--serif)', fontSize: '18px', fontWeight: '400', color: 'var(--ink)', marginBottom: '4px' },
  sectionSub: { fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--stone)', lineHeight: '1.6' },
  cancelBtn: { background: 'none', border: '1px solid var(--border)', color: 'var(--stone)', padding: '13px 24px', borderRadius: '1px', fontFamily: 'var(--sans)', fontSize: '12.5px', fontWeight: '600', letterSpacing: '0.06em', cursor: 'pointer', marginTop: '22px' },
  secNote: { fontFamily: 'var(--sans)', fontSize: '11px', color: 'var(--stone)', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)', opacity: 0.7 },
};

const editS = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modal: { background: 'var(--white)', borderRadius: '2px', padding: '32px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,.4)' },
  modalHdr: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  modalTitle: { fontFamily: 'var(--serif)', fontSize: '22px', fontWeight: '400', color: 'var(--ink)' },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--stone)', padding: '4px' },
  cancelBtn: { background: 'none', border: '1px solid var(--border)', color: 'var(--stone)', padding: '13px 24px', borderRadius: '1px', fontFamily: 'var(--sans)', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' },
};