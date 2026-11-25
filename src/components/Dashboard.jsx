import { useMemo, useState } from 'react';
import { f4, fs, hyp } from '../lib/data.js';
import { CardHead } from './Layout.jsx';
import { MethodChart, PrfChart, ForestPlot, Ternary, RankBuckets } from './Charts.jsx';

export default function Dashboard({ summary, hyps, grid, queries }) {
  const [split, setSplit] = useState('test');
  const [metric, setMetric] = useState('MRR@10');
  const h1 = hyp(hyps, 'H1'), h2a = hyp(hyps, 'H2a'), h2b = hyp(hyps, 'H2b');

  const moves = useMemo(() => {
    const t = queries.filter((q) => q.s === 'test');
    const rk = (v) => (v == null ? 9999 : v);
    const bucket = (key) => {
      const n = t.length, r = t.map((q) => rk(q.r[key]));
      return { r1: r.filter((v) => v === 1).length / n, r2: r.filter((v) => v >= 2 && v <= 5).length / n, r6: r.filter((v) => v >= 6 && v <= 10).length / n, out: r.filter((v) => v > 10).length / n };
    };
    const pool = t.filter((q) => rk(q.r.rrf) >= 2 && rk(q.r.rrf) <= 5);
    return {
      buckets: [{ system: 'Tanpa PRF', ...bucket('rrf') }, { system: 'Field-aware PRF', ...bucket('fa') }],
      up: t.filter((q) => rk(q.r.fa) < rk(q.r.rrf)).length,
      down: t.filter((q) => rk(q.r.fa) > rk(q.r.rrf)).length,
      lifted: pool.filter((q) => q.r.fa === 1).length,
      pool: pool.length,
    };
  }, [queries]);

  return (
    <div className="stack">
      <div className="card callout">
        <p>
          Fusi RRF(BM25F, Qwen3) menaikkan MRR@10 test sebesar <b>{fs(h1.delta)}</b> dibanding Qwen3. Field-aware PRF unggul <b>{fs(h2b.delta)}</b> atas whole-table PRF, tetapi berubah <b>{fs(h2a.delta)}</b> dibanding hybrid tanpa PRF.
        </p>
      </div>

      <section className="card card-dark" id="rq1">
        <CardHead over="RQ1 · Performa" title="MRR@10 per metode">
          <select value={split} onChange={(e) => setSplit(e.target.value)} aria-label="Split">
            <option value="test">Test (554 kueri)</option>
            <option value="dev">Dev (465 kueri)</option>
          </select>
        </CardHead>
        <div className="legend">
          <span><i className="sw" style={{ background: 'var(--c1)' }} />Fusi RRF</span>
          <span><i className="sw" style={{ background: 'var(--c2)' }} />Cascade</span>
          <span><i className="sw" style={{ background: 'var(--c3)' }} />Retriever tunggal</span>
          <span><i className="dot" style={{ border: '1.5px solid var(--ink)' }} />Split lainnya</span>
        </div>
        <MethodChart summary={summary} split={split} />
        <p className="note">DPR dan SPLADE tidak dijalankan pada run final ini (lihat tabel RQ1 di slide).</p>
      </section>

      <section className="grid2" id="rq2">
        <div className="card">
          <CardHead over="RQ2 · Varian PRF" title="Dalam hybrid vs sparse saja" />
          <div className="legend">
            <span><i className="sw" style={{ background: 'var(--c1)' }} />+ RRF dengan Qwen3</span>
            <span><i className="sw" style={{ background: 'var(--c2)' }} />Sparse saja (BM25F + PRF)</span>
            <span><i className="sw" style={{ background: 'var(--ref)' }} />Garis: hybrid tanpa PRF</span>
          </div>
          <PrfChart summary={summary} />
        </div>
        <div className="card">
          <CardHead over="Uji hipotesis" title="Δ dengan CI 95%">
            <select value={metric} onChange={(e) => setMetric(e.target.value)} aria-label="Metrik">
              {['MRR@10', 'nDCG@10', 'Recall@1', 'Recall@10'].map((m) => <option key={m}>{m}</option>)}
            </select>
          </CardHead>
          <p className="note">Test set. Bootstrap per tabel gold; p Holm per keluarga (konfirmatori H1–H2b, ablasi H3a–c).</p>
          <ForestPlot hyps={hyps} metric={metric} />
        </div>
      </section>

      <section className="grid2" id="lambda">
        <div className="card">
          <CardHead over="Grid λ di dev" title="5.151 kombinasi (Σλ = 1)" />
          <p className="note">Setiap titik satu kombinasi λ title, header, cells; warna = MRR@10 dev. Lingkaran = λ terpilih (0,04; 0,32; 0,64).</p>
          <Ternary grid={grid} />
        </div>
        <div className="card">
          <CardHead over="Efek PRF" title="Posisi tabel gold di test" />
          <p className="note">Hybrid tanpa PRF vs dengan field-aware PRF.</p>
          <RankBuckets rows={moves.buckets} />
          <div className="mini-stats">
            <div className="tile"><div className="lab">Membaik</div><div className="big up">{moves.up}</div></div>
            <div className="tile"><div className="lab">Memburuk</div><div className="big down">{moves.down}</div></div>
            <div className="tile"><div className="lab">Rank 2–5 naik ke 1</div><div className="big">{moves.lifted} <span className="muted">dari {moves.pool}</span></div></div>
          </div>
        </div>
      </section>

      <section className="card card-flush" id="tabel">
        <CardHead over="Ringkasan" title="Semua metode · test" />
        <div className="tw">
          <table>
            <thead><tr><th>Metode</th><th>Kelompok</th><th className="r">R@1</th><th className="r">R@5</th><th className="r">R@10</th><th className="r">MRR@10</th><th className="r">nDCG@10</th></tr></thead>
            <tbody>
              {summary.filter((r) => r.split === 'test').sort((a, b) => b['MRR@10'] - a['MRR@10']).map((r) => (
                <tr key={r.method}>
                  <td>{r.method}</td><td>{r.group}</td>
                  {['Recall@1', 'Recall@5', 'Recall@10', 'MRR@10', 'nDCG@10'].map((k) => <td key={k} className="r">{f4(r[k])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <details className="card">
        <summary className="muted" style={{ cursor: 'pointer' }}>Definisi metrik dan catatan</summary>
        <p className="note" style={{ marginTop: 8 }}>
          MRR@10: rata-rata 1/peringkat tabel gold bila masuk 10 besar, selain itu 0. Recall@k: proporsi kueri dengan tabel gold di k besar. nDCG@10 dengan satu tabel gold per kueri.
          Hasil H2b sensitif terhadap resolusi grid λ: pada step 0,1 selisihnya +0,0018 (p Holm 0,41). Test pernah dilihat di revisi awal, jadi bukan holdout murni.
        </p>
      </details>
    </div>
  );
}
