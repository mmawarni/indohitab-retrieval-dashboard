# IndoHiTab Retrieval · Dashboard & Demo

Dashboard hasil mini riset **Sparse–Dense Hybrid Table Retrieval dengan Field-Aware PRF** dan demo interaktifnya.
Dibangun dengan Vite + React + d3. Hasil build berupa situs statis, jadi bisa di-hosting di mana saja (Vercel, Netlify, GitHub Pages, server kampus).

## Isi

| Tab | Isi |
|---|---|
| Dashboard hasil | Kartu H1/H2a/H2b, MRR@10 per metode (dev/test), varian PRF, forest plot H1–H3c (MRR@10, nDCG@10, Recall@1, Recall@10), grid λ 5.151 kombinasi, posisi tabel gold, tabel semua metode |
| Demo kueri benchmark | 1.019 kueri dev/test: peringkat BM25F, Qwen3, RRF, 5 tabel feedback, term ekspansi per field, peringkat akhir semua varian PRF |
| Try query | BM25F + field-aware PRF dijalankan di browser atas 600 tabel, dengan slider λ judul/header/sel |

Tab dapat dibuka langsung lewat URL: `#dashboard`, `#demo`, `#coba`.

## Menjalankan

Butuh Node.js 18 atau lebih baru.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # hasil di folder dist/
npm run preview    # cek hasil build di http://localhost:4173
```

## Hosting

Yang di-hosting hanya isi folder `dist/` (sudah ada di zip ini, atau buat ulang dengan `npm run build`).
`vite.config.js` memakai `base: './'`, jadi situs jalan di root domain maupun subfolder.

- **Vercel**: import repo, framework *Vite*, build command `npm run build`, output `dist`.
- **Netlify**: build command `npm run build`, publish directory `dist`. Atau seret folder `dist/` ke app.netlify.com/drop.
- **GitHub Pages**: `npm run build`, lalu unggah isi `dist/` ke branch `gh-pages` (misalnya dengan `npx gh-pages -d dist`).
- **Server sendiri**: salin isi `dist/` ke folder web (nginx/Apache). Tidak perlu backend.

## Data

Semua data ada di `public/data/` dan ikut tersalin ke `dist/data/` saat build:

| File | Sumber |
|---|---|
| `summary.json` | `summary_20261124_103150.csv` (run final, grid λ step 0,01) |
| `hypotheses.json` | baris H1–H3c dari `paired_deltas_20261124_103150.csv` |
| `lambda_grid.json` | `prf_lambda_dev_grid_20261124_103150.csv` (kolom: t, h, c, MRR@10 dev, terpilih) |
| `queries.json` | `query_level_20261124_103150.csv`: peringkat gold, tabel feedback, term ekspansi |
| `tables.json` | judul dan token per field (judul, header, sel) dari `tables.json` IndoHiTab |

Untuk memakai run lain, ganti file di `public/data/` dengan format yang sama lalu build ulang.

## Catatan

- Angka pada tab *Dashboard* dan *Demo kueri benchmark* berasal langsung dari file hasil eksperimen.
- Tab *Try query* adalah pendekatan: hanya sisi sparse (Qwen3 tidak berjalan di browser), dan field tabel direkonstruksi dari `tables.json`, sehingga peringkat BM25F sama dengan eksperimen pada sekitar 90% kueri test.
- Test pernah dilihat di revisi awal eksperimen, jadi bukan holdout murni. Hasil H2b sensitif terhadap resolusi grid λ (step 0,1: +0,0018, p Holm 0,41).
