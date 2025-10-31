from pymongo import MongoClient
import csv
from pathlib import Path

# MongoDB Atlas connection string
# Replace with your connection string after creating cluster
MONGODB_URI = "mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"

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

def import_to_mongodb():
    print("Connecting to MongoDB Atlas...")
    client = MongoClient(MONGODB_URI)
    db = client['smartpilladvisor']
    collection = db['interactions']
    
    # Create indexes for faster queries
    collection.create_index([("Drug_A", 1)])
    collection.create_index([("Drug_B", 1)])
    collection.create_index([("Level", 1)])
    
    total_count = 0
    batch = []
    batch_size = 1000
    
    print("Starting import...\n")
    
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
                doc = {
                    'Drug_A': row['Drug_A'],
                    'Drug_B': row['Drug_B'],
                    'Level': row['Level'],
                    'DDInterID_A': row.get('DDInterID_A') or None,
                    'DDInterID_B': row.get('DDInterID_B') or None
                }
                
                batch.append(doc)
                file_count += 1
                total_count += 1
                
                # Insert in batches
                if len(batch) >= batch_size:
                    collection.insert_many(batch)
                    print(f"  ✓ Inserted {total_count} records")
                    batch = []
        
        # Insert remaining records
        if batch:
            collection.insert_many(batch)
            batch = []
        
        print(f"  ✅ {csv_file}: {file_count} records\n")
    
    print(f"🎉 Import complete!")
    print(f"📊 Total records imported: {total_count}")
    print(f"\n✅ Database: smartpilladvisor")
    print(f"✅ Collection: interactions")
    
    client.close()

if __name__ == '__main__':
    try:
        import_to_mongodb()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
