import { useEffect, useState } from 'react';
import { useData } from './lib/data.js';
import Dashboard from './components/Dashboard.jsx';
import Demo from './components/Demo.jsx';
import LiveSearch from './components/LiveSearch.jsx';
import { TABS, Sidebar, Navbar, HeaderStats, FooterAdmin } from './components/Layout.jsx';

const fromHash = () => { const h = location.hash.slice(1); return TABS.some(([k]) => k === h) ? h : 'dashboard'; };

export default function App() {
  const [tab, setTab] = useState(fromHash);
  useEffect(() => {
    const on = () => { setTab(fromHash()); scrollTo(0, 0); };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  const d = useData(['summary.json', 'hypotheses.json', 'lambda_grid.json', 'queries.json', 'tables.json']);

  return (
    <>
      <Sidebar tab={tab} />
      <div className="main">
        <Navbar tab={tab} />
        <HeaderStats data={d.status === 'ok' ? d.data : null} />
        <div className="content">
          {d.status === 'loading' && <div className="card"><p className="note">Memuat data hasil eksperimen…</p></div>}
          {d.status === 'error' && <div className="card"><p className="note">Data gagal dimuat: {d.error}. Pastikan folder data ikut ter-deploy.</p></div>}
          {d.status === 'ok' && (() => {
            const [summary, hyps, grid, queries, tables] = d.data;
            if (tab === 'demo') return <Demo queries={queries} tables={tables} />;
            if (tab === 'coba') return <LiveSearch tables={tables} />;
            return <Dashboard summary={summary} hyps={hyps} grid={grid} queries={queries} />;
          })()}
          <FooterAdmin />
        </div>
      </div>
    </>
  );
}
