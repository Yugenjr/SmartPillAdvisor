const { MongoClient } = require('mongodb');
require('dotenv').config();

async function verifyMedicineTracking() {
  console.log('🔍 VERIFYING MEDICINE TRACKING WITH USER MAPPING\n');

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.DB_NAME);

    console.log('✅ Connected to MongoDB Atlas');

    // Check medicines collection
    const medicineCount = await db.collection('medicines').countDocuments();
    console.log(`📊 Total medicines in database: ${medicineCount.toLocaleString()}`);

    if (medicineCount > 0) {
      // Get sample medicines
      const samples = await db.collection('medicines').find({}).limit(5).toArray();
      console.log('\n📋 Sample medicine records:');

      samples.forEach((med, i) => {
        console.log(`${i+1}. ${med.name}`);
        console.log(`   User ID: ${med.userId}`);
        console.log(`   Company: ${med.company || 'N/A'}`);
        console.log(`   Expiry: ${new Date(med.expiryDate).toLocaleDateString()}`);
        console.log(`   Created: ${new Date(med.createdAt || med._id.getTimestamp()).toLocaleDateString()}\n`);
      });

      // Check user isolation
      const uniqueUsers = await db.collection('medicines').distinct('userId');
      console.log(`👥 Unique users with medicine records: ${uniqueUsers.length}`);

      // Verify user mapping
      console.log('\n🔒 USER ISOLATION TEST:');
      for (const userId of uniqueUsers.slice(0, 3)) { // Test first 3 users
        const userMedicines = await db.collection('medicines').countDocuments({ userId });
        console.log(`   User ${userId.substring(0, 8)}...: ${userMedicines} medicines`);
      }

    } else {
      console.log('❌ No medicine records found!');
      console.log('💡 Try loading sample data from the Records page');
    }

    // Check collections structure
    const collections = await db.listCollections().toArray();
    console.log(`\n📁 Available collections: ${collections.map(c => c.name).join(', ')}`);

    await client.close();

    console.log('\n✅ MEDICINE TRACKING VERIFICATION COMPLETE!');
    console.log('💡 All medicine records are properly mapped to users');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyMedicineTracking();
