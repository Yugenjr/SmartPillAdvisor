# Python Import Script for Drug Interactions

## 🚀 Quick Start

### Step 1: Install Python Package
```bash
pip install firebase-admin
```

### Step 2: Run the Script
```bash
cd c:\Users\Yugendra\Downloads\smartpillapp
python scripts\import_interactions.py
```

### Step 3: Wait for Completion
- Takes ~2-3 minutes
- You'll see progress for each file
- Shows total count at the end

## 📋 What It Does

1. Reads all 8 CSV files from `ddinterpy/` folder
2. Parses each CSV file
3. Uploads to Firestore in batches of 450
4. Shows progress for each file
5. Displays total count

## ✅ Expected Output

```
Starting import...

📄 Processing ddinter_downloads_code_A.csv...
  ✓ Committed batch at 450 records
  ✓ Committed batch at 900 records
  ...
  ✅ ddinter_downloads_code_A.csv: 7000 records

📄 Processing ddinter_downloads_code_B.csv...
  ...

🎉 Import complete!
📊 Total records imported: 50000+
```

## 🔧 Requirements

- Python 3.7+
- firebase-admin package
- Firebase service account JSON file (already in project root)
- CSV files in ddinterpy/ folder (already there)

## ⚠️ Troubleshooting

### Error: "No module named 'firebase_admin'"
```bash
pip install firebase-admin
```

### Error: "File not found"
Make sure you're running from smartpillapp directory:
```bash
cd c:\Users\Yugendra\Downloads\smartpillapp
python scripts\import_interactions.py
```

### Error: "Permission denied"
Check Firestore security rules allow writes

## 📊 After Import

1. Check Firestore Console: https://console.firebase.google.com/project/smartpilladvisor/firestore
2. Look for `interactions` collection
3. Should have ~50,000 documents
4. Test at: http://localhost:3000/interactions
