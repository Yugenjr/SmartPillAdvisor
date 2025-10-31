import sqlite3
import csv
from pathlib import Path

# Create SQLite database
db_path = Path(__file__).parent.parent / 'drug_interactions.db'
conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

# Create table
cursor.execute('''
CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    Drug_A TEXT NOT NULL,
    Drug_B TEXT NOT NULL,
    Level TEXT NOT NULL,
    DDInterID_A TEXT,
    DDInterID_B TEXT
)
''')

# Create indexes for fast queries
cursor.execute('CREATE INDEX IF NOT EXISTS idx_drug_a ON interactions(Drug_A)')
cursor.execute('CREATE INDEX IF NOT EXISTS idx_drug_b ON interactions(Drug_B)')
cursor.execute('CREATE INDEX IF NOT EXISTS idx_level ON interactions(Level)')

conn.commit()

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

total_count = 0

print("Creating SQLite database with drug interactions...\n")

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
            cursor.execute('''
                INSERT INTO interactions (Drug_A, Drug_B, Level, DDInterID_A, DDInterID_B)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                row['Drug_A'],
                row['Drug_B'],
                row['Level'],
                row.get('DDInterID_A') or None,
                row.get('DDInterID_B') or None
            ))
            file_count += 1
            total_count += 1
            
            # Commit every 1000 records
            if file_count % 1000 == 0:
                conn.commit()
                print(f"  ✓ Inserted {file_count} records")
    
    conn.commit()
    print(f"  ✅ {csv_file}: {file_count} records\n")

print(f"🎉 Database created successfully!")
print(f"📊 Total records: {total_count}")
print(f"📁 Database location: {db_path}")
print(f"\n✅ You can now use this database in your Next.js app!")

conn.close()
