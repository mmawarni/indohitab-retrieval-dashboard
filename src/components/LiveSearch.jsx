import { useMemo, useState } from 'react';
import { buildIndex, tokenize } from '../lib/retrieval.js';
import { Chips, FieldLegend } from './Demo.jsx';

const DEFAULT_Q = 'Berapa persentase penduduk berusia 15 hingga 24 tahun yang bekerja?';

export default function LiveSearch({ tables }) {
  const idx = useMemo(() => buildIndex(tables), [tables]);
  const [text, setText] = useState(DEFAULT_Q);
  const [query, setQuery] = useState(DEFAULT_Q);
  const [lam, setLam] = useState([4, 32, 64]);
  const norm = useMemo(() => { const s = lam.reduce((a, c) => a + c, 0) || 1; return lam.map((v) => v / s); }, [lam]);

  const result = useMemo(() => {
    const toks = tokenize(query);
    if (!toks.length) return null;
    const base = idx.score(toks);
    const o1 = idx.rank(base);
    if (base[o1[0]] <= 0) return { empty: true };
    const terms = idx.prfTerms(query, o1, norm);
    const o2 = idx.rank(idx.expand(base, terms));
    return { o1, o2, terms, pos: new Map(o1.map((d, i) => [d, i + 1])) };
  }, [idx, query, norm]);

  const names = [['Judul', 'var(--f-title)'], ['Header', 'var(--f-header)'], ['Sel', 'var(--f-cells)']];
  const List = ({ order, moves }) => (
    <ol>
      {order.slice(0, 10).map((d, i) => {
        const t = idx.docs[d];
        const mv = moves ? result.pos.get(d) - (i + 1) : 0;
        return (
          <li key={d}>
            {t.t} <span className="note">({t.id})</span>
            {moves && <span className={`mv ${mv > 0 ? 'up' : mv < 0 ? 'down' : 'same'}`}>{mv > 0 ? `▲${mv}` : mv < 0 ? `▼${-mv}` : '='}</span>}
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className="panel" style={{ gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h2>Try query</h2>
        <p className="note">
          Berjalan langsung di browser atas 600 tabel: BM25F (bobot judul 4, header 4, sel 1), lalu field-aware PRF sparse dengan 5 tabel feedback dan 15 term.
          Qwen3 tidak dijalankan di sini, dan field tabel direkonstruksi dari tables.json, jadi peringkat bisa sedikit berbeda dari eksperimen (sekitar 90% sama untuk BM25F).
        </p>
      </div>
      <form style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} onSubmit={(e) => { e.preventDefault(); setQuery(text); }}>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} aria-label="Pertanyaan" style={{ flex: 1, minWidth: 220 }} />
        <button className="btn" type="submit">Cari</button>
      </form>
      <div className="sliders">
        {names.map(([n, c], i) => (
          <div className="sl" key={n}>
            <label htmlFor={`lam-${i}`}><span style={{ color: c }}>λ {n.toLowerCase()}</span><span>{norm[i].toFixed(2)}</span></label>
            <input id={`lam-${i}`} type="range" min={0} max={100} value={lam[i]} onChange={(e) => setLam((L) => L.map((v, j) => (j === i ? +e.target.value : v)))} />
          </div>
        ))}
      </div>
      <p className="note">Bobot dinormalisasi agar jumlahnya 1. Nilai awal = λ terpilih di dev (0,04; 0,32; 0,64).</p>
      {!result && <p className="note">Tulis pertanyaan lalu tekan Cari.</p>}
      {result?.empty && <p className="note">Tidak ada kata kueri yang muncul di korpus. Coba kata lain.</p>}
      {result && !result.empty && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h3>Term ekspansi (feedback = 5 teratas BM25F)</h3>
            <FieldLegend />
            <Chips terms={result.terms} withField />
          </div>
          <div className="res">
            <div className="panel"><h3>BM25F · 10 teratas</h3><List order={result.o1} /></div>
            <div className="panel"><h3>BM25F + field-aware PRF · 10 teratas</h3><List order={result.o2} moves /></div>
          </div>
        </>
      )}
    </div>
  );
}
