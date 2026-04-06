# 📖 Bala-STT | Real-Time AI Reading Fluency Evaluator

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python)
![OpenAI Whisper](https://img.shields.io/badge/AI-Whisper-white?style=for-the-badge&logo=openai)

A production-ready, full-stack SaaS application designed to evaluate reading fluency in real-time. By bridging a high-performance **Next.js** frontend with a **FastAPI + Whisper** neural backend, this application provides users with granular, chunk-based analysis of their reading accuracy, speed, and pronunciation.

---

## ✨ Core Features

* 🎙️ **Neural Voice Transcription:** Utilizes OpenAI's Whisper model to accurately convert live speech-to-text.
* 🧠 **Advanced NLP Evaluation:** Evaluates student reading sessions using strict mathematical metrics for WCPM (Words Correct Per Minute), Chunking Scores, and Total Accuracy.
* 📊 **Granular Word Mapping:** Automatically detects and categorizes reading errors into specific arrays: Mispronounced, Skipped, Extra, and Repeated words.
* 🎨 **Premium SaaS Dashboard:** A glassmorphic UI built with Tailwind CSS and Lucide React, featuring a responsive 3-column metrics grid.
* 🔍 **Detailed Chunk Analysis:** Visually breaks down transcripts into readable phrase blocks with color-coded, pill-style highlights for instant visual feedback.

---

## 🏗️ System Architecture

### 💻 The Frontend (`/frontend`)
Built with **Next.js 14**, **React**, and **Tailwind CSS**.
* **Audio Engine:** Captures high-fidelity `.webm` audio via a custom `useAudioRecorder` hook.
* **State Management:** Handles complex SSR hydration guards and safe data extraction using Optional Chaining.
* **UI/UX:** Features a deep-dark mode (`bg-[#0B0F19]`) SaaS layout, dynamic SVGs, and interactive validation logs that group words into distinct "Chunks" based on punctuation.

### ⚙️ The Backend (`/backend`)
Built with **Python**, **FastAPI**, and **Whisper**.
* **Audio Processing:** Receives the `.webm` audio blob, streams it to the local filesystem, and feeds it into the Whisper Neural Engine.
* **The AI Judge:** A custom business logic evaluator (`evaluator.py`) that strictly calculates:
  * **WCPM:** `(Total Correct Words / Speech Duration) * 60` (Filters out background noise).
  * **Chunking Score:** `(Passed Chunks / Total Chunks) * 100` *(Penalizes >1.5s gaps between words in the same phrase).*
  * **Accuracy:** `(Correct Words / Total Story Words) * 100`

---

## 🚀 Getting Started

To run this project locally, you must boot up both the Python backend and the Next.js frontend in separate terminal windows.

### Prerequisites
* Node.js (v18+)
* Python (3.9+)
* FFmpeg (Required for Whisper neural audio processing)

### 1. Booting the Backend (AI Engine)
Navigate to the backend directory, activate your virtual environment, and start the FastAPI server:

```bash
cd backend
python -m venv venv

# Activate the virtual environment
venv\Scripts\activate      # Windows
source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Start the server
python main.py

cd frontend
npm install
npm run dev
## ⚠️ Important Setup Instructions for Local Development

Because this application uses heavy Neural Network models, the binary files (`.wasm`, `.onnx`) were excluded from this repository to respect GitHub's file size limits. To run this project locally, you **MUST** complete these two steps before starting the servers.

### 1. Install FFmpeg (System Audio Processing)
The Python backend uses OpenAI's Whisper, which requires FFmpeg to be installed on your computer to decode the `.webm` audio files.
* **Windows:** Open Command Prompt as Administrator and run: `winget install ffmpeg` (or download from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/))
* **Mac:** Open Terminal and run: `brew install ffmpeg`
* **Linux:** Open Terminal and run: `sudo apt install ffmpeg`

### 2. Download the Missing Frontend AI Models
The frontend requires specific Sherpa-ONNX WebAssembly files to process the microphone data.
1. Download the required model files here: **[LINK TO YOUR GOOGLE DRIVE / DROPBOX ZIP FILE]**
2. Extract the `.zip` file.
3. Place all the `.wasm` and `.onnx` files directly into the `frontend/public/` folder. 

*Note: If you skip this step, the frontend will throw a "Missing Module" or "OfflineStream" error when you click the microphone!*

https://drive.google.com/drive/folders/1NTYKExmHQWWqujWoEQVh6u9rwnBOcEgI?usp=sharing  use this line for ai model download in my drive sir

cd frontend
npm install
npm run dev
