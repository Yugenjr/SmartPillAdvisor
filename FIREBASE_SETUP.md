# 🔥 Firebase Setup Guide for Smart Pill Advisory

## Prerequisites
- Firebase account (https://firebase.google.com/)
- Firebase project created

## Step 1: Enable Firebase Authentication

1. Go to Firebase Console → Your Project
2. Click **Authentication** in the left sidebar
3. Click **Get Started**
4. Enable **Email/Password** sign-in method
5. Save changes

## Step 2: Create Firestore Database

1. Go to **Firestore Database** in the left sidebar
2. Click **Create Database**
3. Choose **Start in production mode** (we'll set rules later)
4. Select your preferred location
5. Click **Enable**

## Step 3: Set Firestore Security Rules

Go to **Firestore Database** → **Rules** tab and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Medicines collection - users can only access their own medicines
    match /medicines/{medicineId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    
    // Chat sessions - users can only access their own chats
    match /chatSessions/{sessionId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    
    // Interaction checks - users can only access their own checks
    match /interactionChecks/{checkId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    
    // Drug interactions database - read-only for all authenticated users
    match /interactions/{interactionId} {
      allow read: if request.auth != null;
    }
  }
}
```

Click **Publish** to save the rules.

## Step 4: Get Firebase Client SDK Config

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps**
3. Click the **Web** icon (</>)
4. Register your app (name: "Smart Pill Advisory")
5. Copy the `firebaseConfig` object

You'll see something like:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 5: Get Firebase Admin SDK Credentials

1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate New Private Key**
3. Download the JSON file
4. Open the JSON file and extract:
   - `project_id`
   - `client_email`
   - `private_key`

## Step 6: Update .env.local

Create/update `.env.local` in your project root:

```env
# Firebase Client SDK (from Step 4)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin SDK (from Step 5)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# Other services
GROQ_API_KEY=your_groq_api_key
MONGODB_URI=your_mongodb_connection_string
DB_NAME=smartpilladvisor
```

**Important:** Make sure the `FIREBASE_PRIVATE_KEY` includes the quotes and `\n` characters exactly as shown.

## Step 7: Create Firestore Collections

The app will automatically create these collections when you use the features:

### Collections Structure:

#### 1. **users**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

#### 2. **medicines**
```json
{
  "userId": "user_uid_here",
  "name": "Paracetamol",
  "company": "Pfizer",
  "dosage": "500mg",
  "expiryDate": "2025-12-31",
  "purchaseDate": "2025-01-01",
  "code": "barcode_or_qr_code",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

#### 3. **chatSessions**
```json
{
  "userId": "user_uid_here",
  "sessionId": "session_123",
  "userMessage": "What is paracetamol?",
  "aiResponse": "Paracetamol is...",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

#### 4. **interactionChecks**
```json
{
  "userId": "user_uid_here",
  "drugs": ["Aspirin", "Warfarin"],
  "results": [...],
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

## Step 8: Test Authentication

1. Run your app: `npm run dev`
2. Go to http://localhost:3000
3. You'll be redirected to `/login`
4. Create a new account
5. Check Firebase Console → Authentication → Users
6. You should see your new user!

## Step 9: Test Data Storage

1. Login to your app
2. Go to Scanner page
3. Add a medicine
4. Check Firebase Console → Firestore Database
5. You should see a new document in the `medicines` collection!

## Troubleshooting

### "Permission denied" errors
- Make sure Firestore rules are published
- Verify user is authenticated
- Check that `userId` matches `request.auth.uid`

### "Firebase app already initialized"
- This is normal, the app handles it automatically

### Authentication not working
- Verify all `NEXT_PUBLIC_*` variables are set
- Check Firebase Console → Authentication is enabled
- Make sure Email/Password provider is enabled

### Data not saving
- Check browser console for errors
- Verify `userId` is being sent with requests
- Check Firestore rules allow the operation

## Security Best Practices

✅ **Never commit `.env.local` to Git**  
✅ **Use Firestore security rules**  
✅ **Validate data on the server**  
✅ **Use Firebase Admin SDK for sensitive operations**  
✅ **Enable App Check for production**  

## Production Deployment

When deploying to Vercel/Netlify:

1. Add all environment variables in the deployment dashboard
2. Enable Firebase App Check
3. Update Firestore rules for production
4. Set up Firebase hosting (optional)
5. Configure custom domain

---

**Your Firebase setup is now complete! 🎉**
