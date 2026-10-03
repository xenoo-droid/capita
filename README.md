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

2. **Dukungan Multi-Siklus (Fleksibel)**
   - **Siklus Bulanan**: Atur tanggal terima kiriman ortu/gaji magang (contoh: tanggal 1 atau tanggal 25).
   - **Siklus Mingguan**: Atur uang saku per minggu (contoh: mulai setiap hari Senin).

3. **Expense Tracker Harian**
   - Catat pengeluaran harian dengan cepat (+10k, +15k, +25k, +50k quick chips).
   - Otomatis mengurangi kuota pos anggaran terkait.
   - Filter riwayat pengeluaran berdasarkan pos alokasi.

4. **Visualisasi Interaktif (Chart.js)**
   - **Pie / Doughnut Chart**: Menampilkan proporsi alokasi rencana vs realisasi pengeluaran sesungguhnya.
   - **Bar Chart**: Perbandingan berdampingan antara *Budget Alokasi* vs *Realisasi Terpakai* per pos.
   - **Warning Overbudget**: Pos yang melebihi alokasi otomatis ditandai merah (*overbudget*).

5. **Indikator "Batas Aman Harian" (Safe Daily Spend)**
   - Menghitung otomatis sisa uang yang boleh dibelanjakan per hari sampai siklus berikutnya tiba, agar terhindar dari tanggal tua tanpa uang.

6. **Penyimpanan Lokal & Backup Cross-Device**
   - Data otomatis tersimpan di browser (`localStorage`).
   - Ekspor dan Impor file `.json` untuk memindahkan data dari laptop ke HP atau sebaliknya.

---

## 🚀 Cara Menjalankan & Membuka di Laptop & HP

### Opsi A: Menggunakan Script Python (Laptop & HP Satu WiFi / Hotspot)
1. Buka PowerShell / Terminal di folder ini:
   ```bash
   python serve.py
   ```
2. Browser laptop akan terbuka otomatis di `http://localhost:8080`.
3. Di terminal akan muncul alamat IP LAN (contoh: `http://192.168.1.15:8080`).
4. Buka alamat tersebut di browser Chrome/Safari pada smartphone (HP) kamu!
5. **Tip di HP**: Ketuk titik tiga di Chrome -> pilih **"Tambahkan ke Layar Utama" (Add to Home Screen)** agar menjadi seperti aplikasi native tanpa instalasi toko aplikasi.

---

### Opsi B: Buka Langsung File HTML (Laptop Saja)
Klik ganda file `index.html` langsung di file explorer untuk membukanya di browser laptop tanpa perlu menjalankan server.

---

### Opsi C: Pasang Gratis di GitHub Pages atau Vercel (Online 24/7 di HP Tanpa Laptop)
Karena web app ini murni HTML, CSS, dan JavaScript tanpa backend database yang rumit:
- **GitHub Pages**: Buat repository baru di GitHub -> upload seluruh file folder ini -> aktifkan GitHub Pages di menu Settings.
- **Vercel / Netlify**: Drag & drop folder ini ke dashboard Vercel/Netlify.
- Kamu akan mendapatkan URL publik gratis (misal: `https://kapitalkula.vercel.app`) yang bisa kamu buka kapan saja di HP!
