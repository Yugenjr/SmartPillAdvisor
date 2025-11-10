/* eslint-disable @typescript-eslint/no-require-imports */
// Script to import drug interactions from CSV files to Firestore
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-service-account.json'); // You'll need to download this

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'smartpilladvisor'
});

const db = admin.firestore();

// Path to CSV files
const CSV_DIR = 'C:\\Users\\Yugendra\\Downloads\\Drug-Interaction-Checking-Website-main\\Drug-Interaction-Checking-Website-main\\ddinterpy';

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

async function importInteractions() {
  console.log('Starting drug interaction import...');
  let totalCount = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const csvFile of csvFiles) {
    const filePath = path.join(CSV_DIR, csvFile);
    console.log(`Processing ${csvFile}...`);

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Create document in Firestore
          const docRef = db.collection('interactions').doc();
          batch.set(docRef, {
            Drug_A: row.Drug_A,
            Drug_B: row.Drug_B,
            Level: row.Level,
            DDInterID_A: row.DDInterID_A || null,
            DDInterID_B: row.DDInterID_B || null
          });

          batchCount++;
          totalCount++;

          // Firestore batch limit is 500
          if (batchCount >= 450) {
            batch.commit();
            batch = db.batch();
            batchCount = 0;
            console.log(`  Committed batch. Total so far: ${totalCount}`);
          }
        })
        .on('end', () => {
          console.log(`  Finished ${csvFile}`);
          resolve();
        })
        .on('error', reject);
    });
  }

  // Commit remaining batch
  if (batchCount > 0) {
    await batch.commit();
    console.log(`  Committed final batch`);
  }

  console.log(`\n✅ Import complete! Total interactions imported: ${totalCount}`);
  process.exit(0);
}

importInteractions().catch((error) => {
  console.error('Error importing interactions:', error);
  process.exit(1);
});
