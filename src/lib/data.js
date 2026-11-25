import { useEffect, useState } from 'react';
import * as d3 from 'd3';

// Semua file data ada di public/data; BASE_URL membuat path tetap benar di subfolder.
const base = import.meta.env.BASE_URL;
const cache = new Map();

export function loadJSON(name) {
  if (!cache.has(name)) {
    cache.set(name, fetch(`${base}data/${name}`).then((r) => {
      if (!r.ok) throw new Error(`Gagal memuat ${name} (${r.status})`);
      return r.json();
    }));
  }
  return cache.get(name);
}

export function useData(names) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const key = names.join('|');
  useEffect(() => {
    let live = true;
    Promise.all(names.map(loadJSON))
      .then((arr) => live && setState({ status: 'ok', data: arr, error: null }))
      .catch((e) => live && setState({ status: 'error', data: null, error: e.message }));
    return () => { live = false; };
  }, [key]);
  return state;
}

export function useWidth(ref) {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

export const f4 = d3.format('.4f');
export const fs = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + d3.format('.4f')(Math.abs(v));
export const f3 = d3.format('.3f');
export const pct = d3.format('.1%');

export const row = (rows, split, method) => rows.find((r) => r.split === split && r.method === method);
export const hyp = (rows, h, split = 'test', metric = 'MRR@10') => rows.find((r) => r.split === split && r.hyp === h && r.metric === metric);
