/* eslint-disable @typescript-eslint/no-require-imports */
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function dataRecovery() {
  console.log('🚀 STARTING DATA RECOVERY PROCESS...\n');

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.DB_NAME);

    // Check current status
    const collections = await db.listCollections().toArray();
    console.log('📋 Current collections:', collections.map(c => c.name).join(', ') || 'NONE');

    // Check interactions collection
    let interactionCount = 0;
    if (collections.some(c => c.name === 'interactions')) {
      interactionCount = await db.collection('interactions').countDocuments();
      console.log(`📊 Interactions collection: ${interactionCount.toLocaleString()} documents`);
    } else {
      console.log('❌ Interactions collection does NOT exist!');
    }

    // If no data, we need to recover
    if (interactionCount < 10000) {
      console.log('\n🔄 DATA RECOVERY REQUIRED!');
      console.log('Your original CSV files are safe. Running recovery import...\n');

      // Run Python import script programmatically
      const { spawn } = require('child_process');
      const pythonProcess = spawn('python', ['scripts/import_to_mongodb.py'], {
        cwd: process.cwd(),
        stdio: 'inherit'
      });

      return new Promise((resolve, reject) => {
        pythonProcess.on('close', (code) => {
          console.log(`\n📋 Import process finished with code ${code}`);
          if (code === 0) {
            console.log('✅ Data recovery completed successfully!');
            resolve();
          } else {
            console.log('❌ Data recovery failed!');
            reject(new Error('Import failed'));
          }
        });

        pythonProcess.on('error', (error) => {
          console.error('❌ Failed to start recovery process:', error);
          reject(error);
        });
      });

    } else {
      console.log('✅ DATA ALREADY RECOVERED!');
      console.log(`Found ${interactionCount.toLocaleString()} drug interactions`);

      // Verify data integrity
      const sample = await db.collection('interactions').find({}).limit(3).toArray();
      console.log('\n📋 Data verification:');
      sample.forEach((doc, i) => {
        console.log(`   ${i+1}. ${doc.Drug_A} + ${doc.Drug_B} (${doc.Level})`);
      });
    }

    await client.close();

  } catch (error) {
    console.error('❌ Recovery error:', error.message);
  }
}

dataRecovery();
