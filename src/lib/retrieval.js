// BM25F + field-aware PRF di browser, mengikuti baseline_v10d (FieldBM25 dan feedback_terms).
// Field tabel direkonstruksi dari tables.json IndoHiTab, jadi peringkat bisa sedikit berbeda
// dari eksperimen (sekitar 90% sama untuk BM25F pada kueri test).

export const STOPWORDS = new Set(
  'ada and antara atau dalam dan dari dengan di ini ke lain menurut oleh pada saat sampai sebagai sebelum secara setidaknya tanpa terhadap tidak untuk ya yang'.split(' '),
);
const TOKEN = /[\p{L}\p{N}_]+(?:[.,:/%-][\p{L}\p{N}_]+)*/gu;
export const tokenize = (s) => String(s).toLowerCase().match(TOKEN) || [];
export const FIELDS = ['title', 'header', 'cells'];

export function buildIndex(tables, { weights = [4, 4, 1], b = 0.75, k1 = 1.5 } = {}) {
  const N = tables.length;
  const sums = [0, 0, 0];
  const df = new Map();
  const docs = tables.map((t) => {
    const len = t.f.map((m) => Object.values(m).reduce((a, c) => a + c, 0));
    len.forEach((l, i) => (sums[i] += l));
    const seen = new Set();
    t.f.forEach((m) => Object.keys(m).forEach((w) => seen.add(w)));
    seen.forEach((w) => df.set(w, (df.get(w) || 0) + 1));
    return { ...t, len };
  });
  const avg = sums.map((s) => s / N);
  const cache = new Map();
  const idf = (w) => { const d = df.get(w) || 0; return Math.log1p((N - d + 0.5) / (d + 0.5)); };

  function termScores(w) {
    if (cache.has(w)) return cache.get(w);
    const out = new Float64Array(N);
    if (df.has(w)) {
      const iw = idf(w);
      docs.forEach((t, d) => {
        let tf = 0;
        for (let i = 0; i < 3; i++) {
          const c = t.f[i][w];
          if (c && avg[i] > 0) tf += (weights[i] * c) / (1 - b + (b * t.len[i]) / avg[i]);
        }
        if (tf > 0) out[d] = (iw * tf * (k1 + 1)) / (tf + k1);
      });
    }
    cache.set(w, out);
    return out;
  }

  function score(tokens) {
    const s = new Float64Array(N);
    tokens.forEach((w) => { const t = termScores(w); for (let d = 0; d < N; d++) s[d] += t[d]; });
    return s;
  }

  // raw_f(t) = Σ_feedback 1/log2(rank+1) · min(tf,3)/√len_f · idf(t);  skor(t) = Σ_f λ_f · raw_f(t) / Z_f (topn)
  function prfTerms(query, ranking, lambdas, { feedbackDocs = 5, nTerms = 15 } = {}) {
    const qt = new Set(tokenize(query));
    const raw = [new Map(), new Map(), new Map()];
    ranking.slice(0, feedbackDocs).forEach((d, r) => {
      const fac = 1 / Math.log2(r + 2);
      docs[d].f.forEach((m, i) => {
        if (!lambdas[i] || !docs[d].len[i]) return;
        const nrm = Math.sqrt(docs[d].len[i]);
        for (const [w, tf] of Object.entries(m)) {
          if (qt.has(w) || STOPWORDS.has(w)) continue;
          const id = Math.log(1 + (N + 1) / ((df.get(w) || 0) + 1));
          raw[i].set(w, (raw[i].get(w) || 0) + (fac * Math.min(tf, 3) / nrm) * id);
        }
      });
    });
    const lsum = lambdas.reduce((a, c) => a + c, 0) || 1;
    const tot = new Map();
    const byField = new Map();
    raw.forEach((m, i) => {
      if (!m.size) return;
      const z = [...m.values()].sort((a, c) => c - a).slice(0, nTerms).reduce((a, c) => a + c, 0);
      if (z <= 0) return;
      for (const [w, v] of m) {
        const c = ((lambdas[i] / lsum) * v) / z;
        tot.set(w, (tot.get(w) || 0) + c);
        const f = byField.get(w) || [0, 0, 0];
        f[i] += c;
        byField.set(w, f);
      }
    });
    const sel = [...tot.entries()].sort((a, c) => c[1] - a[1] || (a[0] < c[0] ? -1 : 1)).slice(0, nTerms);
    const norm = sel.reduce((a, [, v]) => a + v, 0) || 1;
    return sel.map(([w, v]) => { const f = byField.get(w); return [w, v / norm, FIELDS[f.indexOf(Math.max(...f))]]; });
  }

  function expand(base, terms, weight = 1) {
    const s = Float64Array.from(base);
    terms.forEach(([w, v]) => { const t = termScores(w); for (let d = 0; d < N; d++) s[d] += weight * v * t[d]; });
    return s;
  }

  const rank = (scores) => Array.from(scores.keys()).sort((a, c) => scores[c] - scores[a] || a - c);

  return { docs, N, score, prfTerms, expand, rank };
}
