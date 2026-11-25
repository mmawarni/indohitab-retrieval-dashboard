import { useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { f4, fs, f3, pct, useWidth } from '../lib/data.js';

function useTip() {
  const [tip, setTip] = useState(null);
  const show = (e, box, lines) => {
    const r = box.current.getBoundingClientRect();
    setTip({ x: Math.min(e.clientX - r.left + 12, r.width - 200), y: e.clientY - r.top - 10, lines });
  };
  const el = tip && (
    <div className="tip" style={{ left: Math.max(0, tip.x), top: Math.max(0, tip.y) }}>
      {tip.lines.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  );
  return [el, show, () => setTip(null)];
}

function XAxis({ x, y, ticks, fmt }) {
  return (
    <g className="axis" transform={`translate(0,${y})`}>
      <line x1={x.range()[0]} x2={x.range()[1]} />
      {x.ticks(ticks).map((t) => (
        <g key={t} transform={`translate(${x(t)},0)`}>
          <line y2={5} />
          <text y={18} textAnchor="middle">{fmt(t)}</text>
        </g>
      ))}
    </g>
  );
}

const GROUP_COLOR = { RRF: 'var(--c1)', Cascade: 'var(--c2)', Tunggal: 'var(--c3)' };

export function MethodChart({ summary, split }) {
  const box = useRef(null);
  const W = useWidth(box);
  const [tipEl, show, hide] = useTip();
  const other = split === 'test' ? 'dev' : 'test';
  const rows = useMemo(() => summary.filter((r) => r.split === split && r.group !== 'PRF').map((r) => ({
    m: r.method, g: r.group, v: r['MRR@10'],
    o: (summary.find((s) => s.split === other && s.method === r.method) || {})['MRR@10'],
  })).sort((a, b) => b.v - a.v), [summary, split]);
  const mL = W < 520 ? 140 : 190, mR = 70, rowH = 32, H = rows.length * rowH + 34;
  const x = d3.scaleLinear().domain([0.6, 0.8]).range([mL, Math.max(mL + 50, W - mR)]);
  const clamp = (v) => x(Math.max(0.6, v));
  return (
    <div className="chart" ref={box}>
      {W > 0 && (
        <svg height={H} role="img" aria-label={`MRR@10 per metode, split ${split}`}>
          <XAxis x={x} y={rows.length * rowH + 6} ticks={Math.max(2, Math.floor((W - mL - mR) / 90))} fmt={d3.format('.2f')} />
          {rows.map((r, i) => (
            <g key={r.m} transform={`translate(0,${i * rowH + 4})`} onPointerMove={(e) => show(e, box, [`${r.m} (${r.g})`, `${split}: ${f4(r.v)}`, `${other}: ${r.o != null ? f4(r.o) : '—'}`])} onPointerLeave={hide}>
              <text x={mL - 8} y={rowH * 0.45 + 4} textAnchor="end">{r.m}</text>
              <rect x={x(0.6)} y={4} width={Math.max(0, clamp(r.v) - x(0.6))} height={rowH - 12} rx={2} fill={GROUP_COLOR[r.g]} />
              {r.o != null && <circle cx={clamp(r.o)} cy={rowH * 0.45} r={4} fill="var(--panel)" stroke="var(--ink)" strokeWidth={1.5} />}
              <text x={clamp(Math.max(r.v, r.o ?? 0)) + 8} y={rowH * 0.45 + 4}>{f4(r.v)}</text>
            </g>
          ))}
        </svg>
      )}
      {tipEl}
    </div>
  );
}

const ARMS = [
  ['RM3', 'PRF arm 2: RM3'], ['Whole-table', 'PRF arm 3: Whole-table PRF'], ['Field bobot sama', 'PRF arm 4: Equal-weight field PRF'],
  ['Field-aware (usulan)', 'PRF arm 5: Field-aware PRF'], ['Field-aware + IDF', 'PRF arm 6: Field-aware PRF + field-IDF'],
];

export function PrfChart({ summary, split = 'test' }) {
  const box = useRef(null);
  const W = useWidth(box);
  const [tipEl, show, hide] = useTip();
  const get = (m) => (summary.find((r) => r.split === split && r.method === m) || {})['MRR@10'];
  const rows = ARMS.map(([lab, k]) => ({ lab, rrf: get(`${k} + RRF`), sp: get(`${k} [sparse only]`) }));
  const base = get('PRF arm 1: No PRF + RRF');
  const mL = 150, mR = 60, rowH = 54, H = rows.length * rowH + 34;
  const x = d3.scaleLinear().domain([0.62, 0.78]).range([mL, Math.max(mL + 50, W - mR)]);
  const bh = (rowH - 14) / 2;
  return (
    <div className="chart" ref={box}>
      {W > 0 && (
        <svg height={H} role="img" aria-label="MRR@10 varian PRF dalam hybrid dan sparse saja">
          <XAxis x={x} y={rows.length * rowH + 6} ticks={Math.max(2, Math.floor((W - mL - mR) / 80))} fmt={d3.format('.2f')} />
          {rows.map((r, i) => (
            <g key={r.lab} transform={`translate(0,${i * rowH + 4})`}>
              <text x={mL - 8} y={rowH / 2} textAnchor="end">{r.lab}</text>
              {[['rrf', 'var(--c1)', '+ RRF'], ['sp', 'var(--c2)', 'sparse saja']].map(([k, c, nm], j) => (
                <g key={k} onPointerMove={(e) => show(e, box, [`${r.lab} · ${nm}`, `MRR@10 ${f4(r[k])}`, `Hybrid tanpa PRF ${f4(base)}`])} onPointerLeave={hide}>
                  <rect x={x(0.62)} y={4 + j * (bh + 2)} width={Math.max(0, x(r[k]) - x(0.62))} height={bh} rx={2} fill={c} />
                  <text x={x(r[k]) + 5} y={4 + j * (bh + 2) + bh / 2 + 4}>{f4(r[k])}</text>
                </g>
              ))}
            </g>
          ))}
          {base != null && <line x1={x(base)} x2={x(base)} y1={0} y2={rows.length * rowH + 6} stroke="var(--ref)" strokeDasharray="4 3" />}
        </svg>
      )}
      {tipEl}
    </div>
  );
}

const HLAB = { H1: 'H1 hybrid vs Qwen3', H2a: 'H2a FA vs tanpa PRF', H2b: 'H2b FA vs whole-table', H3a: 'H3a field vs whole', H3b: 'H3b λ tuning vs sama', H3c: 'H3c IDF per field' };

export function ForestPlot({ hyps, split = 'test', metric = 'MRR@10' }) {
  const box = useRef(null);
  const W = useWidth(box);
  const [tipEl, show, hide] = useTip();
  const rows = Object.keys(HLAB).map((h) => hyps.find((r) => r.split === split && r.hyp === h && r.metric === metric)).filter(Boolean);
  const mL = 165, mR = 72, rowH = 40, H = rows.length * rowH + 34;
  const lo = Math.min(-0.015, d3.min(rows, (r) => r.ci_lo)), hi = Math.max(0.02, d3.max(rows, (r) => r.ci_hi));
  const x = d3.scaleLinear().domain([lo, hi]).nice().range([mL, Math.max(mL + 50, W - mR)]);
  const col = (r) => (r.p_holm < 0.05 ? (r.delta > 0 ? 'var(--green)' : 'var(--red)') : 'var(--muted)');
  return (
    <div className="chart" ref={box}>
      {W > 0 && (
        <svg height={H} role="img" aria-label={`Selisih ${metric} dan CI 95% untuk H1 sampai H3c, split ${split}`}>
          <XAxis x={x} y={rows.length * rowH + 6} ticks={Math.max(2, Math.floor((W - mL - mR) / 70))} fmt={d3.format('+.2f')} />
          <line x1={x(0)} x2={x(0)} y1={0} y2={rows.length * rowH + 6} stroke="var(--ref)" />
          {rows.map((r, i) => (
            <g key={r.hyp} transform={`translate(0,${i * rowH + rowH / 2})`} onPointerMove={(e) => show(e, box, [HLAB[r.hyp], `Δ ${fs(r.delta)} · CI [${fs(r.ci_lo)}; ${fs(r.ci_hi)}]`, `p ${f3(r.p_value)} · p Holm ${f3(r.p_holm)}`])} onPointerLeave={hide}>
              <rect x={0} y={-rowH / 2} width={W} height={rowH} fill="transparent" />
              <text x={mL - 8} y={4} textAnchor="end">{HLAB[r.hyp]}</text>
              <line x1={x(r.ci_lo)} x2={x(r.ci_hi)} stroke={col(r)} strokeWidth={2} />
              <circle cx={x(r.delta)} r={5} fill={col(r)} />
              <text x={x(r.ci_hi) + 6} y={4}>{fs(r.delta)}</text>
            </g>
          ))}
        </svg>
      )}
      {tipEl}
    </div>
  );
}

export function Ternary({ grid }) {
  const box = useRef(null);
  const W = useWidth(box);
  const [tipEl, show, hide] = useTip();
  const pts = useMemo(() => grid.rows.map(([t, h, c, v, s]) => ({ t, h, c, v, sel: !!s })), [grid]);
  const side = Math.max(120, Math.min(W - 40, 440)), hgt = (side * Math.sqrt(3)) / 2, ox = (W - side) / 2, oy = 26;
  const P = (p) => [ox + side * (p.c + p.t * 0.5), oy + hgt * (1 - p.t)];
  const ext = d3.extent(pts, (p) => p.v);
  const col = d3.scaleSequential(d3.interpolateViridis).domain(ext);
  const del = useMemo(() => (W > 0 ? d3.Delaunay.from(pts, (p) => P(p)[0], (p) => P(p)[1]) : null), [pts, W]);
  const sel = pts.find((p) => p.sel);
  const r = Math.max(1.6, side / 260);
  const onMove = (e) => {
    const b = box.current.getBoundingClientRect();
    const p = pts[del.find(e.clientX - b.left, e.clientY - b.top)];
    if (p) show(e, box, [`λ (${[p.t, p.h, p.c].map((v) => v.toFixed(2)).join('; ')})`, `MRR@10 dev ${f4(p.v)}${p.sel ? ' · terpilih' : ''}`]);
  };
  return (
    <div className="chart" ref={box}>
      {W > 0 && (
        <svg height={hgt + oy + 64} role="img" aria-label="Segitiga grid λ title, header, cells berwarna MRR@10 dev" onPointerMove={onMove} onPointerLeave={hide}>
          <path d={`M${ox},${oy + hgt}L${ox + side},${oy + hgt}L${ox + side / 2},${oy}Z`} fill="none" stroke="var(--line)" />
          {pts.map((p, i) => { const [cx, cy] = P(p); return <circle key={i} cx={cx} cy={cy} r={r} fill={col(p.v)} />; })}
          {sel && <circle cx={P(sel)[0]} cy={P(sel)[1]} r={8} fill="none" stroke="var(--ink)" strokeWidth={2} />}
          <text x={ox + side / 2} y={oy - 9} textAnchor="middle">title = 1</text>
          <text x={ox} y={oy + hgt + 18}>header = 1</text>
          <text x={ox + side} y={oy + hgt + 18} textAnchor="end">cells = 1</text>
          <g transform={`translate(${ox},${oy + hgt + 34})`}>
            {d3.range(0, 1.0001, 0.05).map((f) => <rect key={f} x={f * side * 0.95} width={side * 0.05 + 1} height={8} fill={col(ext[0] + f * (ext[1] - ext[0]))} />)}
            <text y={24}>{f4(ext[0])}</text>
            <text x={side} y={24} textAnchor="end">{f4(ext[1])}</text>
          </g>
        </svg>
      )}
      {tipEl}
    </div>
  );
}

const BUCKETS = [['r1', 'Rank 1', 'var(--c1)'], ['r2', 'Rank 2–5', 'var(--c2)'], ['r6', 'Rank 6–10', 'var(--ref)'], ['out', 'Di luar 10', 'var(--muted)']];

export function RankBuckets({ rows }) {
  const box = useRef(null);
  const W = useWidth(box);
  const mL = 130, bh = 30;
  const x = d3.scaleLinear().domain([0, 1]).range([mL, Math.max(mL + 50, W - 6)]);
  return (
    <div className="chart" ref={box}>
      {W > 0 && (
        <svg height={rows.length * 46 + 4} role="img" aria-label="Proporsi posisi tabel gold di test, tanpa dan dengan PRF">
          {rows.map((r, i) => {
            let acc = 0;
            return (
              <g key={r.system} transform={`translate(0,${i * 46 + 4})`}>
                <text y={bh / 2 + 4}>{r.system}</text>
                {BUCKETS.map(([k, , c]) => {
                  const x0 = x(acc); acc += r[k];
                  return (
                    <g key={k}>
                      <rect x={x0} width={Math.max(0, x(acc) - x0)} height={bh} fill={c} />
                      {r[k] > 0.08 && <text x={x0 + 5} y={bh / 2 + 4} style={{ fill: '#fff' }}>{pct(r[k])}</text>}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      )}
      <div className="legend">{BUCKETS.map(([k, l, c]) => <span key={k}><i className="sw" style={{ background: c }} />{l}</span>)}</div>
    </div>
  );
}
