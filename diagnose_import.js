/* eslint-disable @typescript-eslint/no-require-imports */
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function diagnoseImportIssue() {
  console.log('🔍 DIAGNOSING WHY 8 CSV FILES DATA IS NOT IN MONGODB\n');

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.DB_NAME);

    console.log('📊 Database:', process.env.DB_NAME);
    console.log('🔗 Connection:', process.env.MONGODB_URI ? '✅ Configured' : '❌ Missing');
    console.log('');

    // Check collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Collections in database:', collections.length);

    if (collections.length === 0) {
      console.log('❌ PROBLEM: No collections found!');
      console.log('\n🔍 POSSIBLE CAUSES:');
      console.log('1. Import script never ran');
      console.log('2. Import script failed');
      console.log('3. Database connection issues');
      console.log('4. Collections were accidentally dropped');

      await client.close();

      console.log('\n🔧 SOLUTION: Let me run the import manually');
      await runImportManually();
      return;
    }

    // Check interactions collection
    const interactionsCollection = collections.find(c => c.name === 'interactions');
    if (!interactionsCollection) {
      console.log('❌ PROBLEM: No interactions collection found!');
      await client.close();
      await runImportManually();
      return;
    }

    const count = await db.collection('interactions').countDocuments();
    console.log(`📊 Interactions collection: ${count.toLocaleString()} documents`);

    if (count === 0) {
      console.log('❌ PROBLEM: Interactions collection exists but is EMPTY!');
      await client.close();
      await runImportManually();
      return;
    }

    if (count < 10000) {
      console.log(`⚠️  PROBLEM: Only ${count} documents (expected 50,000+)`);
      console.log('💡 This suggests partial import or data loss');
      await client.close();
      await runImportManually();
      return;
    }

    // Data looks good
    console.log('✅ SUCCESS: Full dataset appears to be loaded!');

    // Verify data quality
    const sample = await db.collection('interactions').find({}).limit(3).toArray();
    console.log('\n📋 Sample data verification:');
    sample.forEach((doc, i) => {
      console.log(`   ${i+1}. ${doc.Drug_A} + ${doc.Drug_B} (${doc.Level})`);
    });

    await client.close();

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Check .env.local file');
    console.log('2. Verify MongoDB Atlas connection');
    console.log('3. Check network connectivity');
  }
}

async function runImportManually() {
  console.log('\n🚀 RUNNING MANUAL IMPORT...\n');

  const fs = require('fs');
  const csv = require('csv-parser');
  const path = require('path');

  const { MongoClient } = require('mongodb');
  require('dotenv').config();

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection('interactions');

  const csvDir = path.join(__dirname, 'ddinterpy');
  const csvFiles = [
    'ddinter_downloads_code_A.csv',
    'ddinter_downloads_code_B.csv',
    'ddinter_downloads_code_D.csv',
    'ddinter_downloads_code_H.csv',
    'ddinter_downloads_code_L.csv',
    'ddinter_downloads_code_P.csv',
    'ddinter_downloads_code_R.csv',
    'ddinter_downloads_code_V.csv'
  ];

  let totalImported = 0;

  for (const csvFile of csvFiles) {
    const filePath = path.join(csvDir, csvFile);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${csvFile}`);
      continue;
    }

    console.log(`📄 Processing ${csvFile}...`);

    const records = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          records.push({
            Drug_A: row.Drug_A,
            Drug_B: row.Drug_B,
            Level: row.Level,
            DDInterID_A: row.DDInterID_A || null,
            DDInterID_B: row.DDInterID_B || null
          });
        })
        .on('end', () => resolve())
        .on('error', reject);
    });

    if (records.length > 0) {
      await collection.insertMany(records);
      console.log(`   ✅ Imported ${records.length} records from ${csvFile}`);
      totalImported += records.length;
    }
  }

  console.log(`\n🎉 MANUAL IMPORT COMPLETE!`);
  console.log(`📊 Total records imported: ${totalImported.toLocaleString()}`);

  await client.close();
}

diagnoseImportIssue();
