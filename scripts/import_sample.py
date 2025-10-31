import firebase_admin
from firebase_admin import credentials, firestore
import csv
import time
from pathlib import Path

# Initialize Firebase Admin
cred = credentials.Certificate('smartpilladvisor-firebase-adminsdk-fbsvc-5ddf1b35d7.json')
firebase_admin.initialize_app(cred)

db = firestore.client()

# Path to CSV files - Import only 2 files for testing
csv_dir = Path(__file__).parent.parent / 'ddinterpy'

csv_files = [
    'ddinter_downloads_code_A.csv',  # ~7,000 records
    'ddinter_downloads_code_L.csv',  # ~4,000 records
]

def import_csv_to_firestore():
    total_count = 0
    batch = db.batch()
    batch_count = 0
    
    print("Starting SAMPLE import (2 files only for testing)...")
    print("This will import ~11,000 records to test the system.\n")
    
    for csv_file in csv_files:
        file_path = csv_dir / csv_file
        
        if not file_path.exists():
            print(f"❌ File not found: {file_path}")
            continue
            
        print(f"📄 Processing {csv_file}...")
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
                
                # Small batches with delays
                if batch_count >= 100:
                    try:
                        batch.commit()
                        print(f"  ✓ Committed batch at {total_count} records")
                        batch = db.batch()
                        batch_count = 0
                        time.sleep(1)  # Wait to avoid quota
                    except Exception as e:
                        if "Quota exceeded" in str(e):
                            print(f"  ⚠️ Quota limit hit. Waiting 10 seconds...")
                            time.sleep(10)
                            batch.commit()
                            batch = db.batch()
                            batch_count = 0
                        else:
                            raise
        
        print(f"  ✅ {csv_file}: {file_count} records\n")
    
    # Commit remaining batch
    if batch_count > 0:
        batch.commit()
        print(f"  ✓ Committed final batch")
    
    print(f"\n🎉 Sample import complete!")
    print(f"📊 Total records imported: {total_count}")
    print(f"\n✅ You can now test the drug interaction checker!")
    print(f"   Visit: http://localhost:3000/interactions")
    print(f"\n💡 To import all data, upgrade to Blaze plan or run full script with delays")

if __name__ == '__main__':
    try:
        import_csv_to_firestore()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
