import firebase_admin
from firebase_admin import credentials, firestore
import csv
import os
import time
from pathlib import Path

# Initialize Firebase Admin
cred = credentials.Certificate('smartpilladvisor-firebase-adminsdk-fbsvc-5ddf1b35d7.json')
firebase_admin.initialize_app(cred)

db = firestore.client()

# Path to CSV files
csv_dir = Path(__file__).parent.parent / 'ddinterpy'

csv_files = [
    'ddinter_downloads_code_A.csv',
    'ddinter_downloads_code_B.csv',
    'ddinter_downloads_code_D.csv',
    'ddinter_downloads_code_H.csv',
    'ddinter_downloads_code_L.csv',
    'ddinter_downloads_code_P.csv',
    'ddinter_downloads_code_R.csv',
    'ddinter_downloads_code_V.csv'
]

def import_csv_to_firestore():
    total_count = 0
    batch = db.batch()
    batch_count = 0
    
    print("Starting import...")
    
    for csv_file in csv_files:
        file_path = csv_dir / csv_file
        
        if not file_path.exists():
            print(f"❌ File not found: {file_path}")
            continue
            
        print(f"\n📄 Processing {csv_file}...")
        file_count = 0
        
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                doc_ref = db.collection('interactions').document()
                batch.set(doc_ref, {
                    'Drug_A': row['Drug_A'],
                    'Drug_B': row['Drug_B'],
                    'Level': row['Level'],
                    'DDInterID_A': row.get('DDInterID_A') or None,
                    'DDInterID_B': row.get('DDInterID_B') or None
                })
                
                batch_count += 1
                file_count += 1
                total_count += 1
                
                # Firestore batch limit is 500, use smaller batches to avoid quota
                if batch_count >= 100:
                    try:
                        batch.commit()
                        print(f"  ✓ Committed batch at {total_count} records")
                        batch = db.batch()
                        batch_count = 0
                        time.sleep(1)  # Wait 1 second between batches to avoid quota
                    except Exception as e:
                        if "Quota exceeded" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                            print(f"  ⚠️ Quota limit hit. Waiting 10 seconds...")
                            time.sleep(10)
                            batch.commit()
                            batch = db.batch()
                            batch_count = 0
                        else:
                            raise
        
        print(f"  ✅ {csv_file}: {file_count} records")
    
    # Commit remaining batch
    if batch_count > 0:
        batch.commit()
        print(f"  ✓ Committed final batch")
    
    print(f"\n🎉 Import complete!")
    print(f"📊 Total records imported: {total_count}")
    print(f"\n✅ Check Firestore Console: https://console.firebase.google.com/project/smartpilladvisor/firestore")

if __name__ == '__main__':
    try:
        import_csv_to_firestore()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
