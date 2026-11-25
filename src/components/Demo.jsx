import { useMemo, useState } from 'react';

export const FIELD = { title: ['Judul', 'var(--f-title)'], header: ['Header', 'var(--f-header)'], cells: ['Sel', 'var(--f-cells)'] };
const PRESETS = [
  ['catatan kelahiran yang termasuk', 'Fusi menyelamatkan (1312)'],
  ['Bahasa Perancis di provinsi paramedis', 'PRF membantu (707)'],
  ['penurunan di sektor bisnis selama periode 2000', 'PRF merugikan (907)'],
  ['bahasa minoritas pada tahun 2011', 'Rank 142 → 74 (707)'],
];
const rk = (v) => (v == null ? 9999 : v);
const fmtRank = (r) => (r == null ? '>100' : r > 10 ? `${r} (di luar 10)` : String(r));
const move = (a, b) => (rk(b) < rk(a) ? 'up' : rk(b) > rk(a) ? 'down' : 'same');
const moveText = (a, b) => { const m = move(a, b); return m === 'up' ? `▲ naik ${rk(a) - rk(b)}` : m === 'down' ? `▼ turun ${rk(b) - rk(a)}` : 'tetap'; };

export function Chips({ terms, withField }) {
  return (
    <div className="chips">
      {terms.map((t) => {
        const [w, wt, f] = Array.isArray(t) ? t : [t, null, null];
        const c = withField && FIELD[f] ? FIELD[f][1] : 'var(--muted)';
        return <span className="chip" key={w}><i className="dot" style={{ background: c, marginRight: 0 }} />{w}{wt != null && <span className="w">{wt.toFixed(3)}</span>}</span>;
      })}
    </div>
  );
}
export function FieldLegend() {
  return <div className="legend">{Object.values(FIELD).map(([l, c]) => <span key={l}><i className="dot" style={{ background: c }} />{l}</span>)}</div>;
}
const Step = ({ n, title, children }) => (
  <div className="panel"><div className="step"><div className="num" aria-hidden="true">{n}</div><div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}><h2>{title}</h2>{children}</div></div></div>
);
const Rank = ({ label, r, sub }) => (
  <div className={`rk${r === 1 ? ' top' : ''}`}><div className="l">{label}</div><div className="v">{r == null ? '—' : r}</div>{sub && <div className="l">{sub}</div>}</div>
);

