# 🏥 Smart Pill Advisory System

> Your intelligent companion for medication management, drug interactions, and medical guidance

![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-38bdf8)

## ✨ Features

### 💊 Drug Interaction Checker
- Check potential interactions between multiple medications
- Real-time database queries with 50,000+ drug interactions
- Color-coded severity levels (Major, Moderate, Minor)
- Beautiful, intuitive interface

### 📱 Medicine Scanner
- QR code and barcode scanning
- Automatic expiry date tracking
- Google Calendar integration for reminders
- Camera-based detection

### 🤖 AI Medical Assistant
- Powered by GROQ AI
- Instant medical guidance
- Chat history stored in Firebase
- Natural language processing

### 📊 Dashboard & Analytics
- Medicine expiry overview
- Risk assessment charts
- Usage statistics
- Modern, responsive design

## 🚀 Tech Stack

- **Frontend:** Next.js 16, React 19, TailwindCSS
- **Backend:** Next.js API Routes
- **Database:** MongoDB Atlas, Firebase Firestore
- **AI:** GROQ API
- **Scanner:** @zxing/browser
- **Charts:** Chart.js, React-Chartjs-2
- **Calendar:** Google Calendar API

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account
- Firebase project
- GROQ API key
- Google Calendar API credentials (optional)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd smartpillapp
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup

Create `.env.local` file in the root directory:

```env
# GROQ API
GROQ_API_KEY=your_groq_api_key_here

# Firebase Admin
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=smartpilladvisor

# Google Calendar (Optional)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
```

### 4. Import Drug Interaction Data

Upload CSV files to MongoDB Atlas using MongoDB Compass:
1. Connect to your MongoDB Atlas cluster
2. Create database: `smartpilladvisor`
3. Create collection: `interactions`
4. Import all 8 CSV files from `ddinterpy/` folder

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
smartpillapp/
├── app/
│   ├── api/              # API routes
│   │   ├── chat/         # AI chatbot endpoint
│   │   ├── interactions/ # Drug interaction checker
│   │   └── medicines/    # Medicine scanner
│   ├── chat/             # Chat page
│   ├── interactions/     # Interactions page
│   ├── scan/             # Scanner page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Dashboard
├── lib/
│   ├── firebaseAdmin.ts  # Firebase admin config
│   └── mongodb.ts        # MongoDB connection
├── ddinterpy/            # Drug interaction CSV files
├── scripts/              # Import scripts
└── public/               # Static assets
```

## 🎨 Design Features

- **Full-width responsive layout**
- **Purple gradient theme** throughout
- **Modern card-based UI**
- **Smooth animations and transitions**
- **Color-coded severity indicators**
- **Mobile-first design**

## 🔒 Security

- Environment variables for sensitive data
- Firebase service account keys excluded from git
- MongoDB connection strings secured
- API keys protected

## 📝 Usage

### Drug Interaction Checker
1. Navigate to `/interactions`
2. Add medicine names
3. Click "Check Interactions"
4. View results with severity levels

### Medicine Scanner
1. Navigate to `/scan`
2. Allow camera access
3. Scan QR code or barcode
4. Fill in details and save

### AI Chat
1. Navigate to `/chat`
2. Ask medical questions
3. Get instant AI-powered responses

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Environment Variables
Add all `.env.local` variables to your deployment platform

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- GROQ for AI capabilities
- MongoDB Atlas for database
- Firebase for backend services
- Next.js team for the framework

---

**Made with ❤️ for better medication management**
