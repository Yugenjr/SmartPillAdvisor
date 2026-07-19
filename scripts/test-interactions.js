import fetch from 'node-fetch';

async function testInteractions() {
  try {
    const response = await fetch('http://localhost:3000/api/interactions/check');
    const data = await response.json();
    console.log('Database check:', data);

    // Test with sample drugs
    const testResponse = await fetch('http://localhost:3000/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        drugList: [{ name: 'Abacavir' }, { name: 'Aspirin' }]
      })
    });
    const testData = await testResponse.json();
    console.log('Interactions test:', testData);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testInteractions();