export default function Demo({ queries, tables }) {
  const titleOf = useMemo(() => Object.fromEntries(tables.map((t) => [t.id, t.t])), [tables]);
  const [search, setSearch] = useState('');
  const [split, setSplit] = useState('test');
  const [effect, setEffect] = useState('all');
  const [cur, setCur] = useState(() => queries.find((q) => q.s === 'test' && q.q.includes('Bahasa Perancis di provinsi paramedis')) || queries[0]);

  const list = useMemo(() => {
    const s = search.trim().toLowerCase();
    return queries.filter((q) => (split === 'all' || q.s === split) && (!s || q.q.toLowerCase().includes(s)) && (effect === 'all' || move(q.r.rrf, q.r.fa) === effect));
  }, [queries, search, split, effect]);

  const q = cur;
  const finals = [['Tanpa PRF (RRF)', q.r.rrf], ['RM3 + RRF', q.r.rm3], ['Whole-table PRF + RRF', q.r.whole], ['Field bobot sama + RRF', q.r.eq], ['Field-aware PRF + RRF (usulan)', q.r.fa], ['Field-aware PRF, sparse saja', q.r.fas]];

  return (
    <div className="demo">
      <aside className="panel rail">
        <h3>Pilih kueri</h3>
        <input type="search" placeholder="Cari kata dalam pertanyaan…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Cari kueri" />
        <select value={split} onChange={(e) => setSplit(e.target.value)} aria-label="Split">
          <option value="test">Test (554)</option><option value="dev">Dev (465)</option><option value="all">Semua (1.019)</option>
        </select>
        <select value={effect} onChange={(e) => setEffect(e.target.value)} aria-label="Efek PRF">
          <option value="all">Semua efek PRF</option><option value="up">PRF menaikkan peringkat</option><option value="down">PRF menurunkan peringkat</option><option value="same">Peringkat tetap</option>
        </select>
        <div className="presets">
          {PRESETS.map(([sub, lab]) => { const hit = queries.find((x) => x.s === 'test' && x.q.includes(sub)); return hit && <button className="preset" key={lab} onClick={() => setCur(hit)}>{lab}</button>; })}
        </div>
        <p className="note">{list.length} kueri</p>
        <ul className="qlist">
          {list.slice(0, 300).map((x) => (
            <li key={x.s + x.id}>
              <button aria-current={String(x === cur)} onClick={() => setCur(x)}>
                {x.q}<span className="meta">{x.s} · gold {x.g} · RRF {fmtRank(x.r.rrf)} → PRF {fmtRank(x.r.fa)}</span>
              </button>
            </li>
          ))}
          {list.length > 300 && <li className="note" style={{ padding: '8px 4px' }}>Menampilkan 300 pertama; persempit pencarian.</li>}
        </ul>
      </aside>

      <div className="steps">
        <div className="panel">
          <h3>Pertanyaan · {q.s}</h3>
          <p className="question">{q.q}</p>
          <p className="gold"><b>Tabel gold {q.g}:</b> {titleOf[q.g] || '—'}</p>
        </div>
        <Step n={1} title="Retrieval awal: sparse dan dense">
          <div className="ranks"><Rank label="BM25F" r={q.r.bm25f} sub="sparse, field-aware" /><Rank label="Qwen3" r={q.r.qwen3} sub="dense, chunk + MaxSim" /></div>
          <p className="note">Angka = peringkat tabel gold dalam hasil masing-masing retriever.</p>
        </Step>
        <Step n={2} title="Fusi RRF (k = 60)">
          <div className="ranks"><Rank label="RRF(BM25F, Qwen3)" r={q.r.rrf} sub="tanpa PRF" /></div>
          <p className="note">Skor RRF = Σ 1/(60 + peringkat) dari kedua retriever.</p>
        </Step>
        <Step n={3} title="Feedback: 5 tabel teratas hasil fusi">
          <ol className="fb">
            {q.fb.map((id, i) => (
              <li key={id + i} className={id === q.g ? 'is-gold' : ''}>
                <span className="note">#{i + 1}</span><span>{titleOf[id] || `Tabel ${id}`}</span>
                {id === q.g ? <span className="badge">GOLD</span> : <span className="note">{id}</span>}
              </li>
            ))}
          </ol>
          <p className="note">{q.fb.includes(q.g) ? 'Tabel gold termasuk feedback.' : 'Tabel gold tidak termasuk feedback, sehingga term ekspansi berasal dari tabel lain.'}</p>
        </Step>
        <Step n={4} title="Seleksi term per field (λ = 0,04; 0,32; 0,64)">
          <FieldLegend />
          <Chips terms={q.fa} withField />
          <div className="cmp">
            <div className="panel" style={{ padding: 12 }}><h3>Whole-table PRF</h3><Chips terms={q.wh.slice(0, 10)} /></div>
            <div className="panel" style={{ padding: 12 }}><h3>Field bobot sama</h3><Chips terms={q.eq.slice(0, 10)} /></div>
          </div>
          <p className="note">Angka pada chip = bobot term setelah normalisasi; warna = field asal kontribusi terbesar. Term angka berasal dari isi sel.</p>
        </Step>
        <Step n={5} title="Peringkat akhir tabel gold">
          <div className="tw">
            <table>
              <thead><tr><th>Sistem</th><th className="r">Peringkat gold</th><th className="r">vs tanpa PRF</th></tr></thead>
              <tbody>
                {finals.map(([l, r], i) => (
                  <tr key={l} style={i === 4 ? { fontWeight: 600 } : undefined}>
                    <td>{l}</td><td className="r">{fmtRank(r)}</td>
                    <td className={`r ${i ? move(q.r.rrf, r) : 'same'}`}>{i ? moveText(q.r.rrf, r) : 'acuan'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="note">Semua angka di mode ini berasal dari query_level run final (24 Nov 2026, grid λ step 0,01).</p>
        </Step>
      </div>
    </div>
  );
}
