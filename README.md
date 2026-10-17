# E-Library Admin Dashboard

Proyek ini dibuat untuk memenuhi tugas Milestone 1 sampai Milestone 3 dalam pengembangan antarmuka sistem informasi perpustakaan digital.

## Struktur folder
- `docs/PERANCANGAN.md` berisi perencanaan menu, ER-D, serta wireframe dan link Figma/Stitch
- `pages/` berisi halaman dashboard, master, form, dan laporan
- `assets/` berisi style dan script JavaScript

## Cara menjalankan
Buka file `index.html` secara langsung di browser, atau jalankan server lokal:

```bash
python -m http.server 8000
```

Lalu buka `http://localhost:8000`.

## Akses admin dan anggota
- Login admin demo: `admin@perpus.id` / `admin123`
- Anggota dapat mendaftar dan masuk melalui tab **Daftar Anggota** dan **Login Anggota** di halaman login.
- Anggota yang masuk dapat mengajukan buku dari portal anggota. Admin dapat menyetujui atau menolak permintaan melalui menu **Permintaan & Peminjaman**.
- Data autentikasi dan transaksi saat ini disimpan di `localStorage` browser untuk keperluan demo. Data tidak tersinkron antar-browser atau antarperangkat dan belum sesuai untuk penggunaan produksi.
