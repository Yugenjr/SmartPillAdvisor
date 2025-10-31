from pymongo import MongoClient
import sys

print("Testing MongoDB Atlas connection...")
print("Connection string: mongodb+srv://yugenjr847:***@yugen.zbssgmq.mongodb.net/\n")

try:
    # Try to connect with shorter timeout
    client = MongoClient(
        "mongodb+srv://yugenjr847:yugen842007@yugen.zbssgmq.mongodb.net/?appName=yugen",
        serverSelectionTimeoutMS=5000
    )
    
    # Test connection
    print("Attempting to connect...")
    client.admin.command('ping')
    
    print("✅ Connection successful!")
    print("✅ MongoDB Atlas is reachable!")
    print("\nYou can now run: python scripts\\upload_csv_mongodb.py")
    
    client.close()
    sys.exit(0)
    
except Exception as e:
    print("❌ Connection failed!")
    print(f"Error: {str(e)}\n")
    print("🔧 Fix:")
    print("1. Go to: https://cloud.mongodb.com/")
    print("2. Click 'Network Access' in left sidebar")
    print("3. Click 'Add IP Address'")
    print("4. Click 'Allow Access from Anywhere'")
    print("5. Click 'Confirm'")
    print("6. Wait 1-2 minutes and try again")
    sys.exit(1)
