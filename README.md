# 👕 OutfitBot — AI Fashion Assistant

OutfitBot adalah chatbot berbasis **LangChain + Groq** yang membantu pengguna menentukan outfit yang sesuai dengan kondisi cuaca dan lokasi mereka. Bot ini terintegrasi dengan **Discord API**, **PostgreSQL**, dan **OpenWeatherMap API**, sehingga dapat berinteraksi secara langsung melalui Discord dan memberikan rekomendasi outfit yang kontekstual.

---

## 🚀 Setup & Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/outfitbot.git
cd outfitbot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment Variables

Buat file `.env` di root project berdasarkan contoh berikut:

```
DISCORD_TOKEN=your_discord_bot_token_here
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/outfitbot_db
WEATHER_API_KEY=your_weather_api_key_here
```

### 4. Jalankan Bot

Untuk menjalankan bot di mode pengembangan:

```bash
node src/index.js
```

Untuk menjalankan pengujian:

```bash
npm run test:win   # (Windows)
# atau
npm test           # (Linux/Mac)
```

---

## 💡 Integrasi Sistem

OutfitBot memanfaatkan beberapa komponen utama:

* **Discord API**: Sebagai platform interaksi utama. Pesan dari pengguna di Discord diterima melalui event `messageCreate` dan diteruskan ke modul `agent.js`.
* **LangChain + Groq**: Mengelola alur percakapan dan pemanggilan model LLM (LLaMA 3.3 70B) untuk menghasilkan respons yang relevan dengan konteks dan data cuaca.
* **PostgreSQL**: Menyimpan riwayat percakapan pengguna agar sesi percakapan bersifat kontekstual dan berkelanjutan.
* **OpenWeatherMap API**: Mengambil data cuaca real-time berdasarkan lokasi pengguna untuk menyesuaikan rekomendasi outfit.

Setiap pesan dari pengguna akan diproses oleh fungsi `askLLM()` yang memanggil LLM Groq melalui LangChain. Jika terdeteksi nama lokasi, fungsi `getWeatherData()` akan mengambil informasi cuaca menggunakan Weather API. Hasil kombinasi dari konteks percakapan dan cuaca digunakan untuk menghasilkan rekomendasi outfit yang personal.

---

## 🧩 Struktur Folder

```
📦 outfitbot
├── src
│   ├── agent.js          # Logika utama chatbot & integrasi API
│   ├── db.js             # Koneksi PostgreSQL
│   ├── logs/chat.log     # Catatan percakapan
│   └── index.js          # Entry point Discord bot
├── tests
│   ├── agent.test.js     # Pengujian fungsi chatbot & integrasi API
│   └── db.test.js        # Pengujian koneksi database
├── .env.example          # Contoh konfigurasi environment
├── package.json
└── README.md
```

---

## 🎥 Demo

Berikut contoh tampilan interaksi OutfitBot di Discord:

![Demo Screenshot](https://drive.google.com/uc?id=16b0VXaPGRl7hMrowqizeKZ6pbrTqpTnW)
![Demo Screenshot](https://drive.google.com/uc?id=1KvTI2cNlOgPkokgzu6WeZVg7rOWFPH5t)
---

## 🧠 Teknologi yang Digunakan

* **Node.js** + **discord.js**
* **LangChain** (untuk pengelolaan alur percakapan)
* **Groq LLM (LLaMA 3.3 70B)**
* **PostgreSQL** (penyimpanan riwayat chat)
* **OpenWeatherMap API** (data cuaca)
* **Jest** (pengujian otomatis)

---
