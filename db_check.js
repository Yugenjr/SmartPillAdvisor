const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkStatus() {
  try {
    console.log('🔍 Checking MongoDB Status...\n');

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.DB_NAME);

    const collections = await db.listCollections().toArray();
    console.log('📋 Collections:', collections.length);

    if (collections.length === 0) {
      console.log('❌ DATABASE IS EMPTY!');
      console.log('✅ But your CSV files are safe - we can restore!');
      console.log('\n📁 Available CSV files:');
      console.log('   ✅ ddinter_downloads_code_A.csv');
      console.log('   ✅ ddinter_downloads_code_B.csv');
      console.log('   ✅ ddinter_downloads_code_D.csv');
      console.log('   ✅ ddinter_downloads_code_H.csv');
      console.log('   ✅ ddinter_downloads_code_L.csv');
      console.log('   ✅ ddinter_downloads_code_P.csv');
      console.log('   ✅ ddinter_downloads_code_R.csv');
      console.log('   ✅ ddinter_downloads_code_V.csv');
    } else {
      console.log('✅ Database has collections:');
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`   📊 ${col.name}: ${count.toLocaleString()} documents`);
      }
    }

    await client.close();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

checkStatus();
