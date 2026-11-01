# QuizCraft AI – Smart Quiz Generator from Notes/PDFs

[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini%20API-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **QuizCraft AI** is an intelligent, full-stack educational assessment platform that transforms study materials, lecture notes, and documents (PDF, DOCX, plain text) into interactive, multi-format quizzes with automatic grading, in-depth explanations, and progress analytics.

---

## ✨ Features

- **🎨 Modern Pastel UI/UX**: Designed with a calm, comfortable pastel palette (`#F8F7FC`, soft lavender `#EAE4F8`, mint green `#E3F1E9`) crafted for distraction-free study sessions.
- **📄 Multi-Format Document Ingestion**:
  - Extract text cleanly from **PDF** (`pdf-parse`) and **DOCX** (`mammoth`).
  - Direct paste and editing of revision notes.
  - Text preview modal with character and word count statistics.
- **🤖 Resilient AI Quiz Generation**:
  - Powered by **Google Gemini AI** with an automated multi-model fallback pool (`gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.7-flash`) to prevent 503 capacity issues.
  - Multiple question formats: **Multiple Choice**, **True/False**, **Fill in the Blanks**, and **Mixed**.
  - Configurable difficulty levels: **Easy**, **Medium**, **Hard**.
  - Flexible question counts (5, 10, 15, or custom).
- **⏱️ Distraction-Free Quiz Taking**:
  - Real-time countdown timer with automated submission on timeout.
  - Interactive question grid navigator with **Mark for Review** flag.
  - Answered / unanswered status indicators.
  - Strict security: correct answers and explanations are never exposed to the client prior to final submission.
- **📊 Detailed Results & PDF Export**:
  - Comprehensive score breakdown, percentage, and time taken.
  - Question-by-question review with detailed explanations for each correct answer.
  - One-click **Download Results as PDF** powered by `jspdf`.
- **📌 Question Bookmarking**: Save tricky or high-yield questions to review and practice later.
- **📈 Performance Analytics**: Dynamic tracking of average score, highest score, total attempts, completion trends, and difficulty breakdowns.
- **🔒 Secure Authentication & Data Isolation**:
  - Complete user registration and login with **JWT** and salted **bcryptjs** password hashing.
  - Strict per-user data isolation: students cannot access or modify materials, quizzes, or bookmarks belonging to others.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Lucide Icons, Axios, jsPDF, Modern CSS3 |
| **Backend** | Node.js, Express.js, JWT, bcryptjs, Multer |
| **Document Processing** | `pdf-parse` (PDF extraction), `mammoth` (Word .docx extraction) |
| **Database** | MongoDB, Mongoose ODM |
| **Artificial Intelligence** | Google Gemini API (`@google/genai`) |

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local community edition or MongoDB Atlas URI)
- [Google Gemini API Key](https://aistudio.google.com/)

---

### 1. Clone the Repository
```bash
git clone https://github.com/charishmadulla/QuizCraft-AI.git
cd QuizCraft-AI
```

---

### 2. Backend Setup
1. Navigate into the `backend` folder and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file inside `backend/` (refer to `.env.example`):
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/smart_quiz_generator
   GEMINI_API_KEY=your_google_gemini_api_key_here
   GEMINI_MODEL=gemini-3.5-flash
   JWT_SECRET=your_super_secret_jwt_key_here
   ```

3. Start the backend server:
   ```bash
   # Development mode with nodemon
   npm run dev

   # Or standard production start
   npm start
   ```
   *The backend will be live at `http://localhost:5000`.*

---

### 3. Frontend Setup
1. Open a new terminal, navigate into the `frontend` folder, and install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. (Optional) Create a `frontend/.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will open at `http://localhost:5173`.*

---

## 🧪 Automated Testing

The project includes 49 end-to-end and security tests verifying API endpoints, quiz generation, and user privacy:

```bash
cd backend

# Run the complete API & Gemini quiz generation suite (31 tests)
node test-suite.js

# Run the multi-user authentication & data isolation suite (18 tests)
node test-auth-isolation.js
```

---

## 📁 Project Structure

```text
QuizCraft-AI/
├── backend/
│   ├── config/             # Database connection (Mongoose)
│   ├── middleware/         # JWT auth protection (protect middleware)
│   ├── models/             # User, StudyMaterial, Quiz, QuizAttempt, BookmarkedQuestion
│   ├── routes/             # auth, materials, uploads, quizzes, bookmarks
│   ├── test-suite.js       # End-to-end verification suite
│   ├── test-auth-isolation.js # Security and user isolation tests
│   ├── server.js           # Express app entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/             # Static assets & icons
│   ├── src/
│   │   ├── components/     # UI Views (Auth, Dashboard, Materials, Quiz, Analytics, etc.)
│   │   ├── services/       # Axios API client with auth interceptors
│   │   ├── utils/          # PDF generator utility
│   │   ├── App.jsx         # Main application controller
│   │   ├── App.css         # Pastel design system stylesheet
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
