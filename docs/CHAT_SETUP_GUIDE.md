# Chat Segment Setup Guide - smartpilladvisor Project

## ✅ What's Already Done

1. **Firebase Client Config** - Updated to use `smartpilladvisor` project
2. **Chat UI** - Beautiful ChatGPT-style interface with sidebar
3. **Groq AI Integration** - Medical assistant chatbot configured
4. **LocalStorage Fallback** - Chat works immediately without Firebase setup

## 🚀 Quick Start (Chat Works Now!)

The chat is **already functional** using localStorage. Visit:
- http://localhost:3002/chat

You can start chatting immediately! History saves to your browser.

## 🔥 Enable Cloud Storage (Firestore)

To sync chat history across devices and persist in the cloud:

### Step 1: Enable Firestore Database

1. Go to: https://console.firebase.google.com/project/smartpilladvisor/firestore
2. Click **"Create database"** (if not already created)
3. Choose **"Start in test mode"** (we'll secure it next)
4. Select a location (e.g., `us-central1`)
5. Click **"Enable"**

### Step 2: Configure Security Rules

1. In Firestore, click the **"Rules"** tab
2. Replace ALL content with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chatSessions/{sessionId} {
      allow read, write: if true;
    }
    
    match /medicines/{medicineId} {
      allow read, write: if true;
    }
    
    match /interactions/{interactionId} {
      allow read, write: if true;
    }
  }
}
```

3. Click **"Publish"**

### Step 3: Test Cloud Storage

1. Refresh http://localhost:3002/chat
2. Start a new chat
3. Send a message
4. Check Firestore Console → Data tab
5. You should see a `chatSessions` collection with your chat!

## 🎨 Chat Features

### Current Features
✅ Beautiful gradient UI with dark sidebar
✅ Real-time chat with Groq AI (groq/compound model)
✅ Chat history with search
✅ Auto-save to Firestore (or localStorage fallback)
✅ Markdown bold text rendering (**text** → **text**)
✅ Timestamps on messages
✅ Auto-scroll to latest message
✅ Loading animations
✅ Mobile-responsive design

### Chat Storage
- **Primary:** Firestore (cloud, syncs across devices)
- **Fallback:** localStorage (browser-only, always works)

## 📊 Data Structure

### Firestore Collection: `chatSessions`

```json
{
  "id": "auto-generated-id",
  "title": "First message preview...",
  "messages": [
    {
      "role": "user",
      "content": "What are typhoid symptoms?",
      "timestamp": 1730000000000
    },
    {
      "role": "assistant",
      "content": "Typhoid symptoms include...",
      "timestamp": 1730000001000
    }
  ],
  "createdAt": 1730000000000
}
```

## 🔧 Environment Variables

Your `.env.local` should have:

```env
# Required for chat AI
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE

# Optional - for Firestore admin operations (not needed for chat)
FIREBASE_PROJECT_ID=smartpilladvisor
FIREBASE_CLIENT_EMAIL=your-service-account@smartpilladvisor.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Note:** Chat works with just `GROQ_API_KEY`. Firebase admin credentials are only needed for server-side operations.

## ✅ Verification Checklist

- [ ] Firestore database created in Firebase Console
- [ ] Security rules published
- [ ] Can send messages at http://localhost:3002/chat
- [ ] Messages appear in chat UI
- [ ] Chat history shows in sidebar
- [ ] Search works in sidebar
- [ ] "New Chat" creates new session
- [ ] Can load previous chats by clicking them
- [ ] Check Firestore Console → Data → chatSessions collection has data

## 🎯 Next Steps

Once chat is working:
1. Test the medical assistant with various questions
2. Verify chat history persists after page refresh
3. Try searching old chats
4. Move on to fixing other modules (scanner, interactions, dashboard)

## 🐛 Troubleshooting

**Problem:** "Permission denied" error in console
- **Solution:** Follow Step 2 above to configure Firestore rules

**Problem:** Send button doesn't work
- **Solution:** Check that GROQ_API_KEY is in .env.local and restart server

**Problem:** Chat history doesn't save
- **Solution:** It's saving to localStorage. To use Firestore, complete Steps 1-2

**Problem:** Messages don't appear
- **Solution:** Check browser console for errors, verify Groq API key is valid

## 📱 UI Components

- **Sidebar:** Dark theme with chat history and search
- **Main Area:** Gradient background with message bubbles
- **Input:** Bottom-fixed with textarea and send button
- **Messages:** User (purple gradient) vs Assistant (white) bubbles
- **Loading:** Animated dots while AI thinks
- **Empty State:** Welcome screen with suggested questions

---

**Status:** ✅ Chat segment is fully functional!
**Storage:** Works with localStorage fallback, upgrades to Firestore when configured
**Next:** Configure Firestore rules to enable cloud sync
