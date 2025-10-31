# MongoDB Atlas Import Guide

## 🚀 Quick Setup (10 minutes)

### Step 1: Create MongoDB Atlas Account (FREE)

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up (free tier - no credit card needed)
3. Create a **FREE M0 cluster** (512MB storage - enough for your data)
4. Choose **AWS** and closest region

### Step 2: Setup Database Access

1. In Atlas dashboard, go to **Database Access**
2. Click **"Add New Database User"**
3. Username: `smartpill`
4. Password: Generate a strong password (save it!)
5. Database User Privileges: **Read and write to any database**
6. Click **"Add User"**

### Step 3: Setup Network Access

1. Go to **Network Access**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
4. Click **"Confirm"**

### Step 4: Get Connection String

1. Go to **Database** → Click **"Connect"**
2. Choose **"Connect your application"**
3. Copy the connection string:
   ```
   mongodb+srv://smartpill:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password

### Step 5: Add to .env.local

Open `.env.local` and add:

```env
MONGODB_URI=mongodb+srv://smartpill:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=smartpilladvisor
```

### Step 6: Install Python MongoDB Driver

```bash
pip install pymongo
```

### Step 7: Update Import Script

Edit `scripts/import_to_mongodb.py` and replace the MONGODB_URI with your connection string.

### Step 8: Run Import

```bash
python scripts\import_to_mongodb.py
```

**Time:** 2-3 minutes for all 50,000+ records!

## ✅ What You Get

- ✅ **FREE** - 512MB storage (plenty for drug data)
- ✅ **FAST** - No quota limits
- ✅ **RELIABLE** - Managed by MongoDB
- ✅ **SCALABLE** - Can upgrade later if needed

## 📊 After Import

Your Next.js app will automatically use MongoDB for drug interactions!

The `/api/interactions` route already uses MongoDB:

```typescript
// Already configured in your app!
const { db } = await connectToDatabase();
const interactions = await db.collection('interactions')
  .find({ Drug_A: drug1, Drug_B: drug2 })
  .toArray();
```

## 🧪 Test It

1. Import data to MongoDB Atlas
2. Visit: http://localhost:3000/interactions
3. Search for: "Aspirin" and "Warfarin"
4. Should see interaction results!

## 💾 Data Structure

```javascript
{
  Drug_A: "Aspirin",
  Drug_B: "Warfarin",
  Level: "Major",
  DDInterID_A: "DDInter123",
  DDInterID_B: "DDInter456"
}
```

## 🔍 Indexes Created

For fast queries:
- `Drug_A` (ascending)
- `Drug_B` (ascending)
- `Level` (ascending)

## 📈 Storage Used

- ~50,000 records
- ~10-15 MB total
- Well within 512MB free tier!

---

## 🎯 Summary

1. Create MongoDB Atlas account (free)
2. Create cluster and user
3. Get connection string
4. Add to `.env.local`
5. Run: `pip install pymongo`
6. Run: `python scripts\import_to_mongodb.py`
7. Done! Test at http://localhost:3000/interactions
