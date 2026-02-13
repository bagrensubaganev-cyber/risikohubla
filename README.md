
# Portal Profil Risiko Digital DJPL

Aplikasi manajemen profil risiko berbasis React yang terintegrasi langsung dengan Google Sheets sebagai basis data master.

## Fitur Utama
- **Advanced Dropdown**: Pencarian data cerdas yang sinkron dengan Spreadsheet.
- **Analisis AI**: Menggunakan Gemini AI untuk menganalisis tren risiko.
- **Ekspor Data**: Download rekap draf ke format Excel atau cetak PDF secara instan.
- **Authentication**: Keamanan akses unit kerja dengan sistem password.
- **Cloud Sync**: Pengiriman data draft lokal ke Google Sheets via Apps Script.

## Persiapan Lokal
1. Install dependencies: `npm install`
2. Jalankan mode pengembangan: `npm run dev`
3. Bangun untuk produksi: `npm run build`

## Konfigurasi API
Aplikasi membutuhkan variabel lingkungan `API_KEY` untuk menjalankan fitur AI Gemini. Jika menggunakan Vercel, tambahkan `API_KEY` di tab Environment Variables.
