import { useState } from 'react';
import { f4, fs, f3, hyp, row } from '../lib/data.js';

// Ikon garis sederhana (gaya Feather) supaya tidak perlu font ikon dari CDN.
const PATHS = {
  chart: 'M18 20V10M12 20V4M6 20v-6',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  trend: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
  layers: 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  check: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  table: 'M3 3h18v18H3zM3 9h18M3 15h18M9 3v18',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  menu: 'M3 12h18M3 6h18M3 18h18',
  x: 'M18 6 6 18M6 6l12 12',
  up: 'M12 19V5M5 12l7-7 7 7',
  down: 'M12 5v14M19 12l-7 7-7-7',
  minus: 'M5 12h14',
};
export function Icon({ name, size = 16 }) {
  return (
    <svg className="ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

export const TABS = [
  ['dashboard', 'Dashboard hasil', 'chart'],
  ['demo', 'Demo kueri benchmark', 'list'],
  ['coba', 'Try query', 'search'],
];
const SECTIONS = [['rq1', 'RQ1 · Metode', 'activity'], ['rq2', 'RQ2 · PRF & hipotesis', 'layers'], ['lambda', 'Grid λ & posisi gold', 'grid'], ['tabel', 'Tabel semua metode', 'table']];

export function Sidebar({ tab }) {
  const [open, setOpen] = useState(false);
  const jump = (id) => { setOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return (
    <nav className="sidebar" aria-label="Navigasi utama">
      <div className="sb-inner">
        <div className="sb-top">
          <a className="brand" href="#dashboard">IndoHiTab Retrieval</a>
          <button className="sb-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Buka menu"><Icon name="menu" size={20} /></button>
        </div>
        <div className={`sb-collapse${open ? ' open' : ''}`}>
          <div className="sb-mhead">
            <span className="brand">IndoHiTab Retrieval</span>
            <button className="sb-toggle" onClick={() => setOpen(false)} aria-label="Tutup menu"><Icon name="x" size={20} /></button>
          </div>
          <hr />
          <h6 className="sb-head">Halaman</h6>
          <ul className="sb-nav">
            {TABS.map(([k, l, ic]) => (
              <li key={k}><a href={`#${k}`} className={tab === k ? 'active' : ''} onClick={() => setOpen(false)}><Icon name={ic} />{l}</a></li>
            ))}
          </ul>
          {tab === 'dashboard' && (
            <>
              <hr />
              <h6 className="sb-head">Bagian dashboard</h6>
              <ul className="sb-nav">
                {SECTIONS.map(([id, l, ic]) => <li key={id}><button onClick={() => jump(id)}><Icon name={ic} />{l}</button></li>)}
              </ul>
            </>
          )}
          <hr />
          <h6 className="sb-head">Tentang</h6>
          <p className="sb-note">Hasil mini riset mata kuliah PIL Ganjil 2026/2027 dengan menggunakan dataset IndoHiTab.</p>
        </div>
      </div>
    </nav>
  );
}

export function Navbar({ tab }) {
  const label = (TABS.find(([k]) => k === tab) || TABS[0])[1];
  return (
    <div className="topnav">
      <span className="topnav-title">{label}</span>
      <span className="avatar" title="Mutiara Mawarni">MM</span>
    </div>
  );
}

function CardStats({ title, value, icon, color, foot }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <div className="stat-text">
          <h5>{title}</h5>
          <span className="stat-val">{value}</span>
        </div>
        <div className="stat-ico" style={{ background: color }}><Icon name={icon} size={20} /></div>
      </div>
      <p className="stat-foot">{foot}</p>
    </div>
  );
}

function hypFoot(r) {
  if (!r) return null;
  const sig = r.p_holm < 0.05;
  const cls = sig ? (r.delta > 0 ? 'up' : 'down') : 'warn';
  return (
    <>
      <span className={cls}><Icon name={sig ? (r.delta > 0 ? 'up' : 'down') : 'minus'} size={12} /> {sig ? 'Didukung' : 'Tidak signifikan'}</span>
      <span> · p Holm {f3(r.p_holm)} · CI [{fs(r.ci_lo)}; {fs(r.ci_hi)}]</span>
    </>
  );
}

export function HeaderStats({ data }) {
  let cards = null;
  if (data) {
    const [summary, hyps] = data;
    const h1 = hyp(hyps, 'H1'), h2a = hyp(hyps, 'H2a'), h2b = hyp(hyps, 'H2b');
    const m = (k) => f4(row(summary, 'test', k)['MRR@10']);
    cards = (
      <div className="stats">
        <CardStats title="MRR@10 test · hybrid" value={m('RRF(BM25F,Qwen3)')} icon="trend" color="var(--red-500)"
          foot={<span>Qwen3 {m('Qwen3')} · BM25F {m('BM25F')}</span>} />
        <CardStats title="H1 · hybrid vs tunggal" value={fs(h1.delta)} icon="activity" color="var(--orange-500)" foot={hypFoot(h1)} />
        <CardStats title="H2a · FA-PRF vs tanpa PRF" value={fs(h2a.delta)} icon="layers" color="var(--pink-500)" foot={hypFoot(h2a)} />
        <CardStats title="H2b · FA vs whole-table" value={fs(h2b.delta)} icon="target" color="var(--sky-500)" foot={hypFoot(h2b)} />
      </div>
    );
  }
  return (
    <header className="hero">
      <div className="hero-inner">
        <p className="hero-kicker">Mini Riset · Perolehan Informasi Lanjut · Fasilkom UI</p>
        <h1>Sparse–Dense Hybrid Table Retrieval for Indonesian Table Question Answering:<span className="h1-sub">A Field-Aware Pseudo-Relevance Feedback Approach</span></h1>
        <p className="hero-sub">Hasil eksperimen pada IndoHiTab dan demo interaktif pipeline BM25F, Qwen3, RRF dan field-aware pseudo-relevance feedback.</p>
        {cards}
      </div>
    </header>
  );
}

export function CardHead({ over, title, children }) {
  return (
    <div className="card-head">
      <div>
        {over && <h6>{over}</h6>}
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function FooterAdmin() {
  return (
    <footer className="foot">
      <hr />
      <div className="foot-row">
        <span>© 2026 Mutiara Mawarni · 2506575945</span>
        <span>Run final 24 November 2026 (grid λ step 0,01). Angka dashboard dan demo benchmark berasal dari file hasil eksperimen; “Try query” adalah pendekatan sparse di browser.</span>
      </div>
    </footer>
  );
}
