<div align="center">
  <img src="public/logo.png" alt="TriSwara Logo" width="150" />
  <h1>TriSwara | त्रि स्वरा</h1>
  <p><b>READ • MAP • RECORD • HARMONIZE</b></p>
  <p><i>The definitive AI-powered Carnatic Music Studio and Harmonic Swara Converter.</i></p>

  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
  [![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](#)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
</div>

<br/>

## 🎵 Overview

**TriSwara** (formerly *Harmonic Swaras*) is a specialized web application built exclusively for Carnatic musicians, vocalists, and students. By combining state-of-the-art vision extraction AI with a powerful bespoke Web Audio Engine, TriSwara bridges the gap between traditional sheet music and modern multi-layered harmonic recording.

Whether you are practicing a simple *Geetham* or recording a complex *Krithi*, this studio seamlessly identifies the original swaras, automatically derives harmonic offsets, and gives you a professional multi-track digital audio workstation (DAW) tailored for Carnatic synchronization right in your browser.

---

## ✨ Features

### 👁️ AI Vision Swara Extraction
Upload any printed, scanned, or handwritten Carnatic sheet music. Our carefully engineered system prompt interfaces with **Google Gemini (Free Tier)**, parsing exact rows of notation and ignoring external lyrical or structural text.

### 📐 Deterministic Harmonic Mapping
TriSwara leverages a mathematically strict 7th-interval mapping algorithm across a 21-position scale (from `.R` base octave up to `N.` top octave). For every normal note it extracts, it instantly generates mathematically perfect `Base` and `Top` harmonic accompaniment frames according to pure Carnatic rules.

### 🎙️ The Harmonic Studio
A bespoke web-audio powered mixing studio constructed explicitly for layered vocal recordings:
* **Multi-Track Recording**: Independent track lanes for the Base, Normal, and Top vocal octaves.
* **Intelligent WebAudio Engine**: Highly optimized precision syncing bypassing standard HTML5 media latency to ensure pure synchronization.
* **Audio Trimming**: Interactive real-time waveform visualization with non-destructive slicing/trimming sliders to cut out silence.
* **Volume Mapping**: Independent node-routed gain adjustment per track with instant playback preview.
* **Mix & Master**: Render your three synchronized tracks down into a single 16-bit PCM WAV file mix instantly in the browser. 

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed along with `npm`. 

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/triswara.git
   cd triswara
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```

4. **Navigate to the Studio**
   Open your browser to `http://localhost:5173`. 
   
> [!NOTE]
> *To use the AI Vision Extractor, you will be prompted for an API key. You can generate a free Gemini API key simply by heading to [Google AI Studio](https://aistudio.google.com).*

---

## 🛠️ Technology Stack

| Architecture Element | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18** | High-performance reactive UI rendering. |
| **Styling & Theme** | **Tailwind CSS** | Custom highly-aesthetic dark mode and gold/glassmorphism geometry. |
| **Audio Routing** | **Web Audio API** | Advanced buffer manipulation, offset management, and hardware DSP bypasses. |
| **AI Vision Layer** | **Gemini Vision** | Serverless integration via a high-security proxy bypass setup. |

---

## 🔒 Security Architecture
**No keys are stored.** When providing your Google Gemini API key to the system, it is kept exclusively inside Volatile Browser Memory (React State). Keys are completely erased the moment the session closes or the window is refreshed. To bypass strict browser CORS parameters, the application routes the encrypted REST payload through an internal Vite proxy node.

---

<div align="center">
  <p><i>Made with devotion for the Carnatic Music Community.</i></p>
  <p>𝄞</p>
</div>
