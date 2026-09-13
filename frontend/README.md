# 🚀 NexusOCR — Multilingual Document OCR & Extraction Pipeline

![NexusOCR Banner](https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80)

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple.svg)](https://vitejs.dev/)
[![Tesseract.js](https://img.shields.io/badge/Tesseract.js-OCR-emerald.svg)](https://tesseract.projectnaptha.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> A modern, classy, light-themed web application and pipeline engine for extracting structured data, key-value entities, and borderless tables from multilingual documents across 100+ languages and complex scripts.

---

## ✨ Key Features

- **🌐 Universal Multi-Script OCR**:
  - Native recognition across **Latin** (English, German, Spanish, French), **Devanagari** (Hindi, Marathi), **Arabic (RTL)**, **CJK** (Japanese, Chinese), and **Cyrillic**.
- **🔍 Deep Extraction Inspector**:
  - **Named Entity Recognition (NER)**: Automatic extraction of dates, tax IDs, invoice numbers, amounts, and demographic fields with statistical confidence indicators.
  - **Table Structure Extractor**: Borderless and tabular grid extraction with 1-click **Export to CSV**.
  - **Text-to-Speech (TTS)**: Built-in audio reader for extracted document text.
  - **Neural Machine Translation**: Side-by-side translation into 30+ target languages.
  - **REST API Payload**: Formatted JSON response ready for enterprise pipelines.
- **📄 Interactive Visual Studio**:
  - Dual-pane layout with zoom, pan, animated laser scanline, and toggleable interactive **bounding box overlays**.
  - Includes real-world multilingual document presets (German invoice, Hindi medical discharge, Arabic residency card, Japanese corporate tax certificate, Spanish deed).
  - Client-side custom file uploader with live Tesseract.js OCR.
- **⚡ High-Throughput Batch Queue**:
  - Parallel multi-document ingestion queue with live progress simulation and bulk archive download.
- **🔐 Complete Authentication Suite**:
  - **Register Page**: Password strength meter, role picker, and clean SaaS layout.
  - **Login Page**: 1-Click demo logins for both Regular User and Super Administrator.
  - **Forgot Password**: 3-step interactive OTP recovery wizard.
- **🛡️ Admin Console**:
  - GPU worker node telemetry (VRAM, temps, load).
  - Multilingual model switchboard and confidence thresholds.
  - User and team management with status controls.
  - Live security and telemetry event stream.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Vanilla CSS Design System (Light-mode SaaS aesthetic, glassmorphism, hairline borders, smooth keyframe animations)
- **Icons**: Lucide React
- **OCR Engine**: Tesseract.js client engine + simulated multi-stage vision transformer pipeline
- **Effects**: Canvas Confetti

---

## 🚀 Quick Start

### 1. Clone the repository:
```bash
git clone https://github.com/Devsanghvi1514/NEXUS.git
cd NEXUS
```

### 2. Install dependencies:
```bash
npm install
```

### 3. Run the development server:
```bash
npm run dev
```

Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

### 4. Build for production:
```bash
npm run build
```

---

## 📁 Project Structure

```
NEXUS/
├── public/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx        # Standing left vertical navigation sidebar
│   │   ├── Navbar.jsx         # Header & dropdown module selector
│   │   ├── Footer.jsx         # Overview page multi-column footer
│   │   └── Toast.jsx          # Notification toast provider
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── RegisterPage.jsx       # Registration with password strength visualizer
│   │   │   ├── LoginPage.jsx          # Login with 1-click demo logins
│   │   │   └── ForgotPasswordPage.jsx # 3-step OTP recovery wizard
│   │   ├── Dashboard/
│   │   │   ├── OcrPipelineDashboard.jsx # Interactive OCR Studio workbench
│   │   │   ├── BatchProcessor.jsx       # Multi-file queue processing
│   │   │   ├── HistoryPage.jsx          # Searchable extraction audit logs
│   │   │   └── ApiDocsPage.jsx          # Interactive REST API & code snippets
│   │   ├── Admin/
│   │   │   └── AdminDashboard.jsx     # Telemetry, user & model controls
│   │   └── LandingPage.jsx            # Product showcase & architecture
│   ├── data/
│   │   └── sampleDocuments.js         # Multilingual document presets & languages
│   ├── utils/
│   │   └── ocrEngine.js               # Client-side Tesseract.js OCR handler
│   ├── App.jsx                        # Main routing & authentication controller
│   ├── index.css                      # Design system, CSS variables & animations
│   └── main.jsx                       # React root entry
├── index.html
├── package.json
└── vite.config.js
```

---

## 📄 License
MIT License © 2026 NexusOCR Inc.
