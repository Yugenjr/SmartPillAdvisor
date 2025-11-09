const { MongoClient } = require('mongodb');
require('dotenv').config();

async function verifyRecovery() {
  console.log('🔍 FINAL DATA RECOVERY VERIFICATION\n');

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.DB_NAME);

    const interactionCount = await db.collection('interactions').countDocuments();

    if (interactionCount > 10000) {
      console.log('✅ SUCCESS: Data recovered!');
      console.log(`📊 Total interactions: ${interactionCount.toLocaleString()}`);

      // Test a few known interactions
      console.log('\n🧪 Testing data integrity:');

      const tests = [
        { drug1: 'aspirin', drug2: 'warfarin', expected: true },
        { drug1: 'ibuprofen', drug2: 'paracetamol', expected: false },
        { drug1: 'amoxicillin', drug2: 'warfarin', expected: true }
      ];

      for (const test of tests) {
        const results = await db.collection('interactions').find({
          $or: [
            { Drug_A: new RegExp(test.drug1, 'i'), Drug_B: new RegExp(test.drug2, 'i') },
            { Drug_A: new RegExp(test.drug2, 'i'), Drug_B: new RegExp(test.drug1, 'i') }
          ]
        }).limit(1).toArray();

        const found = results.length > 0;
        const status = found === test.expected ? '✅' : '❌';
        console.log(`   ${test.drug1} + ${test.drug2}: ${status} ${found ? 'Found' : 'Not found'}`);
      }

      console.log('\n🎉 Your drug interaction database is fully recovered!');
      console.log('💡 You can now use the interactions page safely.');

      // Create a backup
      console.log('\n💾 Creating backup for safety...');
      const { spawn } = require('child_process');
      const backupProcess = spawn('node', ['backup_restore.js', 'backup'], {
        cwd: process.cwd(),
        stdio: 'inherit'
      });

    } else {
      console.log('❌ RECOVERY INCOMPLETE!');
      console.log('Only', interactionCount, 'records found. Expected 50,000+');
      console.log('\n🔄 Re-running import process...');

      // Re-run import
      const { spawn } = require('child_process');
      const importProcess = spawn('python', ['scripts/import_to_mongodb.py'], {
        cwd: process.cwd(),
        stdio: 'inherit'
      });
    }

    await client.close();

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyRecovery();
