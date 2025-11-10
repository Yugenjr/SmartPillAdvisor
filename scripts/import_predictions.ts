// Set env vars before any imports
process.env.MONGODB_URI = 'mongodb+srv://yugenjr847:yugen842007@yugen.zbssgmq.mongodb.net/?retryWrites=true&w=majority&connectTimeoutMS=30000&socketTimeoutMS=30000';
process.env.DB_NAME = 'smartpilladvisor';

import { MongoClient } from "mongodb";

// Sample Indian medicine data with names and prices
const indianMedicines = [
  { name: "Paracetamol", price: 25 },
  { name: "Ibuprofen", price: 45 },
  { name: "Aspirin", price: 20 },
  { name: "Amoxicillin", price: 120 },
  { name: "Ciprofloxacin", price: 85 },
  { name: "Azithromycin", price: 150 },
  { name: "Metformin", price: 35 },
  { name: "Insulin", price: 450 },
  { name: "Omeprazole", price: 75 },
  { name: "Ranitidine", price: 40 },
  { name: "Losartan", price: 90 },
  { name: "Amlodipine", price: 65 },
  { name: "Atorvastatin", price: 180 },
  { name: "Levothyroxine", price: 95 },
  { name: "Prednisone", price: 55 },
  { name: "Hydrochlorothiazide", price: 30 },
  { name: "Warfarin", price: 200 },
  { name: "Digoxin", price: 25 },
  { name: "Furosemide", price: 15 },
  { name: "Spironolactone", price: 50 },
  { name: "Albuterol", price: 80 },
  { name: "Salbutamol", price: 75 },
  { name: "Budesonide", price: 250 },
  { name: "Cetirizine", price: 35 },
  { name: "Loratadine", price: 45 },
  { name: "Diphenhydramine", price: 20 },
  { name: "Ranitidine", price: 40 },
  { name: "Pantoprazole", price: 85 },
  { name: "Esomeprazole", price: 110 },
  { name: "Lansoprazole", price: 70 },
  { name: "Domperidone", price: 25 },
  { name: "Ondansetron", price: 60 },
  { name: "Diazepam", price: 15 },
  { name: "Alprazolam", price: 25 },
  { name: "Clonazepam", price: 30 },
  { name: "Gabapentin", price: 75 },
  { name: "Pregabalin", price: 120 },
  { name: "Tramadol", price: 45 },
  { name: "Codeine", price: 35 },
  { name: "Morphine", price: 150 },
  { name: "Methadone", price: 80 },
  { name: "Buprenorphine", price: 200 },
  { name: "Fentanyl", price: 300 },
  { name: "Ketamine", price: 250 },
  { name: "Propofol", price: 400 },
  { name: "Midazolam", price: 180 },
  { name: "Rocuronium", price: 350 },
  { name: "Vecuronium", price: 450 },
  { name: "Succinylcholine", price: 275 },
  { name: "Neostigmine", price: 150 },
  { name: "Pyridostigmine", price: 200 },
  { name: "Atropine", price: 25 },
  { name: "Epinephrine", price: 50 },
  { name: "Dopamine", price: 75 },
  { name: "Norepinephrine", price: 100 },
  { name: "Phenylephrine", price: 45 },
  { name: "Vasopressin", price: 300 },
  { name: "Heparin", price: 180 },
  { name: "Warfarin", price: 200 },
  { name: "Enoxaparin", price: 350 },
  { name: "Fondaparinux", price: 400 },
  { name: "Aspirin", price: 20 },
  { name: "Clopidogrel", price: 150 },
  { name: "Ticagrelor", price: 250 },
  { name: "Prasugrel", price: 300 },
  { name: "Abciximab", price: 500 },
  { name: "Eptifibatide", price: 450 },
  { name: "Tirofiban", price: 400 },
  { name: "Streptokinase", price: 600 },
  { name: "Alteplase", price: 800 },
  { name: "Tenecteplase", price: 700 },
  { name: "Urokinase", price: 550 },
  { name: "Reteplase", price: 650 },
  { name: "Desmopressin", price: 180 },
  { name: "Oxytocin", price: 50 },
  { name: "Carboprost", price: 300 },
  { name: "Misoprostol", price: 75 },
  { name: "Dinoprostone", price: 200 },
  { name: "Mifepristone", price: 150 },
  { name: "Methotrexate", price: 85 },
  { name: "Cyclophosphamide", price: 200 },
  { name: "Doxorubicin", price: 350 },
  { name: "Paclitaxel", price: 400 },
  { name: "Docetaxel", price: 450 },
  { name: "Cisplatin", price: 300 },
  { name: "Carboplatin", price: 250 },
  { name: "Oxaliplatin", price: 350 },
  { name: "Gemcitabine", price: 400 },
  { name: "Capecitabine", price: 300 },
  { name: "Fluorouracil", price: 150 },
  { name: "Irinotecan", price: 500 },
  { name: "Topotecan", price: 450 },
  { name: "Etoposide", price: 250 },
  { name: "Vinblastine", price: 300 },
  { name: "Vincristine", price: 350 },
  { name: "Bleomycin", price: 400 },
  { name: "Dacarbazine", price: 450 },
  { name: "Procarbazine", price: 300 },
  { name: "Temozolomide", price: 500 },
  { name: "Bevacizumab", price: 1000 },
  { name: "Trastuzumab", price: 1200 },
  { name: "Rituximab", price: 1100 },
  { name: "Cetuximab", price: 950 },
  { name: "Panitumumab", price: 1050 },
  { name: "Ipilimumab", price: 1300 },
  { name: "Nivolumab", price: 1250 },
  { name: "Pembrolizumab", price: 1350 },
  { name: "Atezolizumab", price: 1400 },
  { name: "Durvalumab", price: 1450 },
  { name: "Avelumab", price: 1500 }
];

async function importPredictions() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(process.env.DB_NAME);

    // Clear existing data
    await db.collection('predictions').deleteMany({});

    // Insert new data
    const result = await db.collection('predictions').insertMany(indianMedicines);

    console.log(`Successfully imported ${result.insertedCount} medicines into predictions collection`);

    await client.close();
  } catch (error) {
    console.error('Error importing predictions:', error);
  }
}

importPredictions();
