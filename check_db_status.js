const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkAllCollections() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.DB_NAME);

    console.log('🔍 Checking MongoDB Database Status...');
    console.log('Database:', process.env.DB_NAME);
    console.log('─'.repeat(50));

    // Get all collections
    const collections = await db.listCollections().toArray();

    console.log('📋 Collections found:', collections.length);

    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`📊 ${collection.name}: ${count.toLocaleString()} documents`);

      // Show sample for interactions collection
      if (collection.name === 'interactions' && count > 0) {
        const sample = await db.collection(collection.name).find({}).limit(3).toArray();
        console.log('   Sample records:');
        sample.forEach((doc, i) => {
          console.log(`     ${i+1}. ${doc.Drug_A} + ${doc.Drug_B} (${doc.Level})`);
        });
      }
    }

    console.log('─'.repeat(50));

    if (collections.length === 0) {
      console.log('❌ NO COLLECTIONS FOUND!');
      console.log('💡 Your database appears to be empty.');
    }

    await client.close();

  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    console.log('💡 Possible issues:');
    console.log('   - Wrong connection string');
    console.log('   - Network connectivity');
    console.log('   - Database permissions');
    console.log('   - MongoDB Atlas cluster paused');
  }
}

checkAllCollections();
