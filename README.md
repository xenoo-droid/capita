# 🎓 KapitalKula - Simple Capital Allocation & Money Manager Mahasiswa

Tools manajemen keuangan dan alokasi modal praktis untuk anak kuliahan. Didesain **mobile-first & responsive**, sehingga nyaman dipakai di layar Laptop maupun Smartphone (HP).

---

## 🌟 Fitur Utama

1. **Capital Allocation (Pembagian Pos Anggaran)**
   - Masukkan total uang saku per periode (misal: Rp 1.500.000).
   - Template siap pakai khusus mahasiswa:
     - **Anak Kos Realistis**: 50% Makan & Kos, 20% Kuliah & Internet, 15% Nongkrong, 15% Tabungan & Darurat.
     - **Rule 50/30/20**: 50% Needs, 30% Wants, 20% Savings.
     - **Mode Survival/Hemat**: 65% Pokok, 10% Hiburan, 25% Tabungan.
     - **Simpel 3 Pos**: 60% Harian, 25% Jajan, 15% Cadangan.
   - Pos alokasi fleksibel: bisa tambah pos baru, ubah persentase, ganti nama, dan sesuaikan warna indikator.

2. **Dukungan Multi-Siklus Fleksibel**
   - **Siklus Mingguan Fleksibel**: 1 Minggu, 2 Minggu (*dwi-mingguan*), 3 Minggu, atau 4 Minggu sekali dengan tanggal mulai siklus.
   - **Siklus Harian & Kustom N-Hari**: Budgeting harian (1 hari), 3 hari, 5 hari, 10 hari, atau input angka hari bebas sesuka hati.
   - **Siklus Bulanan**: Pilihan tanggal kiriman ortu/gaji magang (contoh: tanggal 1 atau tanggal 25).

3. **Catat Transaksi: Pengeluaran & Pemasukan Tambahan (Uang Kaget / Rezeki)**
   - **Pencatatan Pengeluaran**: Pengurangan kuota pos otomatis dengan quick chips (+10k, +15k, +25k, +50k).
   - **Pencatatan Pemasukan Tambahan**:
     - Bila ada uang dadakan (freelance, beasiswa, hadiah, jualan barang bekas).
     - **Opsi Alokasi Pemasukan**:
       - ⚖️ *Bagi Otomatis*: Uang masuk dibagi proporsional ke semua pos sesuai formula persentase anggaran.
       - 🎯 *Alokasi Langsung*: Uang masuk 100% menambah kuota pos tertentu (misal langsung masuk ke Tabungan atau Kebutuhan).
   - **Filter Transaksi**: Filter berdasarkan jenis (Semua / Pengeluaran / Pemasukan) dan berdasarkan pos alokasi.

4. **Visualisasi Interaktif (Chart.js)**
   - **Pie / Doughnut Chart**: Menampilkan proporsi alokasi rencana (dengan penyesuaian pemasukan) vs realisasi pengeluaran sesungguhnya.
   - **Bar Chart**: Perbandingan berdampingan antara *Budget Alokasi* vs *Realisasi Terpakai* per pos.
   - **Warning Overbudget**: Pos yang melebihi alokasi otomatis ditandai merah (*overbudget*).

5. **Indikator "Batas Aman Harian" (Safe Daily Spend)**
   - Menghitung otomatis sisa uang yang boleh dibelanjakan per hari sampai siklus berikutnya tiba, agar terhindar dari tanggal tua tanpa uang.

6. **Penyimpanan Lokal & Backup Cross-Device**
   - Data otomatis tersimpan di browser (`localStorage`).
   - Ekspor dan Impor file `.json` untuk memindahkan data dari laptop ke HP atau sebaliknya.

---

## 🚀 Akses Online Langsung (GitHub Pages)

Web app ini sudah terhubung dan live di GitHub Pages:
👉 📱 [**https://xenoo-droid.github.io/capita/**](https://xenoo-droid.github.io/capita/)

Di HP (Chrome/Safari), kamu cukup buka tautan di atas dan pilih **"Add to Home Screen"** agar menjadi aplikasi di layar HP kamu.
