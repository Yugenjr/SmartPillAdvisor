import pandas as pd
from pymongo import MongoClient

# 1️⃣ Connect to MongoDB Atlas
client = MongoClient("mongodb+srv://yugenjr847:yugen842007@yugen.zbssgmq.mongodb.net/?appName=yugen")
db = client["smartpilladvisor"]
collection = db["interactions"]

# Create indexes for faster queries
print("Creating indexes...")
collection.create_index([("Drug_A", 1)])
collection.create_index([("Drug_B", 1)])
collection.create_index([("Level", 1)])

# 2️⃣ Upload all 8 CSV files (chunked)
csv_files = [
    "ddinterpy/ddinter_downloads_code_A.csv",
    "ddinterpy/ddinter_downloads_code_B.csv",
    "ddinterpy/ddinter_downloads_code_D.csv",
    "ddinterpy/ddinter_downloads_code_H.csv",
    "ddinterpy/ddinter_downloads_code_L.csv",
    "ddinterpy/ddinter_downloads_code_P.csv",
    "ddinterpy/ddinter_downloads_code_R.csv",
    "ddinterpy/ddinter_downloads_code_V.csv"
]

total_records = 0

for filename in csv_files:
    print(f"\n📄 Uploading {filename} ...")
    file_records = 0

    # Read file in chunks (2000 rows at a time)
    for chunk in pd.read_csv(filename, chunksize=2000):
        # Convert each chunk to dictionary and upload
        records = chunk.to_dict(orient='records')
        collection.insert_many(records)
        file_records += len(records)
        total_records += len(records)
        print(f"  ✓ Uploaded {file_records} records from {filename}")
    
    print(f"✅ {filename} uploaded successfully! ({file_records} records)")

print(f"\n🎉 All files uploaded to MongoDB Atlas!")
print(f"📊 Total records: {total_records}")
print(f"✅ Database: smartpilladvisor")
print(f"✅ Collection: interactions")
print(f"\n🔗 View in MongoDB Atlas: https://cloud.mongodb.com/")

client.close()
