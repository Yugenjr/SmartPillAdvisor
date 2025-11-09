const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkInteractions() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.DB_NAME);

    const count = await db.collection('interactions').countDocuments();
    console.log('Total interactions in DB:', count);

    if (count > 0) {
      console.log('\nSample interactions:');
      const samples = await db.collection('interactions').find({}).limit(5).toArray();
      samples.forEach((doc, i) => {
        console.log(`${i+1}. ${doc.Drug_A} + ${doc.Drug_B} - ${doc.Level || 'Unknown'}`);
      });

      // Check for specific drugs
      console.log('\nChecking for Ibuprofen:');
      const ibuResults = await db.collection('interactions').find({
        $or: [
          { Drug_A: /ibuprofen/i },
          { Drug_B: /ibuprofen/i }
        ]
      }).toArray();
      console.log('Ibuprofen interactions found:', ibuResults.length);

      console.log('\nChecking for Abacavir:');
      const abaResults = await db.collection('interactions').find({
        $or: [
          { Drug_A: /abacavir/i },
          { Drug_B: /abacavir/i }
        ]
      }).toArray();
      console.log('Abacavir interactions found:', abaResults.length);

    } else {
      console.log('No interactions found in database!');
    }

    await client.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkInteractions();
